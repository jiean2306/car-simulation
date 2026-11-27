import * as THREE from '../vendor/three.module.js';

// 3D showroom: virtualized 3-platform turntable pool so even 120+ cars cause zero lag.
// Only the centered platform mounts the active 3D car; side platforms frame the view.
const SPACING = 7.6;
// Canonical vehicles face -Z while the showroom camera sits on +Z, so π - 0.62 frames the front-left 3/4 hero angle.
const HERO_ROT_Y = Math.PI - 0.62;

export function createShowroom(assets, vehicles) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090d15);
  scene.fog = new THREE.Fog(0x090d15, 14, 42);
  if (assets.hdrs && assets.hdrs.morning) scene.environment = assets.hdrs.morning;

  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 120);

  // Soft studio fill + key light tracking focused platform + rim accents (no showroom shadow-map pass)
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x0b0f17, 0.72));
  const key = new THREE.SpotLight(0xffffff, 65, 24, Math.PI / 5, 0.55, 1.4);
  key.castShadow = false;
  scene.add(key, key.target);
  const rimL = new THREE.PointLight(0x38bdf8, 14, 12, 1.6);
  const rimR = new THREE.PointLight(0xf59e0b, 10, 12, 1.6);
  scene.add(rimL, rimR);

  // Glossy studio floor (covers arbitrary roster length when virtualized around camX)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 80),
    new THREE.MeshStandardMaterial({ color: 0x121722, roughness: 0.38, metalness: 0.45 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const platGeo = new THREE.CylinderGeometry(2.75, 2.90, 0.22, 48);
  const platMat = new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.3, metalness: 0.75 });
  const topGeo = new THREE.CylinderGeometry(2.62, 2.62, 0.02, 48);
  const topMat = new THREE.MeshStandardMaterial({ color: 0x0f141d, roughness: 0.22, metalness: 0.6 });
  const ringGeo = new THREE.TorusGeometry(2.78, 0.035, 6, 56);

  let roster = [];
  let index = 0;
  let camX = 0;
  let drawerOpen = false;
  let pendingHeroCarId = null;
  const modelCache = new Map(); // LRU cache of recently built showroom cars (max 4)

  let userSpinHold = 0;
  let arrivalHold = 1.2;
  let dragging = false;
  let lastX = 0;

  function makeSlot() {
    const group = new THREE.Group();
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
    holder.rotation.y = HERO_ROT_Y;
    group.add(plat, top, ring, holder);
    scene.add(group);
    return { group, holder, ringMat, car: null, carId: null, loading: false };
  }

  // Fixed pool of 3 turntables: pool[0] = prev, pool[1] = active center, pool[2] = next
  const pool = [makeSlot(), makeSlot(), makeSlot()];

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
      if (modelCache.size > 4) {
        const oldestKey = modelCache.keys().next().value;
        modelCache.delete(oldestKey);
      }
    }
    return res;
  }

  function buildCenterCar(force = false) {
    const slot = pool[1];
    const def = roster[index];
    if (!slot || !def) return;
    if (!force && slot.carId === def.id && !slot.loading) return;

    const changedCar = slot.carId !== def.id;
    const snapHeroOnArrival = pendingHeroCarId === def.id && !slot.car && userSpinHold <= 0;
    const res = getCachedOrBuildCar(def, force);
    clearSlotCar(slot);
    if (changedCar || snapHeroOnArrival) {
      slot.holder.rotation.y = HERO_ROT_Y;
      arrivalHold = 1.2;
    }

    if (res.pending) {
      slot.loading = true;
      slot.carId = def.id;
      if (changedCar) pendingHeroCarId = def.id;
      const targetIndex = index;
      res.pending.then(loaded => {
        if (loaded && targetIndex === index && roster[index] && roster[index].id === def.id) {
          buildCenterCar(true);
        } else if (slot.carId === def.id) {
          slot.loading = false;
        }
      });
    } else {
      slot.car = res.group;
      slot.carId = def.id;
      slot.loading = false;
      if (pendingHeroCarId === def.id) pendingHeroCarId = null;
      if (changedCar || snapHeroOnArrival) {
        slot.holder.rotation.y = HERO_ROT_Y;
        arrivalHold = 1.2;
      }
      slot.holder.add(res.group);
    }
  }

  function syncVisibleCars() {
    if (!roster.length) {
      pool.forEach(s => {
        clearSlotCar(s);
        s.group.visible = false;
      });
      return;
    }

    pool[0].group.position.x = (index - 1) * SPACING;
    pool[0].group.visible = index > 0;
    clearSlotCar(pool[0]);

    pool[1].group.position.x = index * SPACING;
    pool[1].group.visible = true;
    buildCenterCar(false);

    pool[2].group.position.x = (index + 1) * SPACING;
    pool[2].group.visible = index < roster.length - 1;
    clearSlotCar(pool[2]);
  }

  function setRoster(list, startIndex = 0) {
    roster = list.slice();
    index = Math.max(0, Math.min(roster.length - 1, startIndex));
    camX = index * SPACING;
    syncVisibleCars();
  }

  function setIndex(i) {
    if (!roster.length) return;
    index = (i + roster.length) % roster.length;
    const targetX = index * SPACING;
    if (Math.abs(targetX - camX) > SPACING * 2.5) {
      camX = targetX - Math.sign(targetX - camX) * SPACING * 1.5;
    }
    syncVisibleCars();
  }

  // Rebuild the focused car with the latest paint/aero settings
  function refreshCurrent() {
    const def = roster[index];
    if (def) modelCache.delete(def.id);
    buildCenterCar(true);
  }

  function update(dt, t) {
    const targetX = index * SPACING;
    camX += (targetX - camX) * Math.min(1, dt * 7.5);
    floor.position.x = camX;

    const lookShift = drawerOpen ? 1.45 : 0;
    camera.position.set(camX + lookShift + 0.55, 1.92, 7.5);
    camera.lookAt(camX + lookShift, 0.68, 0);

    key.position.set(camX + 1.5, 9, 3.5);
    key.target.position.set(camX, 0, 0);
    rimL.position.set(camX - 4.5, 1.6, -2.5);
    rimR.position.set(camX + 4.5, 1.4, -2.5);

    userSpinHold = Math.max(0, userSpinHold - dt);
    arrivalHold = Math.max(0, arrivalHold - dt);
    const center = pool[1];
    const targetEmissive = center.loading
      ? 1.8 + Math.sin(t * 8.0) * 1.4
      : 2.2 + Math.sin(t * 2.4) * 0.45;
    center.ringMat.emissiveIntensity += (targetEmissive - center.ringMat.emissiveIntensity) * Math.min(1, dt * 8);
    pool[0].ringMat.emissiveIntensity = 0.15;
    pool[2].ringMat.emissiveIntensity = 0.15;

    if (!center.loading && userSpinHold <= 0 && arrivalHold <= 0) center.holder.rotation.y += dt * 0.18;
  }

  let activePointerId = null;
  function onPointerDown(xOrEvent, pointerId) {
    const x = typeof xOrEvent === 'number' ? xOrEvent : xOrEvent.clientX;
    const pid = pointerId !== undefined ? pointerId : (typeof xOrEvent === 'object' && xOrEvent ? xOrEvent.pointerId : null);
    dragging = true;
    activePointerId = pid != null ? pid : null;
    lastX = x;
  }
  function onPointerMove(xOrEvent, pointerId) {
    if (!dragging || !pool[1]) return;
    const pid = pointerId !== undefined ? pointerId : (typeof xOrEvent === 'object' && xOrEvent ? xOrEvent.pointerId : null);
    if (activePointerId !== null && pid != null && pid !== activePointerId) return;
    const x = typeof xOrEvent === 'number' ? xOrEvent : xOrEvent.clientX;
    pool[1].holder.rotation.y += (x - lastX) * 0.012;
    lastX = x;
    userSpinHold = 2.5;
  }
  function onPointerUp(eOrId) {
    const pid = typeof eOrId === 'object' && eOrId ? eOrId.pointerId : eOrId;
    if (activePointerId !== null && pid != null && pid !== activePointerId) return;
    dragging = false;
    activePointerId = null;
  }

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
