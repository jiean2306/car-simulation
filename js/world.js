import * as THREE from 'three';

export const NUM_BLOCKS = 12;
export const BLOCK_LEN = 200;
export const LOOP_LEN = NUM_BLOCKS * BLOCK_LEN; // 2,400m loop
export const STREAM_RADIUS = 380;

export const DISTRICTS = [
  { name: 'Sector 1 · Straightaway', color: '#38bdf8', start: 0, end: 3 },
  { name: 'Sector 2 · Boulevard',    color: '#4ade80', start: 3, end: 6 },
  { name: 'Sector 3 · Speed Trap',   color: '#f59e0b', start: 6, end: 9 },
  { name: 'Sector 4 · Final Mile',   color: '#a855f7', start: 9, end: 12 }
];

export function mod(n, m) { return ((n % m) + m) % m; }
export function wrapDelta(toS, fromS) {
  let d = mod(toS - fromS, LOOP_LEN);
  if (d > LOOP_LEN * 0.5) d -= LOOP_LEN;
  return d;
}

function createCleanRoadTexture(maxAniso) {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d');

  // Smooth dark asphalt base
  ctx.fillStyle = '#232933';
  ctx.fillRect(0, 0, s, s);

  // Subtle longitudinal lane shading
  [0.125, 0.375, 0.625, 0.875].forEach(frac => {
    const g = ctx.createLinearGradient(s * frac - 30, 0, s * frac + 30, 0);
    g.addColorStop(0, 'rgba(15,18,24,0)');
    g.addColorStop(0.5, 'rgba(15,18,24,0.32)');
    g.addColorStop(1, 'rgba(15,18,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(s * frac - 30, 0, 60, s);
  });

  // Outer white boundary lines
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(10, 0, 6, s);
  ctx.fillRect(s - 16, 0, 6, s);

  // Dashed lane dividers
  for (let y = 16; y < s; y += 64) {
    ctx.fillRect(s * 0.25 - 3, y, 6, 32);
    ctx.fillRect(s * 0.75 - 3, y, 6, 32);
  }

  // Double yellow median line
  ctx.fillStyle = '#eab308';
  ctx.fillRect(s * 0.487, 0, 5, s);
  ctx.fillRect(s * 0.513 - 5, 0, 5, s);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 12);
  tex.anisotropy = maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createHighwayWorld(scene, renderer) {
  const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  // Lightweight shared materials & geometries for locked 60 FPS performance
  const matRoad = new THREE.MeshStandardMaterial({
    map: createCleanRoadTexture(maxAniso),
    roughness: 0.78,
    metalness: 0.04,
    envMapIntensity: 0.35
  });

  const matShoulder = new THREE.MeshStandardMaterial({
    color: 0x333c4a,
    roughness: 0.85,
    metalness: 0.05
  });

  const matGrass = new THREE.MeshStandardMaterial({
    color: 0x28382c,
    roughness: 0.92,
    metalness: 0.0
  });

  const matRail = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.4,
    metalness: 0.7,
    envMapIntensity: 0.6
  });

  const matPost = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.4
  });

  const matBuildingA = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.2, envMapIntensity: 0.3 });
  const matBuildingB = new THREE.MeshStandardMaterial({ color: 0x273549, roughness: 0.55, metalness: 0.25, envMapIntensity: 0.3 });
  const matTreeLeaf = new THREE.MeshStandardMaterial({ color: 0x2d5a3c, roughness: 0.8 });
  const matTreeTrunk = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });

  // Shared Geometries
  const roadGeo = new THREE.PlaneGeometry(18, BLOCK_LEN + 0.3);
  roadGeo.rotateX(-Math.PI / 2);

  const shoulderGeo = new THREE.BoxGeometry(5.0, 0.18, BLOCK_LEN + 0.2);
  const railGeo = new THREE.BoxGeometry(0.16, 0.32, BLOCK_LEN + 0.2);
  const apronGeo = new THREE.PlaneGeometry(180, BLOCK_LEN + 0.4);
  apronGeo.rotateX(-Math.PI / 2);

  const lampPoleGeo = new THREE.CylinderGeometry(0.09, 0.12, 6.2, 6);
  const lampArmGeo = new THREE.BoxGeometry(1.8, 0.1, 0.12);
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 2.6, 6);
  const crownGeo = new THREE.DodecahedronGeometry(1.75, 1);
  const bldgGeoA = new THREE.BoxGeometry(20, 36, 26);
  const bldgGeoB = new THREE.BoxGeometry(18, 48, 22);

  const blockChunks = [];
  const checkpointGates = [];

  for (let i = 0; i < NUM_BLOCKS; i++) {
    const g = new THREE.Group();

    const road = new THREE.Mesh(roadGeo, matRoad);
    road.receiveShadow = true;
    g.add(road);

    const apron = new THREE.Mesh(apronGeo, matGrass);
    apron.position.y = -0.04;
    g.add(apron);

    [-1, 1].forEach(side => {
      const sh = new THREE.Mesh(shoulderGeo, matShoulder);
      sh.position.set(side * 11.5, 0.09, 0);
      g.add(sh);

      const rail = new THREE.Mesh(railGeo, matRail);
      rail.position.set(side * 9.15, 0.52, 0);
      g.add(rail);

      for (let z = -75; z <= 75; z += 50) {
        const pole = new THREE.Mesh(lampPoleGeo, matPost);
        pole.position.set(side * 9.8, 3.1, z);
        const arm = new THREE.Mesh(lampArmGeo, matPost);
        arm.position.set(side * 9.0, 6.15, z);
        g.add(pole, arm);

        const trunk = new THREE.Mesh(trunkGeo, matTreeTrunk);
        trunk.position.set(side * 13.5, 1.3, z + 22);
        const crown = new THREE.Mesh(crownGeo, matTreeLeaf);
        crown.position.set(side * 13.5, 3.4, z + 22);
        g.add(trunk, crown);
      }

      // Clean low-poly background skyline silhouettes so focus stays 100% on the car
      const b1 = new THREE.Mesh(bldgGeoA, i % 2 === 0 ? matBuildingA : matBuildingB);
      b1.position.set(side * 34, 18, -45);
      const b2 = new THREE.Mesh(bldgGeoB, i % 2 === 0 ? matBuildingB : matBuildingA);
      b2.position.set(side * 36, 24, 45);
      g.add(b1, b2);
    });

    if (i % 3 === 0) {
      const dist = DISTRICTS[Math.floor(i / 3)];
      checkpointGates.push({
        blockIdx: i,
        s: i * BLOCK_LEN + BLOCK_LEN * 0.5,
        name: dist.name,
        color: dist.color
      });
    }

    g.visible = false;
    scene.add(g);
    blockChunks.push({ group: g, centerS: i * BLOCK_LEN + BLOCK_LEN * 0.5 });
  }

  function updateWorld(playerS) {
    for (let i = 0; i < blockChunks.length; i++) {
      const ch = blockChunks[i];
      const dz = wrapDelta(ch.centerS, playerS);
      ch.group.visible = Math.abs(dz) <= STREAM_RADIUS;
      if (ch.group.visible) {
        ch.group.position.z = -dz;
      }
    }
  }

  return {
    blockChunks,
    checkpointGates,
    updateWorld
  };
}
