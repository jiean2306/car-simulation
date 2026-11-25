import * as THREE from 'three';

/**
 * Generates a smooth, anatomically accurate 3D lofted car body + greenhouse cabin
 * from a longitudinal profile table (z stations from front bumper to rear bumper),
 * complete with curved 3D wheel-arch cutouts, flush inset windshield & side windows,
 * painted A/B/C/D pillars, interior cabin (seats + dashboard + steering wheel),
 * and brand-specific front grilles, headlights, and taillights.
 */
export function buildRealisticCarBody(carDef, opts) {
  const {
    bodyMat,
    accentMat,
    glassMat,
    matCarbon,
    matChrome,
    matDarkTrim,
    hlGlowMat,
    brakeMat,
    drlMat,
    amberMat
  } = opts;

  const group = new THREE.Group();
  const style = getCarBodyArchetype(carDef);

  const W = carDef.width;
  const L = carDef.length;
  const H = style.height;
  const wheelR = style.wheelRadius;
  const wbF = -L * style.frontAxleFrac; // Front axle Z (-Z is front)
  const wbR =  L * style.rearAxleFrac;  // Rear axle Z (+Z is rear)

  // 1. Build Sculpted Multi-Section 3D Lower Body & Fender Haunches (with real curved wheel wells!)
  const lowerBodyGeo = createLoftedLowerBody(W, L, H, wheelR, wbF, wbR, style);
  const lowerBodyMesh = new THREE.Mesh(lowerBodyGeo, bodyMat);
  lowerBodyMesh.castShadow = true;
  lowerBodyMesh.receiveShadow = true;
  group.add(lowerBodyMesh);

  // Dark inner wheel-well liners & chassis undertray so wheel arches never look hollow
  const undertray = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.82, 0.14, L * 0.88),
    matDarkTrim
  );
  undertray.position.set(0, style.groundClearance + 0.08, 0);
  group.add(undertray);

  // Panda Two-Tone lower rocker/bumper cladding (for AE86 Trueno, SUVs, or Two-Tone livery)
  if (style.hasLowerCladding || carDef.id === 'toy_ae86') {
    const cladMat = carDef.id === 'toy_ae86' ? matDarkTrim : accentMat;
    const sillL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, (wbR - wbF) - wheelR * 2.1), cladMat);
    sillL.position.set(-W * 0.485, style.groundClearance + 0.11, (wbF + wbR) * 0.5);
    const sillR = sillL.clone();
    sillR.position.x = W * 0.485;
    group.add(sillL, sillR);
  }

  // 2. Build Realistic Greenhouse (Roof, A/B/C/D Pillars, Flush Inset Windshield, Side Windows & Rear Glass)
  buildRealisticGreenhouse(group, W, L, H, style, carDef, {
    bodyMat: opts.twoTone ? accentMat : bodyMat,
    glassMat,
    matDarkTrim
  });

  // 3. Build Visible 3D Interior Cockpit (Dashboard, Steering Wheel, Bucket Seats)
  const steeringWheel = buildInteriorCockpit(group, W, L, H, style, matDarkTrim, accentMat);

  // 4. Build Brand- & Model-Accurate 3D Front Fascia (Grille, Headlights, DRLs, FMIC, Hood Scoop)
  buildBrandFrontFascia(group, W, L, H, style, carDef, {
    bodyMat,
    accentMat,
    matCarbon,
    matChrome,
    matDarkTrim,
    hlGlowMat,
    brakeMat,
    drlMat,
    amberMat
  });

  // 5. Build Brand- & Model-Accurate 3D Rear Fascia (Taillights, Diffuser, License Plate, G63 Spare Tire)
  buildBrandRearFascia(group, W, L, H, style, carDef, {
    bodyMat,
    matCarbon,
    matChrome,
    matDarkTrim,
    brakeMat,
    amberMat
  });

  // 6. Sculpted Door Side Mirrors
  buildSideMirrors(group, W, L, H, style, bodyMat, matDarkTrim, matChrome);

  return {
    meshGroup: group,
    steeringWheel,
    wheelPositions: {
      wx: W * 0.445,
      wy: wheelR,
      wzF: wbF,
      wzR: wbR,
      wheelScale: wheelR / 0.35
    },
    dimensions: new THREE.Vector3(W, H, L)
  };
}

/**
 * Maps each of the 180 cars across 18 brands to its authentic real-world body dimensions,
 * window beltline-to-roof glass ratio (36% to 44% of height!), hood length, and roofline profile.
 */
