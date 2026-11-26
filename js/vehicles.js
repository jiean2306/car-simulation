import * as THREE from 'three';
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

  const rideHeight = [0.025, 0.0, -0.025, -0.045][playerConfig.suspension] || 0;
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

  const spoolRpm = aspiration === 'NA'
    ? 0
    : (aspiration === 'SUPERCHARGED' ? 1500 : (aspiration === 'TWIN-TURBO' ? 2400 : 3400));

  const dynoPoints = [];
  for (let i = 0; i <= 28; i++) {
    const r = 1000 + (i / 28) * (redline - 1000);
    const d = sampleEngineCurve(r, redline, torqueNm, hp, aspiration, maxBoostBar, 1.0);
    dynoPoints.push({ rpm: Math.round(r), torque: Math.round(d.torqueNm), hp: Math.round(d.hp) });
  }

  return {
    base,
    aspiration,
    drivetrain,
    hp,
    torqueNm,
    redline,
    maxBoostBar,
    spoolRpm,
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

export function sampleEngineCurve(rpm, redline, peakTorqueNm, peakHp, aspiration, maxBoostBar, boostFraction = 1.0) {
  const normRpm = Math.max(0, Math.min(1.08, (rpm - 900) / Math.max(1000, redline - 900)));
  let torqueFactor = 0.55;

  if (aspiration === 'NA') {
    const baseBell = 0.66 + 0.34 * Math.sin(Math.pow(Math.min(1, normRpm), 0.85) * Math.PI * 0.88);
    const vtecKick = normRpm > 0.62 ? 0.08 * Math.sin(((normRpm - 0.62) / 0.38) * Math.PI) : 0;
    torqueFactor = baseBell + vtecKick;
  } else if (aspiration === 'SUPERCHARGED') {
    const baseCurve = 0.76 + 0.24 * Math.sin(Math.min(1, normRpm) * Math.PI * 0.82);
    const boostContribution = 0.28 * boostFraction * (0.5 + 0.5 * Math.min(1, normRpm * 1.3));
    torqueFactor = baseCurve * (0.78 + boostContribution);
  } else {
    const spoolStart = aspiration === 'TWIN-TURBO' ? 0.20 : 0.34;
    const naturalNa = 0.52 + 0.18 * Math.sin(Math.min(1, normRpm) * Math.PI * 0.85);
    const turboWindow = Math.max(0, Math.min(1, (normRpm - spoolStart) / 0.24));
    const topEndTapering = normRpm > 0.86 ? 1.0 - (normRpm - 0.86) * 0.85 : 1.0;
    const boostMult = turboWindow * boostFraction * topEndTapering;
    torqueFactor = naturalNa + 0.46 * boostMult;
  }

  if (rpm > redline) {
    torqueFactor *= Math.max(0.1, 1.0 - ((rpm - redline) / 250));
  }

  const currentTorqueNm = peakTorqueNm * Math.max(0.25, Math.min(1.06, torqueFactor));
  const currentHp = (currentTorqueNm * rpm) / 7127;
  return { torqueNm: currentTorqueNm, hp: currentHp };
}

/**
 * Maps every vehicle in the 12-brand / 19-car catalog to its unique
 * real 3D .GLB vehicle model file.
 */
export function pickRealGLBKey(carDef) {
  return (carDef && carDef.glbKey) || 'ferrari';
}

// Per-GLB forward orientation rotation around Y so every model faces -Z (highway forward)
const GLB_FORWARD_ROT_Y = {
  ferrari:        0,
  porsche_gt3rs:  Math.PI,
  porsche_718:    Math.PI,
  porsche_918:    Math.PI,
  porsche_930:    Math.PI,
  porsche_turbos: Math.PI,
  bmwm5:          Math.PI,
  sedan:          Math.PI,
  saloon:         Math.PI,
  g63:            Math.PI,
  suv_q7:         Math.PI,
  lamborghini:    Math.PI,
  corvette:       Math.PI,
  muscle:         -Math.PI * 0.5,
  gtr:            Math.PI * 0.5,
  mclaren:        Math.PI,
  hatchback:      -Math.PI * 0.5,
  jeep_wrangler:  Math.PI,
  xiaomi_yu7:     Math.PI
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

/**
 * Normalizes any real 3D .GLB car model to face -Z, sit flush at Y = 0,
 * and match the target vehicle's length while preserving realistic window & roof proportions.
 */
function normalizeRealGLB(modelClone, glbKey, carDef, spacerOffset = 0) {
  // Strip studio floors, fabric backdrops, and stray streetlamps embedded in third-party GLBs
  const toRemove = [];
  modelClone.traverse(n => {
    if (n.isLight || n.isCamera || /ground|floor|shadow|plane|studio|backdrop|fabric|lanternglass|camera|light/i.test(n.name || '')) {
      toRemove.push(n);
    }
  });
  toRemove.forEach(n => { if (n.parent) n.parent.remove(n); });
const computeCarBox = (root) => {
root.updateMatrixWorld(true);
const meshInfos = [];
root.traverse(n => {
if (!n.isMesh || !n.geometry) return;
for (let p = n; p; p = p.parent) { if (p.visible === false) return; }
if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
const b = n.geometry.boundingBox;
if (!b || b.isEmpty()) return;
const wb = b.clone().applyMatrix4(n.matrixWorld);
const sz = new THREE.Vector3();
const ctr = new THREE.Vector3();
wb.getSize(sz); wb.getCenter(ctr);
const maxXZ = Math.max(sz.x, sz.z);
if (maxXZ > 0 && sz.y < maxXZ * 0.015) return;
meshInfos.push({ box: wb, center: ctr, span: sz.length() });
});
if (!meshInfos.length) return new THREE.Box3().setFromObject(root);
const xs = meshInfos.map(m => m.center.x).sort((a, b) => a - b);
const ys = meshInfos.map(m => m.center.y).sort((a, b) => a - b);
const zs = meshInfos.map(m => m.center.z).sort((a, b) => a - b);
const mid = Math.floor(meshInfos.length / 2);
const medCenter = new THREE.Vector3(xs[mid], ys[mid], zs[mid]);
const dists = meshInfos.map(m => m.center.distanceTo(medCenter)).sort((a, b) => a - b);
const spans = meshInfos.map(m => m.span).sort((a, b) => a - b);
const maxDist = Math.max(dists[Math.floor(meshInfos.length * 0.75)] * 5, spans[mid] * 5, 1e-3);
const out = new THREE.Box3();
let count = 0;
for (const m of meshInfos) {
if (m.center.distanceTo(medCenter) <= maxDist) { out.union(m.box); count++; }
}
if (!count) { for (const m of meshInfos) out.union(m.box); }
return out;
};

  const wrapper = new THREE.Group();
  const inner = new THREE.Group();
  inner.add(modelClone);

  const rotY = GLB_FORWARD_ROT_Y[glbKey] !== undefined ? GLB_FORWARD_ROT_Y[glbKey] : Math.PI;
  inner.rotation.y = rotY;
  wrapper.add(inner);
  wrapper.updateMatrixWorld(true);

  const box = computeCarBox(wrapper);
  const size = new THREE.Vector3();
  box.getSize(size);

  // If width > length after initial rotation, rotate 90 degrees so length is along Z
  if (size.x > size.z * 1.15) {
    inner.rotation.y += Math.PI * 0.5;
    wrapper.updateMatrixWorld(true);
   box.copy(computeCarBox(wrapper));
    box.getSize(size);
  }

  // Uniformly scale to target car length while keeping true-to-life window/roof aspect ratios
  const targetLen = carDef.length || 4.55;
  const uniformScale = targetLen / Math.max(size.z, 0.1);

  // Subtle proportion tailoring (e.g. compact hatchback vs long wagon vs wide track)
  let heightAdjust = 1.0;
  let widthAdjust = 1.0 + (spacerOffset * 0.35);
  if (glbKey === 'suv_q7') {
    if (carDef.chassis === 'hatch') {
      heightAdjust = 0.92;
      widthAdjust *= 0.94;
    } else if (carDef.chassis === 'wagon') {
      heightAdjust = 0.86;
    }
  }

  inner.scale.set(
    uniformScale * widthAdjust,
    uniformScale * heightAdjust,
    uniformScale
  );
  wrapper.updateMatrixWorld(true);

  const box2 = computeCarBox(wrapper);
  const center2 = new THREE.Vector3();
  const finalSize = new THREE.Vector3();
  box2.getCenter(center2);
  box2.getSize(finalSize);

  inner.position.x -= center2.x;
  inner.position.y -= box2.min.y;
  inner.position.z -= center2.z;
  wrapper.updateMatrixWorld(true);

  return { group: wrapper, size: finalSize };
}

/**
 * Traverses a real 3D .GLB car model and binds the user's custom Body Paint,
 * Two-Tone Accent/Carbon Hood & Roof, Window Glass Tint, Alloy Rim Color, and Brake Caliper Color.
 */
function applyCustomMaterialsToGLB(modelClone, glbKey, mats, twoTone) {
  const { bodyMat, accentMat, glassMat, rimMat, calMat, matCarbon, brakeMat } = mats;

  modelClone.traverse(node => {
    if (!node.isMesh || !node.material) return;
    node.castShadow = true;
    node.receiveShadow = true;

    const nName = (node.name || '').toLowerCase();
    const applyToSingleMat = origMat => {
      const mName = ((origMat && origMat.name) || '').toLowerCase();

      // 1. Primary Body Paint
      const isPaint =
        nName === 'body' ||
        mName === 'body_color' ||
        mName === 'paint' ||
        mName === 'coat' ||
        mName === 'bodycolor' ||
        mName === 'new_material' ||
        mName === 'mat8' ||
        mName === 'sennapaint' ||
        mName === 'sennapaintmain' ||
        (glbKey === 'suv_q7' && mName === 'material') ||
        (glbKey === 'jeep_wrangler' && mName === 'material') ||
        (glbKey === 'xiaomi_yu7' && mName === 'carpaint') ||
        (glbKey === 'hatchback' && (mName === 'material.010' || mName === 'material.012')) ||
        mName.includes('carpaint') ||
        mName.includes('car_paint') ||
        mName.includes('paint_material') ||
        mName.includes('body_paint') ||
        mName.includes('coloured_material');

      if (isPaint && !mName.includes('black') && !mName.includes('secondary')) {
        if (twoTone && (nName.includes('hood') || nName.includes('roof') || nName.includes('bonnet'))) {
          return accentMat;
        }
        return bodyMat;
      }

      // 2. Window Glass (excluding headlight/taillight lenses and screens)
      const isWindow =
        (nName === 'glass' ||
         mName === 'glass_gray' ||
         mName === 'glass' ||
         mName === 'glass_18' ||
         mName === 'window_glass' ||
         mName === 'vidiro' ||
         mName === 'vidrio2' ||
         mName === 'mat17' ||
         mName === 'senna_glass' ||
         mName === 'windows' ||
         mName === 'd_glass' ||
         mName.includes('window_material') ||
         mName.includes('mmat_glass') ||
         mName.includes('twixer_992_glass.002')) &&
        !mName.includes('light') &&
        !mName.includes('red') &&
        !mName.includes('screen') &&
        !mName.includes('int');

      if (isWindow) {
        return glassMat;
      }

      // 3. Alloy Rims
      const isRim =
        nName.startsWith('rim_') ||
        mName === '930_rim' ||
        mName === 'wheel_rim' ||
        mName === 'gt4_rimface' ||
        mName === 'q7rin' ||
        mName === 'mat22' ||
        mName === 'alum' ||
        mName.includes('jmi_rim') ||
        mName.includes('3dwheel1a') ||
        mName.includes('wheels_chrome') ||
        mName.includes('tire_hub');

      if (isRim) {
        return rimMat;
      }

      // 4. Brake Calipers
      const isCaliper =
        nName === 'brake' ||
        nName === 'brakes' ||
        mName === 'caliper' ||
        mName === 'calip_1' ||
        mName === 'calip_2' ||
        mName.includes('callipera') ||
        mName.includes('amdb11_caliper') ||
        mName.includes('tire_brake');

      if (isCaliper) {
        return calMat;
      }

      // 5. Taillights / Brakelights
      if (nName === 'lights_red' || mName === 'taillight_glass' || mName === 'taillight' || mName.includes('brakelight')) {
        return brakeMat;
      }

      // 6. Carbon Fiber Trim
      if (mName.includes('carbon')) {
        return twoTone ? accentMat : matCarbon;
      }

      origMat.envMapIntensity = 1.35;
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
    side: THREE.FrontSide
  });

  const matDarkTrim = new THREE.MeshStandardMaterial({
    color: 0x12161f,
    roughness: 0.48,
    metalness: 0.35,
    side: THREE.FrontSide
  });

  let playerWheels = [];
  let playerFrontSteerNodes = [];
  let playerNosFlames = [];
  let playerBrakeLightMat = null;
  let playerSteeringWheel = null;
  let zpdLightbarMeshes = [];

  function makeBodyPaintMat(hexColor, finish) {
    if (finish === 'carbon') return matCarbon;
    if (finish === 'chrome') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(hexColor),
        roughness: 0.05,
        metalness: 0.98,
        envMapIntensity: 1.65,
        side: THREE.FrontSide
      });
    }
    const rough = finish === 'matte' ? 0.55 : (finish === 'metallic' ? 0.14 : (finish === 'pearl' ? 0.09 : 0.08));
    const metal = finish === 'metallic' ? 0.85 : (finish === 'matte' ? 0.20 : (finish === 'pearl' ? 0.62 : 0.45));
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor),
      roughness: rough,
      metalness: metal,
      envMapIntensity: 1.38,
      side: THREE.FrontSide
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
          return { group: root, root, pending, wheels, frontSteer, steeringWheel, brakeMat, flames: [], lightbarPair: [] };
        }
      }
      sourceGLB = assets.models.sedan || assets.models.ferrari;
    }

    let carSize = new THREE.Vector3(carDef.width || 1.92, 1.38, carDef.length || 4.55);
    const camberRad = (cfg.camberDeg * Math.PI) / 180;

    if (sourceGLB) {
      const modelClone = sourceGLB.clone(true);
      applyCustomMaterialsToGLB(
        modelClone,
        glbKey,
        { bodyMat, accentMat, glassMat, rimMat, calMat, matCarbon, brakeMat },
        cfg.livery === 'twotone'
      );

      const norm = normalizeRealGLB(modelClone, glbKey, carDef, cfg.spacerOffset);
      carSize = norm.size;
      norm.group.position.y = rh;
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
    const deckY = (carDef.chassis === 'hatch' || carDef.chassis === 'wagon' || carDef.chassis === 'suv')
      ? carSize.y * 0.94
      : carSize.y * 0.68;

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
      blade.castShadow = true;
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
      rBox.castShadow = true;
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

    // ---- GROUND CONTACT AO SHADOW ----
    if (assets.textures.ferrariAO) {
      const aoPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(carSize.x * 1.18, carSize.z * 1.03),
        new THREE.MeshBasicMaterial({
          map: assets.textures.ferrariAO,
          blending: THREE.MultiplyBlending,
          premultipliedAlpha: true,
          transparent: true,
          depthWrite: false
        })
      );
      aoPlane.rotation.x = -Math.PI / 2;
      aoPlane.position.y = 0.012;
      root.add(aoPlane);
    }

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
      fl.position.set(ex, 0.22 + rh, rearZ + 0.46);
      fl.visible = false;
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
  }

  // Diverse Real 3D .GLB Traffic Fleet (SUVs, Sedans, Coupes, Muscle Cars, Supercars!)
  const trafficAgents = [];
  const trafficPoolKeys = ['bmwm5', 'sedan', 'suv_q7', 'muscle', 'g63', 'ferrari'];
  const trafficColors = ['#dc2626', '#0284c7', '#f59e0b', '#16a34a', '#f8fafc', '#334155', '#7c3aed', '#e11d48'];

  function spawnTrafficFleet(loopLen) {
    const countPerLane = 3;
    for (let k = 0; k < countPerLane; k++) {
      const s = k * (loopLen / countPerLane);
      addTrafficAgent(-6.6, s + 30,  -1, 19 + (k % 3) * 2.5, trafficPoolKeys[k % trafficPoolKeys.length], trafficColors[k % trafficColors.length], loopLen);
      addTrafficAgent(-2.2, s + 110, -1, 24 + (k % 3) * 2.5, trafficPoolKeys[(k + 1) % trafficPoolKeys.length], trafficColors[(k + 2) % trafficColors.length], loopLen);
      addTrafficAgent(2.2,  s + 60,   1, 22 + (k % 3) * 2.2, trafficPoolKeys[(k + 2) % trafficPoolKeys.length], trafficColors[(k + 4) % trafficColors.length], loopLen);
      addTrafficAgent(6.6,  s + 150,  1, 18 + (k % 3) * 2.0, trafficPoolKeys[(k + 3) % trafficPoolKeys.length], trafficColors[(k + 6) % trafficColors.length], loopLen);
    }
  }
