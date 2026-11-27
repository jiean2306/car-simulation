import * as THREE from '../vendor/three.module.js';
import { CAR_CATALOG, CAR_BY_ID } from './carCatalog.js';

export const playerConfig = {
  carId: 'fer_458',
  // Drivetrain & Performance Tuning
  aspirationMod: 'stock', // 'stock' | 'na_itb' | 'single_turbo' | 'twin_turbo' | 'supercharger'
  engineStage: 0,         // 0: Stock, 1: Stage 1, 2: Stage 2, 3: Stage 3 Race
  transmission: 'AT',     // 'AT' (Automatic) | 'MT' (Manual Sequential)
  gearRatioMode: 'stock', // 'stock' | 'short' (Acceleration) | 'long' (Top Speed)
  drivetrainMod: 'stock', // 'stock' | 'RWD' | 'AWD' | 'FWD'
  brakes: 1,              // 0: OEM, 1: Slotted Sport, 2: Brembo 6-Pot, 3: Carbon-Ceramic F1
  tires: 1,               // 0: Street, 1: Pilot Sport 4S, 2: P-Zero Trofeo Slick, 3: Drag/Track, 4: Drift
  suspension: 1,          // 0: Factory, 1: Lowered -25mm, 2: Coilovers -45mm, 3: Slammed -60mm

  // Visual Styling & Accessories
  paint: '#d91b24',
  accentColor: '#111827',
  finish: 'gloss',        // 'gloss' | 'metallic' | 'matte' | 'chrome' | 'pearl' | 'carbon'
  windowTint: 'smoke',    // 'clear' | 'smoke' | 'limo' | 'blue'
  headlightColor: '#fff5d6',
  rims: 'silver',         // 'silver' | 'gold' | 'black' | 'bronze' | 'chrome'
  caliperColor: '#ef4444',
  camberDeg: 0,           // 0 | -3 | -6
  spacerOffset: 0.0,      // 0.0 | 0.04 | 0.08
  frontAero: 'sport',     // 'stock' | 'sport' | 'canards' | 'fmic'
  spoiler: 'none',        // 'none' | 'lip' | 'gt' | 'timeattack'
  roofAcc: 'none',        // 'none' | 'scoop' | 'box' | 'zpd' | 'rally'
  exhaustStyle: 'quad',   // 'dual' | 'quad' | 'center'
  underglow: 'none',      // 'none' | '#38bdf8' | '#f43f5e' | '#f59e0b' | '#4ade80' | '#a855f7'
  livery: 'none'          // 'none' | 'stripes' | 'twotone'
};

export function computeVehicleSpecs() {
  const base = CAR_BY_ID[playerConfig.carId] || CAR_CATALOG[0];

  let aspiration = base.aspiration;
  let maxBoostBar = base.maxBoostBar;
  let aspTorqueMult = 1.0;
  let aspPowerMult = 1.0;
  let redlineBonus = 0;

  if (playerConfig.aspirationMod === 'na_itb') {
    aspiration = 'NA';
    maxBoostBar = 0;
    redlineBonus = 650;
    aspPowerMult = base.aspiration === 'NA' ? 1.14 : 0.88;
    aspTorqueMult = base.aspiration === 'NA' ? 1.08 : 0.82;
  } else if (playerConfig.aspirationMod === 'single_turbo') {
    aspiration = 'TURBO';
    maxBoostBar = Math.max(1.45, base.maxBoostBar + 0.55);
    aspPowerMult = base.aspiration === 'NA' ? 1.42 : 1.22;
    aspTorqueMult = base.aspiration === 'NA' ? 1.48 : 1.26;
  } else if (playerConfig.aspirationMod === 'twin_turbo') {
    aspiration = 'TWIN-TURBO';
    maxBoostBar = Math.max(1.55, base.maxBoostBar + 0.60);
    aspPowerMult = base.aspiration === 'NA' ? 1.46 : 1.25;
    aspTorqueMult = base.aspiration === 'NA' ? 1.50 : 1.28;
  } else if (playerConfig.aspirationMod === 'supercharger') {
    aspiration = 'SUPERCHARGED';
    maxBoostBar = Math.max(1.15, base.maxBoostBar + 0.35);
    aspPowerMult = base.aspiration === 'NA' ? 1.34 : 1.15;
    aspTorqueMult = base.aspiration === 'NA' ? 1.42 : 1.20;
  }

  const stageMult = [1.0, 1.15, 1.32, 1.54][playerConfig.engineStage] || 1.0;
  if (maxBoostBar > 0) {
    maxBoostBar = +(maxBoostBar * [1.0, 1.12, 1.24, 1.38][playerConfig.engineStage]).toFixed(2);
  }

  const redline = Math.min(11500, base.redline + redlineBonus + playerConfig.engineStage * 150);
  const hp = Math.round(base.hp * aspPowerMult * stageMult);
  const torqueNm = Math.round(base.torqueNm * aspTorqueMult * stageMult);

  const drivetrain = playerConfig.drivetrainMod === 'stock' ? base.drivetrain : playerConfig.drivetrainMod;

  const tireGripMult = [0.88, 1.04, 1.18, 1.28, 0.74][playerConfig.tires] || 1.0;
  const suspGripMult = [0.96, 1.04, 1.12, 1.08][playerConfig.suspension] || 1.0;
  const aeroBonus = (playerConfig.spoiler === 'gt' || playerConfig.spoiler === 'timeattack') ? 0.06 : 0;
  const cornerG = +(base.baseGrip * tireGripMult * suspGripMult + aeroBonus).toFixed(2);

  const brakeMult = [0.92, 1.05, 1.18, 1.34][playerConfig.brakes] || 1.0;
  const brakeG = +(base.baseBrake * brakeMult * Math.min(1.18, tireGripMult)).toFixed(2);

  const rideHeight = [0.0, -0.012, -0.024, -0.036][playerConfig.suspension] || 0;
  const rollStiff = [0.095, 0.058, 0.032, 0.025][playerConfig.suspension] || 0.05;

  const numGears = base.gears || 6;
  const ratioScale = playerConfig.gearRatioMode === 'short' ? 1.12 : (playerConfig.gearRatioMode === 'long' ? 0.91 : 1.0);
  const gearRatios = [];
  const firstGear = 3.65;
  const topGear = 0.78;
  for (let g = 1; g <= numGears; g++) {
    const t = (g - 1) / Math.max(1, numGears - 1);
    gearRatios.push(+(firstGear * Math.pow(topGear / firstGear, t) * ratioScale).toFixed(3));
  }

  const powerWatts = hp * 745.7;
  const aeroArea = 2.05;
  const dragCoeff = base.drag * (playerConfig.spoiler === 'timeattack' ? 1.06 : 1.0);
  const physTopSpeedMs = Math.pow((2 * powerWatts) / (1.225 * dragCoeff * aeroArea), 1 / 3);
  const gearTopSpeedMs = physTopSpeedMs * (playerConfig.gearRatioMode === 'short' ? 0.91 : (playerConfig.gearRatioMode === 'long' ? 1.06 : 1.0));
  const maxSpeedMs = Math.min(physTopSpeedMs * 1.04, gearTopSpeedMs);
  const topSpeedKmh = Math.round(maxSpeedMs * 3.6);

  const isEV = /Dual-Motor|HyperEV|HyperV8s|Electric/i.test(base.engineCode) && playerConfig.aspirationMod === 'stock';

  const idleRpm = isEV ? 0 : (redline >= 8200 ? 980 : (redline <= 5500 ? 720 : 850));
  const launchStallRpm = isEV
    ? 1800
    : (aspiration === 'NA'
        ? (redline >= 8000 ? 3400 : 2500)
        : (aspiration === 'SUPERCHARGED' ? 2700 : (aspiration === 'TWIN-TURBO' ? 3100 : 3300)));

  const inertiaStageScale = 1 + playerConfig.engineStage * 0.10;
  let baseRevUp = 4400;
  let baseRevDrop = 2500;
  if (isEV) {
    baseRevUp = 8000;
    baseRevDrop = 5200;
  } else if (aspiration === 'NA') {
    baseRevUp = redline >= 8000 ? 6800 : 4400;
    baseRevDrop = redline >= 8000 ? 4200 : 2500;
  } else if (aspiration === 'TWIN-TURBO') {
    baseRevUp = 5400;
    baseRevDrop = 3200;
  } else if (aspiration === 'TURBO') {
    baseRevUp = 4600;
    baseRevDrop = 2800;
  } else if (aspiration === 'SUPERCHARGED') {
    baseRevUp = 5000;
    baseRevDrop = 3100;
  }
  const revUpRate = Math.round(baseRevUp * inertiaStageScale);
  const revDropRate = Math.round(baseRevDrop * inertiaStageScale);

  const spoolRpm = (aspiration === 'NA' || isEV)
    ? 0
    : (aspiration === 'SUPERCHARGED'
        ? 1200
        : (aspiration === 'TWIN-TURBO'
            ? 2250
            : Math.round(redline * (playerConfig.aspirationMod === 'single_turbo' ? 0.46 : 0.42))));
  const spoolRateUp = aspiration === 'SUPERCHARGED' ? 22.0 : (aspiration === 'TWIN-TURBO' ? 3.2 : 1.65);
  const spoolRateDown = aspiration === 'SUPERCHARGED' ? 24.0 : (aspiration === 'TWIN-TURBO' ? 5.5 : 4.8);

  const dynoPoints = [];
  for (let i = 0; i <= 28; i++) {
    const r = 1000 + (i / 28) * (redline - 1000);
    const steadyBoost = (aspiration === 'NA' || isEV || maxBoostBar <= 0)
      ? 1.0
      : (aspiration === 'SUPERCHARGED'
          ? Math.min(1, Math.max(0, (r - 1100) / Math.max(800, redline - 1100)))
          : Math.max(0, Math.min(1, (r - spoolRpm * 0.72) / Math.max(800, redline * (aspiration === 'TWIN-TURBO' ? 0.22 : 0.32)))));
    const d = sampleEngineCurve(r, redline, torqueNm, hp, aspiration, maxBoostBar, steadyBoost, isEV);
    dynoPoints.push({ rpm: Math.round(r), torque: Math.round(d.torqueNm), hp: Math.round(d.hp) });
  }

  return {
    base,
    isEV,
    aspiration,
    drivetrain,
    hp,
    torqueNm,
    redline,
    idleRpm,
    launchStallRpm,
    revUpRate,
    revDropRate,
    maxBoostBar,
    spoolRpm,
    spoolRateUp,
    spoolRateDown,
    numGears,
    gearRatios,
    topSpeedKmh,
    maxSpeedMs,
    cornerG,
    brakeG,
    rideHeight,
    rollStiff,
    nosCap: 100 + playerConfig.engineStage * 15,
    dynoPoints
  };
}