export function getCarBodyArchetype(carDef) {
  const id = carDef.id;
  const brand = carDef.brand;
  const ch = carDef.chassis;

  // Base defaults (Sports Sedan)
  const s = {
    type: 'sedan',
    height: 1.44,
    groundClearance: 0.16,
    wheelRadius: 0.34,
    frontAxleFrac: 0.31,
    rearAxleFrac: 0.30,
    noseHeight: 0.56,
    hoodBaseY: 0.78,
    beltY: 0.88,         // Window bottom sill height
    roofY: 1.44,         // Roof peak height (Window height = 1.44 - 0.88 = 0.56m!)
    trunkY: 0.94,
    hoodEndZ: -0.22,     // Fraction of L where windshield base starts
    roofStartZ: -0.05,   // Fraction of L where windshield top meets roof
    roofEndZ: 0.22,      // Fraction of L where rear window top starts
    rearGlassEndZ: 0.37, // Fraction of L where rear window base meets trunk/tailgate
    tumblehome: 0.83,    // Roof width as fraction of body width (realistic inward window angle)
    fenderRise: 0.03,    // Height of outer fenders above center hood (high on Porsche 911!)
    haunchFlare: 0.04,   // Rear quarter panel muscular flare
    doors: 4,
    hasLowerCladding: false,
    isFastback: false,
    isHatch: false,
    isWagon: false,
    isSUV: false,
    isPickup: false,
    isGWagen: false
  };

  // --- 1. MALAYSIAN & JDM COMPACT HATCHBACKS (Perodua Myvi, Axia, Kelisa, Kancil, Viva, Kenari, Proton Satria, Suprima, Civic Type R, GR Yaris, Focus RS) ---
  if (ch === 'hatch') {
    s.type = 'hatch';
    s.height = id.includes('kanc') || id.includes('kelis') ? 1.43 : 1.51;
    s.groundClearance = 0.16;
    s.wheelRadius = id.includes('kanc') || id.includes('kelis') ? 0.29 : 0.32;
    s.frontAxleFrac = 0.32;
    s.rearAxleFrac = 0.33;
    s.noseHeight = 0.58;
    s.hoodBaseY = 0.80;
    s.beltY = 0.89;
    s.roofY = s.height;
    s.trunkY = 0.92;
    s.hoodEndZ = -0.25;
    s.roofStartZ = -0.07;
    s.roofEndZ = 0.34;      // Long hatchback roof extending to the rear tailgate!
    s.rearGlassEndZ = 0.46; // Steep hatchback rear tailgate window
    s.tumblehome = 0.84;
    s.fenderRise = 0.01;
    s.haunchFlare = id.includes('fl5') || id.includes('fk8') || id.includes('yaris') || id.includes('neo') ? 0.05 : 0.02;
    s.doors = (id.includes('neo') || id.includes('gti') || id.includes('ek9') || id.includes('yaris') || id.includes('c30')) ? 2 : 4;
    s.isHatch = true;
    return s;
  }

  // --- 2. PORSCHE 911 / 718 TEARDROP SILHOUETTE ---
  if (brand === 'Porsche' && ch !== 'saloon') {
    s.type = 'porsche_911';
    s.height = 1.30;
    s.groundClearance = 0.13;
    s.wheelRadius = 0.345;
    s.frontAxleFrac = 0.30;
    s.rearAxleFrac = 0.29;
    s.noseHeight = 0.44;
    s.hoodBaseY = 0.68;
    s.beltY = 0.80;
    s.roofY = 1.30;         // 0.50m tall curved 911 teardrop window greenhouse!
    s.trunkY = 0.84;
    s.hoodEndZ = -0.20;
    s.roofStartZ = -0.03;
    s.roofEndZ = 0.14;
    s.rearGlassEndZ = 0.38; // Continuous fastback teardrop slope to rear engine deck
    s.tumblehome = 0.80;
    s.fenderRise = 0.095;   // Iconic raised Porsche 911 front headlight fenders with lower center frunk!
    s.haunchFlare = 0.075;  // Wide 911 Turbo / GT3 RS rear haunches
    s.doors = 2;
    s.isFastback = true;
    return s;
  }

  // --- 3. LAMBORGHINI SHARP HEXAGONAL WEDGE SUPERCAR ---
  if (brand === 'Lamborghini' && ch !== 'suv') {
    s.type = 'lambo_wedge';
    s.height = 1.18;
    s.groundClearance = 0.12;
    s.wheelRadius = 0.35;
    s.frontAxleFrac = 0.30;
    s.rearAxleFrac = 0.31;
    s.noseHeight = 0.36;
    s.hoodBaseY = 0.62;
    s.beltY = 0.74;
    s.roofY = 1.18;         // 0.44m tall sharp angular wedge cabin
    s.trunkY = 0.82;
    s.hoodEndZ = -0.27;
    s.roofStartZ = -0.05;
    s.roofEndZ = 0.15;
    s.rearGlassEndZ = 0.42;
    s.tumblehome = 0.78;
    s.fenderRise = 0.04;
    s.haunchFlare = 0.08;
    s.doors = 2;
    s.isFastback = true;
    return s;
  }

  // --- 4. AMERICAN MUSCLE (Dodge Challenger / Charger / Ford Mustang) ---
  if (ch === 'muscle' || (brand === 'Dodge' && (id.includes('demon') || id.includes('hell') || id.includes('scat') || id.includes('dayt')))) {
    s.type = brand === 'Ford' ? 'muscle_mustang' : 'muscle_challenger';
    s.height = 1.41;
    s.groundClearance = 0.15;
    s.wheelRadius = 0.355;
    s.frontAxleFrac = 0.32;
    s.rearAxleFrac = 0.29;
    s.noseHeight = 0.64;    // Tall, imposing vertical muscle-car front fascia
    s.hoodBaseY = 0.86;     // High flat muscular hood
    s.beltY = 0.91;
    s.roofY = 1.41;         // 0.50m tall realistic muscle-car windshield & side windows!
    s.trunkY = 0.95;
    s.hoodEndZ = -0.17;     // Long V8 front hood
    s.roofStartZ = 0.0;
    s.roofEndZ = 0.20;
    s.rearGlassEndZ = 0.38;
    s.tumblehome = 0.83;
    s.fenderRise = 0.015;
    s.haunchFlare = 0.065;  // Coke-bottle rear fender flare
    s.doors = 2;
    s.isFastback = brand === 'Ford';
    return s;
  }

  // --- 5. JDM SKYLINE GT-R (R34 / R32 / R33 / R35) BOXY 3-BOX COUPE ---
  if (brand === 'Nissan' && (id.includes('r34') || id.includes('r32') || id.includes('r33') || id.includes('r35'))) {
    s.type = 'jdm_gtr';
    s.height = 1.37;
    s.groundClearance = 0.14;
    s.wheelRadius = 0.34;
    s.frontAxleFrac = 0.31;
    s.rearAxleFrac = 0.30;
    s.noseHeight = 0.56;
    s.hoodBaseY = 0.80;
    s.beltY = 0.86;
    s.roofY = 1.37;         // 0.51m tall airy JDM greenhouse windows!
    s.trunkY = 0.90;
    s.hoodEndZ = -0.19;
    s.roofStartZ = -0.03;
    s.roofEndZ = 0.19;
    s.rearGlassEndZ = 0.35;
    s.tumblehome = 0.83;
    s.fenderRise = 0.02;
    s.haunchFlare = 0.055;
    s.doors = 2;
    return s;
  }

  // --- 6. JDM RETRO POP-UP HEADLIGHT WEDGE (Toyota AE86 Trueno, 180SX, NSX-R NA2, MR2, Prelude) ---
  if (id === 'toy_ae86' || id === 'nis_180sx' || id === 'hon_nsxr' || id === 'toy_mr2') {
    s.type = 'jdm_retro_popup';
    s.height = id === 'hon_nsxr' ? 1.18 : 1.33;
    s.groundClearance = 0.15;
    s.wheelRadius = 0.31;
    s.frontAxleFrac = 0.31;
    s.rearAxleFrac = 0.30;
    s.noseHeight = 0.48;
    s.hoodBaseY = 0.72;
    s.beltY = id === 'hon_nsxr' ? 0.74 : 0.82;
    s.roofY = s.height;     // Big airy 80s/90s JDM glass cabin!
    s.trunkY = 0.85;
    s.hoodEndZ = -0.20;
    s.roofStartZ = -0.04;
    s.roofEndZ = 0.18;
    s.rearGlassEndZ = 0.39;
    s.tumblehome = 0.83;
    s.fenderRise = 0.01;
    s.haunchFlare = 0.03;
    s.doors = 2;
    s.isFastback = true;
    return s;
  }

  // --- 7. LONG-HOOD FRONT-ENGINE GT SUPERCAR (AMG GT Black Series, SLS, SLR, Viper ACR, Ferrari 812/Roma, Supra A80/A90, Nissan Z) ---
  if (id.includes('viper') || id.includes('vgts') || id.includes('mer_gtbs') || id.includes('mer_sls') || id.includes('mer_slr') || id.includes('fer_812') || id.includes('fer_roma') || id.includes('toy_a90') || id.includes('toy_a80') || id.includes('nis_z34') || id.includes('nis_370z') || id.includes('nis_350z')) {
    s.type = (id.includes('toy_a') || id.includes('nis_')) ? 'jdm_supra_coupe' : 'front_gt_supercar';
    s.height = 1.29;
    s.groundClearance = 0.13;
    s.wheelRadius = 0.345;
    s.frontAxleFrac = 0.33;
    s.rearAxleFrac = 0.30;
    s.noseHeight = 0.48;
    s.hoodBaseY = 0.75;
    s.beltY = 0.82;
    s.roofY = 1.29;         // 0.47m tall realistic GT coupe windows
    s.trunkY = 0.87;
    s.hoodEndZ = -0.14;     // Extra-long front hood, cab-backward greenhouse!
    s.roofStartZ = 0.02;
    s.roofEndZ = 0.22;
    s.rearGlassEndZ = 0.40;
    s.tumblehome = 0.80;
    s.fenderRise = 0.035;
    s.haunchFlare = 0.07;
    s.doors = 2;
    s.isFastback = true;
    return s;
  }

  // --- 8. ESTATE WAGONS (Audi RS6 Avant, RS4, Volvo 850 T-5R, V60, V70R, Perodua Alza, Dodge Magnum) ---
  if (ch === 'wagon') {
    s.type = 'wagon';
    s.height = 1.47;
    s.groundClearance = 0.16;
    s.wheelRadius = 0.34;
    s.frontAxleFrac = 0.31;
    s.rearAxleFrac = 0.30;
    s.noseHeight = 0.58;
    s.hoodBaseY = 0.82;
    s.beltY = 0.89;
    s.roofY = 1.47;         // 0.58m tall estate wagon greenhouse!
    s.trunkY = 0.90;
    s.hoodEndZ = -0.22;
    s.roofStartZ = -0.05;
    s.roofEndZ = 0.38;      // Long wagon roof extending all the way back
    s.rearGlassEndZ = 0.47;
    s.tumblehome = 0.84;
    s.fenderRise = 0.02;
    s.haunchFlare = id.includes('rs6') ? 0.06 : 0.025;
    s.doors = 4;
    s.isWagon = true;
    return s;
  }

  // --- 9. ULTRA-LUXURY FULL-SIZE SALOON / COUPE (Rolls-Royce Phantom/Ghost/Wraith, Bentley Flying Spur/Continental/Mulsanne, Toyota Century) ---
  if (brand === 'Rolls-Royce' || brand === 'Bentley' || id === 'toy_cent' || ch === 'saloon') {
    if (ch !== 'suv' && id !== 'ben_speed8') {
      s.type = (brand === 'Rolls-Royce' || brand === 'Bentley' || id === 'toy_cent') ? 'luxury_rolls_bentley' : 'sedan';
      s.height = 1.52;
      s.groundClearance = 0.17;
      s.wheelRadius = 0.37;
      s.frontAxleFrac = 0.32;
      s.rearAxleFrac = 0.30;
      s.noseHeight = 0.72;  // Tall upright Pantheon / Matrix radiator grille nose
      s.hoodBaseY = 0.92;
      s.beltY = 0.96;
      s.roofY = 1.52;       // 0.56m tall formal luxury glass cabin
      s.trunkY = 0.96;
      s.hoodEndZ = -0.18;
      s.roofStartZ = -0.03;
      s.roofEndZ = 0.24;
      s.rearGlassEndZ = 0.38;
      s.tumblehome = 0.86;
      s.fenderRise = 0.01;
      s.haunchFlare = 0.03;
      s.doors = ch === 'coupe' ? 2 : 4;
      return s;
    }
  }

  // --- 10. SUVs, CROSSOVERS, G63 AMG 4x4 & F-150 RAPTOR PICKUP ---
  if (ch === 'suv') {
    const isG63 = id === 'mer_g63';
    const isRaptor = id === 'frd_rapt';
    s.type = isG63 ? 'suv_gwagen' : (isRaptor ? 'suv_pickup' : 'suv_crossover');
    s.height = isG63 ? 1.92 : (isRaptor ? 1.88 : (id === 'per_ativa' || id === 'pro_x50' ? 1.62 : 1.68));
    s.groundClearance = isG63 || isRaptor ? 0.28 : 0.22;
    s.wheelRadius = isG63 || isRaptor ? 0.42 : (id === 'per_ativa' || id === 'pro_x50' ? 0.34 : 0.39);
    s.frontAxleFrac = 0.32;
    s.rearAxleFrac = 0.31;
    s.noseHeight = isG63 || isRaptor ? 0.96 : 0.78;
    s.hoodBaseY = isG63 || isRaptor ? 1.15 : 0.98;
    s.beltY = isG63 || isRaptor ? 1.18 : 1.04;
    s.roofY = s.height;
    s.trunkY = isRaptor ? 1.12 : s.beltY;
    s.hoodEndZ = -0.22;
    s.roofStartZ = isG63 ? -0.14 : -0.06;
    s.roofEndZ = isRaptor ? 0.12 : (isG63 ? 0.45 : 0.36);
    s.rearGlassEndZ = isRaptor ? 0.14 : (isG63 ? 0.48 : 0.46);
    s.tumblehome = isG63 ? 0.93 : 0.85;
    s.fenderRise = 0.015;
    s.haunchFlare = 0.04;
    s.doors = 4;
    s.hasLowerCladding = true;
    s.isSUV = true;
    s.isPickup = isRaptor;
    s.isGWagen = isG63;
    return s;
  }

  // --- 11. 2-DOOR SPORTS COUPES (BMW M4/M2/M3 E46/E92/E30, Audi TT RS/RS5/S1, Honda S2000/DC2/DC5, Proton Putra, Nissan S15, Volvo P1800) ---
  if (ch === 'coupe') {
    s.type = 'coupe';
    s.height = 1.37;
    s.groundClearance = 0.15;
    s.wheelRadius = 0.335;
    s.frontAxleFrac = 0.31;
    s.rearAxleFrac = 0.30;
    s.noseHeight = 0.54;
    s.hoodBaseY = 0.78;
    s.beltY = 0.85;
    s.roofY = 1.37;         // 0.52m tall realistic coupe windshield & quarter windows!
    s.trunkY = 0.90;
    s.hoodEndZ = -0.20;
    s.roofStartZ = -0.03;
    s.roofEndZ = 0.17;
    s.rearGlassEndZ = 0.35;
    s.tumblehome = 0.82;
    s.fenderRise = 0.02;
    s.haunchFlare = 0.045;
    s.doors = 2;
    return s;
  }

  // --- 12. 4-DOOR SPORTS SEDANS (Proton Saga, Wira, Inspira, Prevé, S70, Perodua Bezza, BMW M3 G80, M5, Mercedes E63, 190E, Audi RS3, Honda Accord, Toyota Chaser, Volvo S60) ---
  return s;
}

