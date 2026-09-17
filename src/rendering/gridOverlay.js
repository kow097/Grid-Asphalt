const RADIUS = 200;

export function renderGridOverlay(ctx, camera, hoverScreenPos, tileSize) {
  if (!hoverScreenPos) return;
  const { x: hx, y: hy } = hoverScreenPos;

  const worldHover = camera.screenToWorld(hx, hy, tileSize);
  const tileRadius = Math.ceil(RADIUS / (tileSize * camera.zoom)) + 1;

  const startX = Math.floor(worldHover.x) - tileRadius;
  const endX = Math.floor(worldHover.x) + tileRadius;
  const startY = Math.floor(worldHover.y) - tileRadius;
  const endY = Math.floor(worldHover.y) + tileRadius;

  ctx.save();
  ctx.beginPath();
  ctx.arc(hx, hy, RADIUS, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineWidth = 1;

  for (let x = startX; x <= endX; x++) {
    const screenX = camera.worldToScreen(x, 0, tileSize).x;
    const dist = Math.abs(screenX - hx);
    if (dist > RADIUS) continue;
    const alpha = 1 - dist / RADIUS;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(screenX, hy - RADIUS);
    ctx.lineTo(screenX, hy + RADIUS);
    ctx.stroke();
  }

  for (let y = startY; y <= endY; y++) {
    const screenY = camera.worldToScreen(0, y, tileSize).y;
    const dist = Math.abs(screenY - hy);
    if (dist > RADIUS) continue;
    const alpha = 1 - dist / RADIUS;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(hx - RADIUS, screenY);
    ctx.lineTo(hx + RADIUS, screenY);
    ctx.stroke();
  }

  ctx.restore();
}
