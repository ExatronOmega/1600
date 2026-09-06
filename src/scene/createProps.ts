import * as THREE from 'three';
import { MODELS, makeFlameSprite } from '../assets/AssetManager.ts';
import { groundObject, loadModelNode, normalizeSize } from '../assets/ModelLoader.ts';

/**
 * Minimalizm na stole: mapa + 1 książka + kałamarz/pióro + świeca + docisk.
 * Środek i większość mapy wolne pod przyszłe karty/pionki/kości.
 */
export async function createProps(topY: number): Promise<THREE.Group> {
  const group = new THREE.Group();
  group.name = 'props';

  const brass = new THREE.MeshStandardMaterial({ color: 0x8a6b2f, roughness: 0.35, metalness: 0.9 });
  const glassInk = new THREE.MeshStandardMaterial({ color: 0x0d0f14, roughness: 0.12, metalness: 0.15 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xd9c9a3, roughness: 0.95 });

  const put = (m: THREE.Object3D, x: number, z: number, yOff = 0) => {
    m.position.x += x;
    m.position.z += z;
    m.position.y += topY + yOff;
    m.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    group.add(m);
    return m;
  };

  // 1. Mosiężny docisk — na zachodniej krawędzi arkusza (trzyma papier).
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.05, 16), brass);
  weight.position.y = 0.025;
  put(weight, -1.08, -0.6);

  // 2. Kałamarz + gęsie pióro — wolny pas na wschód od mapy.
  const inkwell = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.09, 12), glassInk);
  inkwell.position.y = 0.045;
  put(inkwell, 1.32, -0.7);
  const quillShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.34, 6), paperMat);
  quillShaft.rotation.z = 1.1;
  quillShaft.rotation.y = 0.5;
  quillShaft.position.y = 0.05;
  put(quillShaft, 1.18, -0.6);
  const feather = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.16, 6), paperMat);
  feather.rotation.z = -0.7;
  feather.position.y = 0.12;
  put(feather, 1.08, -0.55);

  // 3. Jedna książka ze zbioru (GLB) — leży płasko na wschodnim pasie stołu.
  try {
    const book = await loadModelNode(MODELS.bookSet, 'book_encyclopedia_set_01_book01');
    normalizeSize(book, 0.26);
    // Połóż na płasko: najmniejszy wymiar bboxa ma być osią Y.
    const dims = new THREE.Box3().setFromObject(book).getSize(new THREE.Vector3());
    if (dims.y <= dims.x && dims.y <= dims.z) {
      // już płaska — nic nie rób
    } else if (dims.x <= dims.z) {
      book.rotation.z = Math.PI / 2;
    } else {
      book.rotation.x = Math.PI / 2;
    }
    const flat = new THREE.Group();
    flat.add(book);
    groundObject(flat);
    flat.rotation.y = 0.35;
    flat.name = 'table-book';
    put(flat, 1.27, 0.05);
  } catch (err) {
    console.warn('[props] pominięto książkę na stole:', err);
  }

  // 4. Mała świeca stołowa (sprite, bez własnego światła).
  const tableCandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.03, 0.14, 10),
    new THREE.MeshStandardMaterial({ color: 0xe2d4ae, roughness: 0.55 }),
  );
  tableCandle.position.y = 0.07;
  put(tableCandle, -1.42, -0.78);
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.015, 14), brass);
  holder.position.y = 0.008;
  put(holder, -1.42, -0.78);
  const tableFlame = makeFlameSprite(0.07);
  tableFlame.position.y = 0.17;
  tableFlame.name = 'table-flame';
  put(tableFlame, -1.42, -0.78);

  return group;
}