/**
 * Builds a smooth 3D lofted lower car body from front bumper (-L/2) to rear bumper (+L/2)
 * with curved 3D wheel arch cutouts over the front and rear axles.
 */
function createLoftedLowerBody(W, L, H, wheelR, wbF, wbR, style) {
  const numZ = 44;
  const hw = W * 0.5;
  const hl = L * 0.5;

  // Cross-section stations along Z from -hl (front nose) to +hl (rear bumper)
  const stations = [];
  for (let i = 0; i <= numZ; i++) {
    const u = i / numZ;          // 0 (front) -> 1 (rear)
    const z = -hl + u * L;
    const zFrac = z / L;         // -0.5 -> +0.5

    // Plan-view width taper at front and rear corners
    let widthFactor = 1.0;
    if (u < 0.08) {
      widthFactor = 0.74 + 0.26 * Math.sin((u / 0.08) * Math.PI * 0.5);
    } else if (u > 0.93) {
      widthFactor = 0.80 + 0.20 * Math.sin(((1 - u) / 0.07) * Math.PI * 0.5);
    }

    // Fender haunch flares over front & rear wheels
    const distF = Math.abs(z - wbF);
    const distR = Math.abs(z - wbR);
    const archSpan = wheelR * 1.32;
    const flareF = distF < archSpan ? Math.cos((distF / archSpan) * Math.PI * 0.5) * (style.haunchFlare * 0.75) : 0;
    const flareR = distR < archSpan ? Math.cos((distR / archSpan) * Math.PI * 0.5) * style.haunchFlare : 0;

    // Circular wheel-arch cutout lifting the lower rocker edge around the front & rear tires
    let archCutY = style.groundClearance;
    const cutSpan = wheelR * 1.18;
    if (distF < cutSpan) {
      const hArch = Math.sqrt(Math.max(0, cutSpan * cutSpan - distF * distF));
      archCutY = Math.max(archCutY, style.wheelRadius * 0.35 + hArch * 0.82);
    }
    if (distR < cutSpan) {
      const hArch = Math.sqrt(Math.max(0, cutSpan * cutSpan - distR * distR));
      archCutY = Math.max(archCutY, style.wheelRadius * 0.35 + hArch * 0.82);
    }

    // Upper beltline & centerline hood/trunk height at this Z
    let yBelt = style.beltY;
    let yCenter = style.beltY + 0.02;

    if (zFrac < style.hoodEndZ) {
      // Front bumper & Hood region
      const hoodU = (zFrac - (-0.5)) / (style.hoodEndZ - (-0.5)); // 0 at nose -> 1 at cowl
      if (hoodU < 0.14) {
        const noseCurve = hoodU / 0.14;
        yBelt = style.groundClearance + (style.noseHeight - style.groundClearance) * Math.pow(noseCurve, 0.55);
        yCenter = yBelt * 0.97;
      } else {
        const hProg = (hoodU - 0.14) / 0.86;
        const baseH = style.noseHeight + (style.hoodBaseY - style.noseHeight) * Math.pow(hProg, 0.72);
        // On Porsche 911 / Exotics, outer fenders rise ABOVE the center frunk hood!
        yBelt = baseH + Math.sin(hProg * Math.PI) * style.fenderRise;
        yCenter = baseH - (style.type === 'porsche_911' ? 0.045 * Math.sin(hProg * Math.PI) : -0.02);
      }
    } else if (zFrac > style.rearGlassEndZ) {
      // Rear Trunk Decklid / Tailgate region
      const trunkU = (zFrac - style.rearGlassEndZ) / (0.5 - style.rearGlassEndZ);
      if (trunkU > 0.85) {
        const drop = (trunkU - 0.85) / 0.15;
        yBelt = style.trunkY * (1 - drop * 0.25);
      } else {
        yBelt = style.trunkY - trunkU * 0.04;
      }
      yCenter = yBelt + 0.015;
    } else {
      // Passenger cabin door beltline
      const cabU = (zFrac - style.hoodEndZ) / Math.max(0.01, style.rearGlassEndZ - style.hoodEndZ);
      yBelt = style.hoodBaseY + (style.trunkY - style.hoodBaseY) * cabU;
      yCenter = yBelt + 0.02;
    }

    const wCur = hw * widthFactor + flareF + flareR;
    stations.push({
      z,
      wBottom: wCur * 0.92,
      wMid: wCur * 1.00,
      wBelt: wCur * 0.95,
      yBottom: archCutY,
      yMid: archCutY + (yBelt - archCutY) * 0.52,
      yBelt,
      yCenter
    });
  }

  // Each station has 9 points from Left Centerline -> Left Side -> Bottom -> Right Side -> Right Centerline:
  // 0: CenterTop (0, yCenter)
  // 1: LeftDeck  (-wBelt*0.55, (yCenter+yBelt)*0.5)
  // 2: LeftBelt  (-wBelt, yBelt)
  // 3: LeftMid   (-wMid, yMid)
  // 4: LeftBot   (-wBottom, yBottom)
  // 5: RightBot  (+wBottom, yBottom)
  // 6: RightMid  (+wMid, yMid)
  // 7: RightBelt (+wBelt, yBelt)
  // 8: RightDeck (+wBelt*0.55, (yCenter+yBelt)*0.5)
  // 9: CenterTop (0, yCenter)
  const ptsPerRing = 10;
  const positions = [];
  const indices = [];

  for (let i = 0; i <= numZ; i++) {
    const s = stations[i];
    const yDeck = (s.yCenter + s.yBelt) * 0.5 + 0.01;
    const ring = [
      [0, s.yCenter, s.z],
      [-s.wBelt * 0.58, yDeck, s.z],
      [-s.wBelt, s.yBelt, s.z],
      [-s.wMid, s.yMid, s.z],
      [-s.wBottom, s.yBottom, s.z],
      [s.wBottom, s.yBottom, s.z],
      [s.wMid, s.yMid, s.z],
      [s.wBelt, s.yBelt, s.z],
      [s.wBelt * 0.58, yDeck, s.z],
      [0, s.yCenter, s.z]
    ];
    for (const p of ring) positions.push(p[0], p[1], p[2]);
  }

  for (let i = 0; i < numZ; i++) {
    const r0 = i * ptsPerRing;
    const r1 = (i + 1) * ptsPerRing;
    for (let j = 0; j < ptsPerRing - 1; j++) {
      const a = r0 + j;
      const b = r0 + j + 1;
      const c = r1 + j + 1;
      const d = r1 + j;
      indices.push(a, b, d, b, c, d);
    }
  }

  // Front & Rear Bumper End Caps
  const frontBase = 0;
  indices.push(frontBase + 0, frontBase + 2, frontBase + 4);
  indices.push(frontBase + 0, frontBase + 4, frontBase + 5);
  indices.push(frontBase + 0, frontBase + 5, frontBase + 7);

  const rearBase = numZ * ptsPerRing;
  indices.push(rearBase + 0, rearBase + 4, rearBase + 2);
  indices.push(rearBase + 0, rearBase + 5, rearBase + 4);
  indices.push(rearBase + 0, rearBase + 7, rearBase + 5);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds an anatomically accurate Upper Cabin Greenhouse with realistic window-to-body
 * height ratio (38% to 44%), inward tumblehome slope, flush inset tinted glass windows,
 * black window frames, and painted A-pillars, B-pillars, C-pillars (and D-pillars on wagons/SUVs).
 */
function buildRealisticGreenhouse(group, W, L, H, style, carDef, mats) {
  const { bodyMat, glassMat, matDarkTrim } = mats;

  const zWindshieldBase = style.hoodEndZ * L;
  const zRoofFront      = style.roofStartZ * L;
  const zRoofRear       = style.roofEndZ * L;
  const zRearGlassBase  = style.rearGlassEndZ * L;

  const yBeltFront = style.hoodBaseY + 0.01;
  const yBeltRear  = style.trunkY + 0.01;
  const yRoof      = style.roofY;

  const wBaseFront = W * 0.44;
  const wBaseRear  = W * (style.isHatch || style.isWagon || style.isSUV ? 0.43 : 0.41);
  const wRoofFront = wBaseFront * style.tumblehome;
  const wRoofRear  = wBaseRear * style.tumblehome;

  // 1. Flush Tinted Glass Greenhouse Core (Inset slightly inside the pillars so pillars frame the glass!)
  const glassGeo = createGreenhouseCoreGeo(
    zWindshieldBase + 0.02, zRoofFront, zRoofRear, zRearGlassBase - 0.02,
    yBeltFront, yBeltRear, yRoof - 0.018,
    wBaseFront - 0.018, wBaseRear - 0.018, wRoofFront - 0.018, wRoofRear - 0.018
  );
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  group.add(glassMesh);

  // 2. Sculpted Painted Roof Panel (with subtle double-bubble or crown arch)
  const roofLen = Math.max(0.4, zRoofRear - zRoofFront);
  const roofPanelGeo = createCrownedRoofGeo(wRoofFront, wRoofRear, zRoofFront, zRoofRear, yRoof);
  const roofMesh = new THREE.Mesh(roofPanelGeo, bodyMat);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  group.add(roofMesh);

  // 3. Painted A-Pillars (Left & Right framing the front windshield)
  [-1, 1].forEach(side => {
    addPillarStrut(
      group,
      new THREE.Vector3(side * wBaseFront, yBeltFront, zWindshieldBase),
      new THREE.Vector3(side * wRoofFront, yRoof - 0.01, zRoofFront),
      0.055,
      bodyMat
    );

    // Roof Side Cantrail (framing top of the side door windows)
    addPillarStrut(
      group,
      new THREE.Vector3(side * wRoofFront, yRoof - 0.015, zRoofFront),
      new THREE.Vector3(side * wRoofRear, yRoof - 0.015, zRoofRear),
      0.05,
      bodyMat
    );

    // Black Window Beltline Weatherstrip Molding along the bottom of the side windows
    addPillarStrut(
      group,
      new THREE.Vector3(side * wBaseFront, yBeltFront + 0.01, zWindshieldBase),
      new THREE.Vector3(side * wBaseRear, yBeltRear + 0.01, zRearGlassBase),
      0.028,
      matDarkTrim
    );

    // B-Pillar (Black flush window divider between front door glass and rear door / quarter glass)
    const bFrac = style.doors === 2 ? 0.56 : 0.46;
    const zBBase = zWindshieldBase + (zRearGlassBase - zWindshieldBase) * bFrac;
    const zBTop  = zRoofFront + (zRoofRear - zRoofFront) * bFrac;
    const yBBase = yBeltFront + (yBeltRear - yBeltFront) * bFrac;
    const wBBase = wBaseFront + (wBaseRear - wBaseFront) * bFrac;
    const wBTop  = wRoofFront + (wRoofRear - wRoofFront) * bFrac;
    addPillarStrut(
      group,
      new THREE.Vector3(side * (wBBase - 0.005), yBBase, zBBase),
      new THREE.Vector3(side * (wBTop - 0.005), yRoof - 0.02, zBTop),
      0.048,
      matDarkTrim
    );

    // Extra C-Pillar divider on 4-door Wagons, SUVs & Saloons (giving 3 distinct side windows!)
    if (style.isWagon || style.isSUV || style.type === 'luxury_rolls_bentley') {
      const cFrac = 0.76;
      const zCBase = zWindshieldBase + (zRearGlassBase - zWindshieldBase) * cFrac;
      const zCTop  = zRoofFront + (zRoofRear - zRoofFront) * cFrac;
      const yCBase = yBeltFront + (yBeltRear - yBeltFront) * cFrac;
      const wCBase = wBaseFront + (wBaseRear - wBaseFront) * cFrac;
      const wCTop  = wRoofFront + (wRoofRear - wRoofFront) * cFrac;
      addPillarStrut(
        group,
        new THREE.Vector3(side * (wCBase - 0.005), yCBase, zCBase),
        new THREE.Vector3(side * (wCTop - 0.005), yRoof - 0.02, zCTop),
        0.055,
        matDarkTrim
      );
    }

    // Painted Rear C-Pillar / D-Pillar (framing the rear windshield & quarter panel)
    const rearPillarWidth = style.type === 'luxury_rolls_bentley' || style.type === 'muscle_challenger' ? 0.11 : 0.075;
    addPillarStrut(
      group,
      new THREE.Vector3(side * wRoofRear, yRoof - 0.015, zRoofRear),
      new THREE.Vector3(side * wBaseRear, yBeltRear, zRearGlassBase),
      rearPillarWidth,
      bodyMat
    );
  });

  // 4. F-150 Raptor Pickup Bed Liner if pickup truck
  if (style.isPickup) {
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.82, 0.08, (0.47 - style.rearGlassEndZ) * L),
      matDarkTrim
    );
    bed.position.set(0, style.trunkY - 0.14, ((style.rearGlassEndZ + 0.47) * 0.5) * L);
    group.add(bed);
  }
}

