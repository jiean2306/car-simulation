// ============================================================================
// REAL 3D .GLB VEHICLE ROSTER — EVERY CAR IS ITS OWN UNIQUE 3D MODEL
// 12 Famous Brands · 19 Distinct Real 3D .GLB Models
// ============================================================================

export const BRANDS = [
  'Ferrari',
  'Porsche',
  'Lamborghini',
  'McLaren',
  'Nissan',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Chevrolet',
  'Volkswagen',
  'Jeep',
  'Xiaomi'
];

function car(id, glbKey, brand, name, chassis, drivetrain, engineCode, aspiration, soundProfile, hp, torqueNm, redline, maxBoostBar, gears, mass, baseGrip, baseBrake, length, defaultColor) {
  const isNA = aspiration === 'NA';
  const peakTorqueRpm = isNA ? Math.round(redline * 0.68) : (aspiration === 'SUPERCHARGED' ? Math.round(redline * 0.52) : Math.round(redline * 0.42));
  const peakPowerRpm = Math.round(redline * 0.90);
  const dragMap = { exotic: 0.25, coupe: 0.28, muscle: 0.32, sedan: 0.28, hatch: 0.31, saloon: 0.26, suv: 0.36 };
  const drag = dragMap[chassis] || 0.29;

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
    width: chassis === 'suv' ? 2.08 : (chassis === 'hatch' ? 1.80 : 1.96),
    defaultColor
  };
}

