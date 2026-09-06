import * as THREE from 'three';
import { sceneConfig } from '../config/sceneConfig.ts';
import { BOARD_MAP_URL, getPaperBump, loadTexture } from '../assets/AssetManager.ts';

export interface BoardMapRefs {
  /** Główny mesh planszy — nazwa `boardMap`, UV 0..1, gotowy na raycast. */
  boardMap: THREE.Mesh;
}

/**
 * Plansza = osobny Mesh (Box o małej grubości), żeby od początku:
 * - raycastować i czytać UV kliknięcia,
 * - przeliczać UV ↔ współrzędne planszy (BoardSystem),
 * - stawiać jednostki dokładnie nad mapą,
 * - dokładać warstwy danych.
 *
 * Krawędzie minimalnie uniesione (fala brzegowa + szum), środek płaski.
 */
export function createBoardMap(topY: number): BoardMapRefs {
  const { width, height, thickness, edgeLift } = sceneConfig.board;

  const geo = new THREE.BoxGeometry(width, thickness, height, 28, 1, 24);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  // Subtelne pofalowanie: pełne 0 w środku, narastające ku brzegom.
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (y <= 0) continue; // tylko wierzch
    const nx = Math.abs(x) / (width / 2); // 0..1
    const z = pos.getZ(i);
    const nz = Math.abs(z) / (height / 2);
    const edge = Math.pow(Math.max(nx, nz), 3);
    const wave =
      Math.sin(x * 5.1) * Math.cos(z * 4.3) * 0.5 + Math.sin(x * 11.7 + z * 7.9) * 0.5;
    pos.setY(i, y + edge * edgeLift * (0.7 + 0.3 * wave) + edgeLift * 0.06 * wave);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xf3e6c4,
    roughness: 0.94,
    metalness: 0,
    // Oddzielny, subtelny szum papieru — NIE skan mapy jako bump.
    bumpMap: getPaperBump(),
    bumpScale: 0.02,
  });

  const boardMap = new THREE.Mesh(geo, mat);
  boardMap.name = 'boardMap';
  boardMap.position.set(-0.15, topY + thickness / 2 + 0.001, 0.02);
  boardMap.rotation.y = -0.035; // lekki, naturalny obrót arkusza
  boardMap.castShadow = true;
  boardMap.receiveShadow = true;

  // Tekstura historycznej mapy na wierzch — ładujemy asynchronicznie,
  // żeby pierwszy kadr pojawił się od razu z kolorem papieru.
  loadTexture(BOARD_MAP_URL)
    .then((tex) => {
      mat.map = tex;
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
    })
    .catch((err) => {
      console.warn('[boardMap] nie udało się wczytać tekstury mapy:', err);
    });

  return { boardMap };
}
