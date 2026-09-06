import * as THREE from 'three';
import { sceneConfig } from '../config/sceneConfig.ts';

export interface LightingRefs {
  group: THREE.Group;
  /** Główne światło stołu (spot z kandelabru, rzuca cień). */
  chandelierSpot: THREE.SpotLight;
  /** Wypełnienie kandelabru (point, bez cienia). */
  chandelierFill: THREE.PointLight;
  /** Światło kominka (point, flicker, bez cienia). */
  fireLight: THREE.PointLight;
  /** Płomienie świec do animacji (emissive). */
  candleFlames: THREE.Mesh[];
  /** Żar w kominku do animacji. */
  embers: THREE.Mesh | null;
}

/**
 * Noc: półmrok + ciepłe świece nad mapą + pomarańczowy kominek.
 * Koszt: tylko 1 shadow-casting light (spot kandelabru).
 */
export function createLighting(firePosition: THREE.Vector3): LightingRefs {
  const group = new THREE.Group();
  group.name = 'lighting';
  const cfg = sceneConfig.lights;

  // Bardzo słabe otoczenie, żeby czerń nie traciła geometrii.
  const hemi = new THREE.HemisphereLight(0x2a3348, 0x1a120c, 0.35);
  group.add(hemi);

  // Kandelabr — wizualnie 6 świec, fizycznie 2 światła.
  const chandelier = new THREE.Group();
  chandelier.position.set(cfg.chandelierPosition.x, cfg.chandelierPosition.y, cfg.chandelierPosition.z);
  chandelier.rotation.y = 0.4; // niesymetrycznie, naturalnie
  chandelier.name = 'chandelier';

  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 0.6, metalness: 0.8 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 10, 28), ironMat);
  ring.rotation.x = Math.PI / 2;
  chandelier.add(ring);
  // Łańcuch do sufitu.
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 6), ironMat);
  chain.position.y = 0.65;
  chandelier.add(chain);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), ironMat);
  stem.position.y = 0.1;
  chandelier.add(stem);

  const waxMat = new THREE.MeshStandardMaterial({ color: 0xe6d9b8, roughness: 0.6 });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xffb45c,
    emissiveIntensity: 3.2,
  });
  const candleFlames: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 0.42;
    const z = Math.sin(a) * 0.42;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.22, 10), waxMat);
    candle.position.set(x, 0.12, z);
    chandelier.add(candle);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), flameMat.clone());
    flame.scale.set(0.8, 1.6, 0.8);
    flame.position.set(x, 0.27, z);
    flame.name = `flame-${i}`;
    chandelier.add(flame);
    candleFlames.push(flame);
  }
  group.add(chandelier);

  // Spot prosto na mapę — to on robi klimat + cienie przedmiotów.
  const chandelierSpot = new THREE.SpotLight(
    cfg.candleColor,
    60,
    14,
    0.75,
    0.55,
    1.8,
  );
  chandelierSpot.position.copy(chandelier.position);
  chandelierSpot.target.position.set(-0.15, 0.8, 0.02); // środek mapy
  chandelierSpot.castShadow = true;
  chandelierSpot.shadow.mapSize.set(
    sceneConfig.renderer.shadowMapSize,
    sceneConfig.renderer.shadowMapSize,
  );
  chandelierSpot.shadow.bias = -0.002;
  chandelierSpot.shadow.camera.near = 0.5;
  chandelierSpot.shadow.camera.far = 8;
  group.add(chandelierSpot, chandelierSpot.target);

  const chandelierFill = new THREE.PointLight(cfg.candleColor, 6, 9, 2);
  chandelierFill.position.set(
    chandelier.position.x,
    chandelier.position.y - 0.35,
    chandelier.position.z,
  );
  group.add(chandelierFill);

  // Kominek — ciepły flicker, nie dominuje nad stołem.
  const fireLight = new THREE.PointLight(cfg.fireColor, 5, 7, 2);
  fireLight.position.copy(firePosition);
  group.add(fireLight);

  // Płomienie kominka: 3 emissive języki + żar (animowane w fireplace.ts).
  const fireFlames = new THREE.Group();
  fireFlames.position.copy(firePosition).add(new THREE.Vector3(0, 0.02, 0.1));
  const flameColors = [0xff7a1e, 0xffa63e, 0xffd27a];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(0.09 - i * 0.022, 0.42 - i * 0.09, 8),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: flameColors[i],
        emissiveIntensity: 2.6,
        transparent: true,
        opacity: 0.92,
      }),
    );
    m.position.set((i - 1) * 0.11, 0.2 + i * 0.03, (i % 2) * 0.06 - 0.03);
    m.name = `fire-flame-${i}`;
    fireFlames.add(m);
  }
  group.add(fireFlames);

  return {
    group,
    chandelierSpot,
    chandelierFill,
    fireLight,
    candleFlames,
    embers: null,
  };
}
