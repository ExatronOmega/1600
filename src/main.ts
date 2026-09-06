import './style.css';
import { createScene } from './scene/createScene.ts';

const canvas = document.getElementById('scene') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('Nie znaleziono <canvas id="scene">');
}

createScene(canvas).catch((err) => {
  console.error('[1600] błąd inicjalizacji sceny:', err);
  const el = document.getElementById('loader-text');
  if (el) el.textContent = 'Nie udało się wczytać sceny — szczegóły w konsoli.';
});
