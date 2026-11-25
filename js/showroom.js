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
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x0b0f17, 0.65));
  const key = new THREE.SpotLight(0xffffff, 60, 24, Math.PI / 5, 0.55, 1.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
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
  floor.receiveShadow = true;
  scene.add(floor);

  const platGeo = new THREE.CylinderGeometry(3.1, 3.25, 0.22, 72);
  const platMat = new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.3, metalness: 0.75 });
  const topGeo = new THREE.CylinderGeometry(2.95, 2.95, 0.02, 72);
  const topMat = new THREE.MeshStandardMaterial({ color: 0x0f141d, roughness: 0.22, metalness: 0.6 });
  const ringGeo = new THREE.TorusGeometry(3.12, 0.035, 8, 96);

  let roster = [];
  let index = 0;
  let camX = 0;
  let drawerOpen = false;
  const slots = []; // { group, holder, ringMat, car, carId, building }

  let userSpinHold = 0;
  let dragging = false;
  let lastX = 0;

  function makeSlot(i) {
    const group = new THREE.Group();
    group.position.x = i * SPACING;
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.y = 0.11;
    plat.receiveShadow = true;
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.23;
    top.receiveShadow = true;
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    const holder = new THREE.Group();
    holder.position.y = 0.24;
    holder.rotation.y = -0.6 + i * 0.9;
    group.add(plat, top, ring, holder);
    scene.add(group);
    return { group, holder, ringMat, car: null, carId: null, building: false, isFocusBuild: false };
  }

  function clearSlotCar(slot) {
    if (slot.car) slot.holder.remove(slot.car);
    slot.car = null;
    slot.carId = null;
  }

  function buildSlotCar(i, force = false) {
    const slot = slots[i];
    const def = roster[i];
    if (!slot || !def) return;
    const focus = i === index;
    if (!force && slot.carId === def.id && slot.isFocusBuild === focus) return;

    const res = vehicles.buildCarModel(def, focus ? null : { paint: def.defaultColor });
    clearSlotCar(slot);
    slot.car = res.group;
    slot.carId = def.id;
    slot.isFocusBuild = focus;
    slot.holder.add(res.group);
    if (res.pending) {
      res.pending.then(() => {
        if (roster[i] && roster[i].id === def.id) buildSlotCar(i, true);
      });
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
      const near = Math.abs(i - index) <= 1;
      if (near) buildSlotCar(i);
      else if (Math.abs(i - index) > 2) clearSlotCar(slots[i]);
      slots[i].group.visible = Math.abs(i - index) <= 2;
    }
  }

  function setIndex(i) {
    if (!roster.length) return;
    index = (i + roster.length) % roster.length;
    syncVisibleCars();
  }

  // Rebuild the focused car with the latest paint/aero settings
  function refreshCurrent() {
    buildSlotCar(index, true);
  }

  function update(dt, t) {
    const targetX = index * SPACING;
    camX += (targetX - camX) * Math.min(1, dt * 5.5);
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
      s.ringMat.emissiveIntensity += ((focus ? 2.6 + Math.sin(t * 2.4) * 0.5 : 0.25) - s.ringMat.emissiveIntensity) * Math.min(1, dt * 6);
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
