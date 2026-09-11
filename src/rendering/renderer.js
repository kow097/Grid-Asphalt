import { renderTiles } from './tileRenderer.js';
import { renderTrucks } from './entityRenderer.js';

export class Renderer {
  constructor(canvas, camera, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.config = config;
  }

  render(world, trucks) {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#0a1520';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    renderTiles(ctx, this.camera, world, this.config.TILE_SIZE);
    renderTrucks(ctx, this.camera, trucks, this.config.TILE_SIZE);
  }
}
