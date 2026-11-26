import * as THREE from '../vendor/three.module.js';
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

  // Boot items: 1 HDR + 3 textures + 3 lightweight core chassis (~2.7 MB total)
  const bootKeys = ['ferrari', 'bmwm5', 'muscle'];
  const progressItems = ['hdr', 'ao', 'carbonC', 'carbonN', ...bootKeys.map(k => `glb_${k}`)];
  const progressMap = Object.fromEntries(progressItems.map(id => [id, 0]));
  let lastLabel = 'Initializing 3D Showroom...';

  function emitProgress(id, frac, label = null) {
    if (id && id in progressMap) progressMap[id] = Math.max(progressMap[id], Math.min(1, frac));
    if (label) lastLabel = label;
    if (!onProgress) return;
    const sum = Object.values(progressMap).reduce((a, b) => a + b, 0);
    const pct = 0.06 + 0.94 * (sum / progressItems.length);
    onProgress(Math.min(1, pct), lastLabel);
  }

  if (onProgress) onProgress(0.06, 'Initializing 3D Showroom...');

  function withTimeout(promise, ms, fallback, onTimeout = null) {
    let timer = null;
    const timeoutPromise = new Promise(resolve => {
      timer = setTimeout(() => {
        if (onTimeout) onTimeout();
        resolve(fallback);
      }, ms);
    });
    return Promise.race([
      promise.then(val => {
        if (timer) clearTimeout(timer);
        return val;
      }),
      timeoutPromise
    ]);
  }

  function loadGLBKey(key, onStepLabel = null, progId = null) {
    if (modelsCache[key]) {
      if (progId) emitProgress(progId, 1);
      return Promise.resolve(modelsCache[key]);
    }
    if (failedLoads.has(key)) {
      if (progId) emitProgress(progId, 1);
      return Promise.resolve(null);
    }
    if (pendingLoads[key]) return pendingLoads[key];
    const url = MODEL_URLS[key];
    if (!url) {
      if (progId) emitProgress(progId, 1);
      return Promise.resolve(null);
    }

    pendingLoads[key] = new Promise(resolve => {
      gltfLoader.load(
        url,
        gltf => {
          modelsCache[key] = gltf ? gltf.scene : null;
          if (!modelsCache[key]) failedLoads.add(key);
          if (progId) emitProgress(progId, 1);
          if (onStepLabel) onStepLabel();
          resolve(modelsCache[key]);
        },
        xhr => {
          if (progId && xhr && xhr.lengthComputable && xhr.total > 0) {
            emitProgress(progId, 0.95 * (xhr.loaded / xhr.total), `Streaming ${key.toUpperCase()} 3D Model...`);
          }
        },
        err => {
          console.warn('GLB load warning:', url, err);
          failedLoads.add(key);
          if (progId) emitProgress(progId, 1);
          if (onStepLabel) onStepLabel();
          resolve(null);
        }
      );
    });
    return pendingLoads[key];
  }

  function loadHDR(url, label, progId) {
    return new Promise(resolve => {
      rgbeLoader.load(
        url,
        tex => {
          tex.mapping = THREE.EquirectangularReflectionMapping;
          emitProgress(progId, 1, label);
          resolve(tex);
        },
        xhr => {
          if (xhr && xhr.lengthComputable && xhr.total > 0) {
            emitProgress(progId, 0.95 * (xhr.loaded / xhr.total));
          }
        },
        () => {
          emitProgress(progId, 1, label);
          resolve(null);
        }
      );
    });
  }

  function loadTex(url, repeatX = 1, repeatY = 1, isColor = true, label = null, progId = null) {
    return new Promise(resolve => {
      texLoader.load(
        url,
        tex => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(repeatX, repeatY);
          tex.anisotropy = maxAniso;
          if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
          if (progId) emitProgress(progId, 1, label);
          resolve(tex);
        },
        undefined,
        () => {
          if (progId) emitProgress(progId, 1, label);
          resolve(null);
        }
      );
    });
  }

  const BOOT_TIMEOUT_MS = 12000;
  const [
    hdrMorning,
    ferrariAO,
    carbonColor,
    carbonNormal
  ] = await Promise.all([
    withTimeout(loadHDR('./assets/hdr/blouberg_sunrise_2_1k.hdr', 'Loaded Studio Reflection Map (.HDR)', 'hdr'), BOOT_TIMEOUT_MS, null, () => emitProgress('hdr', 1)),
    withTimeout(loadTex('./assets/textures/ferrari_ao.png', 1, 1, false, 'Loaded Chassis Contact Shadow Map', 'ao'), BOOT_TIMEOUT_MS, null, () => emitProgress('ao', 1)),
    withTimeout(loadTex('./assets/textures/Carbon.png', 12, 12, true, 'Loaded Carbon Fiber Weave Maps', 'carbonC'), BOOT_TIMEOUT_MS, null, () => emitProgress('carbonC', 1)),
    withTimeout(loadTex('./assets/textures/Carbon_Normal.png', 12, 12, false, null, 'carbonN'), BOOT_TIMEOUT_MS, null, () => emitProgress('carbonN', 1)),
    ...bootKeys.map(k =>
      withTimeout(
        loadGLBKey(k, () => emitProgress(`glb_${k}`, 1, `Loaded 3D ${k.toUpperCase()} Chassis (.GLB)`), `glb_${k}`),
        BOOT_TIMEOUT_MS,
        null,
        () => emitProgress(`glb_${k}`, 1)
      )
    )
  ]);

  // Load remaining .GLB models strictly on demand when selected in the showroom
  // so background Draco decoding never competes with rendering or car switching.
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
