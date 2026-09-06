export const DEBUG: boolean =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('debug') === 'true';

export const sceneConfig = {
  renderer: {
    maxPixelRatio: 2,
    shadowMapSize: 1024,
  },
  room: {
    width: 10, // X
    height: 3.6, // Y
    depth: 8, // Z
    wallColor: 0x4a453c,
    floorColor: 0x2e2620,
  },
  table: {
    length: 3.2, // X
    width: 2.0, // Z
    height: 0.8, // top surface Y
    topThickness: 0.09,
  },
  board: {
    // Zachowujemy proporcje tekstury 3969x3463 (~1.146),
    // rozmiar daje ~60% powierzchni blatu.
    width: 2.1,
    height: 2.1 / (3969 / 3463),
    thickness: 0.008,
    // Delikatne podwinięcie krawędzi — powierzchniowo plansza zostaje płaska.
    edgeLift: 0.012,
  },
  camera: {
    fov: 50,
    target: { x: 0, y: 0.85, z: 0 },
    // Kadr startowy: cała plansza + stół + kandelabr + kominek w tle.
    startPosition: { x: 2.2, y: 2.0, z: 3.0 },
    minDistance: 1.1,
    maxDistance: 5.4,
    minPolarAngle: 0.12,
    maxPolarAngle: 1.35,
  },
  lights: {
    // Kandelabr nisko nad stołem, żeby wszedł w domyślny kadr.
    chandelierPosition: { x: 0.35, y: 2.15, z: -0.25 },
    candleColor: 0xffb45c,
    fireColor: 0xff6a22,
  },
} as const;

export type SceneConfig = typeof sceneConfig;
