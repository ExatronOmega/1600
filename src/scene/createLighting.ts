import * as THREE from 'three';
import { sceneConfig } from '../config/sceneConfig.ts';
import { makeFlameSprite } from '../assets/AssetManager.ts';

export interface LightingRefs {
  group: THREE.Group;
  /** Główne światło stołu (spot z kandelabru, rzuca cień). */
  chandelierSpot: THREE.SpotLight;
  /** Wypełnienie kandelabru (point, bez cienia). */
  chandelierFill: THREE.PointLight;
  /** Światło kominka (point, flicker, bez cienia). */
  fireLight: THREE.PointLight;
  /** Płomienie świec do animacji (sprite'y z userData.baseScale). */
  candleFlames: THREE.Object3D[];
}

/**
 * Noc: półmrok + ciepłe świece nad mapą + pomarańczowy kominek.
 * Koszt: tylko 1 shadow-casting light (spot kandelabru).
 */
export function createLighting(firePosition: THREE.Vector3): LightingRefs {
  const group = new THREE.Group();
  group.name = 'lighting';
  const cfg = sceneConfig.lights;

  // Bardzo słabe, lekko chłodne otoczenie.
  const hemi = new THREE.HemisphereLight(0x2a3348, 0x1a120c, 0.3);
  group.add(hemi);

  // Kandelabr — element wizualny: obręcz, kielichy, łańcuchy, świece.
  const chandelier = new THREE.Group();
  chandelier.position.set(cfg.chandelierPosition.x, cfg.chandelierPosition.y, cfg.chandelierPosition.z);
  chandelier.rotation.y = 0.4; // niesymetrycznie, naturalnie
  chandelier.name = 'chandelier';

  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 0.55, metalness: 0.85 });
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xe2d4ae, roughness: 0.55 });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.028, 10, 32), ironMat);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  chandelier.add(ring);

  // Kielichy pod świece (toczone).
  const cupProfile = [
    new THREE.Vector2(0.012, 0),
    new THREE.Vector2(0.035, 0.012),
    new THREE.Vector2(0.042, 0.035),
    new THREE.Vector2(0.03, 0.05),
  ];
  const cupGeo = new THREE.LatheGeometry(cupProfile, 12);

  const candleFlames: THREE.Object3D[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 0.42;
    const z = Math.sin(a) * 0.42;
    const cup = new THREE.Mesh(cupGeo, ironMat);
    cup.position.set(x, 0.0, z);
    chandelier.add(cup);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.023, 0.2, 10), waxMat);
    candle.position.set(x, 0.14, z);
    chandelier.add(candle);
    const flame = makeFlameSprite(0.085);
    flame.position.set(x, 0.29, z);
    flame.name = `flame-${i}`;
    chandelier.add(flame);
    candleFlames.push(flame);
  }

  // Trzpień + 3 łańcuchy do wierzchołka + łańcuch do sufitu.
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.34, 8), ironMat);
  stem.position.y = 0.05;
  chandelier.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), ironMat);
  knob.position.y = -0.14;
  chandelier.add(knob);
  const apex = new THREE.Vector3(0, 0.78, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const from = new THREE.Vector3(Math.cos(a) * 0.42, 0.02, Math.sin(a) * 0.42);
    const dir = apex.clone().sub(from);
    const len = dir.length();
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, len, 6), ironMat);
    chain.position.copy(from).addScaledVector(dir, 0.5);
    chain.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    chandelier.add(chain);
  }
  const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.9, 6), ironMat);
  drop.position.y = 1.15;
  chandelier.add(drop);
  group.add(chandelier);

  // Spot prosto na mapę — klimat + cienie przedmiotów.
  // Celowo umiarkowany: papier ma być czytelny, nie przepalony.
  const chandelierSpot = new THREE.SpotLight(cfg.candleColor, 12, 14, 0.75, 0.55, 1.8);
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

  const chandelierFill = new THREE.PointLight(cfg.candleColor, 4, 9, 2);
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

  // Płomienie kominka: 3 warstwowe sprite'y (animowane w fireplace.ts).
  const flameSizes = [0.55, 0.4, 0.27];
  const flameOpacities = [0.55, 0.8, 0.95];
  for (let i = 0; i < 3; i++) {
    const f = makeFlameSprite(flameSizes[i], flameOpacities[i]);
    f.position.set(
      firePosition.x + (i - 1) * 0.09,
      firePosition.y - 0.18 + i * 0.07,
      firePosition.z + (i % 2) * 0.05 - 0.02,
    );
    f.name = `fire-flame-${i}`;
    group.add(f);
  }

  return { group, chandelierSpot, chandelierFill, fireLight, candleFlames };
}
