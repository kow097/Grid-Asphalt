import { TERRAIN_COLORS, RESOURCE_COLORS, PORT_COLOR } from './spriteAtlas.js';

export function renderTiles(ctx, camera, world, tileSize) {
  const { tiles, width, height } = world;

  const topLeft = camera.screenToWorld(0, 0, tileSize);
  const bottomRight = camera.screenToWorld(ctx.canvas.width, ctx.canvas.height, tileSize);

  const startX = Math.max(0, Math.floor(topLeft.x) - 1);
  const startY = Math.max(0, Math.floor(topLeft.y) - 1);
  const endX = Math.min(width - 1, Math.ceil(bottomRight.x) + 1);
  const endY = Math.min(height - 1, Math.ceil(bottomRight.y) + 1);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const tile = tiles[y * width + x];
      const screen = camera.worldToScreen(x, y, tileSize);
      const size = tileSize * camera.zoom;

      ctx.fillStyle = TERRAIN_COLORS[tile.terrain] || '#000';
      ctx.fillRect(screen.x, screen.y, size + 1, size + 1);

      if (tile.resourceNode) {
        ctx.fillStyle = RESOURCE_COLORS[tile.resourceNode.type] || '#fff';
        const pad = size * 0.25;
        ctx.fillRect(screen.x + pad, screen.y + pad, size - pad * 2, size - pad * 2);
      }

      if (tile.port) {
        ctx.fillStyle = PORT_COLOR;
        ctx.beginPath();
        ctx.arc(screen.x + size / 2, screen.y + size / 2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
