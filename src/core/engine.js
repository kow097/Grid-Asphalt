import { Camera } from './camera.js';
import { InputHandler } from './input.js';
import { GameLoop } from './gameLoop.js';
import { CONFIG } from './config.js';
import { Renderer } from '../rendering/renderer.js';
import { IslandGenerator } from '../world/islandGenerator.js';
import { PathGrid } from '../pathfinding/grid.js';
import { Truck, TRUCK_STATE } from '../logistics/truck.js';
import { Wallet } from '../economy/currency.js';
import { QuestManager } from '../economy/questManager.js';
import { DIFFICULTY_MODES } from '../state/difficultyModes.js';
import { GameState } from '../state/gameState.js';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this._resize();
    window.addEventListener('resize', () => this._resize());

    this.camera = new Camera(canvas);
    this.input = new InputHandler(canvas, this.camera, CONFIG);
    this.renderer = new Renderer(canvas, this.camera, CONFIG);

    const generator = new IslandGenerator(CONFIG.WORLD_SEED, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    const world = generator.generate();
    this.pathGrid = new PathGrid(world.tiles, world.width, world.height);

    const wallet = new Wallet(500);
    const questManager = new QuestManager(wallet, DIFFICULTY_MODES.NORMAL);

    this.state = new GameState(world, wallet, questManager);
    this.camera.x = (world.width * CONFIG.TILE_SIZE) / 2;
    this.camera.y = (world.height * CONFIG.TILE_SIZE) / 2;

    this._spawnDemoTruck();

    this.loop = new GameLoop(this._update.bind(this), this._render.bind(this));
  }

  _spawnDemoTruck() {
    const { ports } = this.state.world;
    if (ports.length === 0) return;
    const start = ports[0];
    const truck = new Truck('demo-1', start.x, start.y, 50);
    this.state.trucks.push(truck);
    this._retarget(truck);
  }

  _retarget(truck) {
    const { width, height } = this.state.world;
    for (let attempt = 0; attempt < 30; attempt++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      if (this.pathGrid.isWalkable(x, y)) {
        truck.setDestination(this.pathGrid, [x, y]);
        return;
      }
    }
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _update(deltaTime) {
    for (const truck of this.state.trucks) {
      truck.update(deltaTime, this.pathGrid);
      if (truck.state === TRUCK_STATE.IDLE) this._retarget(truck);
    }
    for (const extractor of this.state.extractors) extractor.update(deltaTime);
    for (const smelter of this.state.smelters) smelter.update(deltaTime);
    for (const assembler of this.state.assemblers) assembler.update(deltaTime);
    this.state.questManager.update(deltaTime);
  }

  _render() {
    this.renderer.render(this.state.world, this.state.trucks);
  }

  start() {
    this.loop.start();
  }
}
