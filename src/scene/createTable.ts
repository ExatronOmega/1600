import * as THREE from 'three';
import { sceneConfig } from '../config/sceneConfig.ts';
import { PBR, getOakTopTexture, getPaperBump, loadPBRMaterial } from '../assets/AssetManager.ts';

export interface TableRefs {
  group: THREE.Group;
  /** Wysokość górnej powierzchni blatu (Y). */
  topY: number;
}

/**
 * Ciężki dębowy stół: blat z PBR starego drewna, toczone nogi
 * (LatheGeometry), fartuch i poprzeczki. Sygnatura stabilna —
 * wnętrze można podmienić na GLTF bez zmian w reszcie aplikacji.
 */
export async function createTable(): Promise<TableRefs> {
  const { length, width, height, topThickness } = sceneConfig.table;
  const group = new THREE.Group();
  group.name = 'table';

  // Blat: proceduralny dąb (tekstura drzwi z gwoździami nie nadaje się na blat).
  const topMat = new THREE.MeshStandardMaterial({
    map: getOakTopTexture(),
    bumpMap: getPaperBump(),
    bumpScale: 0.015,
    roughness: 0.72,
    metalness: 0.02,
  });
  const [legMat, darkWood] = await Promise.all([
    loadPBRMaterial(PBR.oldWood, { repeat: [0.7, 0.7], offset: [0.35, 0.12], color: 0xa8906e }),
    loadPBRMaterial(PBR.oldWood, { repeat: [1.6, 0.35], offset: [0.1, 0.55], color: 0x8f765c }),
  ]);

  const solid = (m: THREE.Mesh) => {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  // Blat.
  const top = new THREE.Mesh(new THREE.BoxGeometry(length, topThickness, width), topMat);
  top.position.y = height - topThickness / 2;
  top.name = 'tableTop';
  solid(top);
  // Wzmocnienie krawędzi blatu (listwa).
  const rimLong = new THREE.BoxGeometry(length + 0.04, 0.045, 0.05);
  for (const sz of [-1, 1]) {
    const rim = new THREE.Mesh(rimLong, darkWood);
    rim.position.set(0, height - topThickness - 0.01, sz * (width / 2 - 0.02));
    solid(rim);
  }

  // Fartuch pod blatem.
  const apronY = height - topThickness - 0.07;
  const apronLong = new THREE.BoxGeometry(length - 0.5, 0.13, 0.06);
  for (const sz of [-1, 1]) {
    const a = new THREE.Mesh(apronLong, darkWood);
    a.position.set(0, apronY, sz * (width / 2 - 0.22));
    solid(a);
  }
  const apronCross = new THREE.BoxGeometry(0.06, 0.13, width - 0.5);
  for (const sx of [-1, 1]) {
    const a = new THREE.Mesh(apronCross, darkWood);
    a.position.set(sx * (length / 2 - 0.22), apronY, 0);
    solid(a);
  }

  // Toczone nogi.
  const legH = height - topThickness;
  const profile: Array<[number, number]> = [
    [0.052, 0.0],
    [0.052, 0.03],
    [0.038, 0.07],
    [0.034, 0.16],
    [0.058, 0.24],
    [0.066, 0.3],
    [0.05, 0.36],
    [0.036, 0.4],
    [0.034, 0.5],
    [0.052, 0.56],
    [0.055, 0.62],
    [0.055, legH],
  ].map(([r, y]) => [r, y] as [number, number]);
  const legGeo = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    14,
  );
  const lx = length / 2 - 0.28;
  const lz = width / 2 - 0.28;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(sx * lx, 0, sz * lz);
      solid(leg);
    }
  }

  // Poprzeczki (H).
  const stretcherY = 0.2;
  const sLong = new THREE.BoxGeometry(length - 0.56, 0.09, 0.07);
  for (const sz of [-1, 1]) {
    const s = new THREE.Mesh(sLong, darkWood);
    s.position.set(0, stretcherY, sz * lz);
    solid(s);
  }
  const sCross = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, width - 0.56), darkWood);
  sCross.position.set(0, stretcherY, 0);
  solid(sCross);

  return { group, topY: height };
}