export function sampleEngineCurve(rpm, redline, peakTorqueNm, peakHp, aspiration, maxBoostBar, boostFraction = 1.0, isEV = false) {
  const normRpm = Math.max(0, Math.min(1.08, (rpm - 800) / Math.max(1200, redline - 800)));
  let torqueFactor = 0.45;

  if (isEV) {
    torqueFactor = normRpm <= 0.55 ? 0.98 : Math.max(0.42, 0.98 * (0.55 / normRpm));
  } else if (aspiration === 'NA') {
    if (redline >= 7800) {
      const clampedNorm = Math.min(1, normRpm);
      const base = 0.34 + 0.54 * Math.pow(clampedNorm, 0.82);
      const highCam = clampedNorm > 0.56 ? 0.14 * Math.sin(((clampedNorm - 0.56) / 0.44) * Math.PI * 0.88) : 0;
      torqueFactor = base + highCam;
    } else {
      torqueFactor = 0.48 + 0.52 * Math.sin(Math.pow(Math.min(1, normRpm), 0.72) * Math.PI * 0.86);
    }
  } else if (aspiration === 'SUPERCHARGED') {
    const clampedNorm = Math.min(1, normRpm);
    const naBase = 0.44 + 0.26 * Math.sin(clampedNorm * Math.PI * 0.85);
    const scBoost = 0.34 * boostFraction * (0.55 + 0.45 * Math.min(1, clampedNorm * 1.35));
    const beltDrag = clampedNorm > 0.85 ? (clampedNorm - 0.85) * 0.45 : 0;
    torqueFactor = naBase + scBoost - beltDrag;
  } else {
    const clampedNorm = Math.min(1, normRpm);
    const offBoostNa = 0.30 + 0.20 * Math.sin(clampedNorm * Math.PI * 0.85);
    const topTaper = clampedNorm > 0.86 ? 1.0 - (clampedNorm - 0.86) * 0.80 : 1.0;
    torqueFactor = offBoostNa + 0.54 * boostFraction * topTaper;
  }

  if (rpm > redline) {
    torqueFactor *= Math.max(0.1, 1.0 - ((rpm - redline) / 250));
  }

  const currentTorqueNm = peakTorqueNm * Math.max(0.22, Math.min(1.05, torqueFactor));
  const currentHp = (currentTorqueNm * Math.max(rpm, isEV ? 2500 : 0)) / 7127;
  return { torqueNm: currentTorqueNm, hp: currentHp };
}

/**
 * Maps every vehicle in the catalog to its unique
 * real 3D .GLB vehicle model file.
 */
export function pickRealGLBKey(carDef) {
  return (carDef && carDef.glbKey) || 'ferrari';
}

