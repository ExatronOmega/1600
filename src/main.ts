import './style.css';
import { createScene } from './scene/createScene.ts';

const canvas = document.getElementById('scene') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('Nie znaleziono <canvas id="scene">');
}

createScene(canvas);
