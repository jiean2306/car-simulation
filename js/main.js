import * as THREE from '../vendor/three.module.js';
import { loadAllAssets } from './assets.js';
import { BRANDS, CAR_CATALOG, CAR_BY_ID } from './carCatalog.js';
import {
  NUM_BLOCKS,
  BLOCK_LEN,
  LOOP_LEN,
  STREAM_RADIUS,
  STREAM_AHEAD,
  STREAM_BEHIND,
  DISTRICTS,
  mod,
  wrapDelta,
  createHighwayWorld
} from './world.js';
import {
  playerConfig,
  computeVehicleSpecs,
  sampleEngineCurve,
  createVehicleManager
} from './vehicles.js';
import { createAudioSystem } from './audio.js';
import { createShowroom } from './showroom.js';

(async function initGame() {
  const loadStatusEl = document.getElementById('load-status');
  try {
  const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth <= 920 && !!(window.matchMedia && window.matchMedia('(hover: none)').matches));
  const container = document.getElementById('canvas-container');
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'default'
  });
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.autoClear = false;
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x182334);
  scene.fog = new THREE.FogExp2(0x182334, 0.0018);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 480);
  const rearMirrorCam = new THREE.PerspectiveCamera(54, 2.7, 0.2, 110);
  const leftMirrorCam = new THREE.PerspectiveCamera(52, 1.55, 0.2, 95);
  const rightMirrorCam = new THREE.PerspectiveCamera(52, 1.55, 0.2, 95);

  // Balanced, clean illumination focused on the player's car (uses ferrariAO contact shadow instead of expensive shadow map passes)
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.08);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffaf0, 1.55);
  sunLight.position.set(16, 28, 18);
  sunLight.castShadow = false;
  scene.add(sunLight);
  scene.add(sunLight.target);

  // Mirrors layout & hot-path scratch state
  let mirrorsEnabled = !isMobile;
  let cachedSpecs = null;
  function getSpecs() {
    if (!cachedSpecs) cachedSpecs = computeVehicleSpecs();
    return cachedSpecs;
  }
  function invalidateSpecs() {
    cachedSpecs = null;
  }
  const _dp = new THREE.Vector3();
  const _dl = new THREE.Vector3();
  const MIRROR_LIST = [['rear', rearMirrorCam], ['left', leftMirrorCam], ['right', rightMirrorCam]];
  let hudCanvasAcc = 0;
  const mirrorRearEl = document.getElementById('mirror-rear');
  const mirrorLeftEl = document.getElementById('mirror-left');
  const mirrorRightEl = document.getElementById('mirror-right');
  const mirrorsLayer = document.getElementById('mirrors-layer');
  const bswLeftEl = document.getElementById('bsw-left');
  const bswRightEl = document.getElementById('bsw-right');

  const mirrorRects = { rear: {}, left: {}, right: {} };
  function layoutMirrors() {
    const w = window.innerWidth, h = window.innerHeight;
    const rw = Math.min(250, Math.max(160, Math.floor(w * 0.21))), rh = Math.floor(rw * 0.30);
    const sw = Math.min(156, Math.max(110, Math.floor(w * 0.13))), sh = Math.floor(sw * 0.62);

    mirrorRects.rear  = { x: Math.floor((w - rw) / 2), yTop: 12, w: rw, h: rh };
    mirrorRects.left  = { x: 12, yTop: Math.floor(h * 0.44), w: sw, h: sh };
    mirrorRects.right = { x: w - sw - 12, yTop: Math.floor(h * 0.44), w: sw, h: sh };

    [
      [mirrorRearEl, mirrorRects.rear, rearMirrorCam],
      [mirrorLeftEl, mirrorRects.left, leftMirrorCam],
      [mirrorRightEl, mirrorRects.right, rightMirrorCam]
    ].forEach(([el, r, cam]) => {
      el.style.left = r.x + 'px';
      el.style.top = r.yTop + 'px';
      el.style.width = r.w + 'px';
      el.style.height = r.h + 'px';
      cam.aspect = r.w / r.h;
      cam.updateProjectionMatrix();
    });
  }
  layoutMirrors();

  // Load 3D .GLB chassis and automotive reflection map
  const loadBarEl = document.getElementById('load-bar-fill');
  const loadingScreenEl = document.getElementById('loading-screen');

  const assets = await loadAllAssets(renderer, (pct, label) => {
    if (loadBarEl) loadBarEl.style.width = `${Math.round(pct * 100)}%`;
    if (loadStatusEl) loadStatusEl.textContent = label;
  });

  if (assets.hdrs.morning) {
    scene.environment = assets.hdrs.morning;
  }

  const world = createHighwayWorld(scene, renderer);
  const vehicles = createVehicleManager(scene, assets);
  const audio = createAudioSystem();
  const showroom = createShowroom(assets, vehicles);

  let playerCarDirty = true;
  let trafficSpawned = false;

  if (loadingScreenEl) loadingScreenEl.classList.add('hidden');

  // ============================================================================
  // 12-BRAND 3D SPINNING PLATFORM SHOWROOM UI
  // ============================================================================
  let activeBrandFilter = 'All';
  let showroomRoster = CAR_CATALOG;
  let showroomIndex = 0;

  const brandPillsEl = document.getElementById('brand-pills');
  const dynoCanvas = document.getElementById('dyno-canvas');
  const dynoCtx = dynoCanvas ? dynoCanvas.getContext('2d') : null;
  const srCounterEl = document.getElementById('sr-counter');

  function syncPaintUI(color) {
    const customPaintEl = document.getElementById('custom-paint');
    if (customPaintEl) customPaintEl.value = color;
    document.querySelectorAll('#paint-swatches .swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color.toLowerCase() === color.toLowerCase());
    });
  }

  function applyCarDefSelection(c) {
    if (!c) return;
    playerConfig.carId = c.id;
    playerConfig.paint = c.defaultColor;
    syncPaintUI(c.defaultColor);
  }

  function selectShowroomIndex(nextIdx) {
    if (!showroomRoster.length) return;
    showroomIndex = ((nextIdx % showroomRoster.length) + showroomRoster.length) % showroomRoster.length;
    const c = showroomRoster[showroomIndex];
    applyCarDefSelection(c);
    playerCarDirty = true;
    updateGarageStatsAndDynoUI();
    showroom.setIndex(showroomIndex);
  }

  function stepShowroom(delta) {
    selectShowroomIndex(showroomIndex + delta);
  }

  function renderBrandPills() {
    if (!brandPillsEl) return;
    brandPillsEl.innerHTML = '';
    const allBrands = ['All', ...BRANDS];
    allBrands.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'brand-pill' + (b === activeBrandFilter ? ' active' : '');
      btn.textContent = b;
      btn.addEventListener('click', () => {
        activeBrandFilter = b;
        showroomRoster = (b === 'All') ? CAR_CATALOG : CAR_CATALOG.filter(c => c.brand === b);
        let idx = showroomRoster.findIndex(c => c.id === playerConfig.carId);
        if (idx < 0) idx = 0;
        showroomIndex = idx;
        applyCarDefSelection(showroomRoster[showroomIndex]);
        playerCarDirty = true;
        showroom.setRoster(showroomRoster, showroomIndex);
        renderBrandPills();
        updateGarageStatsAndDynoUI();
      });
      brandPillsEl.appendChild(btn);
    });
  }

  function drawDynoGraph(specs) {
    if (!dynoCtx) return;
    const w = dynoCanvas.width, h = dynoCanvas.height;
    dynoCtx.clearRect(0, 0, w, h);

    // Subtle dyno grid lines
    dynoCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    dynoCtx.lineWidth = 1;
    for (let y = 16; y < h; y += 18) {
      dynoCtx.beginPath();
      dynoCtx.moveTo(0, y);
      dynoCtx.lineTo(w, y);
      dynoCtx.stroke();
    }

    const pts = specs.dynoPoints;
    if (!pts || !pts.length) return;
    const maxVal = Math.max(400, specs.hp * 1.15, specs.torqueNm * 1.15);

    // Plot Torque Curve (Amber/Gold)
    dynoCtx.strokeStyle = '#f59e0b';
    dynoCtx.lineWidth = 2;
    dynoCtx.beginPath();
    pts.forEach((p, idx) => {
      const x = 6 + (idx / (pts.length - 1)) * (w - 12);
      const y = h - 10 - (p.torque / maxVal) * (h - 20);
      if (idx === 0) dynoCtx.moveTo(x, y);
      else dynoCtx.lineTo(x, y);
    });
    dynoCtx.stroke();

    // Plot Power Curve (Cyan)
    dynoCtx.strokeStyle = '#38bdf8';
    dynoCtx.lineWidth = 2;
    dynoCtx.beginPath();
    pts.forEach((p, idx) => {
      const x = 6 + (idx / (pts.length - 1)) * (w - 12);
      const y = h - 10 - (p.hp / maxVal) * (h - 20);
      if (idx === 0) dynoCtx.moveTo(x, y);
      else dynoCtx.lineTo(x, y);
    });
    dynoCtx.stroke();

    // Legend
    dynoCtx.fillStyle = '#f59e0b';
    dynoCtx.font = '700 8.5px Inter, sans-serif';
    dynoCtx.fillText(`TRQ ${specs.torqueNm}Nm`, 6, 11);
    dynoCtx.fillStyle = '#38bdf8';
    dynoCtx.fillText(`PWR ${specs.hp}HP`, 78, 11);
    dynoCtx.fillStyle = '#94a3b8';
    dynoCtx.fillText(`${specs.redline} RPM`, w - 48, h - 3);
  }

  function updateGarageStatsAndDynoUI() {
    invalidateSpecs();
    const s = getSpecs();
    const brandLblEl = document.getElementById('garage-brand-lbl');
    if (brandLblEl) brandLblEl.textContent = s.base.brand;
    document.getElementById('garage-car-title').textContent = s.base.name;
    document.getElementById('garage-eng-tag').textContent = s.base.engineCode;
    const driveEl = document.getElementById('garage-drive-tag');
    if (driveEl) driveEl.textContent = s.drivetrain;

    const aspEl = document.getElementById('garage-asp-tag');
    if (aspEl) {
      aspEl.textContent = s.maxBoostBar > 0 ? `${s.aspiration} ${s.maxBoostBar}B` : 'NA';
      aspEl.classList.toggle('asp-na', s.aspiration === 'NA');
      aspEl.classList.toggle('asp-sc', s.aspiration === 'SUPERCHARGED');
    }
    if (srCounterEl) srCounterEl.textContent = `${showroomIndex + 1} / ${showroomRoster.length}`;

    document.getElementById('st-spd').style.width = `${Math.min(100, (s.topSpeedKmh / 430) * 100)}%`;
    document.getElementById('stn-spd').textContent = `${s.topSpeedKmh} km/h`;
    document.getElementById('st-pwr').style.width = `${Math.min(100, (s.hp / 1300) * 100)}%`;
    document.getElementById('stn-pwr').textContent = `${s.hp} HP`;
    document.getElementById('st-trq').style.width = `${Math.min(100, (s.torqueNm / 1400) * 100)}%`;
    document.getElementById('stn-trq').textContent = `${s.torqueNm} Nm`;
    document.getElementById('st-grp').style.width = `${Math.min(100, (s.cornerG / 2.0) * 100)}%`;
    document.getElementById('stn-grp').textContent = `${s.cornerG.toFixed(2)} G`;

    // Sync Bottom HUD Car & Engine Header
    document.getElementById('hud-car-name').textContent = `${s.base.brand} ${s.base.name}`;
    document.getElementById('hud-asp-badge').textContent = `${s.base.engineCode} · ${s.aspiration}`;

    drawDynoGraph(s);
  }

  renderBrandPills();
  const initialIdx = Math.max(0, showroomRoster.findIndex(c => c.id === playerConfig.carId));
  showroomIndex = initialIdx;
  applyCarDefSelection(showroomRoster[showroomIndex]);
  showroom.setRoster(showroomRoster, showroomIndex);
  updateGarageStatsAndDynoUI();

  // ============================================================================
  // TRANSMISSION (AUTO / MANUAL SEQUENTIAL) & DRIVING PHYSICS ENGINE
  // ============================================================================
  let gameState = 'garage';
  let gameMode = 'career';
  let credits = parseInt(localStorage.getItem('zv_credits') || '25000', 10);

  const creditsEl = document.getElementById('credits-val');
  function addCredits(amount) {
    credits += amount;
    localStorage.setItem('zv_credits', String(credits));
    if (creditsEl) creditsEl.textContent = `$${credits.toLocaleString()} CR`;
  }
  addCredits(0);

  const phys = {
    s: 40.0,
    x: 2.2,
    vx: 0,
    vs: 0,
    heading: 0,
    steerAngle: 0,
    pitch: 0,
    roll: 0,
    gear: 1,       // 0 = R, 1..numGears = Forward gears
    rpm: 900,
    boostBar: 0.0, // Current turbo/supercharger boost pressure in BAR
    liveHp: 60,
    liveTorqueNm: 260,
    slipRatio: 0.0,
    shiftCutTimer: 0.0,
    prevThrottle: 0,
    nos: 100,
    nosActive: false,
    shake: 0,
    wheelSpin: 0
  };

  function setTransmissionMode(mode) {
    playerConfig.transmission = mode;
    const isMT = mode === 'MT';
    const topBtn = document.getElementById('btn-trans-top');
    const botBtn = document.getElementById('btn-trans-mode');
    if (topBtn) {
      topBtn.textContent = isMT ? 'Gear: MANUAL (T)' : 'Gear: AUTO (T)';
      topBtn.classList.toggle('primary', isMT);
    }
    if (botBtn) {
      botBtn.textContent = isMT ? 'MANUAL (T)' : 'AUTO (T)';
    }
    document.querySelectorAll('.chip-row[data-config="transmission"] .mod-chip').forEach(ch => {
      ch.classList.toggle('active', ch.dataset.val === mode);
    });
  }

  function toggleTransmission() {
    setTransmissionMode(playerConfig.transmission === 'AT' ? 'MT' : 'AT');
  }

  function manualShift(delta) {
    const specs = getSpecs();
    const nextGear = Math.max(0, Math.min(specs.numGears, phys.gear + delta));
    if (nextGear !== phys.gear) {
      // Trigger BOV flutter on upshift under boost
      if (delta > 0 && specs.aspiration.includes('TURBO') && phys.boostBar > 0.25) {
        audio.triggerTurboBOV(phys.boostBar);
        phys.boostBar *= 0.45;
      }
      audio.triggerShiftPop();
      phys.gear = nextGear;
      // Rev-match throttle blip on manual downshift
      if (delta < 0 && nextGear >= 1) {
        const gIdx = Math.max(0, Math.min(specs.numGears - 1, nextGear - 1));
        const newRatio = specs.gearRatios[gIdx];
        const topRatio = specs.gearRatios[specs.numGears - 1];
        const newGearMaxMs = Math.max(11, specs.maxSpeedMs * (topRatio / newRatio));
        const newWheelRpm = (Math.abs(phys.vs) / newGearMaxMs) * specs.redline;
        phys.rpm = Math.min(specs.redline * 0.96, Math.max(phys.rpm + 450, newWheelRpm));
      }
      phys.shiftCutTimer = 0.085; // 85ms clutch torque cut
    }
  }

  document.getElementById('btn-trans-top').addEventListener('click', toggleTransmission);
  document.getElementById('btn-trans-mode').addEventListener('click', toggleTransmission);
  document.getElementById('btn-shift-up').addEventListener('click', () => {
    setTransmissionMode('MT');
    manualShift(1);
  });
  document.getElementById('btn-shift-down').addEventListener('click', () => {
    setTransmissionMode('MT');
    manualShift(-1);
  });

  // Career Missions & Time Attack
  const CAREER_MISSIONS = [
    { id: 'nearmiss', title: 'Perform 3 Near-Miss Overtakes', target: 3, reward: 2500 },
    { id: 'topspeed', title: 'Reach 220 km/h High-Speed Blitz', target: 220, reward: 3000 },
    { id: 'combo',    title: 'Build a x2.00 Overtake Combo Chain', target: 2.0, reward: 4000 },
    { id: 'oncoming', title: 'Perform 3 Oncoming Lane Overtakes', target: 3, reward: 5000 },
    { id: 'cleanrun', title: 'Drive 1,000m Without Any Collision', target: 1000, reward: 6000 }
  ];
  let careerStageIdx = 0;
  let careerProgress = 0;
  let timeAttackTimer = 32.0;
  let nextCheckpointIdx = 1;

  const missionTypeLbl = document.getElementById('mission-type-lbl');
  const missionRewardLbl = document.getElementById('mission-reward-lbl');
  const missionTitleEl = document.getElementById('mission-title');
  const missionBarEl = document.getElementById('mission-bar');

  function updateMissionHUD() {
    if (gameMode === 'career') {
      const m = CAREER_MISSIONS[careerStageIdx % CAREER_MISSIONS.length];
      missionTypeLbl.textContent = `CAREER STAGE ${careerStageIdx + 1}`;
      missionRewardLbl.textContent = `+$${m.reward.toLocaleString()} CR`;
      missionTitleEl.textContent = `${m.title} (${Math.min(m.target, Math.floor(careerProgress * 10) / 10)}/${m.target})`;
      missionBarEl.style.width = `${Math.min(100, (careerProgress / m.target) * 100)}%`;
    } else if (gameMode === 'timeattack') {
      const gate = world.checkpointGates[nextCheckpointIdx % world.checkpointGates.length];
      missionTypeLbl.textContent = `TIME ATTACK · ${timeAttackTimer.toFixed(1)}s`;
      missionRewardLbl.textContent = '+$2,000 CR / GATE';
      missionTitleEl.textContent = `Next Gate: ${gate ? gate.name : 'Sector'} (${Math.round(gate ? gate.s : 600)}m)`;
      missionBarEl.style.width = `${Math.min(100, (timeAttackTimer / 35.0) * 100)}%`;
    } else {
      missionTypeLbl.textContent = 'FREERIDE & DYNO TEST';
      missionRewardLbl.textContent = `${playerConfig.transmission} GEARBOX`;
      missionTitleEl.textContent = 'Press T for Manual/Auto · Q/E to Shift Gears';
      missionBarEl.style.width = '100%';
    }
  }

  function advanceCareerMission() {
    const m = CAREER_MISSIONS[careerStageIdx % CAREER_MISSIONS.length];
    addCredits(m.reward);
    audio.playFanfare();
    showOvertakeToast(
      { name: `STAGE ${careerStageIdx + 1} COMPLETE!`, color: '#4ade80' },
      m.reward,
      [`+$${m.reward.toLocaleString()} CR Earned`]
    );
    careerStageIdx++;
    careerProgress = 0;
    updateMissionHUD();
  }

  document.querySelectorAll('#mode-selector .sr-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mode-selector .sr-mode').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      gameMode = btn.dataset.mode;
      careerProgress = 0;
      timeAttackTimer = 32.0;
      updateMissionHUD();
    });
  });

  const scoreState = {
    total: 0,
    overtakes: 0,
    combo: 1.0,
    comboTimer: 0,
    bestGrade: '—',
    bestRank: 0
  };

  const showroomUi = document.getElementById('showroom-ui');
  const customDrawer = document.getElementById('custom-drawer');
  const btnToggleCustom = document.getElementById('btn-toggle-custom');
  const pauseOverlay = document.getElementById('pause-overlay');
  const topHud = document.getElementById('top-hud');
  const bottomHud = document.getElementById('bottom-hud');
  const mobileControls = document.getElementById('mobile-controls');
  let drawerOpen = false;

  function setDrawerOpen(open) {
    drawerOpen = !!open;
    if (customDrawer) customDrawer.classList.toggle('open', drawerOpen);
    if (showroomUi) showroomUi.classList.toggle('drawer-open', drawerOpen);
    if (btnToggleCustom) btnToggleCustom.classList.toggle('active', drawerOpen);
    showroom.setDrawerOpen(drawerOpen);
  }

  function syncMobileControls() {
    if (mobileControls) mobileControls.classList.toggle('hidden', !(gameState === 'playing' && isMobile));
  }

  function setGameState(next) {
    gameState = next;
    if (next === 'playing') {
      if (!trafficSpawned) {
        vehicles.spawnTrafficFleet(LOOP_LEN);
        trafficSpawned = true;
      }
      if (playerCarDirty) {
        vehicles.rebuildPlayerCar();
        playerCarDirty = false;
      }
    }
    if (showroomUi) showroomUi.classList.toggle('hidden', next !== 'garage');
    pauseOverlay.classList.toggle('hidden', next !== 'paused');
    topHud.classList.toggle('garage-hidden', next === 'garage');
    bottomHud.classList.toggle('garage-hidden', next === 'garage');
    mirrorsLayer.classList.toggle('hidden', !mirrorsEnabled || next !== 'playing');
    syncMobileControls();
    if (next !== 'garage') setDrawerOpen(false);
    if (next === 'paused') {
      document.getElementById('pause-stats').textContent =
        `Score: ${scoreState.total.toLocaleString()} · Overtakes: ${scoreState.overtakes} · Best: ${scoreState.bestGrade}`;
    }
    updateMissionHUD();
  }

  function resetRun() {
    invalidateSpecs();
    const s = getSpecs();
    phys.vs = 0;
    phys.vx = 0;
    phys.x = 2.2;
    phys.s = 40.0;
    phys.heading = 0;
    phys.gear = 1;
    phys.rpm = s.idleRpm;
    phys.boostBar = 0;
    phys.nos = s.nosCap;
    scoreState.total = 0;
    scoreState.overtakes = 0;
    scoreState.combo = 1.0;
    scoreState.comboTimer = 0;
    scoreState.bestGrade = '—';
    scoreState.bestRank = 0;
    careerProgress = 0;
    timeAttackTimer = 32.0;
    nextCheckpointIdx = 1;
    document.getElementById('combo-bar').style.width = '0%';
    updateScoreHUD();
    updateMissionHUD();
  }

  document.getElementById('btn-prev-car').addEventListener('click', () => stepShowroom(-1));
  document.getElementById('btn-next-car').addEventListener('click', () => stepShowroom(1));
  if (btnToggleCustom) {
    btnToggleCustom.addEventListener('click', () => setDrawerOpen(!drawerOpen));
  }
  const btnCloseCustom = document.getElementById('btn-close-custom');
  if (btnCloseCustom) {
    btnCloseCustom.addEventListener('click', () => setDrawerOpen(false));
  }

  document.getElementById('btn-pause').addEventListener('click', () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  });
  document.getElementById('btn-resume').addEventListener('click', () => setGameState('playing'));
  document.getElementById('btn-pause-garage').addEventListener('click', () => setGameState('garage'));
  document.getElementById('btn-pause-restart').addEventListener('click', () => {
    resetRun();
    setGameState('playing');
  });
  document.getElementById('btn-garage').addEventListener('click', () => {
    setGameState(gameState === 'garage' ? 'playing' : 'garage');
  });
  document.getElementById('btn-drive-now').addEventListener('click', () => {
    audio.ensureAudio();
    setGameState('playing');
  });

  const btnMirrors = document.getElementById('btn-mirrors');
  function toggleMirrors() {
    mirrorsEnabled = !mirrorsEnabled;
    btnMirrors.textContent = mirrorsEnabled ? 'Mirrors: ON (M)' : 'Mirrors: OFF (M)';
    btnMirrors.classList.toggle('active', mirrorsEnabled);
    mirrorsLayer.classList.toggle('hidden', !mirrorsEnabled || gameState !== 'playing');
  }
  btnMirrors.addEventListener('click', toggleMirrors);
  btnMirrors.textContent = mirrorsEnabled ? 'Mirrors: ON (M)' : 'Mirrors: OFF (M)';
  btnMirrors.classList.toggle('active', mirrorsEnabled);
  mirrorsLayer.classList.toggle('hidden', !mirrorsEnabled || gameState !== 'playing');

  // Overtake Scoring & Toasts
  const GRADES = [
    { rank: 1, name: 'CLEAN PASS', color: '#93c5fd', mult: 1.0 },
    { rank: 2, name: 'GREAT',      color: '#4ade80', mult: 1.35 },
    { rank: 3, name: 'SLICK',      color: '#facc15', mult: 1.75 },
    { rank: 4, name: 'INSANE!',    color: '#fb923c', mult: 2.25 },
    { rank: 5, name: 'GODLIKE!!',  color: '#f43f5e', mult: 3.0 }
  ];
  const otFeed = document.getElementById('overtake-feed');

  function showOvertakeToast(gObj, pts, tags) {
    const el = document.createElement('div');
    el.className = 'ot-toast';
    el.style.borderColor = gObj.color;
    el.innerHTML = `<div class="ot-grade" style="color:${gObj.color};">${gObj.name}${pts ? ' +' + pts : ''}</div><div class="ot-detail">${tags.join(' · ')}</div>`;
    otFeed.appendChild(el);
    while (otFeed.children.length > 3) otFeed.removeChild(otFeed.firstChild);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1850);
  }

  function evaluateOvertake(agent) {
    const speedKmh = Math.abs(phys.vs) * 3.6;
    const relSpeedKmh = Math.abs(phys.vs - agent.dir * agent.speed) * 3.6;
    const latGap = Math.max(0, Math.abs(phys.x - agent.laneX) - (agent.halfW + 0.96));
    let skill = 0, proxBonus = 40;
    const tags = [];
    const isNearMiss = latGap < 1.45;
    const isOncoming = phys.x < -0.2;

    if (latGap < 0.75) { skill += 3; proxBonus = 180; tags.push('Razor Close +180'); }
    else if (isNearMiss) { skill += 2; proxBonus = 100; tags.push('Near Miss +100'); }
    else { skill += 1; tags.push('Clean Gap +40'); }

    if (speedKmh > 220) { skill += 2; tags.push(`${Math.round(speedKmh)} km/h Blitz`); }
    else if (speedKmh > 140) { skill += 1; tags.push(`${Math.round(speedKmh)} km/h Fast`); }

    let riskMult = 1.0;
    if (isOncoming) { skill += 2; riskMult = 1.8; tags.push('Oncoming x1.8'); }
    if (Math.abs(phys.heading) > 0.12) { skill += 1; tags.push('Drift Pass!'); }

    const gradeObj = GRADES[Math.min(GRADES.length - 1, Math.max(0, Math.floor((skill - 1) * 0.72)))];
    scoreState.overtakes++;
    scoreState.combo = Math.min(5.0, +(scoreState.combo + 0.25).toFixed(2));
    scoreState.comboTimer = 6.0;

    const pts = Math.round((100 + proxBonus + Math.round(relSpeedKmh * 1.4)) * gradeObj.mult * riskMult * scoreState.combo);
    scoreState.total += pts;
    addCredits(Math.round(pts * 0.35));

    if (gradeObj.rank > scoreState.bestRank) {
      scoreState.bestRank = gradeObj.rank;
      scoreState.bestGrade = gradeObj.name;
    }

    showOvertakeToast(gradeObj, pts, tags);
    audio.playChime(520 + gradeObj.rank * 95, 0.18);
    updateScoreHUD();

    if (gameMode === 'career') {
      const m = CAREER_MISSIONS[careerStageIdx % CAREER_MISSIONS.length];
      if (m.id === 'nearmiss' && isNearMiss) {
        careerProgress += 1;
        if (careerProgress >= m.target) advanceCareerMission();
      } else if (m.id === 'oncoming' && isOncoming) {
        careerProgress += 1;
        if (careerProgress >= m.target) advanceCareerMission();
      } else if (m.id === 'combo') {
        careerProgress = Math.max(careerProgress, scoreState.combo);
        if (careerProgress >= m.target) advanceCareerMission();
      }
      updateMissionHUD();
    }
  }

  function updateScoreHUD() {
    document.getElementById('score-val').textContent = scoreState.total.toLocaleString();
    document.getElementById('ot-count').textContent = `Overtakes: ${scoreState.overtakes}`;
    document.getElementById('best-rating').textContent = `Best: ${scoreState.bestGrade}`;
    document.getElementById('combo-badge').textContent = `x${scoreState.combo.toFixed(2)} CHAIN`;
  }

  // Controls & Camera Modes
  const keys = {};
  let camModeIdx = 0;
  const CAM_MODES = ['Chase', 'Hood', 'Cockpit', 'Orbit'];
  let orbitYaw = 0.65, orbitPitch = 0.20, orbitDist = 5.5, dragging = false, lastMX = 0, lastMY = 0;
  const btnCam = document.getElementById('btn-cam');

  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (gameState === 'garage') {
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepShowroom(-1);
        return;
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepShowroom(1);
        return;
      } else if (e.code === 'Escape') {
        if (drawerOpen) setDrawerOpen(false);
        else setGameState('playing');
        return;
      }
    }

    if (e.code === 'KeyP' || (e.code === 'Escape' && gameState === 'playing')) {
      if (gameState === 'playing') setGameState('paused');
      else if (gameState === 'paused') setGameState('playing');
    } else if (e.code === 'KeyG') {
      setGameState(gameState === 'garage' ? 'playing' : 'garage');
    } else if (e.code === 'KeyM') {
      toggleMirrors();
    } else if (e.code === 'KeyT') {
      toggleTransmission();
    } else if ((e.code === 'KeyE' || e.code === 'BracketRight' || e.code === 'PageUp') && gameState === 'playing') {
      setTransmissionMode('MT');
      manualShift(1);
    } else if ((e.code === 'KeyQ' || e.code === 'BracketLeft' || e.code === 'PageDown') && gameState === 'playing') {
      setTransmissionMode('MT');
      manualShift(-1);
    } else if (e.code === 'KeyC' && gameState === 'playing') {
      camModeIdx = (camModeIdx + 1) % CAM_MODES.length;
      btnCam.textContent = `Cam: ${CAM_MODES[camModeIdx]} (C)`;
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function bindTouchHold(id, code) {
    const el = document.getElementById(id);
    if (!el) return;
    const set = (v, e) => {
      e.preventDefault();
      if (v) audio.ensureAudio();
      keys[code] = v;
    };
    el.addEventListener('pointerdown', e => set(true, e));
    el.addEventListener('pointerup', e => set(false, e));
    el.addEventListener('pointercancel', e => set(false, e));
    el.addEventListener('pointerleave', e => set(false, e));
  }
  bindTouchHold('btn-steer-left', 'ArrowLeft');
  bindTouchHold('btn-steer-right', 'ArrowRight');
  bindTouchHold('btn-gas', 'ArrowUp');
  bindTouchHold('btn-brake', 'ArrowDown');
  bindTouchHold('btn-handbrake', 'Space');
  bindTouchHold('btn-nos', 'ShiftLeft');
  document.getElementById('btn-mc-shift-up')?.addEventListener('pointerdown', e => {
    e.preventDefault();
    audio.ensureAudio();
    setTransmissionMode('MT');
    manualShift(1);
  });
  document.getElementById('btn-mc-shift-down')?.addEventListener('pointerdown', e => {
    e.preventDefault();
    audio.ensureAudio();
    setTransmissionMode('MT');
    manualShift(-1);
  });

  renderer.domElement.addEventListener('pointerdown', e => {
    dragging = true;
    if (gameState === 'garage') {
      showroom.onPointerDown(e);
    } else {
      lastMX = e.clientX;
      lastMY = e.clientY;
    }
  });
  window.addEventListener('pointerup', e => {
    dragging = false;
    showroom.onPointerUp(e);
  });
  window.addEventListener('pointercancel', e => {
    dragging = false;
    showroom.onPointerUp(e);
  });
  window.addEventListener('pointermove', e => {
    if (gameState === 'garage') {
      showroom.onPointerMove(e);
    } else if (dragging && CAM_MODES[camModeIdx] === 'Orbit') {
      orbitYaw -= (e.clientX - lastMX) * 0.007;
      orbitPitch = Math.max(0.08, Math.min(0.85, orbitPitch + (e.clientY - lastMY) * 0.005));
      lastMX = e.clientX;
      lastMY = e.clientY;
    }
  });
  btnCam.addEventListener('click', () => {
    camModeIdx = (camModeIdx + 1) % CAM_MODES.length;
    btnCam.textContent = `Cam: ${CAM_MODES[camModeIdx]} (C)`;
  });

  // Customize Drawer Tabs & Tuning Chip Bindings
  document.querySelectorAll('.g-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.g-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.g-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  }));

  document.querySelectorAll('.chip-row[data-mod]').forEach(row => {
    const k = row.dataset.mod;
    row.querySelectorAll('.mod-chip').forEach(b => b.addEventListener('click', () => {
      row.querySelectorAll('.mod-chip').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      playerConfig[k] = parseFloat(b.dataset.val);
      playerCarDirty = true;
      showroom.refreshCurrent();
      updateGarageStatsAndDynoUI();
    }));
  });

  document.querySelectorAll('.chip-row[data-config]').forEach(row => {
    const k = row.dataset.config;
    row.querySelectorAll('.mod-chip').forEach(b => b.addEventListener('click', () => {
      row.querySelectorAll('.mod-chip').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      if (k === 'transmission') {
        setTransmissionMode(b.dataset.val);
      } else {
        playerConfig[k] = b.dataset.val;
        playerCarDirty = true;
        showroom.refreshCurrent();
        updateGarageStatsAndDynoUI();
      }
    }));
  });

  document.querySelectorAll('.dot-row[data-config]').forEach(row => {
    const k = row.dataset.config;
    row.querySelectorAll('.dot-chip').forEach(b => b.addEventListener('click', () => {
      row.querySelectorAll('.dot-chip').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      playerConfig[k] = b.dataset.val;
      playerCarDirty = true;
      showroom.refreshCurrent();
      updateGarageStatsAndDynoUI();
    }));
  });

  document.querySelectorAll('#paint-swatches .swatch').forEach(sw => sw.addEventListener('click', () => {
    document.querySelectorAll('#paint-swatches .swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    playerConfig.paint = sw.dataset.color;
    document.getElementById('custom-paint').value = sw.dataset.color;
    playerCarDirty = true;
    showroom.refreshCurrent();
  }));

  document.getElementById('custom-paint').addEventListener('input', e => {
    playerConfig.paint = e.target.value;
    playerCarDirty = true;
    showroom.refreshCurrent();
  });
  document.getElementById('custom-accent').addEventListener('input', e => {
    playerConfig.accentColor = e.target.value;
    playerCarDirty = true;
    showroom.refreshCurrent();
  });

  // Tachometer, Sound Wave Oscilloscope & GPS Radar Canvases
  const tachCanvas = document.getElementById('tach-canvas');
  const tachCtx = tachCanvas ? tachCanvas.getContext('2d') : null;
  const waveCanvas = document.getElementById('wave-canvas');
  const waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;
  const radarCanvas = document.getElementById('radar-canvas');
  const radarCtx = radarCanvas ? radarCanvas.getContext('2d') : null;

  function drawTachometer(rpm, redline, wantNos) {
    if (!tachCtx) return;
    const w = tachCanvas.width, h = tachCanvas.height;
    const cx = w / 2, cy = h / 2, r = w * 0.42;
    tachCtx.clearRect(0, 0, w, h);

    const startA = Math.PI * 0.75;
    const endA = Math.PI * 2.25;
    const maxDialRpm = Math.ceil((redline + 500) / 1000) * 1000;
    const frac = Math.min(1, Math.max(0, rpm / maxDialRpm));

    tachCtx.beginPath();
    tachCtx.arc(cx, cy, r, startA, endA);
    tachCtx.strokeStyle = 'rgba(255,255,255,0.14)';
    tachCtx.lineWidth = 10;
    tachCtx.lineCap = 'round';
    tachCtx.stroke();

    tachCtx.beginPath();
    tachCtx.arc(cx, cy, r, startA, startA + (endA - startA) * frac);
    tachCtx.strokeStyle = wantNos ? '#38bdf8' : (rpm >= redline * 0.92 ? '#ef4444' : '#f59e0b');
    tachCtx.lineWidth = 10;
    tachCtx.lineCap = 'round';
    tachCtx.stroke();

    const maxTicks = Math.round(maxDialRpm / 1000);
    for (let i = 0; i <= maxTicks; i++) {
      const a = startA + (endA - startA) * (i / maxTicks);
      const x1 = cx + Math.cos(a) * (r - 8), y1 = cy + Math.sin(a) * (r - 8);
      const x2 = cx + Math.cos(a) * (r - 16), y2 = cy + Math.sin(a) * (r - 16);
      tachCtx.beginPath();
      tachCtx.moveTo(x1, y1);
      tachCtx.lineTo(x2, y2);
      tachCtx.strokeStyle = (i * 1000 >= redline - 300) ? '#ef4444' : 'rgba(255,255,255,0.6)';
      tachCtx.lineWidth = 2;
      tachCtx.stroke();
    }

    const na = startA + (endA - startA) * frac;
    tachCtx.beginPath();
    tachCtx.moveTo(cx, cy);
    tachCtx.lineTo(cx + Math.cos(na) * (r - 6), cy + Math.sin(na) * (r - 6));
    tachCtx.strokeStyle = '#ffffff';
    tachCtx.lineWidth = 3;
    tachCtx.stroke();

    tachCtx.beginPath();
    tachCtx.arc(cx, cy, 5, 0, Math.PI * 2);
    tachCtx.fillStyle = '#38bdf8';
    tachCtx.fill();

    tachCtx.fillStyle = '#94a3b8';
    tachCtx.font = '700 10px Inter, sans-serif';
    tachCtx.textAlign = 'center';
    tachCtx.fillText(`${playerConfig.transmission} · x1K`, cx, cy + 28);
  }

  function drawRadar() {
    if (!radarCtx) return;
    const w = radarCanvas.width, h = radarCanvas.height;
    radarCtx.clearRect(0, 0, w, h);

    const roadLeft = 13, roadWidth = w - 26;
    radarCtx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    radarCtx.fillRect(roadLeft, 0, roadWidth, h);

    radarCtx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
    radarCtx.lineWidth = 1.5;
    radarCtx.beginPath();
    radarCtx.moveTo(w / 2, 0);
    radarCtx.lineTo(w / 2, h);
    radarCtx.stroke();

    const playerY = h * 0.74;
    const mapX = x => (w / 2) + (x / 9.0) * (roadWidth * 0.5);
    const mapZ = relS => playerY - (relS / 150) * (h * 0.68);

    for (const a of vehicles.trafficAgents) {
      const rel = wrapDelta(a.s, phys.s);
      if (rel > -50 && rel < 160) {
        const bx = mapX(a.laneX);
        const by = mapZ(rel);
        radarCtx.fillStyle = a.dir > 0 ? '#4ade80' : '#fb923c';
        radarCtx.fillRect(bx - 2.5, by - 4.5, 5, 9);
      }
    }

    const px = mapX(phys.x);
    radarCtx.fillStyle = '#38bdf8';
    radarCtx.beginPath();
    radarCtx.moveTo(px, playerY - 6);
    radarCtx.lineTo(px - 4.5, playerY + 5);
    radarCtx.lineTo(px + 4.5, playerY + 5);
    radarCtx.closePath();
    radarCtx.fill();
  }

  setGameState('garage');

  // ============================================================================
  // MAIN 60-FPS SIMULATION & RENDER LOOP
  // ============================================================================
  const clock = new THREE.Clock();
  const speedValEl = document.getElementById('speed-val');
  const gearValEl = document.getElementById('gear-val');
  const rpmValEl = document.getElementById('rpm-val');
  const rpmFillEl = document.getElementById('rpm-fill');
  const nosValEl = document.getElementById('nos-val');
  const nosFillEl = document.getElementById('nos-fill');
  const comboBarEl = document.getElementById('combo-bar');
  const fpsEl = document.getElementById('fps-readout');
  const distLblEl = document.getElementById('district-label');
  const hudLiveHpEl = document.getElementById('hud-live-hp');
  const hudLiveTrqEl = document.getElementById('hud-live-trq');
  const hudLiveBoostEl = document.getElementById('hud-live-boost');
  const hudLiveGripEl = document.getElementById('hud-live-grip');

  const camPosSmooth = new THREE.Vector3(2.2, 2.2, 6.2);
  const camLookSmooth = new THREE.Vector3(2.2, 0.95, -14);
  let elapsed = 0, fpsF = 0, fpsT = 0, lastFrameMs = 0;

  function animate(now = 0) {
    requestAnimationFrame(animate);
    if (document.hidden) {
      clock.getDelta();
      return;
    }
    const minInterval = (gameState === 'garage' && !dragging) ? 20.0 : 14.0;
    if (lastFrameMs && (now - lastFrameMs) < minInterval) return;
    lastFrameMs = now;

    const dt = Math.min(clock.getDelta(), 0.04);
    elapsed += dt;

    fpsF++;
    fpsT += dt;
    if (fpsT >= 0.4) {
      fpsEl.textContent = `${Math.round(fpsF / fpsT)} FPS`;
      fpsF = 0;
      fpsT = 0;
    }

    const specs = getSpecs();
    if (gameState === 'garage') {
      audio.updateEngineAudio(900, specs.redline, 0, false, false, specs.base.soundProfile, specs.aspiration, 0);
      showroom.update(dt, elapsed);
      const W = window.innerWidth, H = window.innerHeight;
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, W, H);
      renderer.clear();
      renderer.render(showroom.scene, showroom.camera);
      return;
    }

    let warnLeft = false, warnRight = false;
    let throttle = 0, brake = 0, wantNos = false;

    if (gameState === 'playing') {
      throttle = (keys['KeyW'] || keys['ArrowUp']) ? 1 : 0;
      brake = (keys['KeyS'] || keys['ArrowDown']) ? 1 : 0;
      const steerIn = ((keys['KeyA'] || keys['ArrowLeft']) ? -1 : 0) + ((keys['KeyD'] || keys['ArrowRight']) ? 1 : 0);
      const handbrake = !!keys['Space'];
      wantNos = Boolean((keys['ShiftLeft'] || keys['ShiftRight']) && throttle && phys.nos > 1);

      // Detect throttle lift off under turbo boost -> trigger Blow-Off Valve (BOV)
      if (phys.prevThrottle > 0.5 && throttle === 0 && specs.aspiration.includes('TURBO') && phys.boostBar > 0.3) {
        audio.triggerTurboBOV(phys.boostBar);
      }
      phys.prevThrottle = throttle;

      phys.nosActive = wantNos;
      if (wantNos) phys.nos = Math.max(0, phys.nos - 24 * dt);
      else phys.nos = Math.min(specs.nosCap, phys.nos + 9 * dt);

      if (phys.shiftCutTimer > 0) {
        phys.shiftCutTimer = Math.max(0, phys.shiftCutTimer - dt);
      }

      const spdAbs = Math.abs(phys.vs);
      const activeGearIdx = Math.max(0, Math.min(specs.numGears - 1, (phys.gear || 1) - 1));
      const curGearRatio = phys.gear === 0 ? 3.4 : specs.gearRatios[activeGearIdx];
      const topGearRatio = specs.gearRatios[specs.numGears - 1];

      // Max vehicle speed achievable in the current gear at redline -> true wheel-referred RPM (0 at standstill)
      const gearMaxSpeedMs = Math.max(11, specs.maxSpeedMs * (topGearRatio / curGearRatio));
      const wheelCoupledRpm = (spdAbs / gearMaxSpeedMs) * specs.redline;

      // Automatic (AT) vs Manual Sequential (MT) Gear Shifting Logic (throttle-sensitive shift points)
      if (playerConfig.transmission === 'AT') {
        if (phys.vs < -0.4 && !throttle) {
          phys.gear = 0; // Reverse only when not flooring throttle
        } else {
          if (phys.gear === 0 && (throttle > 0 || phys.vs >= -0.2)) phys.gear = 1;
          const upFrac = throttle > 0.5 ? 0.92 : 0.62;
          const downFrac = throttle > 0.5 ? 0.46 : 0.28;
          if (wheelCoupledRpm >= specs.redline * upFrac && phys.gear < specs.numGears && phys.shiftCutTimer <= 0) {
            manualShift(1);
          } else if (wheelCoupledRpm < specs.redline * downFrac && phys.gear > 1 && phys.shiftCutTimer <= 0) {
            phys.gear--;
          }
        }
      }

      // Crankshaft / Flywheel RPM: driven by Throttle & inertia; braking NEVER directly drops RPM
      let hitRevLimiter = false;
      const effectiveThrottle = (phys.shiftCutTimer > 0) ? 0 : throttle;

      if (effectiveThrottle > 0) {
        const converterCeiling = (phys.gear <= 1 || brake)
          ? specs.launchStallRpm
          : (playerConfig.transmission === 'AT'
              ? Math.max(specs.idleRpm, wheelCoupledRpm + 550)
              : Math.max(specs.idleRpm, wheelCoupledRpm));
        const slipCeiling = Math.max(wheelCoupledRpm, converterCeiling);
        if (wheelCoupledRpm >= specs.redline) {
          hitRevLimiter = true;
          phys.rpm = specs.redline - (Math.sin(elapsed * 58) > 0 ? 150 : 0);
        } else if (phys.rpm < slipCeiling) {
          phys.rpm = Math.min(specs.redline, phys.rpm + specs.revUpRate * effectiveThrottle * dt);
          if (wheelCoupledRpm > phys.rpm) phys.rpm = wheelCoupledRpm;
        } else {
          phys.rpm += (Math.min(specs.redline, wheelCoupledRpm) - phys.rpm) * Math.min(1, dt * 14);
        }
      } else {
        const coastFloor = (phys.shiftCutTimer > 0)
          ? specs.idleRpm
          : (playerConfig.transmission === 'AT'
              ? Math.max(specs.idleRpm, wheelCoupledRpm * 0.26)
              : (wheelCoupledRpm > specs.idleRpm * 1.18 ? wheelCoupledRpm : specs.idleRpm));
        if (phys.rpm > coastFloor) {
          const dropRate = playerConfig.transmission === 'MT' && wheelCoupledRpm > specs.idleRpm * 1.18
            ? specs.revDropRate * 1.35
            : specs.revDropRate;
          phys.rpm = Math.max(coastFloor, phys.rpm - dropRate * dt);
        } else {
          phys.rpm += (coastFloor - phys.rpm) * Math.min(1, dt * 10);
        }
      }

      // Forced Induction Spool Physics (NA vs Supercharger instant boost vs Exhaust-driven Turbo lag)
      if (specs.aspiration === 'NA' || specs.isEV || specs.maxBoostBar <= 0) {
        phys.boostBar = 0;
      } else if (specs.aspiration === 'SUPERCHARGED') {
        const rpmFrac = Math.max(0, (phys.rpm - specs.spoolRpm) / Math.max(1000, specs.redline - specs.spoolRpm));
        const targetB = effectiveThrottle ? specs.maxBoostBar * Math.pow(Math.min(1, rpmFrac), 0.72) : 0;
        phys.boostBar += (targetB - phys.boostBar) * Math.min(1, dt * specs.spoolRateUp);
      } else {
        const exhaustFlow = effectiveThrottle * Math.pow(Math.max(0, phys.rpm / specs.redline), 1.35);
        const canSpool = effectiveThrottle > 0 && phys.rpm > specs.spoolRpm * 0.68;
        const rpmBoostCap = canSpool
          ? specs.maxBoostBar * Math.max(0, Math.min(1, (phys.rpm - specs.spoolRpm * 0.68) / Math.max(900, specs.redline * 0.36)))
          : 0;
        const rate = canSpool
          ? specs.spoolRateUp * (0.32 + 0.95 * exhaustFlow)
          : specs.spoolRateDown;
        phys.boostBar += (rpmBoostCap - phys.boostBar) * Math.min(1, dt * rate);
      }

      const boostFraction = specs.maxBoostBar > 0 ? (phys.boostBar / specs.maxBoostBar) : 1.0;
      const engineOut = sampleEngineCurve(
        phys.rpm,
        specs.redline,
        specs.torqueNm,
        specs.hp,
        specs.aspiration,
        specs.maxBoostBar,
        boostFraction,
        specs.isEV
      );
      const activeThrottle = (phys.shiftCutTimer > 0 || hitRevLimiter) ? 0 : throttle;
      phys.liveTorqueNm = Math.round(engineOut.torqueNm * (activeThrottle ? 1.0 : 0.08) * (wantNos ? 1.35 : 1.0));
      phys.liveHp = Math.round((phys.liveTorqueNm * Math.max(phys.rpm, specs.isEV ? 2500 : 0)) / 7127);

      // Wheel Drive Force from Engine Torque * Gear Ratio
      const finalDrive = 3.42;
      const wheelRadius = 0.335;
      const drivetrainEff = specs.drivetrain === 'AWD' ? 0.85 : 0.90;
      const rawWheelForce = activeThrottle
        ? (phys.liveTorqueNm * curGearRatio * finalDrive * drivetrainEff) / wheelRadius
        : 0;

      // Tire Traction Circle Limit (Driven axle weight distribution + downforce)
      const driveTractionShare = specs.drivetrain === 'AWD' ? 1.0 : (specs.drivetrain === 'RWD' ? 0.62 : 0.54);
      const maxTireGripForce = specs.base.mass * 9.81 * specs.cornerG * driveTractionShare;
      const cappedDriveForce = Math.min(rawWheelForce, maxTireGripForce * 1.12);

      // Aerodynamic Drag, Rolling Resistance & Off-Throttle Engine Compression Braking
      const aeroDrag = 0.5 * 1.225 * specs.base.drag * 2.05 * phys.vs * spdAbs;
      const rolling = phys.vs * (14.0 + specs.base.mass * 0.004);
      const engineDrag = (activeThrottle === 0 && phys.vs > 0.5 && phys.gear > 0)
        ? specs.base.mass * (playerConfig.transmission === 'MT' ? 0.48 : 0.16) * (curGearRatio / topGearRatio)
        : 0;

      // Wheel Braking System Physics (stops vehicle speed ONLY; does not directly suppress engine RPM)
      let brakeForce = 0;
      if (brake) {
        if (throttle > 0 || phys.vs > 0.6 || (playerConfig.transmission === 'MT' && phys.gear > 0)) {
          brakeForce = specs.base.mass * specs.brakeG * 9.81;
        } else {
          if (playerConfig.transmission === 'AT') phys.gear = 0;
          if (phys.gear === 0) phys.vs = Math.max(-16, phys.vs - 11 * dt);
        }
      }
      if (handbrake && phys.vs > 1) {
        brakeForce += specs.base.mass * 5.8;
      }

      const signedDrive = phys.gear === 0 ? -cappedDriveForce * 0.5 : cappedDriveForce;
      const netAccel = (signedDrive - aeroDrag - rolling - engineDrag - brakeForce) / specs.base.mass;
      let nextVs = Math.min(specs.maxSpeedMs * (wantNos ? 1.12 : 1.0), phys.vs + netAccel * dt);
      if (brake && phys.gear > 0 && phys.vs >= 0 && nextVs < 0) nextVs = 0;
      phys.vs = nextVs;
      if (!throttle && !brake && Math.abs(phys.vs) < 0.2) phys.vs = 0;

      // Steering & Lateral Tire Grip (FWD understeer vs RWD oversteer vs AWD neutral grip)
      const speedSteerFactor = 1.0 / (1.0 + spdAbs * 0.022);
      phys.steerAngle += (steerIn * 0.52 * speedSteerFactor - phys.steerAngle) * Math.min(1, dt * 11);

      const dtFactor = specs.drivetrain === 'FWD' ? 0.88 : (specs.drivetrain === 'AWD' ? 1.06 : 1.0);
      const latGrip = specs.cornerG * dtFactor * (handbrake ? 0.36 : 1.0);
      const desiredVx = steerIn * Math.min(spdAbs * 0.42, 16.0) * (handbrake ? 1.15 : 1.0);
      phys.vx += (desiredVx - phys.vx) * Math.min(1, dt * (3.0 + latGrip * 4.4));

      // Combined Longitudinal + Lateral Slip Ratio calculation for HUD Tire Grip readout
      const longUsage = rawWheelForce / Math.max(1, maxTireGripForce);
      const latUsage = Math.abs(phys.vx) / Math.max(6, 13 * specs.cornerG);
      phys.slipRatio = Math.min(1.5, Math.hypot(longUsage * 0.72, latUsage) + (handbrake && spdAbs > 8 ? 0.65 : 0));

      const prevS = phys.s;
      const distStep = phys.vs * dt;
      phys.s = mod(phys.s + distStep, LOOP_LEN);
      phys.x += phys.vx * dt;

      if (Math.abs(phys.x) > 8.1) {
        phys.x = Math.sign(phys.x) * 8.1;
        phys.vx *= -0.25;
        phys.vs *= 0.94;
        phys.shake = 0.22;
      }

      const driftYawMult = (specs.drivetrain === 'RWD' && phys.slipRatio > 0.95) ? 1.65 : (handbrake ? 1.85 : 1.08);
      phys.heading += (-phys.vx / Math.max(12, spdAbs + 6) * driftYawMult - phys.heading) * Math.min(1, dt * 8);
      phys.pitch += (Math.max(-0.045, Math.min(0.055, netAccel * 0.0042)) - phys.pitch) * Math.min(1, dt * 9);
      phys.roll += (Math.max(-0.09, Math.min(0.09, -phys.vx * specs.rollStiff * 0.08)) - phys.roll) * Math.min(1, dt * 9);

      if (scoreState.comboTimer > 0) {
        scoreState.comboTimer = Math.max(0, scoreState.comboTimer - dt);
        comboBarEl.style.width = `${(scoreState.comboTimer / 6.0) * 100}%`;
        if (scoreState.comboTimer === 0) {
          scoreState.combo = 1.0;
          updateScoreHUD();
        }
      }

      phys.wheelSpin -= phys.vs * dt * 2.8;

      // Career & Time Attack Checks
      const curSpeedKmh = spdAbs * 3.6;
      if (gameMode === 'career') {
        const m = CAREER_MISSIONS[careerStageIdx % CAREER_MISSIONS.length];
        if (m.id === 'topspeed') {
          careerProgress = Math.max(careerProgress, Math.round(curSpeedKmh));
          updateMissionHUD();
          if (careerProgress >= m.target) advanceCareerMission();
        } else if (m.id === 'cleanrun' && distStep > 0) {
          careerProgress += distStep;
          updateMissionHUD();
          if (careerProgress >= m.target) advanceCareerMission();
        }
      } else if (gameMode === 'timeattack') {
        timeAttackTimer = Math.max(0, timeAttackTimer - dt);
        const gate = world.checkpointGates[nextCheckpointIdx % world.checkpointGates.length];
        if (gate) {
          const prevRel = wrapDelta(gate.s, prevS);
          const curRel = wrapDelta(gate.s, phys.s);
          if (prevRel > 0 && curRel <= 0 && Math.abs(prevRel - curRel) < 60) {
            timeAttackTimer = Math.min(40, timeAttackTimer + 14.0);
            nextCheckpointIdx++;
            addCredits(2000);
            audio.playFanfare();
            showOvertakeToast(
              { name: `${gate.name.toUpperCase()}!`, color: gate.color },
              2000,
              ['+14.0s Bonus Time · +$2,000 CR']
            );
          }
        }
        updateMissionHUD();
      }

      // Traffic Agents Simulation
      for (let i = 0; i < vehicles.trafficAgents.length; i++) {
        const a = vehicles.trafficAgents[i];
        const prevRel = wrapDelta(a.s, prevS);
        a.s = mod(a.s + a.dir * a.speed * dt, LOOP_LEN);
        const curRel = wrapDelta(a.s, phys.s);
        if (a.overtakenCooldown > 0) a.overtakenCooldown -= dt;

        if (curRel > -16 && curRel < 3) {
          const dx = a.laneX - phys.x;
          if (dx < -1.35 && dx > -5.5) warnLeft = true;
          if (dx > 1.35 && dx < 5.5) warnRight = true;
        }

        const absDz = Math.abs(curRel);
        const absDx = Math.abs(phys.x - a.laneX);
        if (absDz < a.halfL + 2.1 && absDx < a.halfW + 0.90) {
          const pushSign = phys.x >= a.laneX ? 1 : -1;
          phys.x += pushSign * (a.halfW + 1.02 - absDx);
          phys.vx = pushSign * 7.0;
          phys.vs *= 0.48;
          phys.shake = 0.55;
          scoreState.combo = 1.0;
          scoreState.comboTimer = 0;
          comboBarEl.style.width = '0%';
          if (gameMode === 'career' && CAREER_MISSIONS[careerStageIdx % CAREER_MISSIONS.length].id === 'cleanrun') {
            careerProgress = 0;
            updateMissionHUD();
          }
          updateScoreHUD();
          showOvertakeToast({ name: 'COLLISION!', color: '#ef4444' }, 0, ['Combo Chain Reset']);
          audio.playChime(110, 0.25, 'sawtooth', 0.2);
          a.overtakenCooldown = 3.0;
        } else if (prevRel > 0 && curRel <= 0 && Math.abs(prevRel - curRel) < 50 && phys.vs > 10 && a.overtakenCooldown <= 0) {
          a.overtakenCooldown = 4.0;
          evaluateOvertake(a);
        }

        a.mesh.visible = (curRel >= -STREAM_BEHIND && curRel <= STREAM_AHEAD);
        if (a.mesh.visible) {
          a.mesh.position.set(a.laneX, 0, -curRel);
        }
      }
    } else {
      for (let i = 0; i < vehicles.trafficAgents.length; i++) {
        const a = vehicles.trafficAgents[i];
        const curRel = wrapDelta(a.s, phys.s);
        a.mesh.visible = (curRel >= -STREAM_BEHIND && curRel <= STREAM_AHEAD);
        if (a.mesh.visible) a.mesh.position.set(a.laneX, 0, -curRel);
      }
    }

    audio.updateEngineAudio(
      phys.rpm,
      specs.redline,
      throttle,
      wantNos,
      gameState === 'playing',
      specs.base.soundProfile,
      specs.aspiration,
      phys.boostBar
    );

    bswLeftEl.classList.toggle('warn', warnLeft);
    bswRightEl.classList.toggle('warn', warnRight);

    vehicles.updatePlayerVisuals(phys, brake, wantNos, elapsed);
    world.updateWorld(phys.s);

    // Camera Transform
    phys.shake = Math.max(0, phys.shake - dt * 2.4);
    const sx = (Math.random() - 0.5) * phys.shake;
    const sy = (Math.random() - 0.5) * phys.shake;
    const speedKmh = Math.round(Math.abs(phys.vs) * 3.6);
    const targetFov = 54 + Math.min(15, speedKmh * 0.045) + (phys.nosActive ? 5 : 0);
    const nextFov = camera.fov + (targetFov - camera.fov) * Math.min(1, dt * 6);
    if (Math.abs(camera.fov - nextFov) > 0.01) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }

    if (CAM_MODES[camModeIdx] === 'Orbit') {
      const dist = orbitDist;
      const cx = phys.x + Math.sin(orbitYaw) * Math.cos(orbitPitch) * dist;
      const cy = 0.82 + Math.sin(orbitPitch) * dist;
      const cz = Math.cos(orbitYaw) * Math.cos(orbitPitch) * dist;
      camera.position.set(cx, cy, cz);
      camera.lookAt(phys.x, 0.68, 0);
    } else if (CAM_MODES[camModeIdx] === 'Hood') {
      camera.position.set(phys.x + sx * 0.3, 1.24 + sy * 0.3, -0.42);
      camera.lookAt(phys.x - phys.heading * 14, 1.05, -24);
    } else if (CAM_MODES[camModeIdx] === 'Cockpit') {
      camera.position.set(phys.x - 0.35 + sx * 0.2, 1.08 + sy * 0.2, 0.18);
      camera.lookAt(phys.x - 0.35 - phys.heading * 12, 0.98, -22);
    } else {
      _dp.set(phys.x + phys.heading * 2.6, 1.92, 5.35 + Math.min(1.35, speedKmh * 0.0045));
      camPosSmooth.lerp(_dp, Math.min(1, dt * 8.5));
      _dl.set(phys.x - phys.heading * 8, 0.98, -16);
      camLookSmooth.lerp(_dl, Math.min(1, dt * 10));
      camera.position.set(camPosSmooth.x + sx, camPosSmooth.y + sy, camPosSmooth.z);
      camera.lookAt(camLookSmooth);
    }

    // Dirty-checked Telemetry HUD Updates
    const speedStr = String(speedKmh);
    if (speedValEl.textContent !== speedStr) speedValEl.textContent = speedStr;
    const gearStr = phys.gear === 0 ? 'R' : String(phys.gear);
    if (gearValEl.textContent !== gearStr) gearValEl.textContent = gearStr;
    const rpmStr = `${Math.round(phys.rpm)} / ${specs.redline}`;
    if (rpmValEl.textContent !== rpmStr) rpmValEl.textContent = rpmStr;
    const rpmW = `${Math.min(100, (phys.rpm / specs.redline) * 100).toFixed(1)}%`;
    if (rpmFillEl.style.width !== rpmW) rpmFillEl.style.width = rpmW;
    const nosPct = Math.round((phys.nos / specs.nosCap) * 100);
    const nosStr = `${nosPct}%`;
    if (nosValEl.textContent !== nosStr) nosValEl.textContent = nosStr;
    if (nosFillEl.style.width !== nosStr) nosFillEl.style.width = nosStr;

    const hpStr = `${phys.liveHp} HP`;
    if (hudLiveHpEl.textContent !== hpStr) hudLiveHpEl.textContent = hpStr;
    const trqStr = `${phys.liveTorqueNm} Nm`;
    if (hudLiveTrqEl.textContent !== trqStr) hudLiveTrqEl.textContent = trqStr;
    const boostStr = specs.aspiration === 'NA' ? 'NA ATMOS' : `+${phys.boostBar.toFixed(2)} BAR`;
    if (hudLiveBoostEl.textContent !== boostStr) hudLiveBoostEl.textContent = boostStr;

    const gripText = phys.slipRatio > 0.98
      ? 'WHEELSPIN!'
      : (phys.slipRatio > 0.72 ? 'SLIP / DRIFT' : `${Math.max(70, Math.round(100 - phys.slipRatio * 28))}% GRIP`);
    const gripColor = phys.slipRatio > 0.98 ? '#ef4444' : (phys.slipRatio > 0.72 ? '#f59e0b' : '#4ade80');
    if (hudLiveGripEl.textContent !== gripText) {
      hudLiveGripEl.textContent = gripText;
      hudLiveGripEl.style.color = gripColor;
    }

    const blkIdx = Math.floor(phys.s / BLOCK_LEN) % NUM_BLOCKS;
    const distObj = DISTRICTS[Math.floor(blkIdx / 3)];
    const distStr = `${distObj.name} · ${Math.round(phys.s)}m`;
    if (distLblEl.textContent !== distStr) distLblEl.textContent = distStr;

    hudCanvasAcc += dt;
    if (hudCanvasAcc >= 0.033) {
      hudCanvasAcc = 0;
      drawTachometer(phys.rpm, specs.redline, phys.nosActive);
      if (waveCanvas && waveCtx) {
        audio.drawEngineWaveform(waveCtx, waveCanvas.width, waveCanvas.height, phys.rpm, specs.redline, specs.aspiration, phys.boostBar);
      }
      drawRadar();
    }

    // ---- RENDER PASS 1: FAST 60-FPS MAIN VIEWPORT ----
    const W = window.innerWidth, H = window.innerHeight;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    renderer.clear();
    renderer.render(scene, camera);

    // ---- RENDER PASS 2: LIVE REAR-VIEW & LEFT/RIGHT SIDE MIRRORS ----
    if (mirrorsEnabled && gameState === 'playing') {
      renderer.setScissorTest(true);

      rearMirrorCam.position.set(phys.x, 1.48, 2.35);
      rearMirrorCam.lookAt(phys.x + phys.heading * 10, 1.15, 48);

      leftMirrorCam.position.set(phys.x - 1.12, 1.02, 0.45);
      leftMirrorCam.lookAt(phys.x - 6.8, 0.92, 28);

      rightMirrorCam.position.set(phys.x + 1.12, 1.02, 0.45);
      rightMirrorCam.lookAt(phys.x + 6.8, 0.92, 28);

      for (let i = 0; i < MIRROR_LIST.length; i++) {
        const [key, cam] = MIRROR_LIST[i];
        const r = mirrorRects[key];
        const yBottom = H - r.yTop - r.h;
        renderer.setViewport(r.x, yBottom, r.w, r.h);
        renderer.setScissor(r.x, yBottom, r.w, r.h);
        renderer.clearDepth();
        renderer.render(scene, cam);
      }

      renderer.setScissorTest(false);
    }
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    showroom.resize();
    layoutMirrors();
    syncMobileControls();
  });

  animate();
  } catch (err) {
    console.error('Boot error:', err);
    if (loadStatusEl) loadStatusEl.textContent = 'Failed to load 3D engine — please refresh.';
  }
})();