let trafficSharedMats = null;
  function getTrafficSharedMats() {
    if (trafficSharedMats) return trafficSharedMats;
    const bodyMats = {};
trafficColors.forEach(hex => { bodyMats[hex] = makeBodyPaintMat(hex, 'metallic'); });
trafficSharedMats = { bodyMats, glassMat: makeWindowGlassMat('smoke'), rimMat: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 }), calMat: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.5 }), brakeMat: new THREE.MeshStandardMaterial({ color: 0xff1e1e, emissive: 0xff1111, emissiveIntensity: 2.0 }) };
return trafficSharedMats;
  }
  function addTrafficAgent(laneX, startS, dir, speed, glbKey, paintHex, loopLen) {
    const source = assets.models[glbKey] || assets.models.ferrari;
if (!source) return null;
const root = new THREE.Group();
      const clone = source.clone(true);
const shared = getTrafficSharedMats();
const bodyMat = shared.bodyMats[paintHex] || (shared.bodyMats[paintHex] = makeBodyPaintMat(paintHex, 'metallic'));
const { glassMat, rimMat, calMat, brakeMat } = shared;
      applyCustomMaterialsToGLB(
        clone,
        glbKey,
        { bodyMat, accentMat: matDarkTrim, glassMat, rimMat, calMat, matCarbon, brakeMat },
        false
      );
const catalogEntry = Object.values(CAR_CATALOG).find(c => c.glbKey === glbKey);
const spec = { length: catalogEntry?.length || 4.65, chassis: catalogEntry?.chassis || 'sedan' };
const norm = normalizeRealGLB(clone, glbKey, spec, 0);
      root.add(norm.group);
const wheels = [];
['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].forEach(wName => {
const wNode = clone.getObjectByName(wName);
if (wNode) wheels.push(wNode);
});
if (wheels.length === 0) {
clone.traverse(n => {
if (n.isMesh && /wheel/i.test(n.name || '')) wheels.push(n);
});
    if (dir < 0) root.rotation.y = Math.PI;
    scene.add(root);

    trafficAgents.push({
      mesh: root,
wheels,
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
    spawnTrafficFleet,
    updatePlayerVisuals
  };
}
