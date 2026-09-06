import * as THREE from 'three';
import { loadingManager } from './loading.ts';

// Mapa: Vaugondy, "Royaume de Pologne" 1778, skan z aukcji OneBid
// (https://onebid.pl/pl/mapy-mapa-vaugondy-robert-de-royaume-de-pologne-1778/1736982).
// Oryginał z XVIII w. — domena publiczna; plik ściągnięty lokalnie do
// public/textures/board-map.jpg i serwowany razem z aplikacją.
// Setting gry jest wcześniejszy (ok. 1600–1650) — mapa to materiał wizualny.
//
// Wszystkie ścieżki liczone od URL strony (a nie od roota serwera),
// żeby działał i dev pod /, i dev pod /1600/, i GitHub Pages pod /1600/.
const BASE = new URL(import.meta.env.BASE_URL, window.location.href).href;
export const BOARD_MAP_URL = `${BASE}textures/board-map.jpg`;

const texLoader = new THREE.TextureLoader(loadingManager);
const textureCache = new Map<string, THREE.Texture>();

export interface TexOptions {
  srgb?: boolean;
  repeat?: [number, number];
  offset?: [number, number];
}

/** Tekstura z cache; klucz zawiera opcje, żeby warianty się nie mieszały. */
export function loadTexture(url: string, opts: TexOptions = {}): Promise<THREE.Texture> {
  const key = `${url}|${opts.srgb ? 's' : 'l'}|${opts.repeat?.join('x') ?? '1x1'}|${opts.offset?.join(',') ?? '0,0'}`;
  const cached = textureCache.get(key);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    texLoader.load(
      url,
      (tex) => {
        tex.colorSpace = opts.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
        if (opts.offset) tex.offset.set(opts.offset[0], opts.offset[1]);
        tex.anisotropy = 8;
        textureCache.set(key, tex);
        resolve(tex);
      },
      undefined,
      (err) => reject(new Error(`[tex] nie wczytano ${url}: ${String(err).slice(0, 120)}`)),
    );
  });
}

export interface PBRSet {
  diff: string;
  nor: string;
  rough: string;
}

/** Komplet PBR (diffuse sRGB + normal/roughness liniowe) jako jeden materiał. */
export async function loadPBRMaterial(
  set: PBRSet,
  opts: {
    repeat?: [number, number];
    offset?: [number, number];
    color?: number;
    roughness?: number;
    normalScale?: number;
  } = {},
): Promise<THREE.MeshStandardMaterial> {
  const [diff, nor, rough] = await Promise.all([
    loadTexture(set.diff, { srgb: true, repeat: opts.repeat, offset: opts.offset }),
    loadTexture(set.nor, { repeat: opts.repeat, offset: opts.offset }),
    loadTexture(set.rough, { repeat: opts.repeat, offset: opts.offset }),
  ]);
  return new THREE.MeshStandardMaterial({
    map: diff,
    normalMap: nor,
    normalScale: new THREE.Vector2(opts.normalScale ?? 0.85, opts.normalScale ?? 0.85),
    roughnessMap: rough,
    roughness: opts.roughness ?? 1.0,
    metalness: 0,
    color: opts.color ?? 0xffffff,
  });
}

export const PBR = {
  stoneWall: {
    diff: `${BASE}textures/pbr/medieval_wall_02/medieval_wall_02_diff_2k.jpg`,
    nor: `${BASE}textures/pbr/medieval_wall_02/medieval_wall_02_nor_gl_2k.jpg`,
    rough: `${BASE}textures/pbr/medieval_wall_02/medieval_wall_02_rough_2k.jpg`,
  } as PBRSet,
  plasterWall: {
    diff: `${BASE}textures/pbr/medieval_wall_01/medieval_wall_01_diff_2k.jpg`,
    nor: `${BASE}textures/pbr/medieval_wall_01/medieval_wall_01_nor_gl_2k.jpg`,
    rough: `${BASE}textures/pbr/medieval_wall_01/medieval_wall_01_rough_2k.jpg`,
  } as PBRSet,
  stoneFloor: {
    diff: `${BASE}textures/pbr/monastery_stone_floor/monastery_stone_floor_diff_2k.jpg`,
    nor: `${BASE}textures/pbr/monastery_stone_floor/monastery_stone_floor_nor_gl_2k.jpg`,
    rough: `${BASE}textures/pbr/monastery_stone_floor/monastery_stone_floor_rough_2k.jpg`,
  } as PBRSet,
  oldWood: {
    diff: `${BASE}textures/pbr/medieval_wood/medieval_wood_diff_2k.jpg`,
    nor: `${BASE}textures/pbr/medieval_wood/medieval_wood_nor_gl_2k.jpg`,
    rough: `${BASE}textures/pbr/medieval_wood/medieval_wood_rough_2k.jpg`,
  } as PBRSet,
};

export const MODELS = {
  crate: `${BASE}models/wooden_crate_01/wooden_crate_01_1k.gltf`,
  bookSet: `${BASE}models/book_encyclopedia_set_01/book_encyclopedia_set_01_1k.gltf`,
  candleholders: `${BASE}models/brass_candleholders/brass_candleholders_1k.gltf`,
} as const;

