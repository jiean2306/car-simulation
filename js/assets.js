import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { DRACOLoader } from '../vendor/DRACOLoader.js';
import { RGBELoader } from '../vendor/RGBELoader.js';

const MODEL_URLS = {
  ferrari:        './assets/models/ferrari.glb',
  porsche_gt3rs:  './assets/models/porsche_gt3rs.glb',
  porsche_718:    './assets/models/porsche_718.glb',
  porsche_918:    './assets/models/porsche_918.glb',
  porsche_930:    './assets/models/porsche_930.glb',
  porsche_turbos: './assets/models/porsche_turbos.glb',
  bmwm5:          './assets/models/bmwm5.glb',
  sedan:          './assets/models/sedan.glb',
  saloon:         './assets/models/saloon.glb',
  g63:            './assets/models/g63.glb',
  suv_q7:         './assets/models/suv_q7.glb',
  lamborghini:    './assets/models/lamborghini.glb',
  corvette:       './assets/models/corvette.glb',
  muscle:         './assets/models/muscle.glb',
  gtr:            './assets/models/gtr.glb',
  mclaren:        './assets/models/mclaren.glb',
  hatchback:      './assets/models/hatchback.glb',
  jeep_wrangler:  './assets/models/jeep_wrangler.glb',
  xiaomi_yu7:     './assets/models/xiaomi_yu7.glb'
};

export async function loadAllAssets(renderer, onProgress) {
  const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('./assets/draco/');

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  const rgbeLoader = new RGBELoader();
  const texLoader = new THREE.TextureLoader();

  const modelsCache = {};
  const pendingLoads = {};

  function loadGLBKey(key, onStepLabel = null) {
    if (modelsCache[key]) return Promise.resolve(modelsCache[key]);
    if (pendingLoads[key]) return pendingLoads[key];
    const url = MODEL_URLS[key];
    if (!url) return Promise.resolve(null);

    pendingLoads[key] = new Promise(resolve => {
      gltfLoader.load(
        url,
        gltf => {
          modelsCache[key] = gltf ? gltf.scene : null;
          if (onStepLabel) onStepLabel();
          resolve(modelsCache[key]);
        },
        undefined,
        err => {
          console.warn('GLB load warning:', url, err);
          if (onStepLabel) onStepLabel();
          resolve(null);
        }
      );
    });
    return pendingLoads[key];
  }

  // Initial fast boot set (loads in ~1.5s) + background prefetcher for all other real .GLB models
  const bootKeys = ['ferrari', 'porsche_gt3rs', 'bmwm5', 'sedan', 'muscle', 'g63', 'suv_q7', 'mclaren'];
  const totalSteps = bootKeys.length + 4;
  let completed = 0;
  function step(label) {
    completed++;
    if (onProgress) onProgress(Math.min(1, completed / totalSteps), label);
  }

  function loadHDR(url, label) {
    return new Promise(resolve => {
      rgbeLoader.load(
        url,
        tex => {
          tex.mapping = THREE.EquirectangularReflectionMapping;
          step(label);
          resolve(tex);
        },
        undefined,
        () => { step(label); resolve(null); }
      );
    });
  }

  function loadTex(url, repeatX = 1, repeatY = 1, isColor = true, label = null) {
    return new Promise(resolve => {
      texLoader.load(
        url,
        tex => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(repeatX, repeatY);
          tex.anisotropy = maxAniso;
          if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
          if (label) step(label);
          resolve(tex);
        },
        undefined,
        () => { if (label) step(label); resolve(null); }
      );
    });
  }

  const [
    hdrMorning,
    ferrariAO,
    carbonColor,
    carbonNormal
  ] = await Promise.all([
    loadHDR('./assets/hdr/blouberg_sunrise_2_1k.hdr', 'Loaded Studio Reflection Map (.HDR)'),
    loadTex('./assets/textures/ferrari_ao.png', 1, 1, false, 'Loaded Chassis Contact Shadow Map'),
    loadTex('./assets/textures/Carbon.png', 12, 12, true, 'Loaded Carbon Fiber Weave Maps'),
    loadTex('./assets/textures/Carbon_Normal.png', 12, 12, false),
    ...bootKeys.map(k => loadGLBKey(k, () => step(`Loaded 3D ${k.toUpperCase()} Chassis (.GLB)`)))
  ]);

  // Background stream remaining real .GLB models without blocking game start (skip huge models so they load on demand)
  const lazyOnly = new Set(['jeep_wrangler', 'xiaomi_yu7']);
  setTimeout(() => {
    Object.keys(MODEL_URLS).forEach(k => {
      if (!lazyOnly.has(k) && !modelsCache[k]) loadGLBKey(k);
    });
  }, 200);

  return {
    models: modelsCache,
    ensureGLBModel: loadGLBKey,
    hdrs: {
      morning: hdrMorning
    },
    textures: {
      ferrariAO,
      carbonColor,
      carbonNormal
    }
  };
}
