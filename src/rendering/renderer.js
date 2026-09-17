import { renderTiles, renderPorts } from './tileRenderer.js';
import { renderTrucks, renderRoute, renderPendingWaypoints, renderDragPreview, renderBuildGhost } from './entityRenderer.js';
import { renderGridOverlay } from './gridOverlay.js';

export class Renderer {
  constructor(canvas, camera, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.config = config;
  }

  render(world, trucks, assets, selectedTruck, pendingWaypoints, hoverScreenPos, dragPreviewTiles, dragPreviewMode, buildGhost, pendingPreviewPaths, elapsedTime) {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#0a1520';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    renderTiles(ctx, this.camera, world, this.config.TILE_SIZE, assets, elapsedTime);
    renderPorts(ctx, this.camera, world.ports, this.config.TILE_SIZE);
    renderDragPreview(ctx, this.camera, dragPreviewTiles, dragPreviewMode, this.config.TILE_SIZE);
    renderBuildGhost(ctx, this.camera, buildGhost, this.config.TILE_SIZE);
    renderGridOverlay(ctx, this.camera, hoverScreenPos, this.config.TILE_SIZE);
    renderRoute(ctx, this.camera, selectedTruck, this.config.TILE_SIZE);
    renderTrucks(ctx, this.camera, trucks, this.config.TILE_SIZE, assets);
    renderPendingWaypoints(ctx, this.camera, pendingWaypoints, pendingPreviewPaths, this.config.TILE_SIZE);
  }
}
