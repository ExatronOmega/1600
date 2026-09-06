import * as THREE from 'three';

/**
 * Warstwa planszy — fundament pod przyszły gameplay.
 *
 *   ROOM → TABLE → BOARD MAP (boardMap, UV 0..1, raycast)
 *                     └→ BOARD SYSTEM → regiony / jednostki / markery / interakcja
 *
 * Przechowuje mesh, bbox, wymiary i konwersje UV ↔ świat.
 * Jednostki stawiamy później przez boardUVToWorld().
 *
 * Konwencja UV odpowiada górnej ściance BoxGeometry:
 *   u = x/w + 0.5,  v = 1 - (z/h + 0.5)
 * obie funkcje są swoimi odwrotnościami i zgodne z hit.uv z raycasta.
 */
export class BoardSystem {
  readonly mesh: THREE.Mesh;
  readonly width: number;
  readonly height: number;
  readonly thickness: number;
  private readonly box = new THREE.Box3();

  constructor(mesh: THREE.Mesh, width: number, height: number, thickness: number) {
    this.mesh = mesh;
    this.width = width;
    this.height = height;
    this.thickness = thickness;
    this.refresh();
  }

  refresh(): void {
    this.box.setFromObject(this.mesh);
  }

  get boundingBox(): THREE.Box3 {
    return this.box.clone();
  }

  get worldPosition(): THREE.Vector3 {
    const p = new THREE.Vector3();
    this.mesh.getWorldPosition(p);
    return p;
  }

  /** Trafienie raycasta w mapę: punkt + UV (0..1) + pozycja światowa. */
  getBoardIntersection(raycaster: THREE.Raycaster): {
    point: THREE.Vector3;
    uv: THREE.Vector2;
  } | null {
    const hits = raycaster.intersectObject(this.mesh, false);
    if (hits.length === 0) return null;
    const hit = hits[0];
    if (!hit.uv) return null;
    return { point: hit.point.clone(), uv: hit.uv.clone() };
  }

  /** Świat → UV planszy (zgodne z hit.uv dla górnej ścianki Boxa). */
  worldToBoardUV(world: THREE.Vector3): THREE.Vector2 {
    const local = this.mesh.worldToLocal(world.clone());
    const u = THREE.MathUtils.clamp(local.x / this.width + 0.5, 0, 1);
    const v = THREE.MathUtils.clamp(1 - (local.z / this.height + 0.5), 0, 1);
    return new THREE.Vector2(u, v);
  }

  /** UV planszy → świat, z opcjonalnym uniesieniem nad papier (pod pionki). */
  boardUVToWorld(uv: THREE.Vector2, lift = 0): THREE.Vector3 {
    const local = new THREE.Vector3(
      (uv.x - 0.5) * this.width,
      this.thickness / 2 + lift,
      (0.5 - uv.y) * this.height,
    );
    return this.mesh.localToWorld(local);
  }
}