function createGreenhouseCoreGeo(z0, z1, z2, z3, yBeltF, yBeltR, yRoof, wBaseF, wBaseR, wRoofF, wRoofR) {
  const yMidBelt = (yBeltF + yBeltR) * 0.5;
  const wMidBase = (wBaseF + wBaseR) * 0.5;
  // 4 cross-section stations for the glass cabin
  const rings = [
    { z: z0, yBot: yBeltF,   yTop: yBeltF + 0.03, wBot: wBaseF * 0.90, wTop: wBaseF * 0.88 },
    { z: z1, yBot: yMidBelt, yTop: yRoof,         wBot: wBaseF,        wTop: wRoofF },
    { z: z2, yBot: yMidBelt, yTop: yRoof,         wBot: wBaseR,        wTop: wRoofR },
    { z: z3, yBot: yBeltR,   yTop: yBeltR + 0.03, wBot: wBaseR * 0.90, wTop: wBaseR * 0.88 }
  ];

  const positions = [];
  const indices = [];
  const ptsPerRing = 6;

  for (const r of rings) {
    const ringPts = [
      [0, r.yTop + 0.01, r.z],
      [-r.wTop, r.yTop, r.z],
      [-r.wBot, r.yBot, r.z],
      [r.wBot, r.yBot, r.z],
      [r.wTop, r.yTop, r.z],
      [0, r.yTop + 0.01, r.z]
    ];
    for (const p of ringPts) positions.push(p[0], p[1], p[2]);
  }

  for (let i = 0; i < rings.length - 1; i++) {
    const r0 = i * ptsPerRing;
    const r1 = (i + 1) * ptsPerRing;
    for (let j = 0; j < ptsPerRing - 1; j++) {
      const a = r0 + j, b = r0 + j + 1, c = r1 + j + 1, d = r1 + j;
      indices.push(a, b, d, b, c, d);
    }
  }

  // Front Windshield & Rear Windshield Glass Surfaces!
  // Ring 0 (z0, windshield base) -> Ring 1 (z1, windshield top):
  // Left top = 1*6 + 1 = 7, Right top = 1*6 + 4 = 10; Left bot = 0*6 + 2 = 2, Right bot = 0*6 + 3 = 3
  indices.push(2, 3, 10, 2, 10, 7);
  // Ring 2 (z2, rear window top) -> Ring 3 (z3, rear window base):
  // Left top = 2*6 + 1 = 13, Right top = 2*6 + 4 = 16; Left bot = 3*6 + 2 = 20, Right bot = 3*6 + 3 = 21
  indices.push(13, 16, 21, 13, 21, 20);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createCrownedRoofGeo(wFront, wRear, zFront, zRear, yRoof) {
  const segsZ = 8;
  const positions = [];
  const indices = [];
  const ptsPerRing = 5;

  for (let i = 0; i <= segsZ; i++) {
    const u = i / segsZ;
    const z = zFront + u * (zRear - zFront);
    const w = wFront + u * (wRear - wFront);
    const archZ = Math.sin(u * Math.PI) * 0.022;
    const ring = [
      [-w, yRoof - 0.012 + archZ * 0.4, z],
      [-w * 0.5, yRoof + 0.008 + archZ, z],
      [0, yRoof + 0.014 + archZ, z],
      [w * 0.5, yRoof + 0.008 + archZ, z],
      [w, yRoof - 0.012 + archZ * 0.4, z]
    ];
    for (const p of ring) positions.push(p[0], p[1], p[2]);
  }

  for (let i = 0; i < segsZ; i++) {
    const r0 = i * ptsPerRing;
    const r1 = (i + 1) * ptsPerRing;
    for (let j = 0; j < ptsPerRing - 1; j++) {
      const a = r0 + j, b = r0 + j + 1, c = r1 + j + 1, d = r1 + j;
      indices.push(a, d, b, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function addPillarStrut(group, p1, p2, thickness, mat) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 0.01) return;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, thickness * 0.72, len), mat);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.lookAt(p2);
  group.add(mesh);
}

/**
 * Builds visible 3D Interior Seats, Dashboard, and Rotating Steering Wheel inside the glass greenhouse.
 */
function buildInteriorCockpit(group, W, L, H, style, matDarkTrim, accentMat) {
  const zDash = style.hoodEndZ * L + 0.28;
  const yDash = style.beltY - 0.04;

  // Dashboard binnacle
  const dash = new THREE.Mesh(new THREE.BoxGeometry(W * 0.76, 0.22, 0.38), matDarkTrim);
  dash.position.set(0, yDash, zDash);
  group.add(dash);

  // Left & Right Sport Bucket Seats with Headrests
  [-W * 0.21, W * 0.21].forEach(sx => {
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.12), matDarkTrim);
    seatBack.position.set(sx, style.beltY - 0.05, zDash + 0.65);
    seatBack.rotation.x = 0.18;
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.10), accentMat);
    headrest.position.set(sx, style.beltY + 0.26, zDash + 0.70);
    group.add(seatBack, headrest);
  });

  // Steering Wheel assembly
  const swGroup = new THREE.Group();
  swGroup.position.set(-W * 0.21, yDash + 0.08, zDash + 0.22);
  swGroup.rotation.x = -0.32;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 8, 18), matDarkTrim);
  const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.02), matDarkTrim);
  swGroup.add(rim, spoke);
  group.add(swGroup);

  return swGroup;
}

