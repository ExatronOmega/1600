import * as THREE from 'three';
import { sceneConfig } from '../config/sceneConfig.ts';
import { makeWoodTexture } from '../assets/AssetManager.ts';

export interface TableRefs {
  group: THREE.Group;
  /** Wysokość górnej powierzchni blatu (Y). */
  topY: number;
}

/**
 * Ciężki dębowy stół. Placeholder z brył — sygnatura pozwala
 * podmienić wnętrze na model GLTF bez zmian w reszcie aplikacji.
 */
export function createTable(): TableRefs {
  const { length, width, height, topThickness } = sceneConfig.table;
  const group = new THREE.Group();
  group.name = 'table';

  const wood = makeWoodTexture();
  wood.repeat.set(2, 1);
  const topMat = new THREE.MeshStandardMaterial({
    map: wood,
    color: 0xb99f78,
    roughness: 0.78,
    metalness: 0.04,
  });
  const legMat = new THREE.MeshStandardMaterial({
    map: wood,
    color: 0x8a7154,
    roughness: 0.85,
    metalness: 0.02,
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(length, topThickness, width), topMat);
  top.position.y = height - topThickness / 2;
  top.castShadow = true;
  top.receiveShadow = true;
  top.name = 'tableTop';
  group.add(top);

  // Masywne nogi + poprzeczki.
  const legGeo = new THREE.BoxGeometry(0.16, height - topThickness, 0.16);
  const lx = length / 2 - 0.25;
  const lz = width / 2 - 0.25;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(sx * lx, (height - topThickness) / 2, sz * lz);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    }
  }
  const stretcherLong = new THREE.BoxGeometry(length - 0.5, 0.1, 0.08);
  for (const sz of [-1, 1]) {
    const s = new THREE.Mesh(stretcherLong, legMat);
    s.position.set(0, 0.22, sz * lz);
    s.castShadow = true;
    group.add(s);
  }
  const stretcherCross = new THREE.BoxGeometry(0.08, 0.1, width - 0.5);
  const sc = new THREE.Mesh(stretcherCross, legMat);
  sc.position.set(0, 0.22, 0);
  group.add(sc);

  return { group, topY: height };
}