// Per-GLB forward orientation rotation around Y so every model faces -Z (highway forward)
const GLB_FORWARD_ROT_Y = {
  ferrari:              0,
  ferrari_f40:          Math.PI,
  ferrari_sf90xx:       Math.PI,
  porsche_gt3rs:        Math.PI,
  porsche_turbos:       Math.PI,
  porsche_carrera4s:    Math.PI,
  porsche_718:          Math.PI,
  porsche_918:          Math.PI,
  porsche_930:          Math.PI,
  porsche_mission_r:    Math.PI,
  porsche_917k:         Math.PI,
  sedan:                Math.PI,
  bmw_m3_g80:           0,
  bmw_m4_comp:          Math.PI,
  bmw_m4_csl:           Math.PI,
  bmwm5:                Math.PI,
  bmw_m5_f90:           Math.PI,
  bmw_m8:               Math.PI,
  mercedes_amg_gtr:     Math.PI,
  g63:                  Math.PI,
  mercedes_brabus_g900: Math.PI,
  audi_q3:              Math.PI,
  suv_q7:               Math.PI,
  toyota_supra_a90:     Math.PI,
  toyota_gr86:          Math.PI,
  toyota_grcorolla:     -Math.PI * 0.5,
  toyota_ae86:          0,
  toyota_camry:         Math.PI,
  toyota_rav4:          Math.PI,
  toyota_lc250:         Math.PI,
  gtr:                  Math.PI * 0.5,
  lamborghini:          Math.PI,
  lambo_aventador:      -Math.PI * 0.5,
  lambo_countach:       0,
  mclaren:              Math.PI,
  corvette:             Math.PI,
  ford_mustang:         Math.PI,
  ford_shelby_gt500:    Math.PI,
  dodge_challenger:     Math.PI,
  hyundai_ioniq5n:      Math.PI,
  tesla_model3:         0,
  jeep_wrangler:        Math.PI,
  saloon:               Math.PI,
  xiaomi_yu7:           Math.PI
};

function createRadialGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0.0, 'rgba(255,255,255,0.92)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.36)');
  g.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function createContactShadowTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 16, 128, 128, 122);
  g.addColorStop(0.0, 'rgba(0,0,0,0.72)');
  g.addColorStop(0.50, 'rgba(0,0,0,0.44)');
  g.addColorStop(0.78, 'rgba(0,0,0,0.14)');
  g.addColorStop(0.96, 'rgba(0,0,0,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

const smoothedGLBKeys = new Set();

/**
 * Computes crease-aware smooth vertex normals once per cached GLB for faceted meshes
 * (e.g. Porsche 911 Turbo S) while preserving crisp panel seams and sharp creases.
 */
function ensureSmoothNormals(sourceGLB, glbKey) {
  if (!sourceGLB || glbKey !== 'porsche_turbos' || smoothedGLBKeys.has(glbKey)) return;
  smoothedGLBKeys.add(glbKey);

  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const creaseCos = 0.72; // ~44 deg crease angle preserves sharp body panel lines

  sourceGLB.traverse(node => {
    if (!node.isMesh || !node.geometry) return;
    const geom = node.geometry;
    const pos = geom.attributes && geom.attributes.position;
    if (!pos || pos.count < 3) return;

    const mats = Array.isArray(node.material) ? node.material : [node.material];
    mats.forEach(m => {
      if (m) {
        m.flatShading = false;
        m.needsUpdate = true;
      }
    });

    if (!geom.boundingBox) geom.computeBoundingBox();
    const extent = geom.boundingBox
      ? Math.max(
          geom.boundingBox.max.x - geom.boundingBox.min.x,
          geom.boundingBox.max.y - geom.boundingBox.min.y,
          geom.boundingBox.max.z - geom.boundingBox.min.z,
          1e-4
        )
      : 1;
    const qs = 25000 / extent;

    const indexAttr = geom.index;
    const triCount = indexAttr ? Math.floor(indexAttr.count / 3) : Math.floor(pos.count / 3);
    if (triCount < 1) return;

    const faceNormX = new Float32Array(triCount);
    const faceNormY = new Float32Array(triCount);
    const faceNormZ = new Float32Array(triCount);
    const unitNormX = new Float32Array(triCount);
    const unitNormY = new Float32Array(triCount);
    const unitNormZ = new Float32Array(triCount);
    const posBuckets = new Map();

    const addRef = (vIdx, triIdx) => {
      const k = `${Math.round(pos.getX(vIdx) * qs)}|${Math.round(pos.getY(vIdx) * qs)}|${Math.round(pos.getZ(vIdx) * qs)}`;
      let list = posBuckets.get(k);
      if (!list) {
        list = [];
        posBuckets.set(k, list);
      }
      list.push(triIdx);
    };

    for (let t = 0; t < triCount; t++) {
      const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
      const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;
      pA.fromBufferAttribute(pos, i0);
      pB.fromBufferAttribute(pos, i1);
      pC.fromBufferAttribute(pos, i2);
      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);
      cb.cross(ab);
      faceNormX[t] = cb.x;
      faceNormY[t] = cb.y;
      faceNormZ[t] = cb.z;
      const len = cb.length();
      if (len > 1e-12) {
        unitNormX[t] = cb.x / len;
        unitNormY[t] = cb.y / len;
        unitNormZ[t] = cb.z / len;
      }
      addRef(i0, t);
      addRef(i1, t);
      addRef(i2, t);
    }

    const outNorm = new Float32Array(pos.count * 3);
    for (let t = 0; t < triCount; t++) {
      const ux = unitNormX[t];
      const uy = unitNormY[t];
      const uz = unitNormZ[t];
      for (let c = 0; c < 3; c++) {
        const vIdx = indexAttr ? indexAttr.getX(t * 3 + c) : t * 3 + c;
        const k = `${Math.round(pos.getX(vIdx) * qs)}|${Math.round(pos.getY(vIdx) * qs)}|${Math.round(pos.getZ(vIdx) * qs)}`;
        const refs = posBuckets.get(k);
        let ax = 0;
        let ay = 0;
        let az = 0;
        if (refs) {
          for (let r = 0; r < refs.length; r++) {
            const nt = refs[r];
            const dot = ux * unitNormX[nt] + uy * unitNormY[nt] + uz * unitNormZ[nt];
            if (dot >= creaseCos) {
              ax += faceNormX[nt];
              ay += faceNormY[nt];
              az += faceNormZ[nt];
            }
          }
        }
        const alen = Math.hypot(ax, ay, az);
        if (alen > 1e-12) {
          outNorm[vIdx * 3] = ax / alen;
          outNorm[vIdx * 3 + 1] = ay / alen;
          outNorm[vIdx * 3 + 2] = az / alen;
        } else {
          outNorm[vIdx * 3] = ux;
          outNorm[vIdx * 3 + 1] = uy;
          outNorm[vIdx * 3 + 2] = uz;
        }
      }
    }
    geom.setAttribute('normal', new THREE.BufferAttribute(outNorm, 3));
  });
}

const rawBoundsCache = new Map();

/**
 * Normalizes any real 3D .GLB car model to face -Z, sit flush at Y = 0,
 * and match the target vehicle's exact factory length while preserving proportions.
 */
