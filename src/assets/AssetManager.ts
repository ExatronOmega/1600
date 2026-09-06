import * as THREE from 'three';

// Mapa: Vaugondy, "Royaume de Pologne" 1778, skan z aukcji OneBid
// (https://onebid.pl/pl/mapy-mapa-vaugondy-robert-de-royaume-de-pologne-1778/1736982).
// Oryginał z XVIII w. — domena publiczna; plik ściągnięty lokalnie do
// public/textures/board-map.jpg i serwowany razem z aplikacją.
// Setting gry jest wcześniejszy (ok. 1600–1650) — mapa to materiał wizualny.
export const BOARD_MAP_URL = '/textures/board-map.jpg';

const textureCache = new Map<string, THREE.Texture>();

export function loadTexture(url: string): Promise<THREE.Texture> {
  const cached = textureCache.get(url);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        textureCache.set(url, tex);
        resolve(tex);
      },
      undefined,
      (err) => reject(err),
    );
  });
}

/** Proceduralne słojowanie drewna — placeholder, do podmiany na PBR/GLTF. */
export function makeWoodTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#4b3520';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * 512;
    g.strokeStyle = `rgba(${20 + Math.random() * 40},${14 + Math.random() * 26},${8 + Math.random() * 14},${0.25 + Math.random() * 0.4})`;
    g.lineWidth = 0.6 + Math.random() * 2.4;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      g.lineTo(x, y + Math.sin(x * 0.02 + i) * 4 + (Math.random() - 0.5) * 3);
    }
    g.stroke();
  }
  // Sęki + przetarcia.
  for (let i = 0; i < 7; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 4 + Math.random() * 10;
    const grad = g.createRadialGradient(x, y, 1, x, y, r * 2.2);
    grad.addColorStop(0, 'rgba(24,14,6,0.85)');
    grad.addColorStop(1, 'rgba(24,14,6,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r * 2.2, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Drobny szum kamienia/tynku na ściany. */
export function makeStoneTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#575046';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const v = 60 + Math.random() * 50;
    g.fillStyle = `rgba(${v},${v - 6},${v - 14},${0.16 + Math.random() * 0.2})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
