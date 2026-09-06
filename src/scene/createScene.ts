import * as THREE from 'three';
import { Timer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DEBUG, sceneConfig } from '../config/sceneConfig.ts';
import { onLoadProgress } from '../assets/loading.ts';
import { createRoom } from './createRoom.ts';
import { createTable } from './createTable.ts';
import { createBoardMap } from './createBoardMap.ts';
import { createLighting } from './createLighting.ts';
import { createProps } from './createProps.ts';
import { createTableCamera } from '../camera/TableCameraController.ts';
import { BoardSystem } from '../board/BoardSystem.ts';
import { createFireplaceAnimator } from '../effects/fireplace.ts';
import { createCandleFlicker } from '../effects/candleFlicker.ts';

export interface SceneHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  board: BoardSystem;
  dispose: () => void;
}

/**
 * Vertical slice: room + table + boardMap + camera + lighting + raycasting.
 * Struktura celowo otwarta na podmianę placeholderów na GLTF
 * (createTable / createProps mają stabilne sygnatury).
 */
export async function createScene(canvas: HTMLCanvasElement): Promise<SceneHandles> {
  const loaderEl = document.getElementById('loader');
  const loaderText = document.getElementById('loader-text');
  onLoadProgress((done, total) => {
    if (loaderText) loaderText.textContent = `Przygotowanie komnaty… ${done}/${total}`;
  });

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, sceneConfig.renderer.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050403);
  scene.fog = new THREE.FogExp2(0x050403, 0.028);
  // Subtelne odbicia dla mosiądzu/stali — nocny klimat zostaje
  // (niskie intensity, kluczowe światła robią robotę).
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.25;
  pmrem.dispose();

  try {
    // Pokój / stół / mapa / rekwizyty (PBR + GLTF ładują się równolegle).
    const [room, table] = await Promise.all([createRoom(), createTable()]);
    scene.add(room.group);
    scene.add(table.group);

    const { boardMap } = createBoardMap(table.topY);
    scene.add(boardMap);

    const props = await createProps(table.topY);
    scene.add(props);

    // Światło. Żar kominka przekazujemy animatorowi (jeśli istnieje).
    const lighting = createLighting(room.firePosition);
    scene.add(lighting.group);
    let embers: THREE.Mesh | null = null;
    room.group.traverse((o) => {
      if (o instanceof THREE.Mesh && o.name === 'embers') embers = o;
    });
    // Płomień świecy stołowej też delikatnie migocze.
    const tableFlame = props.getObjectByName('table-flame');
    if (tableFlame) lighting.candleFlames.push(tableFlame);

    // Plansza jako system — referencja pod przyszłe regiony/jednostki.
    const board = new BoardSystem(
      boardMap,
      sceneConfig.board.width,
      sceneConfig.board.height,
      sceneConfig.board.thickness,
    );
    scene.userData.board = board;

    // Kamera przywiązana do stołu.
    const { camera, controls } = createTableCamera(canvas);

    // Raycast kliknięć w mapę → konsola + HUD (fundament pod regiony).
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const readout = document.getElementById('board-readout');
    let downAt: { x: number; y: number } | null = null;

    canvas.addEventListener('pointerdown', (e) => {
      downAt = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointerup', (e) => {
      // Ignoruj przeciągnięcia orbity — liczy się czysty klik.
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = board.getBoardIntersection(raycaster);
      if (hit) {
        console.log(
          `[board] UV: x=${hit.uv.x.toFixed(4)} y=${hit.uv.y.toFixed(4)} | world: ` +
            `x=${hit.point.x.toFixed(3)} y=${hit.point.y.toFixed(3)} z=${hit.point.z.toFixed(3)}`,
        );
        if (readout) {
          readout.textContent =
            `UV: ${hit.uv.x.toFixed(4)}, ${hit.uv.y.toFixed(4)} · ` +
            `world: ${hit.point.x.toFixed(2)}, ${hit.point.y.toFixed(2)}, ${hit.point.z.toFixed(2)}`;
        }
        if (DEBUG) showHitMarker(hit.point);
      }
    });

    // Debug: osie, siatka, bbox mapy, marker trafienia.
    let hitMarker: THREE.Mesh | null = null;
    function showHitMarker(p: THREE.Vector3): void {
      if (!hitMarker) {
        hitMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x00ff88 }),
        );
        scene.add(hitMarker);
      }
      hitMarker.position.copy(p).add(new THREE.Vector3(0, 0.01, 0));
    }
    if (DEBUG) {
      scene.add(new THREE.AxesHelper(1.2));
      const grid = new THREE.GridHelper(10, 20, 0x334455, 0x223344);
      grid.position.y = 0.005;
      scene.add(grid);
      const bboxHelper = new THREE.Box3Helper(board.boundingBox, 0x00ff88);
      scene.add(bboxHelper);
      console.log('[debug] board bbox:', board.boundingBox, 'pos:', board.worldPosition);
    }

    // Pętla: flicker ognia + świec.
    const animateFire = createFireplaceAnimator(lighting.fireLight, lighting.group, embers);
    const animateCandles = createCandleFlicker(
      lighting.chandelierSpot,
      lighting.chandelierFill,
      lighting.candleFlames,
    );
    const clock = new Timer();
    let raf = 0;
    function tick(): void {
      raf = requestAnimationFrame(tick);
      clock.update();
      const t = clock.getElapsed();
      animateFire(t);
      animateCandles(t);
      controls.update();
      renderer.render(scene, camera);
    }
    tick();

    function onResize(): void {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, sceneConfig.renderer.maxPixelRatio));
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    return {
      renderer,
      scene,
      camera,
      board,
      dispose: () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        controls.dispose();
        renderer.dispose();
      },
    };
  } finally {
    if (loaderEl) loaderEl.classList.add('hidden');
    onLoadProgress(null);
  }
}
