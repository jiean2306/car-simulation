import * as THREE from 'three';

// 3D showroom: every car sits on its own turntable platform in a row.
// The camera glides between platforms; the focused car spins on its own.
const SPACING = 8.5;

export function createShowroom(assets, vehicles) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090d15);
  scene.fog = new THREE.Fog(0x090d15, 14, 42);
  if (assets.hdrs && assets.hdrs.morning) scene.environment = assets.hdrs.morning;

  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 120);

  // Lighting: soft fill + key light that follows the focused platform + coloured rim lights
  // Disable shadow-map casting in showroom (uses fast contact shadow map instead of 2nd geometry pass)
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x0b0f17, 0.72));
  const key = new THREE.SpotLight(0xffffff, 65, 24, Math.PI / 5, 0.55, 1.4);
  key.castShadow = false;
  scene.add(key, key.target);
  const rimL = new THREE.PointLight(0x38bdf8, 14, 12, 1.6);
  const rimR = new THREE.PointLight(0xf59e0b, 10, 12, 1.6);
  scene.add(rimL, rimR);

  // Glossy studio floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 80),
    new THREE.MeshStandardMaterial({ color: 0x121722, roughness: 0.38, metalness: 0.45 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const platGeo = new THREE.CylinderGeometry(3.1, 3.25, 0.22, 48);
  const platMat = new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.3, metalness: 0.75 });
  const topGeo = new THREE.CylinderGeometry(2.95, 2.95, 0.02, 48);
  const topMat = new THREE.MeshStandardMaterial({ color: 0x0f141d, roughness: 0.22, metalness: 0.6 });
  const ringGeo = new THREE.TorusGeometry(3.12, 0.035, 6, 56);

  let roster = [];
  let index = 0;
  let camX = 0;
  let drawerOpen = false;
  const slots = [];
  const modelCache = new Map(); // LRU cache of recently built showroom cars (max 5)

  let userSpinHold = 0;
  let dragging = false;
  let lastX = 0;

  function makeSlot(i) {
    const group = new THREE.Group();
    group.position.x = i * SPACING;
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.y = 0.11;
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.23;
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    const holder = new THREE.Group();
    holder.position.y = 0.24;
    holder.rotation.y = -0.6 + i * 0.9;
    group.add(plat, top, ring, holder);
    scene.add(group);
    return { group, holder, ringMat, car: null, carId: null, loading: false };
  }

  function clearSlotCar(slot) {
    if (slot.car) slot.holder.remove(slot.car);
    slot.car = null;
    slot.carId = null;
    slot.loading = false;
  }

  function getCachedOrBuildCar(def, force) {
    const cacheKey = def.id;
    if (!force && modelCache.has(cacheKey)) {
      const hit = modelCache.get(cacheKey);
      modelCache.delete(cacheKey);
      modelCache.set(cacheKey, hit);
      return { group: hit, pending: null };
    }
    const res = vehicles.buildCarModel(def, null, false);
    if (!res.pending) {
      modelCache.set(cacheKey, res.group);
      if (modelCache.size > 5) {
        const oldestKey = modelCache.keys().next().value;
        modelCache.delete(oldestKey);
      }
    }
    return res;
  }

  function buildSlotCar(i, force = false) {
    const slot = slots[i];
    const def = roster[i];
    if (!slot || !def) return;
    if (!force && slot.carId === def.id && !slot.loading) return;

    const res = getCachedOrBuildCar(def, force);
    clearSlotCar(slot);
    if (res.pending) {
      slot.loading = true;
      slot.carId = def.id;
      res.pending.then(loaded => {
        if (loaded && i === index && roster[i] && roster[i].id === def.id) {
          buildSlotCar(i, true);
        } else if (slot.carId === def.id) {
          slot.loading = false;
        }
      });
    } else {
      slot.car = res.group;
      slot.carId = def.id;
      slot.loading = false;
      slot.holder.add(res.group);
    }
  }

  function setRoster(list, startIndex = 0) {
    slots.forEach(s => scene.remove(s.group));
    slots.length = 0;
    roster = list.slice();
    for (let i = 0; i < roster.length; i++) slots.push(makeSlot(i));
    index = Math.max(0, Math.min(roster.length - 1, startIndex));
    camX = index * SPACING;
    syncVisibleCars();
  }

  function syncVisibleCars() {
    for (let i = 0; i < slots.length; i++) {
      if (i === index) buildSlotCar(i);
      else clearSlotCar(slots[i]);
      slots[i].group.visible = Math.abs(i - index) <= 1;
    }
  }

  function setIndex(i) {
    if (!roster.length) return;
    index = (i + roster.length) % roster.length;
    syncVisibleCars();
  }

  // Rebuild the focused car with the latest paint/aero settings
  function refreshCurrent() {
    const def = roster[index];
    if (def) modelCache.delete(def.id);
    buildSlotCar(index, true);
  }

  function update(dt, t) {
    const targetX = index * SPACING;
    camX += (targetX - camX) * Math.min(1, dt * 7.5);
    const lookShift = drawerOpen ? 1.7 : 0;
    camera.position.set(camX + lookShift + 0.6, 2.35, 9.6);
    camera.lookAt(camX + lookShift, 0.75, 0);

    key.position.set(camX + 1.5, 9, 3.5);
    key.target.position.set(camX, 0, 0);
    rimL.position.set(camX - 4.5, 1.6, -2.5);
    rimR.position.set(camX + 4.5, 1.4, -2.5);

    userSpinHold = Math.max(0, userSpinHold - dt);
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.group.visible) continue;
      const focus = i === index;
      const targetEmissive = focus
        ? (s.loading ? 1.8 + Math.sin(t * 8.0) * 1.4 : 2.6 + Math.sin(t * 2.4) * 0.5)
        : 0.25;
      s.ringMat.emissiveIntensity += (targetEmissive - s.ringMat.emissiveIntensity) * Math.min(1, dt * 8);
      if (!(focus && userSpinHold > 0)) s.holder.rotation.y += dt * (focus ? 0.42 : 0.18);
    }
  }

  function onPointerDown(x) { dragging = true; lastX = x; }
  function onPointerMove(x) {
    if (!dragging || !slots[index]) return;
    slots[index].holder.rotation.y += (x - lastX) * 0.012;
    lastX = x;
    userSpinHold = 2.5;
  }
  function onPointerUp() { dragging = false; }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  return {
    scene,
    camera,
    setRoster,
    setIndex,
    getIndex: () => index,
    refreshCurrent,
    update,
    resize,
    setDrawerOpen: v => { drawerOpen = v; },
    onPointerDown,
    onPointerMove,
    onPointerUp
  };
}
