import * as THREE from 'three';
import { sceneConfig } from '../config/sceneConfig.ts';
import { makeStoneTexture } from '../assets/AssetManager.ts';

export interface RoomRefs {
  group: THREE.Group;
  /** Pozycja ognia w kominku (do światła + animacji). */
  firePosition: THREE.Vector3;
}

/**
 * Nocna komnata zamku: kamienne ściany, belki, podłoga, kominek,
 * ciężkie drzwi, skrzynia i półka w tle. Tylko tło dla stołu.
 */
export function createRoom(): RoomRefs {
  const { width, height, depth } = sceneConfig.room;
  const group = new THREE.Group();
  group.name = 'room';

  const stone = makeStoneTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    map: stone,
    color: 0x9a917f,
    roughness: 0.95,
    metalness: 0,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    color: sceneConfig.room.floorColor,
    roughness: 0.9,
    metalness: 0.02,
  });
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x2c1e10,
    roughness: 0.85,
    metalness: 0,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x3a2812,
    roughness: 0.8,
    metalness: 0.05,
  });

  // Podłoga.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  group.add(floor);

  // Sufit (ciemny, ledwo widoczny).
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ color: 0x171310, roughness: 1 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  // Ściany.
  const wallGeoX = new THREE.PlaneGeometry(width, height);
  const wallGeoZ = new THREE.PlaneGeometry(depth, height);

  const back = new THREE.Mesh(wallGeoX, wallMat); // północ, z kominkiem
  back.position.set(0, height / 2, -depth / 2);
  back.receiveShadow = true;
  group.add(back);

  const front = new THREE.Mesh(wallGeoX, wallMat);
  front.position.set(0, height / 2, depth / 2);
  front.rotation.y = Math.PI;
  group.add(front);

  const left = new THREE.Mesh(wallGeoZ, wallMat);
  left.position.set(-width / 2, height / 2, 0);
  left.rotation.y = Math.PI / 2;
  left.receiveShadow = true;
  group.add(left);

  const right = new THREE.Mesh(wallGeoZ, wallMat);
  right.position.set(width / 2, height / 2, 0);
  right.rotation.y = -Math.PI / 2;
  group.add(right);

  // Belki stropowe.
  for (let i = -2; i <= 2; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.16, 0.2), beamMat);
    beam.position.set(0, height - 0.1, i * 1.5);
    group.add(beam);
  }
  // Słupy przy ścianach.
  for (const x of [-width / 2 + 0.15, width / 2 - 0.15]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, height, 0.22), beamMat);
    post.position.set(x, height / 2, -depth / 2 + 0.15);
    group.add(post);
  }

  // Drzwi w ścianie południowej (za startową kamerą, proste i ciężkie).
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.12), doorMat);
  door.position.set(-2.6, 1.1, depth / 2 - 0.08);
  door.castShadow = true;
  door.name = 'door';
  group.add(door);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.2), beamMat);
  doorFrame.position.set(-2.6, 2.27, depth / 2 - 0.08);
  group.add(doorFrame);

  // Skrzynia + półka w tle (wschodnia ściana).
  const chest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.55), doorMat);
  chest.position.set(width / 2 - 0.7, 0.28, 1.6);
  chest.castShadow = true;
  chest.receiveShadow = true;
  group.add(chest);
  const chestLid = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.1, 0.59), beamMat);
  chestLid.position.set(width / 2 - 0.7, 0.6, 1.6);
  chestLid.castShadow = true;
  group.add(chestLid);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.6), beamMat);
  shelf.position.set(width / 2 - 0.25, 1.9, -1.2);
  group.add(shelf);
  // Kilka glinianych naczyń / ksiąg jako proste bryły.
  const potMat = new THREE.MeshStandardMaterial({ color: 0x5c4632, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.22, 10), potMat);
    pot.position.set(width / 2 - 0.25, 2.04, -1.8 + i * 0.4);
    pot.castShadow = true;
    group.add(pot);
  }

  // Kominek w ścianie północnej (lekko na zachód od środka,
  // żeby był widoczny w domyślnym kadrze w tle).
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0x3d3831, roughness: 0.95 });
  const firePos = new THREE.Vector3(-1.7, 0.45, -depth / 2 + 0.45);
  const firebox = new THREE.Group();
  firebox.position.copy(firePos);
  const opening = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 0.7), stoneDark);
  opening.position.y = 0.1;
  firebox.add(opening);
  const mantel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.85), beamMat);
  mantel.position.y = 0.68;
  mantel.castShadow = true;
  firebox.add(mantel);
  // Palenisko: polana + żar.
  const logMat = new THREE.MeshStandardMaterial({ color: 0x1f130a, roughness: 1 });
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 8), logMat);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i - 1) * 0.35;
    log.position.set(0, -0.22 + i * 0.05, (i - 1) * 0.08);
    firebox.add(log);
  }
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0x2a0e02,
    emissive: 0xff4400,
    emissiveIntensity: 2.2,
    roughness: 1,
  });
  const embers = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), emberMat);
  embers.scale.set(1.4, 0.35, 0.8);
  embers.position.y = -0.2;
  embers.name = 'embers';
  firebox.add(embers);
  group.add(firebox);

  return { group, firePosition: new THREE.Vector3(firePos.x, 0.55, firePos.z + 0.2) };
}
