import * as THREE from 'three';

/** Nieregularny flicker kominka: światło + puls sprite'ów + puls żaru. */
export function createFireplaceAnimator(
  fireLight: THREE.PointLight,
  lightingGroup: THREE.Group,
  embers: THREE.Mesh | null,
): (t: number) => void {
  const flames: THREE.Object3D[] = [];
  lightingGroup.traverse((o) => {
    if (o.name.startsWith('fire-flame-')) flames.push(o);
  });
  const baseIntensity = fireLight.intensity;
  const seeds = flames.map((_, i) => i * 1.7 + 0.4);
  const bases = flames.map((f) => (f.userData.baseScale as THREE.Vector3 | undefined)?.clone() ?? f.scale.clone());

  return (t: number) => {
    const n =
      Math.sin(t * 9.3) * 0.5 + Math.sin(t * 23.7 + 1.3) * 0.3 + Math.sin(t * 41.1 + 4.1) * 0.2;
    fireLight.intensity = baseIntensity * (1 + n * 0.28);
    flames.forEach((f, i) => {
      const s = 1 + Math.sin(t * (11 + i * 3.1) + seeds[i]) * 0.13 + n * 0.07;
      const b = bases[i];
      f.scale.set(b.x / Math.sqrt(s), b.y * s, 1);
      f.position.x += Math.sin(t * 5 + seeds[i]) * 0.0006;
    });
    if (embers) {
      const m = embers.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 2.2 + n * 0.8;
    }
  };
}