function normalizeRealGLB(modelClone, glbKey, carDef, spacerOffset = 0) {
  // Strip studio floors, flat baked shadow quads, fabric backdrops, dangling badges, and streetlamp posts
  const toRemove = [];
  modelClone.traverse(n => {
    const nm = n.name || '';
    const lnm = nm.toLowerCase();
    if (
      nm === 'Ground' ||
      nm === 'Fabric' ||
      nm === 'Obj_Shadow_Plane' ||
      nm === 'Plane_0' ||
      nm === 'Plane.007_28' ||
      nm === 'Plane.015_62' ||
      nm === 'Object_140' ||
      nm.startsWith('LanternGlass') ||
      (glbKey === 'porsche_930' && (nm === 'Cylinder.002_32' || nm === 'Cylinder.006_20')) ||
      (glbKey === 'gtr' && nm === 'GTR.029') ||
      (lnm.includes('shadow') && lnm.includes('plane'))
    ) {
      toRemove.push(n);
    }
  });
  toRemove.forEach(n => { if (n.parent) n.parent.remove(n); });

  const wrapper = new THREE.Group();
  const scaleGroup = new THREE.Group();
  const inner = new THREE.Group();
  inner.add(modelClone);

  const rotY = GLB_FORWARD_ROT_Y[glbKey] !== undefined ? GLB_FORWARD_ROT_Y[glbKey] : Math.PI;
  inner.rotation.y = rotY;
  scaleGroup.add(inner);
  wrapper.add(scaleGroup);

  let cached = rawBoundsCache.get(glbKey);
  if (!cached) {
    wrapper.updateMatrixWorld(true);
    // Measure precise mesh/tire vertices once per GLB so rotated round tires sit flush with zero air gap
    const box = new THREE.Box3().setFromObject(wrapper, true);
    const size = new THREE.Vector3();
    box.getSize(size);

    // If width > length after initial rotation, rotate 90 degrees so length is along Z
    let extraRotY = 0;
    if (size.x > size.z * 1.15) {
      extraRotY = Math.PI * 0.5;
      inner.rotation.y = rotY + extraRotY;
      wrapper.updateMatrixWorld(true);
      box.setFromObject(wrapper, true);
      box.getSize(size);
    }

    const rawSteerBox = new THREE.Box3();
    modelClone.traverse(n => {
      if (!n.isMesh) return;
      const mName = Array.isArray(n.material)
        ? n.material.map(m => (m && m.name) || '').join(' ')
        : ((n.material && n.material.name) || '');
      const tag = ((n.name || '') + ' ' + mName).toLowerCase();
      if (/steer|volant/.test(tag)) {
        rawSteerBox.expandByObject(n, true);
      }
    });

    cached = {
      extraRotY,
      rawMin: box.min.clone(),
      rawMax: box.max.clone(),
      rawSize: size.clone(),
      hasSteer: !rawSteerBox.isEmpty(),
      rawSteerMin: rawSteerBox.isEmpty() ? null : rawSteerBox.min.clone(),
      rawSteerMax: rawSteerBox.isEmpty() ? null : rawSteerBox.max.clone()
    };
    rawBoundsCache.set(glbKey, cached);
  } else {
    inner.rotation.y = rotY + cached.extraRotY;
  }

  // Uniformly scale to target car length while keeping true-to-life proportions (supports 0.01x cm-exported GLBs)
  const targetLen = carDef.length || 4.55;
  const uniformScale = targetLen / Math.max(cached.rawSize.z, 1e-6);

  // Subtle proportion tailoring (e.g. compact hatchback vs long wagon vs wide track)
  let heightAdjust = carDef.heightScale || 1.0;
  let widthAdjust = (carDef.widthScale || 1.0) + (spacerOffset * 0.35);
  if (glbKey === 'suv_q7' && !carDef.heightScale) {
    if (carDef.chassis === 'hatch') {
      heightAdjust = 0.85;
      widthAdjust *= 0.94;
    } else if (carDef.chassis === 'wagon') {
      heightAdjust = 0.83;
    }
  }

  const sx = uniformScale * widthAdjust;
  const sy = uniformScale * heightAdjust;
  const sz = uniformScale;

  scaleGroup.scale.set(sx, sy, sz);
  scaleGroup.position.set(
    -((cached.rawMin.x + cached.rawMax.x) * 0.5) * sx,
    -cached.rawMin.y * sy,
    -((cached.rawMin.z + cached.rawMax.z) * 0.5) * sz
  );
  wrapper.updateMatrixWorld(true);

  modelClone.traverse(n => {
    if (n.isMesh && !/wheel|steer/i.test(n.name || '')) {
      n.updateMatrix();
      n.matrixAutoUpdate = false;
    }
  });

  const finalSize = new THREE.Vector3(
    cached.rawSize.x * sx,
    cached.rawSize.y * sy,
    cached.rawSize.z * sz
  );

  let steerBox = null;
  if (cached.hasSteer && cached.rawSteerMin && cached.rawSteerMax) {
    steerBox = new THREE.Box3(
      new THREE.Vector3(
        cached.rawSteerMin.x * sx + scaleGroup.position.x,
        cached.rawSteerMin.y * sy + scaleGroup.position.y,
        cached.rawSteerMin.z * sz + scaleGroup.position.z
      ),
      new THREE.Vector3(
        cached.rawSteerMax.x * sx + scaleGroup.position.x,
        cached.rawSteerMax.y * sy + scaleGroup.position.y,
        cached.rawSteerMax.z * sz + scaleGroup.position.z
      )
    );
  }

  return { group: wrapper, size: finalSize, steerBox };
}

/**
 * Traverses a real 3D .GLB car model and binds the user's custom Body Paint,
 * Two-Tone Accent/Carbon Hood & Roof, Window Glass Tint, Alloy Rim Color, and Brake Caliper Color.
 */
