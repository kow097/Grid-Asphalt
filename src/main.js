import { Engine } from './core/engine.js';

const canvas = document.getElementById('game-canvas');
const engine = new Engine(canvas);
engine.start();
