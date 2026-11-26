// ============================================================================
// REAL 3D .GLB VEHICLE ROSTER — HIGH-DETAIL PBR MODELS ONLY
// 20 Iconic Global Brands · 121 Authentic Real-World Vehicles
// ============================================================================

export const BRANDS = [
  'Ferrari',
  'Audi',
  'Mercedes-Benz',
  'BMW',
  'Honda',
  'Toyota',
  'Nissan',
  'Porsche',
  'Lamborghini',
  'McLaren',
  'Volkswagen',
  'Chevrolet',
  'Ford',
  'Dodge',
  'Subaru',
  'Mitsubishi',
  'Proton',
  'Perodua',
  'Jeep',
  'Xiaomi'
];

function car(
  id,
  glbKey,
  brand,
  name,
  chassis,
  drivetrain,
  engineCode,
  aspiration,
  soundProfile,
  hp,
  torqueNm,
  redline,
  maxBoostBar,
  gears,
  mass,
  baseGrip,
  baseBrake,
  length,
  defaultColor,
  opts = {}
) {
  const isNA = aspiration === 'NA';
  const peakTorqueRpm = isNA
    ? Math.round(redline * 0.68)
    : (aspiration === 'SUPERCHARGED' ? Math.round(redline * 0.52) : Math.round(redline * 0.42));
  const peakPowerRpm = Math.round(redline * 0.90);
  const dragMap = {
    exotic: 0.25,
    coupe: 0.28,
    muscle: 0.32,
    sedan: 0.28,
    wagon: 0.29,
    hatch: 0.30,
    saloon: 0.26,
    suv: 0.35
  };
  const drag = dragMap[chassis] || 0.29;
  const widthScale = opts.widthScale || 1.0;
  const heightScale = opts.heightScale || 1.0;
  const baseWidth = chassis === 'suv' ? 2.08 : (chassis === 'hatch' ? 1.84 : 1.96);

  return {
    id,
    glbKey,
    brand,
    name,
    chassis,
    drivetrain,
    engineCode,
    aspiration,
    soundProfile,
    hp,
    torqueNm,
    redline,
    peakTorqueRpm,
    peakPowerRpm,
    maxBoostBar,
    gears,
    mass,
    drag,
    baseGrip,
    baseBrake,
    length,
    width: +(baseWidth * widthScale).toFixed(2),
    widthScale,
    heightScale,
    defaultSpoiler: opts.defaultSpoiler || 'none',
    defaultRims: opts.defaultRims || 'silver',
    defaultFinish: opts.defaultFinish || 'gloss',
    defaultColor
  };
}