function applyCustomMaterialsToGLB(modelClone, glbKey, mats, twoTone, castShadow = false) {
  const { bodyMat, accentMat, glassMat, rimMat, calMat, matCarbon, brakeMat } = mats;

  modelClone.traverse(node => {
    if (!node.isMesh || !node.material) return;
    node.castShadow = !!castShadow;
    node.receiveShadow = false;

    const nName = (node.name || '').toLowerCase();
    const applyToSingleMat = origMat => {
      const mName = ((origMat && origMat.name) || '').toLowerCase();
      const hasDiffuseTex = !!(origMat && origMat.map);
      const isTransparentCoat = !!(origMat && origMat.transparent && origMat.opacity < 0.95);

      // 1. Primary Body Paint (protect textured atlases/badges/liveries from flat overwrite)
      if (mName.startsWith('paint 2') && !hasDiffuseTex) {
        return twoTone ? accentMat : bodyMat;
      }

      const isPalettePaint =
        (glbKey === 'toyota_supra_a90' && nName.startsWith('paint_') && mName === 'palettematerial003') ||
        (glbKey === 'hyundai_ioniq5n' && nName.includes('paint_geo') && !nName.includes('red_paint') && mName === 'palettematerial004');

      const isPaint =
        isPalettePaint ||
        (!hasDiffuseTex &&
         !isTransparentCoat &&
         (nName === 'body' ||
          mName === 'body_color' ||
          mName === 'paint' ||
          mName === 'coat' ||
          mName === 'bodycolor' ||
          mName === 'new_material' ||
          mName === 'mat8' ||
          mName === 'sennapaint' ||
          mName === 'sennapaintmain' ||
          mName === 'bodypaint.001' ||
          mName === 'hoodpainttextured1mtl' ||
          mName === 'meshesbody151mtl' ||
          mName === 'm4xnme_paint' ||
          mName === 'bm_carpaint_max1' ||
          mName === 'mt_body' ||
          mName === 'primary.003' ||
          mName === 'color_2' ||
          mName === 'car_paint' ||
          mName === 'tdummy_material_0_085' ||
          mName === 'rtmi_1203070001_002' ||
          mName === 'jmi_1355060001_004' ||
          mName === 'mmat_gallardo_base1' ||
          mName === 'material.012' ||
          mName.startsWith('paint 1') ||
          (glbKey === 'ferrari_f40' && mName === 'material') ||
          (glbKey === 'suv_q7' && mName === 'material') ||
          (glbKey === 'xiaomi_yu7' && mName === 'carpaint') ||
          mName.includes('carpaint') ||
          mName.includes('car_paint') ||
          mName.includes('paint_material') ||
          mName.includes('body_paint') ||
          mName.includes('coloured_material')));

      if (isPaint && !mName.includes('black') && !mName.includes('secondary') && !mName.includes('trim') && !mName.includes('caliper')) {
        if (twoTone && (nName.includes('hood') || nName.includes('roof') || nName.includes('bonnet'))) {
          return accentMat;
        }
        return bodyMat;
      }

      // 2. Window Glass (excluding headlight/taillight lenses and screens)
      const isPaletteGlass =
        (glbKey === 'toyota_supra_a90' && mName === 'palettematerial001') ||
        (glbKey === 'hyundai_ioniq5n' && mName === 'palettematerial002');

      const isWindow =
        isPaletteGlass ||
        (glbKey === 'ford_mustang' && mName === 'glass_clear' && !nName.includes('headlight') && !nName.includes('tailight') && !nName.includes('bumper') && !nName.includes('cylinder')) ||
        ((nName === 'glass' ||
          mName === 'glass_gray' ||
          mName === 'glass' ||
          mName === 'glass_18' ||
          mName === 'glass_d' ||
          mName === 'glass.002' ||
          mName === 'glass.003' ||
          mName === 'dark_glass' ||
          mName === 'frost_glass' ||
          mName === 'window' ||
          mName === 'windows' ||
          mName === 'window1mtl' ||
          mName === 'rearleftdoorwindow1mtl' ||
          mName === 'mesheswindows1mtl' ||
          mName === 'bm_glass_windowfront_low1' ||
          mName === 'window_black' ||
          mName === 'window_glass' ||
          mName === 'front_glass' ||
          mName === 'tinted_glass' ||
          mName === 'f40_window' ||
          mName === 'f40_window.001' ||
          mName === 'f40_glass' ||
          mName === 'vidiro' ||
          mName === 'vidrio2' ||
          mName === 'vidrionegro' ||
          mName === 'mat17' ||
          mName === 'senna_glass' ||
          mName === 'd_glass' ||
          mName === 'rtmi_glass1' ||
          mName === 'mt_windscreens' ||
          mName === 'mt_glass_translucent' ||
          mName === 'car_windows.etc.png' ||
          mName === 'マテリアル.037' ||
          mName === 'マテリアル.653' ||
          mName.startsWith('extwindowsglass') ||
          mName.startsWith('intwindows') ||
          mName.startsWith('m4xnme_glassclear') ||
          mName.includes('untitledmat_glass') ||
          mName.includes('window_material') ||
          mName.includes('mmat_glass') ||
          mName.includes('twixer_992_glass.002')) &&
         !nName.includes('headlight') &&
         !mName.includes('light') &&
         !mName.includes('red') &&
         !mName.includes('amber') &&
         !mName.includes('screen') &&
         !mName.includes('int'));

      if (isWindow) {
        return glassMat;
      }

      // 3. Alloy Rims (protect combined tire+rim UV atlases via !hasDiffuseTex so rubber stays dark)
      const isDedicatedRim =
        (glbKey === 'toyota_gr86' && nName.includes('_rim_')) ||
        (glbKey === 'ford_shelby_gt500' && mName === 'glossblack' && nName.includes('gt500.wheel.')) ||
        (glbKey === 'ford_mustang' && nName.includes('frdperofrmcrim') && (mName === 'material_205' || mName.startsWith('aluminium_clean')));

      const isRim =
        isDedicatedRim ||
        (!hasDiffuseTex &&
         (nName.startsWith('rim_') ||
          mName === '930_rim' ||
          mName === 'wheel_rim' ||
          mName === 'gt4_rimface' ||
          mName === 'carrera4s_rimface' ||
          mName === 'mat22' ||
          mName === 'alum' ||
          mName === 'rim1' ||
          mName === 'rim2' ||
          mName === 'mt_alloywheels' ||
          mName === 'meshesm8rim1mtl' ||
          mName === 'meshesm8rim0011mtl' ||
          mName === 'bm_rim_main_max1' ||
          mName === 'bm_rim_secondary_max1' ||
          mName === 'ao_chrome_rim' ||
          mName === 'wheelcolor1mtl' ||
          mName === 'yu7rim_c1' ||
          mName === 'f40_rrims' ||
          mName.includes('wheels_chrome')));

      if (isRim) {
        return rimMat;
      }

      // 4. Brake Calipers
      const isCaliper =
        nName === 'brake' ||
        nName === 'brakes' ||
        mName === 'brake' ||
        mName === 'caliper' ||
        mName === 'calipers' ||
        mName === 'calliper' ||
        mName === 'caliper1mtl' ||
        mName === 'calliperpaintrl1mtl' ||
        mName === 'mt_brakecaliper' ||
        mName === 'calip_1' ||
        mName === 'calip_2' ||
        mName === 'f40_mechanics.001' ||
        mName.includes('callipera') ||
        mName.includes('amdb11_caliper') ||
        mName.includes('tire_brake');

      if (isCaliper) {
        return calMat;
      }

      // 5. Taillights / Brakelights
      if (
        nName === 'lights_red' ||
        mName === 'taillight_glass' ||
        mName === 'taillight' ||
        mName === 'redglass' ||
        mName === 'rearlight' ||
        mName === 'super_brakelight' ||
        mName.includes('brakelight')
      ) {
        return brakeMat;
      }

      // 6. Carbon Fiber Trim (preserve textured meshes unless explicitly untextured carbon trim)
      if (!hasDiffuseTex && mName.includes('carbon')) {
        return twoTone ? accentMat : matCarbon;
      }

      origMat.envMapIntensity = 1.38;
      return origMat;
    };

    if (Array.isArray(node.material)) {
      node.material = node.material.map(applyToSingleMat);
    } else {
      node.material = applyToSingleMat(node.material);
    }
  });
}

