import * as THREE from 'three';

/**
 * Wspólny LoadingManager — wszystkie loadery (tekstury + GLTF) go używają,
 * więc overlay ładowania pokazuje realny postęp.
 */
export const loadingManager = new THREE.LoadingManager();

type ProgressHandler = (done: number, total: number, url: string) => void;
let progressHandler: ProgressHandler | null = null;

export function onLoadProgress(h: ProgressHandler | null): void {
  progressHandler = h;
}

loadingManager.onProgress = (_url, loaded, total) => {
  progressHandler?.(loaded, total, _url);
};