/**
 * Builds Brand- & Model-Accurate 3D Front Grilles, Headlights, Pop-up Lights, FMIC, and Hood Scoops.
 */
function buildBrandFrontFascia(group, W, L, H, style, carDef, mats) {
  const { bodyMat, accentMat, matCarbon, matChrome, matDarkTrim, hlGlowMat, brakeMat, drlMat, amberMat } = mats;
  const frontZ = -L * 0.492;
  const yNose = style.noseHeight;
  const brand = carDef.brand;
  const id = carDef.id;

  // 1. PORSCHE 911 / 718: Raised Fender Oval/Round Angled 4-Point LED Headlights
  if (style.type === 'porsche_911') {
    [-W * 0.34, W * 0.34].forEach(lx => {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), hlGlowMat);
      pod.rotation.x = Math.PI * 0.32;
      pod.scale.set(1.0, 1.0, 1.35);
      pod.position.set(lx, yNose + 0.13, frontZ + 0.24);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 18), matChrome);
      ring.rotation.x = -Math.PI * 0.18;
      ring.position.set(lx, yNose + 0.14, frontZ + 0.24);
      group.add(pod, ring);
    });
    // Lower Porsche 3-intake aero bumper
    const intake = new THREE.Mesh(new THREE.BoxGeometry(W * 0.78, 0.16, 0.08), matDarkTrim);
    intake.position.set(0, style.groundClearance + 0.12, frontZ + 0.02);
    group.add(intake);
    return;
  }

  // 2. DODGE CHALLENGER / CHARGER: Recessed Full-Width Black Cavity with 4 Round Halo LED Headlights
  if (style.type === 'muscle_challenger' || brand === 'Dodge') {
    const cavity = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, 0.20, 0.10), matDarkTrim);
    cavity.position.set(0, yNose - 0.04, frontZ + 0.02);
    group.add(cavity);

    // 4 Iconic Round Challenger Halo Rings: (O)(O) --- (O)(O)
    [-W * 0.36, -W * 0.24, W * 0.24, W * 0.36].forEach(hx => {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.014, 8, 18), hlGlowMat);
      halo.position.set(hx, yNose - 0.04, frontZ - 0.025);
      group.add(halo);
    });

    // Demon / Hellcat Wide Air-Catcher Hood Scoop
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(W * 0.38, 0.09, L * 0.22), matCarbon);
    scoop.position.set(0, style.hoodBaseY + 0.03, -L * 0.24);
    group.add(scoop);
    return;
  }

  // 3. BMW: Signature Twin-Kidney Grille + 4 Corona Angel-Eye LED Headlights
  if (brand === 'BMW') {
    const isModernTallKidney = id.includes('g80') || id.includes('csl');
    const kw = 0.23, kh = isModernTallKidney ? 0.30 : 0.18;
    [-0.14, 0.14].forEach(kx => {
      const surround = new THREE.Mesh(new THREE.BoxGeometry(kw, kh, 0.08), matChrome);
      surround.position.set(kx, yNose - (isModernTallKidney ? 0.08 : 0.02), frontZ + 0.01);
      const inner = new THREE.Mesh(new THREE.BoxGeometry(kw * 0.84, kh * 0.84, 0.09), matDarkTrim);
      inner.position.copy(surround.position);
      group.add(surround, inner);
    });
    // Quad Angel-Eye Headlights
    [-W * 0.37, -W * 0.27, W * 0.27, W * 0.37].forEach(hx => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 16), hlGlowMat);
      ring.position.set(hx, yNose + 0.01, frontZ + 0.02);
      group.add(ring);
    });
    return;
  }

  // 4. ROLLS-ROYCE & BENTLEY: Tall Pantheon Waterfall Grille / Bentley 4 Round Crystal Lamps
  if (brand === 'Rolls-Royce' || brand === 'Bentley') {
    const gMat = brand === 'Rolls-Royce' ? matChrome : matDarkTrim;
    const grille = new THREE.Mesh(new THREE.BoxGeometry(W * 0.38, 0.34, 0.10), gMat);
    grille.position.set(0, yNose - 0.06, frontZ + 0.01);
    group.add(grille);

    if (brand === 'Rolls-Royce') {
      // Spirit of Ecstasy Hood Ornament + Laser Rectangular Headlights
      const ecstasy = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 8), matChrome);
      ecstasy.position.set(0, yNose + 0.14, frontZ + 0.03);
      group.add(ecstasy);
      [-W * 0.33, W * 0.33].forEach(lx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.08), hlGlowMat);
        hl.position.set(lx, yNose, frontZ + 0.02);
        group.add(hl);
      });
    } else {
      // Bentley 4 Round Crystal Headlights
      [-W * 0.36, -W * 0.24, W * 0.24, W * 0.36].forEach((hx, idx) => {
        const r = (idx === 1 || idx === 2) ? 0.085 : 0.065;
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 16), hlGlowMat);
        lamp.rotation.x = Math.PI / 2;
        lamp.position.set(hx, yNose - 0.02, frontZ + 0.02);
        group.add(lamp);
      });
    }
    return;
  }

  // 5. MERCEDES-BENZ G63 AMG BOXY 4x4: Round Halo Headlights + Bullbar + Exterior Turn Signals
  if (style.isGWagen) {
    const grille = new THREE.Mesh(new THREE.BoxGeometry(W * 0.48, 0.26, 0.08), matDarkTrim);
    grille.position.set(0, yNose - 0.06, frontZ + 0.01);
    const star = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16), matChrome);
    star.position.set(0, yNose - 0.06, frontZ - 0.035);
    group.add(grille, star);

    [-W * 0.34, W * 0.34].forEach(lx => {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16), hlGlowMat);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(lx, yNose - 0.05, frontZ + 0.01);
      // G-Wagen fender-top amber turn signal boxes!
      const blinker = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.14), amberMat);
      blinker.position.set(lx, style.hoodBaseY + 0.02, frontZ + 0.22);
      group.add(lamp, blinker);
    });
    return;
  }

  // 6. RETRO JDM POP-UP HEADLIGHTS (Toyota AE86 Trueno, 180SX, NSX NA1, MR2)
  if (style.type === 'jdm_retro_popup') {
    [-W * 0.31, W * 0.31].forEach(lx => {
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.22), bodyMat);
      housing.position.set(lx, yNose + 0.09, frontZ + 0.14);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.09, 0.04), hlGlowMat);
      lens.position.set(lx, yNose + 0.09, frontZ + 0.025);
      const bumperSignal = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.05), amberMat);
      bumperSignal.position.set(lx, yNose - 0.08, frontZ + 0.01);
      group.add(housing, lens, bumperSignal);
    });
    const grille = new THREE.Mesh(new THREE.BoxGeometry(W * 0.42, 0.08, 0.06), matDarkTrim);
    grille.position.set(0, yNose - 0.02, frontZ + 0.01);
    group.add(grille);
    return;
  }

  // 7. STANDARD BRAND FASCIAS (Perodua, Proton, Honda, Toyota, Nissan GT-R, Audi, Mercedes, Volvo, Ford, Lamborghini)
  const grilleW = brand === 'Audi' ? W * 0.50 : W * 0.46;
  const grilleH = brand === 'Audi' ? 0.26 : 0.16;
  const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(grilleW, grilleH, 0.08), matDarkTrim);
  grilleMesh.position.set(0, yNose - 0.04, frontZ + 0.01);
  group.add(grilleMesh);

  // Chrome / Red Brand Accent Bar across the grille (Perodua / Proton / Volvo diagonal / Honda Red Badge)
  if (brand === 'Perodua' || brand === 'Proton' || brand === 'Mercedes-Benz') {
    const bow = new THREE.Mesh(new THREE.BoxGeometry(grilleW * 0.96, 0.028, 0.09), matChrome);
    bow.position.set(0, yNose + 0.01, frontZ + 0.005);
    group.add(bow);
  } else if (brand === 'Volvo') {
    const slash = new THREE.Mesh(new THREE.BoxGeometry(grilleW * 0.85, 0.025, 0.09), matChrome);
    slash.rotation.z = 0.34;
    slash.position.set(0, yNose - 0.04, frontZ + 0.005);
    group.add(slash);
  } else if (brand === 'Honda') {
    const redH = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.065, 0.09), brakeMat);
    redH.position.set(0, yNose - 0.02, frontZ + 0.005);
    group.add(redH);
  }

  // Swept Angular Headlight Pods + LED DRL Blades
  [-1, 1].forEach(side => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.095, 0.16), hlGlowMat);
    hl.position.set(side * (W * 0.34), yNose + 0.01, frontZ + 0.06);
    hl.rotation.y = side * 0.22;
    hl.rotation.z = -side * 0.08;
    group.add(hl);
  });

  // Lower Front Bumper Intake (with gleaming Aluminum FMIC Intercooler on GT-R / Turbo cars!)
  const isTurbo = carDef.aspiration.includes('TURBO') || style.type === 'jdm_gtr';
  const lowerIntake = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.56, 0.15, 0.07),
    isTurbo ? matChrome : matDarkTrim
  );
  lowerIntake.position.set(0, style.groundClearance + 0.11, frontZ + 0.02);
  group.add(lowerIntake);
}

