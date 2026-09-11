export function renderTrucks(ctx, camera, trucks, tileSize) {
  for (const truck of trucks) {
    const screen = camera.worldToScreen(truck.position.x, truck.position.y, tileSize);
    const size = tileSize * camera.zoom * 0.5;

    ctx.fillStyle = truck.cargo ? '#e0a030' : '#cccccc';
    ctx.fillRect(screen.x - size / 2, screen.y - size / 2, size, size);
  }
}
