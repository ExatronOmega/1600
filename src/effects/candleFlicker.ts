import * as THREE from 'three';

/** Delikatne migotanie świec — światło + skala emissive płomieni. */
export function createCandleFlicker(
  spot: THREE.SpotLight,
  fill: THREE.PointLight,
  flames: THREE.Mesh[],
): (t: number) => void {
  const baseSpot = spot.intensity;
  const baseFill = fill.intensity;
  const seeds = flames.map((_, i) => i * 2.3 + 0.7);

  return (t: number) => {
    const n = Math.sin(t * 7.1) * 0.5 + Math.sin(t * 17.3 + 2.0) * 0.35 + Math.sin(t * 29.7) * 0.15;
    spot.intensity = baseSpot * (1 + n * 0.07);
    fill.intensity = baseFill * (1 + n * 0.12);
    flames.forEach((f, i) => {
      const s = 1 + Math.sin(t * (9 + i * 1.7) + seeds[i]) * 0.1;
      f.scale.set(0.8 / Math.sqrt(s), 1.6 * s, 0.8 / Math.sqrt(s));
    });
  };
}
