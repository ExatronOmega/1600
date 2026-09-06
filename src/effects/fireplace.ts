import * as THREE from 'three';

/** Nieregularny flicker kominka — światło + skala płomieni + puls żaru. */
export function createFireplaceAnimator(
  fireLight: THREE.PointLight,
  lightingGroup: THREE.Group,
  embers: THREE.Mesh | null,
): (t: number) => void {
  const flames: THREE.Mesh[] = [];
  lightingGroup.traverse((o) => {
    if (o instanceof THREE.Mesh && o.name.startsWith('fire-flame-')) flames.push(o);
  });
  const baseIntensity = fireLight.intensity;
  const seeds = flames.map((_, i) => i * 1.7 + 0.4);

  return (t: number) => {
    const n =
      Math.sin(t * 9.3) * 0.5 + Math.sin(t * 23.7 + 1.3) * 0.3 + Math.sin(t * 41.1 + 4.1) * 0.2;
    fireLight.intensity = baseIntensity * (1 + n * 0.28);
    flames.forEach((f, i) => {
      const s = 1 + Math.sin(t * (11 + i * 3.1) + seeds[i]) * 0.14 + n * 0.08;
      f.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
      f.rotation.y = Math.sin(t * 3 + seeds[i]) * 0.25;
    });
    if (embers) {
      const m = embers.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 2.0 + n * 0.7;
    }
  };
}
