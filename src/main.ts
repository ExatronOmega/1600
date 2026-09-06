import './style.css';
import { createScene } from './scene/createScene.ts';

const canvas = document.getElementById('scene') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('Nie znaleziono <canvas id="scene">');
}

function webgl2Available(): boolean {
  try {
    const test = document.createElement('canvas');
    const gl = test.getContext('webgl2');
    if (gl) {
      // explicitly lose it — był tylko do testu
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function showFatal(html: string): void {
  const el = document.getElementById('loader-text');
  if (el) el.textContent = html;
}

if (!webgl2Available()) {
  console.error('[1600] brak kontekstu WebGL2 w tej przeglądarce');
  showFatal(
    'Ta przeglądarka nie udostępnia WebGL2 (wymagane przez Three.js). ' +
      'Sprawdź chrome://gpu; w VirtualBoksie włącz Display → 3D Acceleration ' +
      'albo uruchom przeglądarkę z flagami --disable-gpu --enable-unsafe-swiftshader.',
  );
} else {
  createScene(canvas).catch((err) => {
    console.error('[1600] błąd inicjalizacji sceny:', err);
    const msg = err instanceof Error ? err.message : String(err);
    showFatal(`Nie udało się wczytać sceny — ${msg.slice(0, 160)} (szczegóły w konsoli).`);
  });
}