export const CAR_CATALOG = [
  // FERRARI
  car('fer_458',   'ferrari',       'Ferrari',       '458 Italia',            'exotic', 'RWD', '4.5L F136 V8',         'NA',           'v8_flatplane',   570,  540,  9000, 0.0,  7, 1485, 1.40, 1.50, 4.53, '#d91b24'),

  // PORSCHE (5 real models)
  car('por_gt3rs', 'porsche_gt3rs', 'Porsche',       '911 GT3 RS (992)',      'coupe',  'RWD', '4.0L MA275 Flat-6',    'NA',           'flat6_na',       525,  465,  9000, 0.0,  7, 1450, 1.55, 1.60, 4.57, '#f8fafc'),
  car('por_turbos','porsche_turbos','Porsche',       '911 Turbo S (992)',     'coupe',  'AWD', '3.7L MA272 Flat-6',    'TWIN-TURBO',   'flat6_turbo',    650,  800,  7200, 1.55, 8, 1640, 1.48, 1.55, 4.54, '#94a3b8'),
  car('por_918',   'porsche_918',   'Porsche',       '918 Spyder',            'exotic', 'AWD', '4.6L V8 Hybrid',       'NA',           'v8_flatplane',   887,  1280, 9150, 0.0,  7, 1634, 1.54, 1.58, 4.64, '#cbd5e1'),
  car('por_gt4rs', 'porsche_718',   'Porsche',       '718 Cayman GT4',        'coupe',  'RWD', '4.0L Flat-6',          'NA',           'flat6_na',       500,  450,  9000, 0.0,  7, 1415, 1.48, 1.52, 4.45, '#f97316'),
  car('por_930',   'porsche_930',   'Porsche',       '911 Turbo (930)',       'coupe',  'RWD', '3.3L Type 930 Flat-6', 'TURBO',        'flat6_turbo',    300,  412,  6700, 0.95, 4, 1335, 1.26, 1.28, 4.29, '#16a34a'),

  // LAMBORGHINI
  car('lam_gal',   'lamborghini',   'Lamborghini',   'Gallardo LP560-4',      'exotic', 'AWD', '5.2L V10',             'NA',           'v10_scream',     560,  540,  8250, 0.0,  6, 1410, 1.44, 1.50, 4.35, '#eab308'),

  // McLAREN
  car('mcl_senna', 'mclaren',       'McLaren',       'Senna',                 'exotic', 'RWD', '4.0L M840TR V8',       'TWIN-TURBO',   'v8_flatplane',   800,  800,  8300, 1.60, 7, 1309, 1.58, 1.62, 4.74, '#f97316'),

  // NISSAN
  car('nis_r35',   'gtr',           'Nissan',        'GT-R NISMO (R35)',      'coupe',  'AWD', '3.8L VR38DETT V6',     'TWIN-TURBO',   'v6_tt',          600,  652,  7100, 1.45, 6, 1720, 1.48, 1.52, 4.69, '#f8fafc'),

  // BMW (2 real models)
  car('bmw_m2g87', 'sedan',         'BMW',           'M2 Coupe (G87)',        'coupe',  'RWD', '3.0L S58 I6',          'TWIN-TURBO',   'i6_turbo',       460,  550,  7200, 1.35, 6, 1700, 1.38, 1.46, 4.58, '#38bdf8'),
  car('bmw_m5f10', 'bmwm5',         'BMW',           'M5 (F10)',              'sedan',  'RWD', '4.4L S63 V8',          'TWIN-TURBO',   'v8_muscle',      560,  680,  7200, 1.50, 7, 1870, 1.34, 1.44, 4.91, '#1d4ed8'),

  // MERCEDES-BENZ
  car('mer_g63',   'g63',           'Mercedes-Benz', 'AMG G63',               'suv',    'AWD', '4.0L M177 V8',         'TWIN-TURBO',   'v8_muscle',      585,  850,  6500, 1.45, 9, 2560, 1.15, 1.28, 4.87, '#1e293b'),

  // AUDI
  car('aud_q7',    'suv_q7',        'Audi',          'Q7 V12 TDI',            'suv',    'AWD', '6.0L V12 TDI',         'TWIN-TURBO',   'w12_luxury',     500,  1000, 5000, 1.65, 6, 2605, 1.18, 1.32, 5.06, '#334155'),

  // CHEVROLET (2 real models)
  car('chv_zr1',   'corvette',      'Chevrolet',     'Corvette C8 ZR1',       'exotic', 'RWD', '5.5L LT7 Flat-V8',     'TWIN-TURBO',   'v8_flatplane',   1064, 1123, 8000, 1.40, 8, 1665, 1.54, 1.58, 4.72, '#ea580c'),
  car('chv_zl1',   'muscle',        'Chevrolet',     'Camaro ZL1',            'muscle', 'RWD', '6.2L LT4 V8',          'SUPERCHARGED', 'v8_supercharged',650,  881,  6500, 0.90, 6, 1761, 1.36, 1.44, 4.78, '#dc2626'),

  // VOLKSWAGEN
  car('vw_golf5',  'hatchback',     'Volkswagen',    'Golf Mk5 GTI',          'hatch',  'FWD', '2.0L EA113 TFSI I4',   'TURBO',        'i4_turbo',       200,  280,  6800, 0.95, 6, 1336, 1.28, 1.30, 4.21, '#dc2626'),

  // JEEP
  car('jep_392',   'jeep_wrangler', 'Jeep',          'Wrangler Rubicon 392',  'suv',    'AWD', '6.4L 392 HEMI V8',     'NA',           'v8_muscle',      470,  637,  6400, 0.0,  8, 2315, 1.12, 1.22, 4.78, '#16a34a'),

  // XIAOMI (2 real models)
  car('xia_su7',   'saloon',        'Xiaomi',        'SU7 Max',               'saloon', 'AWD', 'Dual-Motor HyperV8s',  'NA',           'v10_scream',     673,  838,  8500, 0.0,  6, 2205, 1.38, 1.48, 4.99, '#0ea5e9'),
  car('xia_yu7',   'xiaomi_yu7',    'Xiaomi',        'YU7 Max SUV',           'suv',    'AWD', 'Dual-Motor HyperEV',   'NA',           'v10_scream',     691,  866,  8500, 0.0,  6, 2320, 1.30, 1.42, 4.99, '#10b981')
];

export const CAR_BY_ID = Object.fromEntries(CAR_CATALOG.map(c => [c.id, c]));
