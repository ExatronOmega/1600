import * as THREE from 'three';

/** Delikatne migotanie świec — światło + skala sprite'ów płomieni. */
export function createCandleFlicker(
  spot: THREE.SpotLight,
  fill: THREE.PointLight,
  flames: THREE.Object3D[],
): (t: number) => void {
  const baseSpot = spot.intensity;
  const baseFill = fill.intensity;
  const seeds = flames.map((_, i) => i * 2.3 + 0.7);
  const bases = flames.map((f) => (f.userData.baseScale as THREE.Vector3 | undefined)?.clone() ?? f.scale.clone());

  return (t: number) => {
    const n = Math.sin(t * 7.1) * 0.5 + Math.sin(t * 17.3 + 2.0) * 0.35 + Math.sin(t * 29.7) * 0.15;
    spot.intensity = baseSpot * (1 + n * 0.07);
    fill.intensity = baseFill * (1 + n * 0.12);
    flames.forEach((f, i) => {
      const s = 1 + Math.sin(t * (9 + i * 1.7) + seeds[i]) * 0.09;
      const b = bases[i];
      f.scale.set(b.x / Math.sqrt(s), b.y * s, 1);
    });
  };
}