/**
 * Subtelny proceduralny szum papieru (bump) — zamiast błędnego
 * używania skanu mapy jako bumpMapy.
 */
let paperBump: THREE.CanvasTexture | null = null;
export function getPaperBump(): THREE.CanvasTexture {
  if (paperBump) return paperBump;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 256, 256);
  // Drobne włókna papieru.
  for (let i = 0; i < 5200; i++) {
    const v = 108 + Math.random() * 40;
    g.fillStyle = `rgba(${v},${v},${v},0.5)`;
    const w = 1 + Math.random() * 2.2;
    g.fillRect(Math.random() * 256, Math.random() * 256, w, 1);
  }
  // Kilka większych plam (nierówna masa papiernicza).
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 8 + Math.random() * 26;
    const grad = g.createRadialGradient(x, y, 1, x, y, r);
    const v = Math.random() > 0.5 ? 150 : 105;
    grad.addColorStop(0, `rgba(${v},${v},${v},0.16)`);
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  paperBump = new THREE.CanvasTexture(c);
  paperBump.wrapS = THREE.RepeatWrapping;
  paperBump.wrapT = THREE.RepeatWrapping;
  paperBump.repeat.set(3, 3);
  return paperBump;
}

/** Proceduralny dębowy blat — długie słoje wzdłuż X, fugi desek, sęki.
 * (medieval_wood to tekstura drzwi z gwoździami — dobra na belki/drzwi,
 *  fatalna na blat stołu). */
let oakTop: THREE.CanvasTexture | null = null;
export function getOakTopTexture(): THREE.CanvasTexture {
  if (oakTop) return oakTop;
  const W = 1024;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#6a4c2c';
  g.fillRect(0, 0, W, H);
  const planks = 5;
  const ph = H / planks;
  for (let p = 0; p < planks; p++) {
    // Odcień deski.
    const tone = 0.88 + Math.random() * 0.24;
    g.fillStyle = `rgb(${Math.round(106 * tone)},${Math.round(76 * tone)},${Math.round(44 * tone)})`;
    g.fillRect(0, p * ph, W, ph);
    // Słoje wzdłuż deski.
    for (let i = 0; i < 46; i++) {
      const y = p * ph + Math.random() * ph;
      const dark = Math.random() > 0.4;
      g.strokeStyle = dark
        ? `rgba(46,28,12,${0.18 + Math.random() * 0.3})`
        : `rgba(214,178,132,${0.1 + Math.random() * 0.16})`;
      g.lineWidth = 0.7 + Math.random() * 1.8;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 64) {
        g.lineTo(x, y + Math.sin(x * 0.008 + i * 1.7 + p) * 3 + (Math.random() - 0.5) * 2);
      }
      g.stroke();
    }
    // Fuga między deskami.
    g.fillStyle = 'rgba(20,12,5,0.85)';
    g.fillRect(0, p * ph - 1, W, 2.5);
    g.fillStyle = 'rgba(220,190,150,0.12)';
    g.fillRect(0, p * ph + 1.5, W, 1);
  }
  // Sęki.
  for (let i = 0; i < 6; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    for (let r = 9; r > 0; r -= 2) {
      g.strokeStyle = `rgba(40,24,10,${0.14 + (9 - r) * 0.05})`;
      g.lineWidth = 1.4;
      g.beginPath();
      g.ellipse(x, y, r * 1.7, r, 0.3, 0, Math.PI * 2);
      g.stroke();
    }
  }
  // Przetarcia / zużycie.
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 12 + Math.random() * 46;
    const grad = g.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, 'rgba(210,180,140,0.07)');
    grad.addColorStop(1, 'rgba(210,180,140,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  oakTop = new THREE.CanvasTexture(c);
  oakTop.wrapS = THREE.RepeatWrapping;
  oakTop.wrapT = THREE.RepeatWrapping;
  oakTop.colorSpace = THREE.SRGBColorSpace;
  oakTop.anisotropy = 8;
  return oakTop;
}

/** Miękki sprite płomienia (additive) — ogień i świece bez geometrii. */
let flameSprite: THREE.CanvasTexture | null = null;
export function getFlameTexture(): THREE.CanvasTexture {
  if (flameSprite) return flameSprite;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 78, 2, 64, 70, 60);
  grad.addColorStop(0, 'rgba(255,244,214,1)');
  grad.addColorStop(0.22, 'rgba(255,196,110,0.85)');
  grad.addColorStop(0.48, 'rgba(255,122,30,0.42)');
  grad.addColorStop(0.75, 'rgba(180,60,8,0.12)');
  grad.addColorStop(1, 'rgba(120,30,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  flameSprite = new THREE.CanvasTexture(c);
  flameSprite.colorSpace = THREE.SRGBColorSpace;
  return flameSprite;
}

/** Gotowy sprite płomienia o zadanej wielkości (metry). */
export function makeFlameSprite(size: number, opacity = 0.95): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: getFlameTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(size * 0.72, size, 1);
  s.userData.baseScale = s.scale.clone();
  return s;
}
