import * as THREE from 'three';
import { sceneConfig } from '../config/sceneConfig.ts';
import { MODELS, PBR, loadPBRMaterial } from '../assets/AssetManager.ts';
import { groundObject, loadModel, loadModelNode, normalizeSize } from '../assets/ModelLoader.ts';

export interface RoomRefs {
  group: THREE.Group;
  /** Pozycja ognia w kominku (do światła + animacji). */
  firePosition: THREE.Vector3;
}

/**
 * Nocna komnata: modularny pokój (lepszy dla kamery i wydajności niż
 * gotowy model), PBR kamienia/tynku/posadzki/drewna, łukowy kominek,
 * kufer i świecznik w tle, szabla na ścianie, książki na półce.
 * Tylko tło dla stołu.
 */
export async function createRoom(): Promise<RoomRefs> {
  const { width, height, depth } = sceneConfig.room;
  const group = new THREE.Group();
  group.name = 'room';

  const [
    stoneNS,
    stoneEW,
    plasterNS,
    plasterEW,
    floorMat,
    beamMat,
    doorMat,
    ceilingMat,
    fireplaceStone,
  ] = await Promise.all([
    loadPBRMaterial(PBR.stoneWall, { repeat: [3, 1.1] }),
    loadPBRMaterial(PBR.stoneWall, { repeat: [2.4, 1.1], offset: [0.4, 0.2] }),
    loadPBRMaterial(PBR.plasterWall, { repeat: [3, 1.1], offset: [0.2, 0] }),
    loadPBRMaterial(PBR.plasterWall, { repeat: [2.4, 1.1], offset: [0.6, 0.35] }),
    loadPBRMaterial(PBR.stoneFloor, { repeat: [4, 3], color: 0x9d968c }),
    loadPBRMaterial(PBR.oldWood, { repeat: [2.5, 0.5], color: 0x8a715a }),
    loadPBRMaterial(PBR.oldWood, { repeat: [1, 1], offset: [0.3, 0.3], color: 0x9c8468 }),
    loadPBRMaterial(PBR.plasterWall, { repeat: [4, 3], color: 0x35302b }),
    loadPBRMaterial(PBR.stoneWall, { repeat: [0.45, 0.45], color: 0xb5aca0 }),
  ]);

  // Posadzka.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  group.add(floor);

  // Sufit.
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  // Ściany: kamień na N+E, zużyty tynk na S+W (ok. 60/40).
  const wallGeoX = new THREE.PlaneGeometry(width, height);
  const wallGeoZ = new THREE.PlaneGeometry(depth, height);
  const back = new THREE.Mesh(wallGeoX, stoneNS);
  back.position.set(0, height / 2, -depth / 2);
  back.receiveShadow = true;
  group.add(back);
  const right = new THREE.Mesh(wallGeoZ, stoneEW);
  right.position.set(width / 2, height / 2, 0);
  right.rotation.y = -Math.PI / 2;
  right.receiveShadow = true;
  group.add(right);
  const front = new THREE.Mesh(wallGeoX, plasterNS);
  front.position.set(0, height / 2, depth / 2);
  front.rotation.y = Math.PI;
  group.add(front);
  const left = new THREE.Mesh(wallGeoZ, plasterEW);
  left.position.set(-width / 2, height / 2, 0);
  left.rotation.y = Math.PI / 2;
  left.receiveShadow = true;
  group.add(left);

  // Belki stropowe + słupy.
  for (let i = -2; i <= 2; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, 0.22), beamMat);
    beam.position.set(0, height - 0.12, i * 1.5);
    group.add(beam);
  }
  for (const x of [-width / 2 + 0.18, width / 2 - 0.18]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, height, 0.24), beamMat);
    post.position.set(x, height / 2, -depth / 2 + 0.18);
    post.castShadow = true;
    group.add(post);
  }

  // Drzwi w ścianie południowej + okucia.
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f1d1b, roughness: 0.55, metalness: 0.85 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.25, 0.12), doorMat);
  door.position.set(-2.6, 1.12, depth / 2 - 0.08);
  door.castShadow = true;
  door.name = 'door';
  group.add(door);
  for (const y of [0.5, 1.15, 1.8]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.09, 0.03), ironMat);
    band.position.set(-2.6, y, depth / 2 - 0.15);
    group.add(band);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 8, 20), ironMat);
  ring.position.set(-2.25, 1.1, depth / 2 - 0.16);
  group.add(ring);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.16, 0.22), beamMat);
  lintel.position.set(-2.6, 2.32, depth / 2 - 0.08);
  lintel.castShadow = true;
  group.add(lintel);

  // Kominek: łukowy portal (extrude) + ciemne palenisko + belka + płyta.
  const fireX = -1.7;
  const portalShape = new THREE.Shape();
  portalShape.moveTo(-0.95, 0);
  portalShape.lineTo(-0.95, 1.6);
  portalShape.lineTo(0.95, 1.6);
  portalShape.lineTo(0.95, 0);
  portalShape.lineTo(0.62, 0);
  portalShape.lineTo(0.62, 0.55);
  portalShape.absarc(0, 0.55, 0.62, 0, Math.PI, false);
  portalShape.lineTo(-0.62, 0);
  portalShape.lineTo(-0.95, 0);
  const portalGeo = new THREE.ExtrudeGeometry(portalShape, { depth: 0.55, bevelEnabled: false });
  const portal = new THREE.Mesh(portalGeo, fireplaceStone);
  portal.position.set(fireX, 0, -depth / 2);
  portal.castShadow = true;
  portal.receiveShadow = true;
  portal.name = 'fireplace';
  group.add(portal);

  const fireboxMat = new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: 1 });
  const firebox = new THREE.Mesh(new THREE.BoxGeometry(1.24, 1.15, 0.5), fireboxMat);
  firebox.position.set(fireX, 0.57, -depth / 2 + 0.22);
  group.add(firebox);
  // Polana w palenisku.
  const logMat = new THREE.MeshStandardMaterial({ color: 0x201209, roughness: 1 });
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.7, 8), logMat);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i - 1) * 0.4;
    log.position.set(fireX + (i - 1) * 0.05, 0.12 + i * 0.045, -depth / 2 + 0.42);
    group.add(log);
  }
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0x2a0e02,
    emissive: 0xff4400,
    emissiveIntensity: 2.4,
    roughness: 1,
  });
  const embers = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), emberMat);
  embers.scale.set(1.5, 0.32, 0.8);
  embers.position.set(fireX, 0.1, -depth / 2 + 0.42);
  embers.name = 'embers';
  group.add(embers);
  const mantel = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.15, 0.72), beamMat);
  mantel.position.set(fireX, 1.68, -depth / 2 + 0.3);
  mantel.castShadow = true;
  group.add(mantel);
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 1.0), fireplaceStone);
  hearth.position.set(fireX, 0.03, -depth / 2 + 0.75);
  hearth.receiveShadow = true;
  group.add(hearth);

  const firePosition = new THREE.Vector3(fireX, 0.55, -depth / 2 + 0.5);

  // Kufer w tle obok kominka + mosiężny świecznik na nim.
  try {
    const crate = await loadModel(MODELS.crate);
    normalizeSize(crate, 0.78);
    groundObject(crate);
    crate.position.set(-3.25, 0, -3.1);
    crate.rotation.y = 0.55;
    crate.name = 'crate';
    group.add(crate);

    const holder = await loadModelNode(MODELS.candleholders, 'brass_candleholder_01');
    normalizeSize(holder, 0.3);
    groundObject(holder);
    holder.position.set(-3.25, 0.78, -3.1);
    holder.rotation.y = -0.4;
    holder.name = 'candleholder';
    group.add(holder);
  } catch (err) {
    console.warn('[room] pominięto kufer/świecznik:', err);
  }

  // Półka na wschodniej ścianie + stos 3 książek (leżą płasko — czytelne z każdej strony).
  const shelfX = width / 2 - 0.17; // deska styka się ze ścianą
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 1.9), beamMat);
  shelf.position.set(shelfX, 1.9, -1.2);
  shelf.castShadow = true;
  group.add(shelf);
  for (const dz of [-0.7, 0.7]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.06), ironMat);
    bracket.position.set(width / 2 - 0.13, 1.76, -1.2 + dz);
    group.add(bracket);
  }
  const layFlat = (obj: THREE.Object3D): void => {
    const dims = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    if (dims.y <= dims.x && dims.y <= dims.z) return;
    if (dims.x <= dims.z) obj.rotation.z = Math.PI / 2;
    else obj.rotation.x = Math.PI / 2;
  };
  try {
    const shelfBooks = ['book_encyclopedia_set_01_book02', 'book_encyclopedia_set_01_book03',
      'book_encyclopedia_set_01_book04'];
    for (const [i, nodeName] of shelfBooks.entries()) {
      const book = await loadModelNode(MODELS.bookSet, nodeName);
      normalizeSize(book, 0.27 - i * 0.02);
      layFlat(book);
      const holder = new THREE.Group();
      holder.add(book);
      groundObject(holder);
      holder.position.set(shelfX, 1.93 + i * 0.05, -1.2);
      holder.rotation.y = (i - 1) * 0.22;
      holder.name = `shelf-book-${i}`;
      group.add(holder);
    }
  } catch (err) {
    console.warn('[room] pominięto książki na półce:', err);
  }

  // Szabla na zachodniej ścianie (proceduralna, stal + mosiądz + skóra).
  group.add(createSaber(new THREE.Vector3(-width / 2 + 0.1, 1.9, 0.6)));

  return { group, firePosition };
}

