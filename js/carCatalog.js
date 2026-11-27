// ============================================================================
// REAL 3D .GLB VEHICLE ROSTER — 100% AUTHENTIC 1-TO-1 DEDICATED MODELS ONLY
// 16 Global Brands · 44 Unique Real 3D .GLB Vehicle Models (Zero Rebadging)
// ============================================================================

export const BRANDS = [
  'Ferrari',
  'Porsche',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Toyota',
  'Nissan',
  'Lamborghini',
  'McLaren',
  'Chevrolet',
  'Ford',
  'Dodge',
  'Hyundai',
  'Tesla',
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
    saloon: 0.25,
    suv: 0.35
  };
  const drag = dragMap[chassis] || 0.29;
  const widthScale = opts.widthScale || 1.0;
  const heightScale = opts.heightScale || 1.0;
  const baseWidth = chassis === 'suv' ? 2.04 : (chassis === 'hatch' ? 1.84 : 1.94);

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
  // ================= FERRARI (3) =================
  car('fer_458',    'ferrari',        'Ferrari', '458 Italia',        'exotic', 'RWD', '4.5L F136 V8',             'NA',         'v8_flatplane', 570,  540, 9000, 0.00, 7, 1485, 1.44, 1.50, 4.53, '#d91b24'),
  car('fer_f40',    'ferrari_f40',    'Ferrari', 'F40',               'exotic', 'RWD', '2.9L F120A Twin-Turbo V8', 'TWIN-TURBO', 'v8_flatplane', 478,  577, 7750, 1.10, 5, 1250, 1.46, 1.38, 4.36, '#dc2626'),
  car('fer_sf90xx', 'ferrari_sf90xx', 'Ferrari', 'SF90 XX Stradale',  'exotic', 'AWD', '4.0L F154FB V8 Hybrid',    'TWIN-TURBO', 'v8_flatplane', 1016, 804, 8000, 1.65, 8, 1560, 1.58, 1.62, 4.85, '#dc2626', { defaultRims: 'black' }),

  // ================= PORSCHE (8) =================
  car('por_gt3rs',     'porsche_gt3rs',     'Porsche', '911 GT3 RS (992)',     'coupe',  'RWD', '4.0L MA275 Flat-6',        'NA',         'flat6_na',     525,  465,  9000, 0.00, 7, 1450, 1.56, 1.60, 4.57, '#f8fafc'),
  car('por_turbos',    'porsche_turbos',    'Porsche', '911 Turbo S (992)',    'coupe',  'AWD', '3.7L MA272 Flat-6',        'TWIN-TURBO', 'flat6_turbo',  650,  800,  7200, 1.55, 8, 1640, 1.48, 1.55, 4.54, '#94a3b8'),
  car('por_carrera4s', 'porsche_carrera4s', 'Porsche', '911 Carrera 4S (992)', 'coupe',  'AWD', '3.0L 9A2 Evo Flat-6',      'TWIN-TURBO', 'flat6_turbo',  450,  530,  7500, 1.25, 8, 1565, 1.44, 1.50, 4.52, '#0ea5e9'),
  car('por_gt4',       'porsche_718',       'Porsche', '718 Cayman GT4',       'coupe',  'RWD', '4.0L MDG.G Flat-6',        'NA',         'flat6_na',     420,  420,  8000, 0.00, 6, 1420, 1.48, 1.52, 4.46, '#f97316'),
  car('por_918',       'porsche_918',       'Porsche', '918 Spyder',           'exotic', 'AWD', '4.6L V8 Hybrid',           'NA',         'v8_flatplane', 887,  1280, 9150, 0.00, 7, 1634, 1.54, 1.58, 4.64, '#cbd5e1'),
  car('por_930',       'porsche_930',       'Porsche', '911 Turbo (930)',      'coupe',  'RWD', '3.3L Type 930 Flat-6',     'TURBO',      'flat6_turbo',  300,  412,  6700, 0.95, 4, 1335, 1.26, 1.28, 4.29, '#16a34a'),
  car('por_missionr',  'porsche_mission_r', 'Porsche', 'Mission R Concept',    'exotic', 'AWD', 'Dual-Motor Track Electric','NA',         'v10_scream',   1088, 1100, 9000, 0.00, 6, 1500, 1.58, 1.62, 4.33, '#f8fafc'),
  car('por_917k',      'porsche_917k',      'Porsche', '917K Le Mans',         'exotic', 'RWD', '4.9L Type 912 Flat-12',    'NA',         'v12_exotic',   600,  550,  8400, 0.00, 5, 800,  1.60, 1.55, 4.14, '#dc2626'),

  // ================= BMW (7) =================
  car('bmw_m2g87',  'sedan',       'BMW', 'M2 Coupe (G87)',        'coupe', 'RWD', '3.0L S58 Twin-Turbo I6',  'TWIN-TURBO', 'i6_turbo',  460, 550, 7200, 1.35, 6, 1700, 1.38, 1.46, 4.58, '#38bdf8'),
  car('bmw_m3g80',  'bmw_m3_g80',  'BMW', 'M3 Competition (G80)',  'sedan', 'RWD', '3.0L S58 Twin-Turbo I6',  'TWIN-TURBO', 'i6_turbo',  510, 650, 7200, 1.50, 8, 1780, 1.44, 1.50, 4.79, '#16a34a', { defaultRims: 'black' }),
  car('bmw_m4comp', 'bmw_m4_comp', 'BMW', 'M4 Competition (G82)',  'coupe', 'RWD', '3.0L S58 Twin-Turbo I6',  'TWIN-TURBO', 'i6_turbo',  510, 650, 7200, 1.50, 8, 1725, 1.45, 1.52, 4.79, '#eab308', { defaultRims: 'black' }),
  car('bmw_m4csl',  'bmw_m4_csl',  'BMW', 'M4 CSL (G82)',          'coupe', 'RWD', '3.0L S58 High-Output I6', 'TWIN-TURBO', 'i6_turbo',  550, 650, 7200, 1.65, 8, 1625, 1.50, 1.56, 4.79, '#64748b', { defaultRims: 'black' }),
  car('bmw_m5f10',  'bmwm5',       'BMW', 'M5 (F10)',              'sedan', 'RWD', '4.4L S63 Twin-Turbo V8',  'TWIN-TURBO', 'v8_muscle', 560, 680, 7200, 1.50, 7, 1870, 1.34, 1.44, 4.72, '#1d4ed8'),
  car('bmw_m5f90',  'bmw_m5_f90',  'BMW', 'M5 CS (F90)',           'sedan', 'AWD', '4.4L S63T4 Twin-Turbo V8','TWIN-TURBO', 'v8_muscle', 635, 750, 7200, 1.60, 8, 1825, 1.46, 1.52, 4.98, '#14532d', { defaultRims: 'gold' }),
  car('bmw_m8',     'bmw_m8',      'BMW', 'M8 Competition Coupe',  'coupe', 'AWD', '4.4L S63T4 Twin-Turbo V8','TWIN-TURBO', 'v8_muscle', 625, 750, 7200, 1.55, 8, 1885, 1.44, 1.50, 4.87, '#1d4ed8'),

  // ================= MERCEDES-BENZ (3) =================
  car('mer_amggtr', 'mercedes_amg_gtr',     'Mercedes-Benz', 'AMG GT R',          'exotic', 'RWD', '4.0L M178 Twin-Turbo V8',   'TWIN-TURBO', 'v8_muscle',  585, 700,  7000, 1.35, 7, 1630, 1.48, 1.54, 4.55, '#94a3b8'),
  car('mer_g63',    'g63',                  'Mercedes-Benz', 'AMG G 63',          'suv',    'AWD', '4.0L M177 Twin-Turbo V8',   'TWIN-TURBO', 'v8_muscle',  585, 850,  6500, 1.45, 9, 2560, 1.15, 1.28, 4.87, '#1e293b', { defaultFinish: 'matte', defaultRims: 'black' }),
  car('mer_g900',   'mercedes_brabus_g900', 'Mercedes-Benz', 'Brabus G900 V12',   'suv',    'AWD', '6.3L V12 Biturbo',          'TWIN-TURBO', 'w12_luxury', 900, 1500, 6200, 1.75, 9, 2660, 1.18, 1.32, 4.89, '#111827', { defaultRims: 'black' }),

  // ================= AUDI (2) =================
  car('aud_q3', 'audi_q3', 'Audi', 'Q3 40 TFSI quattro',  'suv', 'AWD', '2.0L EA888 Turbo I4',    'TURBO',      'i4_turbo',   190, 320,  6500, 1.10, 7, 1695, 1.16, 1.22, 4.48, '#1e3a8a'),
  car('aud_q7', 'suv_q7',  'Audi', 'Q7 V12 TDI quattro',  'suv', 'AWD', '6.0L V12 TDI Twin-Turbo','TWIN-TURBO', 'w12_luxury', 500, 1000, 5000, 1.65, 6, 2605, 1.18, 1.32, 5.06, '#334155'),

  // ================= TOYOTA (7) =================
  car('toy_a90',   'toyota_supra_a90',  'Toyota', 'GR Supra 3.0 (A90)',     'coupe', 'RWD', '3.0L B58 Twin-Scroll I6',  'TURBO', 'i6_turbo',   387, 500, 7000, 1.30, 8, 1520, 1.42, 1.46, 4.38, '#eab308', { defaultRims: 'black' }),
  car('toy_gr86',  'toyota_gr86',       'Toyota', 'GR86',                   'coupe', 'RWD', '2.4L FA24 Boxer-4',        'NA',    'flat6_na',   235, 250, 7500, 0.00, 6, 1270, 1.38, 1.38, 4.26, '#dc2626'),
  car('toy_grc',   'toyota_grcorolla',  'Toyota', 'GR Corolla',             'hatch', 'AWD', '1.6L G16E-GTS Turbo I3',   'TURBO', 'i3_compact', 300, 370, 7200, 1.75, 6, 1475, 1.44, 1.46, 4.41, '#dc2626', { defaultRims: 'black' }),
  car('toy_ae86',  'toyota_ae86',       'Toyota', 'Sprinter Trueno AE86',   'coupe', 'RWD', '1.6L 4A-GEU DOHC I4',      'NA',    'i4_vtec',    130, 149, 7700, 0.00, 5, 940,  1.28, 1.24, 4.20, '#f8fafc'),
  car('toy_camry', 'toyota_camry',      'Toyota', 'Camry Hybrid (XV80)',    'sedan', 'FWD', '2.5L A25A-FXS Hybrid',     'NA',    'i4_vtec',    225, 221, 6200, 0.00, 6, 1595, 1.20, 1.24, 4.74, '#f8fafc'),
  car('toy_rav4',  'toyota_rav4',       'Toyota', 'RAV4 Hybrid AWD',        'suv',   'AWD', '2.5L Dynamic Force Hybrid','NA',    'i4_turbo',   219, 221, 6200, 0.00, 6, 1730, 1.15, 1.22, 4.46, '#cbd5e1'),
  car('toy_lc250', 'toyota_lc250',      'Toyota', 'Land Cruiser 250',       'suv',   'AWD', '2.4L T24A-FTS Hybrid Turbo','TURBO','i4_turbo',   326, 630, 6000, 1.35, 8, 2500, 1.14, 1.24, 4.74, '#e2e8f0'),

  // ================= NISSAN (1) =================
  car('nis_r35', 'gtr', 'Nissan', 'GT-R NISMO (R35)', 'coupe', 'AWD', '3.8L VR38DETT Twin-Turbo V6', 'TWIN-TURBO', 'v6_tt', 600, 652, 7100, 1.45, 6, 1720, 1.48, 1.52, 4.69, '#f8fafc', { defaultRims: 'black' }),

  // ================= LAMBORGHINI (3) =================
  car('lam_gal',      'lamborghini',     'Lamborghini', 'Gallardo LP560-4',    'exotic', 'AWD', '5.2L Odd-Firing V10', 'NA', 'v10_scream', 560, 540, 8250, 0.00, 6, 1410, 1.44, 1.50, 4.35, '#eab308'),
  car('lam_av',       'lambo_aventador', 'Lamborghini', 'Aventador LP700-4',   'exotic', 'AWD', '6.5L L539 V12',       'NA', 'v12_exotic', 700, 690, 8500, 0.00, 7, 1575, 1.50, 1.54, 4.78, '#f97316'),
  car('lam_countach', 'lambo_countach',  'Lamborghini', 'Countach LPI 800-4',  'exotic', 'AWD', '6.5L V12 Supercap',   'NA', 'v12_exotic', 803, 755, 8700, 0.00, 7, 1595, 1.52, 1.56, 4.87, '#f8fafc'),

  // ================= McLAREN (1) =================
  car('mcl_senna', 'mclaren', 'McLaren', 'Senna', 'exotic', 'RWD', '4.0L M840TR Twin-Turbo V8', 'TWIN-TURBO', 'v8_flatplane', 800, 800, 8300, 1.60, 7, 1309, 1.58, 1.62, 4.74, '#f97316'),

  // ================= CHEVROLET (1) =================
  car('chv_zr1', 'corvette', 'Chevrolet', 'Corvette C8 ZR1', 'exotic', 'RWD', '5.5L LT7 Twin-Turbo Flat-V8', 'TWIN-TURBO', 'v8_flatplane', 1064, 1123, 8000, 1.40, 8, 1665, 1.54, 1.58, 4.72, '#ea580c'),

  // ================= FORD (2) =================
  car('frd_mustang', 'ford_mustang',      'Ford', 'Mustang GT (S197)',    'muscle', 'RWD', '4.6L Modular 3V V8',           'NA',           'v8_muscle', 300, 434, 6250, 0.00, 5, 1580, 1.32, 1.36, 4.76, '#dc2626'),
  car('frd_gt500',   'ford_shelby_gt500', 'Ford', 'Mustang Shelby GT500', 'muscle', 'RWD', '5.2L Predator Supercharged V8','SUPERCHARGED', 'v8_muscle', 760, 847, 7500, 0.85, 7, 1895, 1.46, 1.54, 4.81, '#1d4ed8'),

  // ================= DODGE (1) =================
  car('ddg_rt', 'dodge_challenger', 'Dodge', 'Challenger R/T 440', 'muscle', 'RWD', '7.2L 440 Magnum V8', 'NA', 'v8_muscle', 390, 664, 6000, 0.00, 4, 1680, 1.24, 1.28, 4.86, '#1d4ed8'),

  // ================= HYUNDAI (1) =================
  car('hyu_i5n', 'hyundai_ioniq5n', 'Hyundai', 'IONIQ 5 N', 'hatch', 'AWD', 'Dual-Motor HyperEV (N Grin)', 'NA', 'v10_scream', 641, 770, 9000, 0.00, 8, 2200, 1.42, 1.50, 4.72, '#38bdf8'),

  // ================= TESLA (1) =================
  car('tsl_m3p', 'tesla_model3', 'Tesla', 'Model 3 Performance', 'sedan', 'AWD', 'Dual-Motor Electric AWD', 'NA', 'v10_scream', 510, 741, 9000, 0.00, 6, 1835, 1.38, 1.44, 4.72, '#f8fafc'),

  // ================= JEEP (1) =================
  car('jep_392', 'jeep_wrangler', 'Jeep', 'Wrangler Rubicon 392', 'suv', 'AWD', '6.4L 392 HEMI V8', 'NA', 'v8_muscle', 470, 637, 6400, 0.00, 8, 2315, 1.12, 1.22, 4.78, '#16a34a'),

  // ================= XIAOMI (2) =================
  car('xia_su7', 'saloon',     'Xiaomi', 'SU7 Max',     'saloon', 'AWD', 'Dual-Motor HyperV8s', 'NA', 'v10_scream', 673, 838, 8500, 0.00, 6, 2205, 1.38, 1.48, 4.99, '#0ea5e9'),
  car('xia_yu7', 'xiaomi_yu7', 'Xiaomi', 'YU7 Max SUV', 'suv',    'AWD', 'Dual-Motor HyperEV',  'NA', 'v10_scream', 691, 866, 8500, 0.00, 6, 2320, 1.30, 1.42, 4.99, '#10b981')
];

export const CAR_BY_ID = Object.fromEntries(CAR_CATALOG.map(c => [c.id, c]));
