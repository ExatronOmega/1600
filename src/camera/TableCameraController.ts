import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sceneConfig } from '../config/sceneConfig.ts';

/**
 * Kamera "przywiązana" do stołu (styl Tabletop Simulator):
 * orbita + zoom + pochylenie, bez chodzenia po pokoju i bez pana.
 */
export function createTableCamera(
  canvas: HTMLCanvasElement,
): { camera: THREE.PerspectiveCamera; controls: OrbitControls } {
  const cfg = sceneConfig.camera;
  const camera = new THREE.PerspectiveCamera(
    cfg.fov,
    window.innerWidth / window.innerHeight,
    0.05,
    60,
  );
  camera.position.set(cfg.startPosition.x, cfg.startPosition.y, cfg.startPosition.z);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(cfg.target.x, cfg.target.y, cfg.target.z);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false; // gracz nie odjeżdża od stołu
  controls.minDistance = cfg.minDistance;
  controls.maxDistance = cfg.maxDistance;
  controls.minPolarAngle = cfg.minPolarAngle;
  controls.maxPolarAngle = cfg.maxPolarAngle;
  controls.rotateSpeed = 0.75;
  controls.zoomSpeed = 0.9;
  // Prawy przycisk też obraca (pan i tak wyłączony).
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  controls.update();
  return { camera, controls };
}
