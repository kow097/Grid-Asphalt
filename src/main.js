import { Engine } from './core/engine.js';

const homeScreen = document.getElementById('home-screen');
const gameRoot = document.getElementById('game-root');
const startBtn = document.getElementById('start-game-btn');
const sizeSelect = document.getElementById('world-size-select');
const islandLabel = document.getElementById('island-count-label');
const islandInput = document.getElementById('island-count-input');
const portInput = document.getElementById('port-count-input');
const seedInput = document.getElementById('seed-input');

let currentEngine = null;

function exitToHome() {
  if (currentEngine) currentEngine.destroy();
  currentEngine = null;
  gameRoot.classList.add('hidden');
  homeScreen.classList.remove('hidden');
}

const MAX_PORTS_BY_SIZE = {
  '120x80': 2,
  '200x200': 4,
  '400x400': 8,
  '800x800': 16,
  '1600x1600': 32,
};

function syncPortLimit() {
  const max = MAX_PORTS_BY_SIZE[sizeSelect.value] ?? 2;
  portInput.max = max;
  if (Number(portInput.value) > max) portInput.value = max;
}

sizeSelect.addEventListener('change', () => {
  const [width] = sizeSelect.value.split('x').map(Number);
  islandLabel.classList.toggle('hidden', width < 400);
  syncPortLimit();
});

syncPortLimit();

startBtn.addEventListener('click', () => {
  const [width, height] = sizeSelect.value.split('x').map(Number);
  const islandCount = width >= 400 ? Number(islandInput.value) : 1;
  const portCount = Math.max(1, Number(portInput.value));
  const seed = seedInput.value ? Number(seedInput.value) : Math.floor(Math.random() * 1_000_000);

  homeScreen.classList.add('hidden');
  gameRoot.classList.remove('hidden');

  const canvas = document.getElementById('game-canvas');
  currentEngine = new Engine(canvas, { worldWidth: width, worldHeight: height, islandCount, portCount, seed, onExit: exitToHome });
  // Izlozeno na window radi debugiranja iz browser konzole (npr.
  // window.engine.selectedTruck.heading) - ne koristi se nigdje u samoj igri.
  window.engine = currentEngine;
  currentEngine.start();
});