export function createVehicleManager(scene, assets) {
  const playerRoot = new THREE.Group();
  const playerChassis = new THREE.Group();
  playerRoot.add(playerChassis);
  scene.add(playerRoot);

  const radialGlowTex = createRadialGlowTexture();
  const contactShadowTex = createContactShadowTexture();

  const matCarbon = new THREE.MeshStandardMaterial({
    color: 0x1c2026,
    map: assets.textures.carbonColor || null,
    normalMap: assets.textures.carbonNormal || null,
    roughness: 0.25,
    metalness: 0.38,
    envMapIntensity: 1.25,
    side: THREE.DoubleSide
  });

  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.08,
    metalness: 0.96,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide
  });

  const matDarkTrim = new THREE.MeshStandardMaterial({
    color: 0x12161f,
    roughness: 0.48,
    metalness: 0.35,
    side: THREE.DoubleSide
  });

  let playerWheels = [];
  let playerFrontSteerNodes = [];
  let playerNosFlames = [];
  let playerBrakeLightMat = null;
  let playerSteeringWheel = null;
  let zpdLightbarMeshes = [];
  let playerGlassMat = null;
  let playerBaseGlassOpacity = 0.68;
  let playerCamAnchors = {
    hood: { x: 0, y: 1.28, z: -0.95, lookY: 1.10 },
    cockpit: { x: -0.35, y: 1.12, z: -0.05, lookY: 1.01 }
  };

  function makeBodyPaintMat(hexColor, finish) {
    if (finish === 'carbon') return matCarbon;
    if (finish === 'chrome') {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hexColor),
        roughness: 0.04,
        metalness: 0.99,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.75,
        side: THREE.DoubleSide
      });
    }
    if (finish === 'matte') {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hexColor),
        roughness: 0.52,
        metalness: 0.22,
        clearcoat: 0.08,
        clearcoatRoughness: 0.42,
        envMapIntensity: 1.15,
        side: THREE.DoubleSide
      });
    }
    const rough = finish === 'metallic' ? 0.16 : (finish === 'pearl' ? 0.12 : 0.10);
    const metal = finish === 'metallic' ? 0.82 : (finish === 'pearl' ? 0.58 : 0.25);
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hexColor),
      roughness: rough,
      metalness: metal,
      clearcoat: 1.0,
      clearcoatRoughness: finish === 'pearl' ? 0.03 : 0.045,
      sheen: finish === 'pearl' ? 0.45 : 0.0,
      envMapIntensity: 1.50,
      side: THREE.DoubleSide
    });
  }

  function makeWindowGlassMat(tint) {
    const map = {
      clear: { color: 0x1e293b, opacity: 0.40 },
      smoke: { color: 0x0d1526, opacity: 0.68 },
      limo:  { color: 0x050811, opacity: 0.88 },
      blue:  { color: 0x0c4a6e, opacity: 0.62 }
    };
    const cfg = map[tint] || map.smoke;
    return new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.06,
      metalness: 0.25,
      transparent: true,
      opacity: cfg.opacity,
      envMapIntensity: 1.45,
      side: THREE.DoubleSide
    });
  }

  function buildCarModel(carDef, overrideOpts = null, castShadow = true) {
    const useStock = overrideOpts !== null;
    const specs = computeVehicleSpecs();
    const cfg = useStock
      ? {
          paint: overrideOpts.paint || carDef.defaultColor,
          accentColor: '#111827',
          finish: 'gloss',
          windowTint: 'smoke',
          headlightColor: '#fff5d6',
          rims: 'silver',
          caliperColor: '#ef4444',
          camberDeg: 0,
          spacerOffset: 0,
          spoiler: 'none',
          roofAcc: 'none',
          underglow: 'none',
          livery: 'none'
        }
      : playerConfig;
    const rh = useStock ? 0 : specs.rideHeight;

    const root = new THREE.Group();
    const wheels = [];
    const frontSteer = [];
    let steeringWheel = null;

    const bodyMat = makeBodyPaintMat(cfg.paint, cfg.finish);
    const accentMat = makeBodyPaintMat(cfg.accentColor, cfg.finish === 'matte' ? 'matte' : 'metallic');
    const glassMat = makeWindowGlassMat(cfg.windowTint);

    const rimColorMap = {
      silver: 0xe2e8f0,
      gold:   0xeab308,
      black:  0x141820,
      bronze: 0x9a5b2c,
      chrome: 0xffffff
    };
    const rimMat = new THREE.MeshStandardMaterial({
      color: rimColorMap[cfg.rims] || 0xe2e8f0,
      roughness: cfg.rims === 'chrome' ? 0.06 : 0.18,
      metalness: cfg.rims === 'chrome' ? 0.98 : 0.88,
      envMapIntensity: 1.4
    });
    const calMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.caliperColor),
      roughness: 0.25,
      metalness: 0.5
    });
    const hlGlowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.headlightColor),
      emissive: new THREE.Color(cfg.headlightColor),
      emissiveIntensity: 3.2,
      roughness: 0.1
    });
    const brakeMat = new THREE.MeshStandardMaterial({
      color: 0xff1e1e,
      emissive: 0xff1111,
      emissiveIntensity: 2.2,
      roughness: 0.15
    });

    const glbKey = pickRealGLBKey(carDef);
    let sourceGLB = assets.models[glbKey];
    let pending = null;

    let carSize = new THREE.Vector3(carDef.width || 1.92, 1.38, carDef.length || 4.55);
    let steerBox = null;
    const settleY = -0.008;
    const yOffset = (useStock ? 0 : rh) + settleY;

    if (!sourceGLB) {
      if (assets.ensureGLBModel && !(assets.isGLBFailed && assets.isGLBFailed(glbKey))) {
        pending = assets.ensureGLBModel(glbKey);
        if (!useStock && castShadow) {
          const expectedCarId = playerConfig.carId;
          pending.then(loaded => {
            if (loaded && playerConfig.carId === expectedCarId) {
              rebuildPlayerCar();
            }
          });
        }
        if (!castShadow) {
          return { group: root, root, pending, wheels, frontSteer, steeringWheel, brakeMat, glassMat, carSize, glbKey, steerBox, yOffset, flames: [], lightbarPair: [] };
        }
      }
      sourceGLB = assets.models.sedan || assets.models.ferrari;
    }

    const camberRad = (cfg.camberDeg * Math.PI) / 180;

    if (sourceGLB) {
      ensureSmoothNormals(sourceGLB, glbKey);
      const modelClone = sourceGLB.clone(true);
      applyCustomMaterialsToGLB(
        modelClone,
        glbKey,
        { bodyMat, accentMat, glassMat, rimMat, calMat, matCarbon, brakeMat },
        cfg.livery === 'twotone',
        castShadow
      );

      const norm = normalizeRealGLB(modelClone, glbKey, carDef, cfg.spacerOffset);
      carSize = norm.size;
      steerBox = norm.steerBox;
      norm.group.position.y = yOffset;
      root.add(norm.group);

      // Hook up wheel & steering nodes if present on the GLB
      ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].forEach(wName => {
        const wNode = modelClone.getObjectByName(wName);
        if (wNode) {
          wNode.rotation.order = 'YXZ';
          const isLeft = wName.endsWith('l');
          wNode.rotation.z = isLeft ? -camberRad : camberRad;
          wheels.push({ node: wNode, axis: 'x', dir: 1 });
          if (wName === 'wheel_fl' || wName === 'wheel_fr') {
            frontSteer.push({ node: wNode, axis: 'y', baseRot: 0 });
          }
        }
      });
      steeringWheel = modelClone.getObjectByName('steering_wheel');
    }

    const rearZ = carSize.z * 0.485;

    // ---- OPTIONAL CUSTOM REAR AERO WING (Only when explicitly added by player!) ----
    const activeWing = cfg.spoiler;
    const isHighDeckGLB = (
      glbKey === 'suv_q7' ||
      glbKey === 'g63' ||
      glbKey === 'mercedes_brabus_g900' ||
      glbKey === 'audi_q3' ||
      glbKey === 'jeep_wrangler' ||
      glbKey === 'xiaomi_yu7' ||
      glbKey === 'toyota_rav4' ||
      glbKey === 'toyota_lc250' ||
      glbKey === 'toyota_grcorolla' ||
      glbKey === 'hyundai_ioniq5n'
    );
    const deckY = isHighDeckGLB ? carSize.y * 0.94 : carSize.y * 0.68;

    if (activeWing === 'lip') {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(carSize.x * 0.72, 0.03, 0.08), matCarbon);
      lip.position.set(0, deckY + rh, rearZ - 0.14);
      lip.rotation.x = -0.22;
      root.add(lip);
    } else if (activeWing === 'gt' || activeWing === 'timeattack') {
      const isTA = activeWing === 'timeattack';
      const wingRise = isTA ? 0.20 : 0.15;
      const wingY = deckY + wingRise + rh;
      const wingW = carSize.x * (isTA ? 0.86 : 0.76);
      const wingZ = rearZ - 0.18;

      const blade = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.02, isTA ? 0.17 : 0.13), matCarbon);
      blade.position.set(0, wingY, wingZ);
      blade.rotation.x = -0.12;
      blade.castShadow = !!castShadow;
      root.add(blade);

      [-wingW * 0.5, wingW * 0.5].forEach(ex => {
        const ep = new THREE.Mesh(new THREE.BoxGeometry(0.014, isTA ? 0.10 : 0.07, isTA ? 0.19 : 0.15), matCarbon);
        ep.position.set(ex, wingY - 0.01, wingZ);
        root.add(ep);
      });

      [-0.36, 0.36].forEach(sx => {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.016, wingRise, 0.07), matDarkTrim);
        strut.position.set(sx, wingY - wingRise * 0.5, wingZ + 0.01);
        strut.rotation.x = 0.12;
        root.add(strut);
      });
    }

    // ---- CUSTOM ROOF ACCESSORIES ----
    const lightbarPair = [];
    if (cfg.roofAcc === 'scoop') {
      const rScoop = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.36), matCarbon);
      rScoop.position.set(0, carSize.y + 0.01 + rh, -0.05);
      root.add(rScoop);
    } else if (cfg.roofAcc === 'box') {
      const rBox = new THREE.Mesh(new THREE.BoxGeometry(carSize.x * 0.38, 0.17, carSize.z * 0.34), matCarbon);
      rBox.position.set(0, carSize.y + 0.08 + rh, 0.10);
      rBox.castShadow = !!castShadow;
      root.add(rBox);
    } else if (cfg.roofAcc === 'zpd') {
      const barY = carSize.y + 0.03 + rh;
      const rMat = new THREE.MeshStandardMaterial({ color: 0xff1111, emissive: 0xff1111, emissiveIntensity: 3.5 });
      const bMat = new THREE.MeshStandardMaterial({ color: 0x1177ff, emissive: 0x1177ff, emissiveIntensity: 3.5 });
      const rBar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.055, 0.13), rMat);
      const bBar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.055, 0.13), bMat);
      rBar.position.set(-0.20, barY, 0.05);
      bBar.position.set(0.20, barY, 0.05);
      root.add(rBar, bBar);
      lightbarPair.push({ rMat, bMat });
    } else if (cfg.roofAcc === 'rally') {
      [-0.30, -0.10, 0.10, 0.30].forEach(lx => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.055, 12), hlGlowMat);
        pod.rotation.x = Math.PI / 2;
        pod.position.set(lx, carSize.y + 0.03 + rh, -0.18);
        root.add(pod);
      });
    }

    // ---- SOFT RADIAL GROUND CONTACT SHADOW ----
    const aoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(carSize.x * 1.16, carSize.z * 1.06),
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        blending: THREE.NormalBlending,
        transparent: true,
        depthWrite: false
      })
    );
    aoPlane.rotation.x = -Math.PI / 2;
    aoPlane.position.y = 0.012;
    aoPlane.userData.isRayIgnore = true;
    root.add(aoPlane);

    // ---- SOFT RADIAL NEON UNDERGLOW ----
    if (cfg.underglow && cfg.underglow !== 'none') {
      const ugCol = new THREE.Color(cfg.underglow);
      const ugPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(carSize.x * 1.28, carSize.z * 1.0),
        new THREE.MeshBasicMaterial({
          map: radialGlowTex,
          color: ugCol,
          transparent: true,
          opacity: 0.50,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      ugPlane.rotation.x = -Math.PI / 2;
      ugPlane.position.y = 0.02;
      ugPlane.userData.isRayIgnore = true;
      root.add(ugPlane);
    }

    // ---- NITROUS EXHAUST FLAMES ----
    const flames = [];
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    [-0.40, 0.40].forEach(ex => {
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.10, 10), flameMat);
      fl.rotation.x = Math.PI / 2;
      fl.position.set(ex, 0.22 + yOffset, rearZ + 0.46);
      fl.visible = false;
      fl.userData.isRayIgnore = true;
      root.add(fl);
      flames.push(fl);
    });

    return {
      group: root,
      root,
      pending,
      wheels,
      frontSteer,
      steeringWheel,
      brakeMat,
      glassMat,
      carSize,
      glbKey,
      steerBox,
      yOffset,
      flames,
      lightbarPair
    };
  }

  function rebuildPlayerCar() {
    while (playerChassis.children.length) playerChassis.remove(playerChassis.children[0]);
    const specs = computeVehicleSpecs();
    const built = buildCarModel(specs.base, null);
    playerChassis.add(built.root);
    playerWheels = built.wheels;
    playerFrontSteerNodes = built.frontSteer;
    playerNosFlames = built.flames;
    playerBrakeLightMat = built.brakeMat;
    playerSteeringWheel = built.steeringWheel;
    zpdLightbarMeshes = built.lightbarPair;
    playerGlassMat = built.glassMat || null;
    playerBaseGlassOpacity = playerGlassMat ? playerGlassMat.opacity : 0.68;

    // Dynamic Hood & Raycast-Verified Cockpit (Driver Seat) Camera Anchors
    const W = built.carSize ? built.carSize.x : 1.96;
    const H = built.carSize ? built.carSize.y : 1.38;
    const L = built.carSize ? built.carSize.z : 4.55;
    const yOff = built.yOffset || 0;
    const sb = built.steerBox;

    const hoodAnchor = {
      x: 0,
      y: H * 0.72 + 0.14 + yOff,
      z: -L * 0.28,
      lookY: H * 0.64 + yOff
    };

    let seatX = (built.glbKey === 'gtr' ? 1 : -1) * W * 0.17;
    if (sb && Math.abs((sb.min.x + sb.max.x) * 0.5) > 0.08) {
      seatX = (sb.min.x + sb.max.x) * 0.5;
    }
    let seatY = H * 0.79 + yOff;
    if (sb) {
      seatY = Math.min(H * 0.86 + yOff, Math.max(sb.max.y + yOff + 0.18, H * 0.79 + yOff));
    }
    let seatZ = -L * 0.05;
    if (sb) {
      seatZ = Math.min(sb.max.z + 0.22, 0.04);
    }

    built.root.updateMatrixWorld(true);
    const rayMeshes = [];
    built.root.traverse(n => {
      if (n.isMesh && n.visible && !n.userData.isRayIgnore) rayMeshes.push(n);
    });
    const rc = new THREE.Raycaster();
    const rayDir = new THREE.Vector3(0, -0.025, -1).normalize();
    const isOpaqueHit = hit => {
      const m = Array.isArray(hit.object.material)
        ? hit.object.material[hit.face ? hit.face.materialIndex : 0]
        : hit.object.material;
      if (!m || m === built.glassMat) return false;
      if (m.transparent && m.opacity < 0.85) return false;
      return true;
    };

    for (let step = 0; step < 6; step++) {
      rc.set(new THREE.Vector3(seatX, seatY, seatZ), rayDir);
      rc.far = L * 0.45;
      const hits = rc.intersectObjects(rayMeshes, false).filter(isOpaqueHit);
      if (hits.length === 0) break;
      if (step < 2 && seatY < H * 0.87 + yOff) {
        seatY += 0.05;
      } else {
        seatZ -= 0.11;
      }
      if (seatZ < -L * 0.25) {
        seatZ = -L * 0.22;
        seatY = Math.max(seatY, H * 0.82 + yOff);
        break;
      }
    }

    playerCamAnchors = {
      hood: hoodAnchor,
      cockpit: { x: seatX, y: seatY, z: seatZ, lookY: seatY - 0.11 }
    };
  }

  function getPlayerCamAnchors() {
    return playerCamAnchors;
  }

  function setCockpitGlassMode(inCockpit) {
    if (!playerGlassMat) return;
    const target = inCockpit ? 0.10 : playerBaseGlassOpacity;
    if (Math.abs(playerGlassMat.opacity - target) > 0.01) {
      playerGlassMat.opacity = target;
      playerGlassMat.depthWrite = false;
    }
  }

  // Diverse Real 3D .GLB Traffic Fleet (High-detail PBR models only)
  const trafficAgents = [];
  const trafficPoolKeys = ['ferrari', 'bmwm5', 'porsche_718', 'porsche_turbos'];
  const trafficColors = ['#dc2626', '#0284c7', '#f59e0b', '#16a34a', '#f8fafc', '#334155', '#7c3aed', '#e11d48'];

  function spawnTrafficFleet(loopLen) {
    const availKeys = trafficPoolKeys.filter(k => assets.models[k]);
    const pool = availKeys.length ? availKeys : ['ferrari'];
    const countPerLane = 2;
    for (let k = 0; k < countPerLane; k++) {
      const s = k * (loopLen / countPerLane);
      addTrafficAgent(-6.6, s + 30,  -1, 19 + (k % 3) * 2.5, pool[k % pool.length], trafficColors[k % trafficColors.length], loopLen);
      addTrafficAgent(-2.2, s + 110, -1, 24 + (k % 3) * 2.5, pool[(k + 1) % pool.length], trafficColors[(k + 2) % trafficColors.length], loopLen);
      addTrafficAgent(2.2,  s + 60,   1, 22 + (k % 3) * 2.2, pool[(k + 2) % pool.length], trafficColors[(k + 4) % trafficColors.length], loopLen);
      addTrafficAgent(6.6,  s + 150,  1, 18 + (k % 3) * 2.0, pool[(k + 3) % pool.length], trafficColors[(k + 6) % trafficColors.length], loopLen);
    }
  }

  let trafficSharedMats = null;
  function getTrafficSharedMats() {
    if (trafficSharedMats) return trafficSharedMats;
    const bodyMats = {};
    trafficColors.forEach(hex => {
      bodyMats[hex] = makeBodyPaintMat(hex, 'metallic');
    });
    trafficSharedMats = {
      bodyMats,
      glassMat: makeWindowGlassMat('smoke'),
      rimMat: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 }),
      calMat: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.5 }),
      brakeMat: new THREE.MeshStandardMaterial({ color: 0xff1e1e, emissive: 0xff1111, emissiveIntensity: 2.0 })
    };
    return trafficSharedMats;
  }

  function addTrafficAgent(laneX, startS, dir, speed, glbKey, paintHex, loopLen) {
    const source = assets.models[glbKey] || assets.models.ferrari;
    if (!source) return null;

    ensureSmoothNormals(source, glbKey);
    const root = new THREE.Group();
    const clone = source.clone(true);
    const shared = getTrafficSharedMats();
    const bodyMat = shared.bodyMats[paintHex] || (shared.bodyMats[paintHex] = makeBodyPaintMat(paintHex, 'metallic'));
    const { glassMat, rimMat, calMat, brakeMat } = shared;

    applyCustomMaterialsToGLB(
      clone,
      glbKey,
      { bodyMat, accentMat: matDarkTrim, glassMat, rimMat, calMat, matCarbon, brakeMat },
      false,
      false
    );
    const catalogEntry = CAR_CATALOG.find(c => c.glbKey === glbKey);
    const spec = {
      length: catalogEntry ? catalogEntry.length : 4.65,
      chassis: catalogEntry ? catalogEntry.chassis : 'sedan',
      widthScale: catalogEntry ? catalogEntry.widthScale : 1.0,
      heightScale: catalogEntry ? catalogEntry.heightScale : 1.0
    };
    const norm = normalizeRealGLB(clone, glbKey, spec, 0);
    norm.group.position.y = -0.008;
    root.add(norm.group);

    if (dir < 0) root.rotation.y = Math.PI;
    scene.add(root);

    trafficAgents.push({
      mesh: root,
      wheels: [],
      lightbarPair: [],
      isPolice: false,
      laneX,
      baseLaneX: laneX,
      s: ((startS % loopLen) + loopLen) % loopLen,
      dir,
      speed,
      halfW: 0.96,
      halfL: 2.30,
      overtakenCooldown: 0
    });
  }

  function updatePlayerVisuals(phys, brake, wantNos, elapsed) {
    playerRoot.position.set(phys.x, 0, 0);
    playerRoot.rotation.y = phys.heading;
    playerChassis.rotation.x = phys.pitch;
    playerChassis.rotation.z = phys.roll;

    if (playerBrakeLightMat) {
      playerBrakeLightMat.emissiveIntensity = brake ? 4.8 : 1.5;
    }

    playerNosFlames.forEach(fl => {
      fl.visible = wantNos;
      if (wantNos) fl.scale.set(1, 0.8 + Math.random() * 0.7, 1);
    });

    playerWheels.forEach(w => {
      w.node.rotation[w.axis] = phys.wheelSpin * w.dir;
    });

    playerFrontSteerNodes.forEach(fs => {
      fs.node.rotation[fs.axis] = fs.baseRot + phys.steerAngle * 0.85;
    });

    if (playerSteeringWheel) {
      playerSteeringWheel.rotation.y = phys.steerAngle * 2.6;
    }

    const strobe = Math.sin(elapsed * 22) > 0;
    zpdLightbarMeshes.forEach(lb => {
      lb.rMat.emissiveIntensity = strobe ? 5.0 : 0.5;
      lb.bMat.emissiveIntensity = strobe ? 0.5 : 5.0;
    });
  }

  return {
    playerRoot,
    playerChassis,
    trafficAgents,
    buildCarModel,
    rebuildPlayerCar,
    getPlayerCamAnchors,
    setCockpitGlassMode,
    spawnTrafficFleet,
    updatePlayerVisuals
  };
}
