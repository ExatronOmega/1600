import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadingManager } from './loading.ts';

const loader = new GLTFLoader(loadingManager);
const cache = new Map<string, Promise<THREE.Group>>();

/**
 * Ładowanie GLTF/GLB z cache — asset pobierany raz, klony dla kolejnych użyć.
 * Zwraca świeży klon sceny (materiały współdzielone — nie modyfikuj ich
 * per instancja bez .clone()).
 */
export function loadModel(url: string): Promise<THREE.Group> {
  let pending = cache.get(url);
  if (!pending) {
    pending = new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          gltf.scene.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          resolve(gltf.scene);
        },
        undefined,
        (err) => reject(err),
      );
    });
    cache.set(url, pending);
  }
  return pending.then((scene) => scene.clone(true));
}

/** Wyciąga pojedynczy nazwany węzeł z modelu (np. jedną książkę ze zbioru). */
export async function loadModelNode(modelUrl: string, nodeName: string): Promise<THREE.Object3D> {
  const scene = await loadModel(modelUrl);
  const node = scene.getObjectByName(nodeName);
  if (!node) throw new Error(`Węzeł ${nodeName} nie istnieje w ${modelUrl}`);
  const holder = new THREE.Group();
  holder.name = nodeName;
  // Przenosimy węzeł (zachowuje lokalny transform), resztę odrzucamy.
  holder.add(node);
  return holder;
}

/** Skaluje obiekt tak, żeby najdłuższy bok bboxa miał `size` metrów. */
export function normalizeSize(obj: THREE.Object3D, size: number): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(obj);
  const dims = new THREE.Vector3();
  box.getSize(dims);
  const longest = Math.max(dims.x, dims.y, dims.z);
  if (longest > 0) obj.scale.multiplyScalar(size / longest);
  return obj;
}

/** Stawia obiekt na ziemi (min.y → 0) i centruje w XZ. */
export function groundObject(obj: THREE.Object3D): THREE.Object3D {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
  return obj;
}