export const CAR_CATALOG = [
  // ================= FERRARI (4) =================
  car('fer_458',   'ferrari',     'Ferrari', '458 Italia',     'exotic', 'RWD', '4.5L F136 V8',           'NA',         'v8_flatplane', 570,  540, 9000, 0.00, 7, 1485, 1.42, 1.50, 4.53, '#d91b24'),
  car('fer_488p',  'ferrari',     'Ferrari', '488 Pista',      'exotic', 'RWD', '3.9L F154CD Twin-Turbo V8','TWIN-TURBO','v8_flatplane', 720,  770, 8000, 1.55, 7, 1385, 1.50, 1.58, 4.60, '#dc2626', { widthScale: 1.02, defaultRims: 'gold' }),
  car('fer_f8',    'ferrari',     'Ferrari', 'F8 Tributo',     'exotic', 'RWD', '3.9L F154CD Twin-Turbo V8','TWIN-TURBO','v8_flatplane', 720,  770, 8000, 1.55, 7, 1435, 1.48, 1.55, 4.61, '#eab308'),
  car('fer_sf90',  'porsche_918', 'Ferrari', 'SF90 Stradale',  'exotic', 'AWD', '4.0L F154FA V8 Hybrid',  'TWIN-TURBO', 'v8_flatplane', 1000, 800, 8000, 1.60, 8, 1570, 1.56, 1.60, 4.71, '#dc2626'),

  // ================= AUDI — A / S / RS / Q / R8 SERIES (15) =================
  car('aud_a3',    'suv_q7',      'Audi', 'A3 Sportback 35 TFSI',   'hatch',  'FWD', '1.5L EA211 evo Turbo',   'TURBO',      'i4_turbo',   150,  250,  6200, 0.90, 7, 1355, 1.20, 1.24, 4.34, '#cbd5e1', { widthScale: 0.92, heightScale: 0.84 }),
  car('aud_a4',    'sedan',       'Audi', 'A4 45 TFSI quattro',     'sedan',  'AWD', '2.0L EA888 Evo4 Turbo',  'TURBO',      'i4_turbo',   265,  370,  6600, 1.25, 7, 1615, 1.30, 1.34, 4.76, '#f8fafc'),
  car('aud_a6',    'bmwm5',       'Audi', 'A6 55 TFSI quattro',     'sedan',  'AWD', '3.0L EA839 V6 Turbo',    'TURBO',      'v6_tt',      340,  500,  6500, 1.20, 7, 1835, 1.28, 1.35, 4.94, '#64748b'),
  car('aud_a8',    'saloon',      'Audi', 'A8 L 60 TFSI quattro',   'saloon', 'AWD', '4.0L EA825 Twin-Turbo V8','TWIN-TURBO','v8_muscle',  460,  660,  6600, 1.30, 8, 2120, 1.24, 1.34, 5.30, '#1e293b'),
  car('aud_s3',    'sedan',       'Audi', 'S3 Sedan (8Y)',          'sedan',  'AWD', '2.0L EA888 Gen4 Turbo',  'TURBO',      'i4_turbo',   333,  420,  6800, 1.45, 7, 1535, 1.36, 1.40, 4.50, '#0ea5e9'),
  car('aud_s4av',  'suv_q7',      'Audi', 'S4 Avant TDI / TFSI',    'wagon',  'AWD', '3.0L EA839 Turbo V6',    'TURBO',      'v6_tt',      354,  500,  6600, 1.35, 8, 1735, 1.34, 1.38, 4.77, '#1d4ed8', { widthScale: 0.96, heightScale: 0.83 }),
  car('aud_s5',    'car_concept', 'Audi', 'S5 Coupe quattro',       'coupe',  'AWD', '3.0L EA839 Turbo V6',    'TURBO',      'v6_tt',      354,  500,  6600, 1.30, 8, 1690, 1.36, 1.40, 4.70, '#dc2626'),
  car('aud_s8',    'saloon',      'Audi', 'S8 TFSI quattro',        'saloon', 'AWD', '4.0L EA825 Twin-Turbo V8','TWIN-TURBO','v8_muscle',  571,  800,  6800, 1.45, 8, 2230, 1.30, 1.40, 5.19, '#334155'),
  car('aud_rs3',   'sedan',       'Audi', 'RS3 Sedan (8Y)',         'sedan',  'AWD', '2.5L DAZA 5-Cyl Turbo',  'TURBO',      'i5_turbo',   400,  500,  7200, 1.55, 7, 1575, 1.44, 1.48, 4.54, '#16a34a', { widthScale: 1.02, defaultRims: 'black' }),
  car('aud_rs5',   'car_concept', 'Audi', 'RS5 Competition Plus',   'coupe',  'AWD', '2.9L DECA Twin-Turbo V6','TWIN-TURBO', 'v6_tt',      450,  600,  6800, 1.50, 8, 1742, 1.44, 1.48, 4.72, '#991b1b', { defaultSpoiler: 'lip', defaultRims: 'black' }),
  car('aud_rs6',   'suv_q7',      'Audi', 'RS6 Avant Performance',  'wagon',  'AWD', '4.0L EA825 Twin-Turbo V8','TWIN-TURBO','v8_muscle',  630,  850,  6800, 1.55, 8, 2090, 1.42, 1.50, 4.99, '#334155', { widthScale: 1.05, heightScale: 0.82, defaultRims: 'black' }),
  car('aud_rs7',   'saloon',      'Audi', 'RS7 Sportback Performance','saloon','AWD','4.0L EA825 Twin-Turbo V8','TWIN-TURBO','v8_muscle',  630,  850,  6800, 1.55, 8, 2065, 1.43, 1.50, 5.01, '#475569', { widthScale: 1.04 }),
  car('aud_rsq8',  'xiaomi_yu7',  'Audi', 'RS Q8 Performance SUV',  'suv',    'AWD', '4.0L EA825 Twin-Turbo V8','TWIN-TURBO','v8_muscle',  640,  850,  6800, 1.55, 8, 2275, 1.30, 1.44, 5.01, '#111827', { widthScale: 1.03, defaultRims: 'black' }),
  car('aud_q7',    'suv_q7',      'Audi', 'Q7 V12 TDI',             'suv',    'AWD', '6.0L V12 TDI Twin-Turbo','TWIN-TURBO', 'w12_luxury', 500,  1000, 5000, 1.65, 6, 2605, 1.18, 1.32, 5.06, '#334155'),
  car('aud_r8',    'lamborghini', 'Audi', 'R8 V10 Performance',     'exotic', 'AWD', '5.2L CSPA V10',          'NA',         'v10_scream', 620,  580,  8700, 0.00, 7, 1595, 1.48, 1.54, 4.43, '#eab308', { defaultSpoiler: 'gt', defaultRims: 'black' }),

  // ================= MERCEDES-BENZ — A / B / C / D / E / S / GL / AMG (17) =================
  car('mer_a250',  'suv_q7',      'Mercedes-Benz', 'A 250 Hatchback (W177)',   'hatch',  'FWD', '2.0L M260 Turbo I4',       'TURBO',      'i4_turbo',   224,  350, 6500, 1.15, 7, 1455, 1.24, 1.28, 4.42, '#f8fafc', { widthScale: 0.92, heightScale: 0.84 }),
  car('mer_a45s',  'suv_q7',      'Mercedes-Benz', 'AMG A 45 S 4MATIC+',       'hatch',  'AWD', '2.0L M139 Handbuilt I4',   'TURBO',      'i4_turbo',   421,  500, 7200, 2.10, 8, 1635, 1.44, 1.48, 4.45, '#eab308', { widthScale: 0.96, heightScale: 0.83, defaultSpoiler: 'gt', defaultRims: 'black' }),
  car('mer_b200',  'suv_q7',      'Mercedes-Benz', 'B 200 Progressive (W247)', 'hatch',  'FWD', '1.3L M282 Turbo I4',       'TURBO',      'i4_turbo',   163,  250, 6200, 1.00, 7, 1410, 1.14, 1.20, 4.42, '#94a3b8', { widthScale: 0.92, heightScale: 0.91 }),
  car('mer_c300',  'sedan',       'Mercedes-Benz', 'C 300 AMG Line (W206)',    'sedan',  'RWD', '2.0L M254 Mild-Hybrid I4', 'TURBO',      'i4_turbo',   258,  400, 6500, 1.25, 9, 1680, 1.28, 1.34, 4.75, '#0ea5e9'),
  car('mer_c63s',  'bmwm5',       'Mercedes-Benz', 'AMG C 63 S Coupe (W205)',  'coupe',  'RWD', '4.0L M177 Twin-Turbo V8',  'TWIN-TURBO', 'v8_muscle',  510,  700, 7000, 1.40, 9, 1795, 1.40, 1.48, 4.75, '#475569', { widthScale: 1.03, heightScale: 0.96, defaultRims: 'black' }),
  car('mer_cla45s','sedan',       'Mercedes-Benz', 'AMG CLA 45 S 4MATIC+',     'sedan',  'AWD', '2.0L M139 Turbo I4',       'TURBO',      'i4_turbo',   421,  500, 7200, 2.10, 8, 1675, 1.42, 1.46, 4.69, '#f97316', { widthScale: 0.98, heightScale: 0.95, defaultSpoiler: 'lip' }),
  car('mer_300d',  'bmwm5',       'Mercedes-Benz', '300D 3.0 Turbo (W124 D)',  'sedan',  'RWD', '3.0L OM603 I6 Turbo Diesel','TURBO',     'i6_turbo',   147,  273, 5200, 0.90, 4, 1510, 1.12, 1.18, 4.74, '#cbd5e1', { widthScale: 0.94, heightScale: 0.98 }),
  car('mer_e300',  'bmwm5',       'Mercedes-Benz', 'E 300 Exclusive (W214)',   'sedan',  'RWD', '2.0L M254 Turbo I4',       'TURBO',      'i4_turbo',   258,  400, 6500, 1.25, 9, 1825, 1.24, 1.32, 4.95, '#1e293b'),
  car('mer_e63s',  'bmwm5',       'Mercedes-Benz', 'AMG E 63 S 4MATIC+',       'sedan',  'AWD', '4.0L M177 Twin-Turbo V8',  'TWIN-TURBO', 'v8_muscle',  612,  850, 7000, 1.50, 9, 2010, 1.38, 1.48, 4.99, '#111827', { widthScale: 1.04, defaultRims: 'black', defaultFinish: 'matte' }),
  car('mer_s580',  'saloon',      'Mercedes-Benz', 'S 580 L 4MATIC (W223)',    'saloon', 'AWD', '4.0L M176 Twin-Turbo V8',  'TWIN-TURBO', 'v8_muscle',  503,  700, 6500, 1.30, 9, 2170, 1.24, 1.34, 5.29, '#0f172a', { defaultRims: 'chrome' }),
  car('mer_gtbs',  'corvette',    'Mercedes-Benz', 'AMG GT Black Series',      'exotic', 'RWD', '4.0L M178 LS2 Flat-V8',    'TWIN-TURBO', 'v8_flatplane',730, 800, 7200, 1.70, 7, 1615, 1.56, 1.60, 4.55, '#f97316', { defaultSpoiler: 'gt', defaultRims: 'black' }),
  car('mer_gla250','xiaomi_yu7',  'Mercedes-Benz', 'GLA 250 4MATIC',           'suv',    'AWD', '2.0L M260 Turbo I4',       'TURBO',      'i4_turbo',   224,  350, 6500, 1.15, 8, 1605, 1.20, 1.26, 4.41, '#f8fafc', { heightScale: 0.95 }),
  car('mer_glb35', 'suv_q7',      'Mercedes-Benz', 'AMG GLB 35 4MATIC',        'suv',    'AWD', '2.0L M260 AMG Turbo I4',   'TURBO',      'i4_turbo',   306,  400, 6600, 1.35, 8, 1775, 1.22, 1.30, 4.65, '#64748b', { heightScale: 0.97 }),
  car('mer_glc43', 'xiaomi_yu7',  'Mercedes-Benz', 'AMG GLC 43 4MATIC',        'suv',    'AWD', '2.0L M139e Turbo I4',      'TURBO',      'i4_turbo',   421,  500, 7000, 1.85, 9, 1965, 1.26, 1.36, 4.72, '#dc2626'),
  car('mer_gle63', 'xiaomi_yu7',  'Mercedes-Benz', 'AMG GLE 63 S Coupe',       'suv',    'AWD', '4.0L M177 Twin-Turbo V8',  'TWIN-TURBO', 'v8_muscle',  612,  850, 6800, 1.45, 9, 2445, 1.24, 1.38, 4.96, '#1e293b', { widthScale: 1.05, defaultRims: 'black' }),
  car('mer_gls600','suv_q7',      'Mercedes-Benz', 'Maybach GLS 600 4MATIC',   'suv',    'AWD', '4.0L M177 Twin-Turbo V8',  'TWIN-TURBO', 'w12_luxury', 557,  730, 6500, 1.35, 9, 2785, 1.16, 1.30, 5.21, '#7c2d12', { heightScale: 1.03, defaultRims: 'chrome' }),
  car('mer_g63',   'g63',         'Mercedes-Benz', 'AMG G63',                  'suv',    'AWD', '4.0L M177 Twin-Turbo V8',  'TWIN-TURBO', 'v8_muscle',  585,  850, 6500, 1.45, 9, 2560, 1.15, 1.28, 4.87, '#1e293b', { defaultFinish: 'matte', defaultRims: 'black' }),

  // ================= BMW — 1..8 / M / X SERIES (18) =================
  car('bmw_128ti', 'suv_q7',      'BMW', '128ti Hot Hatch (F40)',     'hatch',  'FWD', '2.0L B48A20T1 Turbo I4', 'TURBO',      'i4_turbo',  265, 400, 6500, 1.30, 8, 1520, 1.28, 1.34, 4.32, '#f8fafc', { widthScale: 0.92, heightScale: 0.84 }),
  car('bmw_230i',  'sedan',       'BMW', '230i M Sport Coupe (G42)',  'coupe',  'RWD', '2.0L B48 TwinPower I4',  'TURBO',      'i4_turbo',  255, 400, 6500, 1.25, 8, 1596, 1.30, 1.35, 4.54, '#7c3aed', { heightScale: 0.95 }),
  car('bmw_m2g87', 'sedan',       'BMW', 'M2 Coupe (G87)',            'coupe',  'RWD', '3.0L S58 Twin-Turbo I6', 'TWIN-TURBO', 'i6_turbo',  460, 550, 7200, 1.35, 6, 1700, 1.38, 1.46, 4.58, '#38bdf8', { widthScale: 1.04, heightScale: 0.96 }),
  car('bmw_320i',  'sedan',       'BMW', '320i M Sport (G20)',        'sedan',  'RWD', '2.0L B48B20 Turbo I4',   'TURBO',      'i4_turbo',  184, 300, 6500, 1.05, 8, 1545, 1.24, 1.28, 4.71, '#f8fafc'),
  car('bmw_m340i', 'sedan',       'BMW', 'M340i xDrive (G20)',        'sedan',  'AWD', '3.0L B58B30O1 Turbo I6', 'TURBO',      'i6_turbo',  382, 500, 7000, 1.25, 8, 1740, 1.36, 1.42, 4.71, '#1d4ed8'),
  car('bmw_m3g80', 'sedan',       'BMW', 'M3 Competition (G80)',      'sedan',  'RWD', '3.0L S58 Twin-Turbo I6', 'TWIN-TURBO', 'i6_turbo',  510, 650, 7200, 1.50, 8, 1780, 1.44, 1.50, 4.79, '#16a34a', { widthScale: 1.05, defaultSpoiler: 'lip', defaultRims: 'black' }),
  car('bmw_430i',  'car_concept', 'BMW', '430i M Sport Coupe (G22)',  'coupe',  'RWD', '2.0L B48 TwinPower I4',  'TURBO',      'i4_turbo',  255, 400, 6500, 1.25, 8, 1620, 1.30, 1.36, 4.77, '#0ea5e9'),
  car('bmw_m4csl', 'car_concept', 'BMW', 'M4 CSL (G82)',              'coupe',  'RWD', '3.0L S58 Twin-Turbo I6', 'TWIN-TURBO', 'i6_turbo',  550, 650, 7200, 1.65, 8, 1625, 1.50, 1.56, 4.79, '#64748b', { widthScale: 1.03, defaultSpoiler: 'lip', defaultRims: 'black' }),
  car('bmw_530i',  'bmwm5',       'BMW', '530i M Sport (G60)',        'sedan',  'RWD', '2.0L B48 Mild-Hybrid I4','TURBO',      'i4_turbo',  255, 400, 6500, 1.25, 8, 1805, 1.24, 1.32, 5.06, '#cbd5e1'),
  car('bmw_m5f10', 'bmwm5',       'BMW', 'M5 (F10)',                  'sedan',  'RWD', '4.4L S63 Twin-Turbo V8', 'TWIN-TURBO', 'v8_muscle', 560, 680, 7200, 1.50, 7, 1870, 1.34, 1.44, 4.91, '#1d4ed8'),
  car('bmw_m5cs',  'bmwm5',       'BMW', 'M5 CS (F90)',               'sedan',  'AWD', '4.4L S63T4 Twin-Turbo V8','TWIN-TURBO','v8_muscle', 635, 750, 7200, 1.60, 8, 1825, 1.46, 1.52, 4.98, '#14532d', { widthScale: 1.04, defaultRims: 'gold', defaultSpoiler: 'lip' }),
  car('bmw_740i',  'saloon',      'BMW', '740i Pure Excellence (G70)','saloon', 'RWD', '3.0L B58 Mild-Hybrid I6','TURBO',      'i6_turbo',  380, 540, 6800, 1.20, 8, 2145, 1.22, 1.32, 5.39, '#1e293b', { defaultRims: 'chrome' }),
  car('bmw_m8',    'car_concept', 'BMW', 'M8 Competition Coupe',      'coupe',  'AWD', '4.4L S63T4 Twin-Turbo V8','TWIN-TURBO','v8_muscle', 625, 750, 7200, 1.55, 8, 1885, 1.44, 1.50, 4.87, '#1d4ed8', { widthScale: 1.04 }),
  car('bmw_x1',    'suv_q7',      'BMW', 'X1 xDrive28i (U11)',        'suv',    'AWD', '2.0L B48A20M2 Turbo I4', 'TURBO',      'i4_turbo',  241, 400, 6500, 1.20, 7, 1690, 1.20, 1.26, 4.50, '#0ea5e9', { heightScale: 0.95 }),
  car('bmw_x3m40', 'suv_q7',      'BMW', 'X3 M40i xDrive',            'suv',    'AWD', '3.0L B58B30M1 Turbo I6', 'TURBO',      'i6_turbo',  382, 500, 7000, 1.25, 8, 1920, 1.24, 1.34, 4.71, '#334155'),
  car('bmw_x5m',   'suv_q7',      'BMW', 'X5 M Competition (F95)',    'suv',    'AWD', '4.4L S63 Twin-Turbo V8', 'TWIN-TURBO', 'v8_muscle', 625, 750, 7200, 1.55, 8, 2385, 1.28, 1.40, 4.94, '#1d4ed8', { widthScale: 1.05, defaultRims: 'black' }),
  car('bmw_x6m',   'xiaomi_yu7',  'BMW', 'X6 M Competition (F96)',    'suv',    'AWD', '4.4L S63 Twin-Turbo V8', 'TWIN-TURBO', 'v8_muscle', 625, 750, 7200, 1.55, 8, 2370, 1.28, 1.40, 4.95, '#dc2626', { widthScale: 1.05, defaultRims: 'black' }),
  car('bmw_x7m60', 'suv_q7',      'BMW', 'X7 M60i xDrive',            'suv',    'AWD', '4.4L S68 Twin-Turbo V8', 'TWIN-TURBO', 'v8_muscle', 530, 750, 6800, 1.35, 8, 2670, 1.18, 1.30, 5.18, '#111827', { heightScale: 1.04 }),

  // ================= HONDA — CIVIC / TYPE R / PRELUDE / CR-Z / CR-V / S2000 / NSX (12) =================
  car('hon_civ15', 'sedan',       'Honda', 'Civic 1.5T RS (FE)',         'sedan',  'FWD', '1.5L L15BG VTEC Turbo',   'TURBO',     'i4_turbo', 182, 240, 6500, 1.10, 6, 1348, 1.24, 1.26, 4.68, '#dc2626'),
  car('hon_eg6',   'suv_q7',      'Honda', 'Civic SiR II (EG6) VTEC',    'hatch',  'FWD', '1.6L B16A DOHC VTEC',     'NA',        'i4_vtec',  170, 157, 8200, 0.00, 5, 1040, 1.28, 1.26, 4.07, '#eab308', { widthScale: 0.90, heightScale: 0.80 }),
  car('hon_fk8',   'sedan',       'Honda', 'Civic Type R (FK8)',         'hatch',  'FWD', '2.0L K20C1 VTEC Turbo',   'TURBO',     'i4_vtec',  320, 400, 7000, 1.58, 6, 1380, 1.42, 1.46, 4.56, '#f8fafc', { widthScale: 1.02, heightScale: 0.97, defaultSpoiler: 'gt', defaultRims: 'black' }),
  car('hon_fl5',   'sedan',       'Honda', 'Civic Type R (FL5)',         'hatch',  'FWD', '2.0L K20C1 VTEC Turbo',   'TURBO',     'i4_vtec',  330, 420, 7000, 1.62, 6, 1430, 1.46, 1.50, 4.59, '#f8fafc', { widthScale: 1.03, heightScale: 0.95, defaultSpoiler: 'gt', defaultRims: 'black' }),
  car('hon_prel99','porsche_718', 'Honda', 'Prelude Type S (BB6)',       'coupe',  'FWD', '2.2L H22A DOHC VTEC',     'NA',        'i4_vtec',  220, 221, 8000, 0.00, 5, 1310, 1.28, 1.30, 4.52, '#dc2626', { heightScale: 0.97 }),
  car('hon_prel25','car_concept', 'Honda', 'Prelude e:HEV Hybrid',       'coupe',  'FWD', '2.0L Atkinson e:HEV',     'NA',        'i4_vtec',  207, 315, 6800, 0.00, 6, 1460, 1.30, 1.34, 4.53, '#f8fafc'),
  car('hon_crz',   'porsche_718', 'Honda', 'CR-Z Alpha Hybrid (ZF1)',    'hatch',  'FWD', '1.5L LEA i-VTEC IMA',     'NA',        'i4_vtec',  135, 174, 6800, 0.00, 6, 1170, 1.24, 1.24, 4.08, '#0ea5e9', { widthScale: 0.93, heightScale: 0.98 }),
  car('hon_crv',   'suv_q7',      'Honda', 'CR-V 1.5T AWD (RS)',         'suv',    'AWD', '1.5L L15BE VTEC Turbo',   'TURBO',     'i4_turbo', 193, 243, 6400, 1.15, 6, 1690, 1.14, 1.20, 4.70, '#1e3a8a', { heightScale: 0.97 }),
  car('hon_dc2',   'porsche_718', 'Honda', 'Integra Type R (DC2)',       'coupe',  'FWD', '1.8L B18C Spec-R VTEC',   'NA',        'i4_vtec',  200, 181, 8600, 0.00, 5, 1120, 1.36, 1.34, 4.38, '#f8fafc', { widthScale: 0.92, defaultSpoiler: 'lip' }),
  car('hon_s2k',   'porsche_718', 'Honda', 'S2000 (AP1) VTEC',           'coupe',  'RWD', '2.0L F20C DOHC VTEC',     'NA',        'i4_vtec',  247, 218, 9000, 0.00, 6, 1260, 1.38, 1.36, 4.13, '#eab308', { widthScale: 0.94, heightScale: 0.94 }),
  car('hon_nsxr',  'ferrari',     'Honda', 'NSX-R (NA2)',                'exotic', 'RWD', '3.2L C32B DOHC VTEC V6',  'NA',        'v6_tt',    290, 304, 8000, 0.00, 6, 1270, 1.44, 1.46, 4.43, '#f8fafc', { widthScale: 0.95, defaultSpoiler: 'lip' }),
  car('hon_nsxs',  'corvette',    'Honda', 'NSX Type S (NC1)',           'exotic', 'AWD', '3.5L JNC1 Twin-Turbo V6', 'TWIN-TURBO','v6_tt',    600, 667, 7500, 1.15, 9, 1725, 1.50, 1.54, 4.54, '#dc2626', { defaultRims: 'black' }),

  // ================= TOYOTA — SUPRA / COROLLA / YARIS / GR SERIES / CAMRY / LC300 (12) =================
  car('toy_altis', 'sedan',       'Toyota', 'Corolla Altis GR Sport',     'sedan', 'FWD', '1.8L 2ZR-FE Dual VVT-i',  'NA',         'i4_vtec',    140, 172, 6400, 0.00, 6, 1365, 1.18, 1.22, 4.63, '#f8fafc'),
  car('toy_grc',   'suv_q7',      'Toyota', 'GR Corolla Morizo Edition',  'hatch', 'AWD', '1.6L G16E-GTS 3-Cyl',     'TURBO',      'i3_compact', 304, 400, 7200, 1.80, 6, 1445, 1.44, 1.48, 4.41, '#64748b', { widthScale: 0.98, heightScale: 0.84, defaultSpoiler: 'lip', defaultRims: 'black' }),
  car('toy_yaris', 'suv_q7',      'Toyota', 'Yaris 1.5G Compact',         'hatch', 'FWD', '1.5L 2NR-FE Dual VVT-i',  'NA',         'i4_turbo',   107, 140, 6200, 0.00, 5, 1115, 1.15, 1.18, 4.14, '#eab308', { widthScale: 0.90, heightScale: 0.85 }),
  car('toy_gryar', 'suv_q7',      'Toyota', 'GR Yaris RZ High-Perf',      'hatch', 'AWD', '1.6L G16E-GTS 3-Cyl',     'TURBO',      'i3_compact', 280, 390, 7200, 1.75, 6, 1280, 1.45, 1.46, 3.99, '#dc2626', { widthScale: 0.96, heightScale: 0.83, defaultSpoiler: 'lip', defaultRims: 'black' }),
  car('toy_gr86',  'porsche_718', 'Toyota', 'GR86 RZ Boxer',              'coupe', 'RWD', '2.4L FA24 Boxer-4',       'NA',         'flat6_na',   235, 250, 7500, 0.00, 6, 1270, 1.36, 1.36, 4.26, '#dc2626', { widthScale: 0.94 }),
  car('toy_a90',   'porsche_718', 'Toyota', 'GR Supra 3.0 RZ (A90)',      'coupe', 'RWD', '3.0L B58 Twin-Scroll I6', 'TURBO',      'i6_turbo',   387, 500, 7000, 1.30, 8, 1520, 1.42, 1.46, 4.38, '#eab308', { widthScale: 1.03, defaultRims: 'black' }),
  car('toy_a80',   'gtr',         'Toyota', 'Supra RZ 2JZ-GTE (A80)',     'coupe', 'RWD', '3.0L 2JZ-GTE Twin-Turbo', 'TWIN-TURBO', 'i6_turbo',   325, 451, 7000, 1.25, 6, 1510, 1.36, 1.38, 4.51, '#f97316', { heightScale: 0.95 }),
  car('toy_st205', 'porsche_718', 'Toyota', 'Celica GT-Four (ST205)',     'coupe', 'AWD', '2.0L 3S-GTE Turbo I4',    'TURBO',      'i4_turbo',   255, 304, 7000, 1.05, 5, 1390, 1.36, 1.34, 4.42, '#f8fafc', { defaultSpoiler: 'gt', defaultRims: 'gold' }),
  car('toy_camry', 'bmwm5',       'Toyota', 'Camry 3.5 V6 TRD',           'sedan', 'FWD', '3.5L 2GR-FKS V6',         'NA',         'v6_tt',      301, 362, 6600, 0.00, 8, 1620, 1.24, 1.30, 4.88, '#f8fafc', { defaultSpoiler: 'lip', defaultRims: 'black' }),
  car('toy_crown', 'saloon',      'Toyota', 'Crown Crossover RS',         'saloon','AWD', '2.4L T24A-FTS Hybrid',    'TURBO',      'i4_turbo',   349, 550, 6400, 1.20, 6, 1970, 1.22, 1.28, 4.93, '#b45309', { heightScale: 1.04 }),
  car('toy_rav4',  'suv_q7',      'Toyota', 'RAV4 Adventure 4WD',         'suv',   'AWD', '2.5L A25A-FKS Dynamic',   'NA',         'i4_turbo',   203, 249, 6600, 0.00, 8, 1690, 1.14, 1.20, 4.61, '#16a34a', { heightScale: 0.98 }),
  car('toy_lc300', 'g63',         'Toyota', 'Land Cruiser 300 GR Sport',  'suv',   'AWD', '3.5L V35A-FTS Twin-Turbo V6','TWIN-TURBO','v6_tt',   415, 650, 6200, 1.35, 10, 2500, 1.14, 1.24, 4.98, '#f8fafc', { heightScale: 0.98 }),

  // ================= NISSAN (6) =================
  car('nis_r34',   'gtr',         'Nissan', 'Skyline GT-R V-Spec II (R34)','coupe','AWD','2.6L RB26DETT Twin-Turbo','TWIN-TURBO','i6_turbo',   330, 392, 8200, 1.20, 6, 1560, 1.42, 1.42, 4.60, '#1d4ed8', { defaultRims: 'gold' }),
  car('nis_r35',   'gtr',         'Nissan', 'GT-R NISMO (R35)',            'coupe','AWD','3.8L VR38DETT Twin-Turbo','TWIN-TURBO','v6_tt',      600, 652, 7100, 1.45, 6, 1720, 1.48, 1.52, 4.69, '#f8fafc', { defaultRims: 'black' }),
  car('nis_rz34',  'porsche_718', 'Nissan', 'Fairlady Z NISMO (RZ34)',     'coupe','RWD','3.0L VR30DDTT Twin-Turbo','TWIN-TURBO','v6_tt',      420, 520, 6800, 1.25, 9, 1680, 1.38, 1.44, 4.38, '#dc2626', { defaultRims: 'black' }),
  car('nis_370z',  'porsche_718', 'Nissan', '370Z NISMO',                  'coupe','RWD','3.7L VQ37VHR V6',         'NA',        'v6_tt',      350, 374, 7500, 0.00, 6, 1545, 1.36, 1.38, 4.25, '#f8fafc', { defaultSpoiler: 'gt' }),
  car('nis_s15',   'sedan',       'Nissan', 'Silvia Spec-R Aero (S15)',    'coupe','RWD','2.0L SR20DET Turbo I4',   'TURBO',     'i4_turbo',   250, 275, 7200, 0.95, 6, 1240, 1.32, 1.30, 4.44, '#0ea5e9', { widthScale: 0.94, heightScale: 0.93, defaultSpoiler: 'gt' }),
  car('nis_patrol','suv_q7',      'Nissan', 'Patrol NISMO V8',             'suv',  'AWD','5.6L VK56VD V8',          'NA',        'v8_muscle',  428, 560, 6200, 0.00, 7, 2665, 1.12, 1.22, 5.17, '#f8fafc', { heightScale: 1.05 }),

  // ================= PORSCHE (7) =================
  car('por_gt3rs', 'porsche_gt3rs', 'Porsche', '911 GT3 RS (992)',   'coupe',  'RWD', '4.0L MA275 Flat-6',    'NA',         'flat6_na',     525,  465,  9000, 0.00, 7, 1450, 1.55, 1.60, 4.57, '#f8fafc'),
  car('por_turbos','porsche_turbos','Porsche', '911 Turbo S (992)',  'coupe',  'AWD', '3.7L MA272 Flat-6',    'TWIN-TURBO', 'flat6_turbo',  650,  800,  7200, 1.55, 8, 1640, 1.48, 1.55, 4.54, '#94a3b8'),
  car('por_918',   'porsche_918',   'Porsche', '918 Spyder',         'exotic', 'AWD', '4.6L V8 Hybrid',       'NA',         'v8_flatplane', 887,  1280, 9150, 0.00, 7, 1634, 1.54, 1.58, 4.64, '#cbd5e1'),
  car('por_gt4rs', 'porsche_718',   'Porsche', '718 Cayman GT4 RS',  'coupe',  'RWD', '4.0L MDG.G Flat-6',    'NA',         'flat6_na',     500,  450,  9000, 0.00, 7, 1415, 1.48, 1.52, 4.45, '#f97316', { defaultSpoiler: 'gt' }),
  car('por_930',   'porsche_930',   'Porsche', '911 Turbo (930)',    'coupe',  'RWD', '3.3L Type 930 Flat-6', 'TURBO',      'flat6_turbo',  300,  412,  6700, 0.95, 4, 1335, 1.26, 1.28, 4.29, '#16a34a'),
  car('por_caygt', 'xiaomi_yu7',    'Porsche', 'Cayenne Turbo GT',   'suv',    'AWD', '4.0L Twin-Turbo V8',   'TWIN-TURBO', 'v8_muscle',    659,  850,  6800, 1.55, 8, 2245, 1.32, 1.46, 4.93, '#475569', { widthScale: 1.04, defaultRims: 'gold' }),
  car('por_taygt', 'saloon',        'Porsche', 'Taycan Turbo GT',    'saloon', 'AWD', 'Dual-Motor HyperEV',   'NA',         'v10_scream',   1034, 1340, 8800, 0.00, 6, 2220, 1.46, 1.54, 4.97, '#7c3aed', { heightScale: 0.95, defaultSpoiler: 'lip' }),

  // ================= LAMBORGHINI (4) =================
  car('lam_gal',   'lamborghini', 'Lamborghini', 'Gallardo LP560-4', 'exotic', 'AWD', '5.2L V10',             'NA',         'v10_scream', 560, 540, 8250, 0.00, 6, 1410, 1.44, 1.50, 4.35, '#eab308'),
  car('lam_sto',   'lamborghini', 'Lamborghini', 'Huracan STO',      'exotic', 'RWD', '5.2L LPI V10',         'NA',         'v10_scream', 640, 565, 8500, 0.00, 7, 1339, 1.54, 1.58, 4.55, '#38bdf8', { widthScale: 1.04, defaultSpoiler: 'gt', defaultRims: 'black' }),
  car('lam_svj',   'mclaren',     'Lamborghini', 'Aventador SVJ',    'exotic', 'AWD', '6.5L L539 V12',        'NA',         'v12_exotic', 770, 720, 8700, 0.00, 7, 1525, 1.52, 1.56, 4.94, '#16a34a', { widthScale: 1.04, defaultRims: 'bronze' }),
  car('lam_urus',  'xiaomi_yu7',  'Lamborghini', 'Urus Performante', 'suv',    'AWD', '4.0L Twin-Turbo V8',   'TWIN-TURBO', 'v8_muscle',  666, 850, 6800, 1.55, 8, 2150, 1.32, 1.46, 5.13, '#eab308', { widthScale: 1.05, defaultRims: 'black' }),

  // ================= McLAREN (3) =================
  car('mcl_senna', 'mclaren',     'McLaren', 'Senna',  'exotic', 'RWD', '4.0L M840TR Twin-Turbo V8', 'TWIN-TURBO', 'v8_flatplane', 800, 800, 8300, 1.60, 7, 1309, 1.58, 1.62, 4.74, '#f97316'),
  car('mcl_765lt', 'mclaren',     'McLaren', '765LT',  'exotic', 'RWD', '4.0L M840T Twin-Turbo V8',  'TWIN-TURBO', 'v8_flatplane', 765, 800, 8500, 1.55, 7, 1339, 1.54, 1.58, 4.60, '#0ea5e9', { defaultSpoiler: 'lip' }),
  car('mcl_p1',    'porsche_918', 'McLaren', 'P1',     'exotic', 'RWD', '3.8L M838TQ V8 Hybrid',     'TWIN-TURBO', 'v8_flatplane', 916, 900, 8500, 1.40, 7, 1450, 1.56, 1.60, 4.59, '#f59e0b'),

  // ================= VOLKSWAGEN (5) =================
  car('vw_golf5',  'suv_q7',      'Volkswagen', 'Golf Mk5 GTI',           'hatch', 'FWD', '2.0L EA113 TFSI I4',  'TURBO', 'i4_turbo', 200, 280, 6800, 0.95, 6, 1336, 1.28, 1.30, 4.21, '#dc2626', { widthScale: 0.92, heightScale: 0.84 }),
  car('vw_golf8r', 'suv_q7',      'Volkswagen', 'Golf Mk8 R 20 Years',    'hatch', 'AWD', '2.0L EA888 Evo4 TSI', 'TURBO', 'i4_turbo', 333, 420, 6800, 1.45, 7, 1555, 1.40, 1.44, 4.29, '#1d4ed8', { widthScale: 0.95, heightScale: 0.83, defaultSpoiler: 'lip', defaultRims: 'black' }),
  car('vw_sciroc', 'porsche_718', 'Volkswagen', 'Scirocco R',             'hatch', 'FWD', '2.0L EA113 TSI I4',   'TURBO', 'i4_turbo', 280, 350, 6800, 1.25, 6, 1425, 1.32, 1.36, 4.26, '#16a34a', { heightScale: 0.99 }),
  car('vw_arteon', 'saloon',      'Volkswagen', 'Arteon R Shooting Brake','wagon', 'AWD', '2.0L EA888 Evo4 TSI', 'TURBO', 'i4_turbo', 320, 420, 6800, 1.40, 7, 1795, 1.32, 1.36, 4.87, '#1e3a8a'),
  car('vw_tiguan', 'suv_q7',      'Volkswagen', 'Tiguan R 4MOTION',       'suv',   'AWD', '2.0L EA888 Evo4 TSI', 'TURBO', 'i4_turbo', 320, 420, 6800, 1.40, 7, 1746, 1.22, 1.28, 4.51, '#1d4ed8', { heightScale: 0.97 }),

  // ================= CHEVROLET (3) =================
  car('chv_zr1',   'corvette',    'Chevrolet', 'Corvette C8 ZR1', 'exotic', 'RWD', '5.5L LT7 Twin-Turbo Flat-V8','TWIN-TURBO',  'v8_flatplane',   1064, 1123, 8000, 1.40, 8, 1665, 1.54, 1.58, 4.72, '#ea580c'),
  car('chv_z06',   'corvette',    'Chevrolet', 'Corvette C8 Z06', 'exotic', 'RWD', '5.5L LT6 Flat-Plane V8',     'NA',          'v8_flatplane',   670,  623,  8600, 0.00, 8, 1561, 1.52, 1.56, 4.69, '#0ea5e9'),
  car('chv_zl1',   'car_concept', 'Chevrolet', 'Camaro ZL1 1LE',  'muscle', 'RWD', '6.2L LT4 Supercharged V8',   'SUPERCHARGED','v8_supercharged',650,  881,  6500, 0.90, 6, 1761, 1.40, 1.48, 4.78, '#dc2626', { widthScale: 1.03, defaultSpoiler: 'gt', defaultRims: 'black' }),

  // ================= FORD (3) =================
  car('frd_dh',    'car_concept', 'Ford', 'Mustang Dark Horse 5.0',  'muscle', 'RWD', '5.0L Coyote Gen-4 V8',       'NA',          'v8_muscle',      500, 567, 7500, 0.00, 6, 1791, 1.34, 1.44, 4.82, '#1e3a8a', { defaultSpoiler: 'lip' }),
  car('frd_gt500', 'car_concept', 'Ford', 'Mustang Shelby GT500',    'muscle', 'RWD', '5.2L Predator SC V8',        'SUPERCHARGED','v8_supercharged',760, 847, 7500, 0.85, 7, 1892, 1.38, 1.48, 4.81, '#f8fafc', { widthScale: 1.04, defaultSpoiler: 'gt', defaultRims: 'black' }),
  car('frd_focrs', 'suv_q7',      'Ford', 'Focus RS AWD',            'hatch',  'AWD', '2.3L EcoBoost Turbo I4',     'TURBO',       'i4_turbo',       350, 475, 6800, 1.60, 6, 1599, 1.38, 1.40, 4.39, '#0ea5e9', { widthScale: 0.94, heightScale: 0.84, defaultSpoiler: 'gt', defaultRims: 'black' }),

  // ================= DODGE (3) =================
  car('ddg_hell',  'car_concept', 'Dodge', 'Challenger SRT Hellcat',     'muscle', 'RWD', '6.2L HEMI Supercharged V8','SUPERCHARGED','v8_supercharged',717, 889, 6500, 0.80, 8, 2015, 1.24, 1.36, 5.02, '#7c3aed', { widthScale: 1.04 }),
  car('ddg_red',   'bmwm5',       'Dodge', 'Charger SRT Redeye Widebody','muscle', 'RWD', '6.2L HEMI High-Output SC V8','SUPERCHARGED','v8_supercharged',797, 959, 6500, 1.00, 8, 2090, 1.26, 1.38, 5.10, '#dc2626', { widthScale: 1.06, defaultRims: 'black' }),
  car('ddg_viper', 'corvette',    'Dodge', 'Viper ACR V10 Extreme',      'exotic', 'RWD', '8.4L Viper V10',           'NA',          'v10_scream',     645, 813, 6400, 0.00, 6, 1530, 1.56, 1.56, 4.46, '#f8fafc', { defaultSpoiler: 'timeattack', defaultRims: 'black' }),

  // ================= SUBARU (2) =================
  car('sub_sti',   'sedan',       'Subaru', 'WRX STI Final Edition', 'sedan', 'AWD', '2.5L EJ257 Boxer-4 Turbo', 'TURBO', 'flat6_turbo', 310, 422, 6800, 1.15, 6, 1525, 1.38, 1.40, 4.59, '#1d4ed8', { defaultSpoiler: 'gt', defaultRims: 'gold' }),
  car('sub_brz',   'porsche_718', 'Subaru', 'BRZ tS',                'coupe', 'RWD', '2.4L FA24 Boxer-4',        'NA',    'flat6_na',    235, 250, 7500, 0.00, 6, 1275, 1.36, 1.38, 4.26, '#0284c7', { widthScale: 0.94 }),

  // ================= MITSUBISHI (2) =================
  car('mit_evo9',  'sedan',       'Mitsubishi', 'Lancer Evolution IX MR',    'sedan', 'AWD', '2.0L 4G63T MIVEC Turbo','TURBO','i4_turbo', 286, 400, 7500, 1.40, 6, 1410, 1.40, 1.42, 4.49, '#dc2626', { defaultSpoiler: 'gt' }),
  car('mit_evo10', 'sedan',       'Mitsubishi', 'Lancer Evolution X Final',  'sedan', 'AWD', '2.0L 4B11T MIVEC Turbo','TURBO','i4_turbo', 303, 413, 7500, 1.45, 5, 1560, 1.38, 1.42, 4.50, '#f8fafc', { defaultSpoiler: 'gt', defaultRims: 'black' }),

  // ================= PROTON (3) =================
  car('pro_saga',  'sedan',       'Proton', 'Saga 1.3 Premium S (MC2)', 'sedan', 'FWD', '1.3L VVT DOHC I4',   'NA',    'i4_vtec',    95,  120, 6000, 0.00, 4, 1085, 1.08, 1.12, 4.33, '#dc2626', { widthScale: 0.93 }),
  car('pro_s70',   'sedan',       'Proton', 'S70 1.5T Flagship X',      'sedan', 'FWD', '1.5L MPI Turbo I3',  'TURBO', 'i3_compact', 150, 226, 6200, 1.00, 7, 1345, 1.18, 1.22, 4.60, '#0ea5e9'),
  car('pro_x50',   'xiaomi_yu7',  'Proton', 'X50 1.5 TGDi Flagship',    'suv',   'FWD', '1.5L TGDi Turbo I3', 'TURBO', 'i3_compact', 177, 255, 6200, 1.15, 7, 1370, 1.14, 1.20, 4.33, '#dc2626', { widthScale: 0.93, heightScale: 0.96 }),

  // ================= PERODUA (3) =================
  car('per_myvi',  'suv_q7',      'Perodua', 'Myvi 1.5 AV (King of Highway)','hatch','FWD','1.5L 2NR-VE Dual VVT-i','NA','i4_vtec',   102, 136, 6200, 0.00, 5, 1025, 1.16, 1.18, 3.90, '#dc2626', { widthScale: 0.90, heightScale: 0.85 }),
  car('per_axia',  'suv_q7',      'Perodua', 'Axia 1.0 SE (2024)',           'hatch','FWD','1.0L 1KR-VE VVT-i I3',  'NA','i3_compact',67,  91,  6200, 0.00, 5, 890,  1.10, 1.12, 3.76, '#eab308', { widthScale: 0.87, heightScale: 0.84 }),
  car('per_ativa', 'suv_q7',      'Perodua', 'Ativa 1.0L Turbo AV',          'suv',  'FWD','1.0L 1KR-VET Turbo I3', 'TURBO','i3_compact',98,140, 6200, 0.95, 5, 1035, 1.12, 1.16, 4.06, '#dc2626', { widthScale: 0.90, heightScale: 0.94 }),

  // ================= JEEP (2) =================
  car('jep_392',   'jeep_wrangler','Jeep', 'Wrangler Rubicon 392',     'suv', 'AWD', '6.4L 392 HEMI V8',         'NA',          'v8_muscle',       470, 637, 6400, 0.00, 8, 2315, 1.12, 1.22, 4.78, '#16a34a'),
  car('jep_hawk',  'suv_q7',       'Jeep', 'Grand Cherokee Trackhawk', 'suv', 'AWD', '6.2L Hellcat Supercharged V8','SUPERCHARGED','v8_supercharged',707, 875, 6500, 0.80, 8, 2433, 1.22, 1.38, 4.82, '#334155', { widthScale: 1.04, defaultRims: 'black' }),

  // ================= XIAOMI (3) =================
  car('xia_su7',   'saloon',     'Xiaomi', 'SU7 Max',            'saloon', 'AWD', 'Dual-Motor HyperV8s', 'NA', 'v10_scream', 673,  838,  8500, 0.00, 6, 2205, 1.38, 1.48, 4.99, '#0ea5e9'),
  car('xia_ultra', 'saloon',     'Xiaomi', 'SU7 Ultra (1548 HP)','saloon', 'AWD', 'Tri-Motor HyperEV',   'NA', 'v10_scream', 1548, 1770, 9200, 0.00, 7, 2360, 1.54, 1.58, 5.07, '#eab308', { widthScale: 1.04, defaultSpoiler: 'gt', defaultRims: 'gold' }),
  car('xia_yu7',   'xiaomi_yu7', 'Xiaomi', 'YU7 Max SUV',        'suv',    'AWD', 'Dual-Motor HyperEV',  'NA', 'v10_scream', 691,  866,  8500, 0.00, 6, 2320, 1.30, 1.42, 4.99, '#10b981')
];

export const CAR_BY_ID = Object.fromEntries(CAR_CATALOG.map(c => [c.id, c]));