/**
 * Builds Brand- & Model-Accurate 3D Rear Taillights, Diffusers, and Tailgate Details:
 * - Nissan Skyline GT-R (R34/R32/R33/R35): 4 Iconic Round Twin-Ring Taillights!
 * - Ford Mustang: 6 Vertical Sequential Tri-Bar Taillights!
 * - Dodge Challenger / Charger / Porsche 911 / Audi RS6/RS7: Full-Width LED Lightbar!
 * - Toyota Supra A80: 4-Pod Circular Taillights in dark housing!
 * - Volvo: Tall Vertical D-Pillar Taillights!
 * - Perodua Myvi / Proton / BMW / Honda: Wraparound L-shaped Taillights + License Plate Recess!
 * - Mercedes G63 AMG: Rear Door Mounted 3D Spare Wheel & Chrome Cover!
 */
function buildBrandRearFascia(group, W, L, H, style, carDef, mats) {
  const { bodyMat, matCarbon, matChrome, matDarkTrim, brakeMat, amberMat } = mats;
  const rearZ = L * 0.492;
  const yTail = style.trunkY - 0.08;
  const brand = carDef.brand;
  const id = carDef.id;

  // Rear Lower Diffuser Valance
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(W * 0.84, 0.16, 0.10), matDarkTrim);
  diffuser.position.set(0, style.groundClearance + 0.09, rearZ - 0.02);
  group.add(diffuser);

  // License Plate Recess
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.04), matDarkTrim);
  plate.position.set(0, yTail - 0.10, rearZ + 0.005);
  group.add(plate);

  // 1. NISSAN SKYLINE GT-R (R34 / R32 / R33 / R35) & FERRARI / CORVETTE: 4 Iconic Round Ring Taillights
  if (style.type === 'jdm_gtr' || id.includes('coss')) {
    [
      [-W * 0.36, 0.068],
      [-W * 0.24, 0.054],
      [W * 0.24,  0.054],
      [W * 0.36,  0.068]
    ].forEach(([tx, rad]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.018, 8, 18), brakeMat);
      ring.position.set(tx, yTail, rearZ + 0.01);
      group.add(ring);
    });
    return;
  }

  // 2. FORD MUSTANG: 6 Vertical Sequential Tri-Bar Taillights (||| --- |||)
  if (style.type === 'muscle_mustang') {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, 0.16, 0.05), matDarkTrim);
    panel.position.set(0, yTail, rearZ + 0.005);
    group.add(panel);
    [-0.38, -0.31, -0.24, 0.24, 0.31, 0.38].forEach(bx => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.13, 0.06), brakeMat);
      bar.position.set(bx * W, yTail, rearZ + 0.01);
      group.add(bar);
    });
    return;
  }

  // 3. DODGE CHALLENGER / CHARGER, PORSCHE 911, AUDI RS7/RS6, BUGATTI, PROTON S70: Full-Width LED Lightbar
  if (style.type === 'muscle_challenger' || style.type === 'porsche_911' || brand === 'Audi' || id === 'pro_s70') {
    const barH = style.type === 'porsche_911' ? 0.045 : 0.11;
    const fullBar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, barH, 0.06), brakeMat);
    fullBar.position.set(0, yTail + 0.02, rearZ + 0.008);
    group.add(fullBar);
    return;
  }

  // 4. VOLVO: Tall Vertical D-Pillar Taillights
  if (brand === 'Volvo' && (style.isWagon || style.isSUV || style.isHatch)) {
    [-W * 0.40, W * 0.40].forEach(vx => {
      const vLamp = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.44, 0.07), brakeMat);
      vLamp.position.set(vx, yTail + 0.16, rearZ - 0.02);
      group.add(vLamp);
    });
    return;
  }

  // 5. MERCEDES G63 AMG: Exterior Rear-Door-Mounted Spare Wheel & Chrome Cover
  if (style.isGWagen) {
    const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 20), matChrome);
    spare.rotation.x = Math.PI / 2;
    spare.position.set(0.15, yTail + 0.08, rearZ + 0.11);
    spare.castShadow = true;
    group.add(spare);
  }

  // 6. STANDARD WRAPAROUND L-SHAPED / HORIZONTAL TAILLIGHTS (Perodua Myvi/Bezza, Proton Saga/Wira/Satria, BMW, Mercedes, Honda, Toyota)
  [-1, 1].forEach(side => {
    const outerLamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.10, 0.08), brakeMat);
    outerLamp.position.set(side * (W * 0.33), yTail + 0.01, rearZ + 0.005);
    const innerLamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.065, 0.07), brakeMat);
    innerLamp.position.set(side * (W * 0.21), yTail + 0.025, rearZ + 0.005);
    group.add(outerLamp, innerLamp);
  });
}

function buildSideMirrors(group, W, L, H, style, bodyMat, matDarkTrim, matChrome) {
  const zMirror = style.hoodEndZ * L + 0.24;
  const yMirror = style.beltY + 0.05;
  [-1, 1].forEach(side => {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.05), matDarkTrim);
    stalk.position.set(side * (W * 0.46), yMirror - 0.02, zMirror);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.10, 0.11), bodyMat);
    housing.position.set(side * (W * 0.51), yMirror, zMirror + 0.02);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.075), matChrome);
    glass.position.set(side * (W * 0.51), yMirror, zMirror + 0.078);
    group.add(stalk, housing, glass);
  });
}
