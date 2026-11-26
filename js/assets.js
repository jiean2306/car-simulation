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
  porsche_turbos: './assets/models/porsche911.glb',
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
  const failedLoads = new Set();

  function loadGLBKey(key, onStepLabel = null) {
    if (modelsCache[key]) return Promise.resolve(modelsCache[key]);
    if (failedLoads.has(key)) return Promise.resolve(null);
    if (pendingLoads[key]) return pendingLoads[key];
    const url = MODEL_URLS[key];
    if (!url) return Promise.resolve(null);

    pendingLoads[key] = new Promise(resolve => {
      let settled = false;
      const finish = (res, failed = false) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (failed) failedLoads.add(key);
        if (onStepLabel) onStepLabel();
        resolve(res);
      };
      const timer = setTimeout(() => {
        console.warn('GLB load timeout:', url);
        finish(null, true);
      }, 15000);
      gltfLoader.load(
        url,
        gltf => {
         if (settled) return;
          const scene = gltf ? gltf.scene : null;
          modelsCache[key] = scene;
          finish(scene, !scene);
        },
        undefined,
        err => {
         if (settled) return;
          console.warn('GLB load warning:', url, err);
          finish(null, true);
        }
      );
    }).finally(() => { delete pendingLoads[key]; });
    return pendingLoads[key];
  }

  // Initial fast boot set (6 core models for instant start & traffic) + on-demand lazy loading for all other .GLBs
  const bootKeys = ['ferrari'];
  const totalSteps = bootKeys.length + 4;
  let completed = 0;
  function step(label) {
    completed++;
    if (onProgress) onProgress(Math.min(1, completed / totalSteps), label);
  }

  function loadHDR(url, label) {
    return new Promise(resolve => {
      let settled = false;
      const finish = tex => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (label) step(label);
        resolve(tex);
      };
      const timer = setTimeout(() => {
        console.warn('HDR load timeout:', url);
        finish(null);
      }, 15000);
      rgbeLoader.load(
        url,
        tex => {
          if (settled) return;
          tex.mapping = THREE.EquirectangularReflectionMapping;
          finish(tex);
        },
        undefined,
        () => { finish(null); }
      );
    });
  }

  function loadTex(url, repeatX = 1, repeatY = 1, isColor = true, label = null) {
    return new Promise(resolve => {
      let settled = false;
      const finish = tex => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (label) step(label);
        resolve(tex);
      };
      const timer = setTimeout(() => {
        console.warn('Texture load timeout:', url);
        finish(null);
      }, 15000);
      texLoader.load(
        url,
        tex => {
          if (settled) return;
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(repeatX, repeatY);
          tex.anisotropy = Math.min(maxAniso, 4);
          if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
          finish(tex);
        },
        undefined,
        () => { finish(null); }
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
    loadTex('./assets/textures/Carbon_Normal.png', 12, 12, false, 'Loaded Carbon Fiber Normal Map'),
    ...bootKeys.map(k => loadGLBKey(k, () => step(`Loaded 3D ${k.toUpperCase()} Chassis (.GLB)`)))
  ]);

  // Non-blocking sequential background preload for remaining showroom vehicles
  const bgKeys = ['sedan', 'bmwm5', 'muscle', 'g63', 'suv_q7'];
  (async () => {
    for (const k of bgKeys) {
      await loadGLBKey(k);
    }
  })();
  return {
    models: modelsCache,
    ensureGLBModel: loadGLBKey,
    isGLBFailed: k => failedLoads.has(k),
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