/** Polska szabla — zakrzywiona głownia (extrude sylwetki), mosiężna rękojeść. */
function createSaber(pos: THREE.Vector3): THREE.Group {
  const saber = new THREE.Group();
  saber.name = 'saber';
  const steel = new THREE.MeshStandardMaterial({ color: 0xb9bec6, roughness: 0.32, metalness: 0.92 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x8a6b2f, roughness: 0.38, metalness: 0.9 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x3d2412, roughness: 0.85 });

  // Głownia: zakrzywiony, zwężający się pas (sylwetka w XY).
  const blade = new THREE.Shape();
  blade.moveTo(0, 0.019);
  blade.quadraticCurveTo(0.45, 0.075, 0.8, 0.315);
  blade.quadraticCurveTo(0.815, 0.328, 0.8, 0.3);
  blade.quadraticCurveTo(0.79, 0.278, 0.775, 0.272);
  blade.quadraticCurveTo(0.45, 0.032, 0, -0.019);
  blade.lineTo(0, 0.019);
  const bladeGeo = new THREE.ExtrudeGeometry(blade, { depth: 0.0045, bevelEnabled: false });
  const bladeMesh = new THREE.Mesh(bladeGeo, steel);
  bladeMesh.castShadow = true;
  saber.add(bladeMesh);
  // Jelce (prosty, lekko wygięty kabłąk).
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.009, 8, 18, Math.PI * 1.2), brass);
  guard.position.set(-0.01, 0, 0.002);
  guard.rotation.z = Math.PI * 0.9;
  guard.castShadow = true;
  saber.add(guard);
  // Rękojeść + głowica.
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.13, 10), leather);
  grip.rotation.z = Math.PI / 2 - 0.12;
  grip.position.set(-0.085, -0.008, 0.002);
  grip.castShadow = true;
  saber.add(grip);
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), brass);
  pommel.position.set(-0.155, -0.016, 0.002);
  saber.add(pommel);

  // Zawieszenie na ścianie: dwa kołki wbijane w ścianę (oś lokalna Z).
  const pegMat = new THREE.MeshStandardMaterial({ color: 0x2c1e10, roughness: 0.85 });
  for (const [px, py] of [[0.15, 0.03], [0.62, 0.19]] as Array<[number, number]>) {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8), pegMat);
    peg.rotation.x = Math.PI / 2;
    peg.position.set(px, py, -0.03);
    saber.add(peg);
  }
  saber.position.copy(pos);
  // Najpierw pochylenie w płaszczyźnie głowni (sztych w górę), potem na ścianę.
  saber.rotation.set(0, Math.PI / 2, 0.5);
  return saber;
}
