// Desnostrana traka: pomak okomit na smjer voznje, na DESNU stranu gledano
// iz smjera kretanja (npr. voznja udesno -> traka pomaknuta prema jugu).
// Formula: rightHandOffset(dx,dy) = (-dy, dx).
// LANE_OFFSET povecan (bio 0.2) - kod 0.2 razmak izmedju dvije suprotne trake
// je bio jedva primjetan, izgledalo je kao da kamioni prolaze jedan kroz
// drugog iako logika blokiranja radi ispravno (razlicit smjer = razlicita
// traka = ne blokira, vidi _isNextTileBlocked u engine.js).
const LANE_OFFSET = 0.28;
const TRUCK_SIZE_RATIO = 0.34;

export function renderTrucks(ctx, camera, trucks, tileSize, assets) {
  const truckSprite = assets?.get('truck');

  for (const truck of trucks) {
    const heading = truck.visualHeading ?? truck.heading ?? { dx: 0, dy: 1 };
    const laneX = truck.position.x - heading.dy * LANE_OFFSET;
    const laneY = truck.position.y + heading.dx * LANE_OFFSET;
    const screen = camera.worldToScreen(laneX, laneY, tileSize);
    const size = tileSize * camera.zoom * TRUCK_SIZE_RATIO;

    if (truckSprite) {
      // Pretpostavka: truck.json je nacrtan okrenut UDESNO (istok) kao
      // kanonska orijentacija - ako je nacrtan drugacije, promijeni ovdje
      // koji se kut oduzima (vidi ROADMAP handoff).
      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.rotate(Math.atan2(heading.dy, heading.dx));
      truckSprite.draw(ctx, -size / 2, -size / 2, size);
      ctx.restore();
    } else {
      ctx.fillStyle = truck.cargo ? '#e0a030' : '#cccccc';
      ctx.fillRect(screen.x - size / 2, screen.y - size / 2, size, size);
    }
  }
}

export function renderRoute(ctx, camera, truck, tileSize) {
  if (!truck?.route?.legs) return;

  ctx.strokeStyle = '#ffee55';
  ctx.lineWidth = Math.max(1, tileSize * camera.zoom * 0.08);

  for (const leg of truck.route.legs) {
    if (leg.length < 2) continue;
    ctx.beginPath();
    for (let i = 0; i < leg.length; i++) {
      const [x, y] = leg[i];
      const screen = camera.worldToScreen(x + 0.5, y + 0.5, tileSize);
      if (i === 0) ctx.moveTo(screen.x, screen.y);
      else ctx.lineTo(screen.x, screen.y);
    }
    ctx.stroke();
  }

  for (const [x, y] of truck.route.waypoints) {
    const screen = camera.worldToScreen(x + 0.5, y + 0.5, tileSize);
    ctx.fillStyle = '#ffee55';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, tileSize * camera.zoom * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function renderPendingWaypoints(ctx, camera, points, paths, tileSize) {
  if (!points || points.length === 0) return;
  const size = tileSize * camera.zoom;

  if (paths && paths.length > 0) {
    ctx.strokeStyle = '#ffee55';
    ctx.lineWidth = Math.max(1, size * 0.06);
    for (const leg of paths) {
      if (!leg || leg.length < 2) continue;
      ctx.beginPath();
      leg.forEach(([x, y], i) => {
        const screen = camera.worldToScreen(x + 0.5, y + 0.5, tileSize);
        if (i === 0) ctx.moveTo(screen.x, screen.y);
        else ctx.lineTo(screen.x, screen.y);
      });
      ctx.stroke();
    }
  }

  ctx.fillStyle = '#ffee55';
  for (const [x, y] of points) {
    const screen = camera.worldToScreen(x + 0.5, y + 0.5, tileSize);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function renderDragPreview(ctx, camera, tiles, mode, tileSize) {
  if (!tiles) return;
  const size = tileSize * camera.zoom;

  let color = 'rgba(255, 238, 85, 0.35)';
  if (mode === 'demolish') color = 'rgba(220, 60, 60, 0.35)';
  else if (mode === 'conveyor') color = 'rgba(80, 200, 220, 0.35)';
  else if (mode === 'merger') color = 'rgba(200, 100, 220, 0.35)';

  ctx.fillStyle = color;
  for (const [x, y] of tiles) {
    const screen = camera.worldToScreen(x, y, tileSize);
    ctx.fillRect(screen.x, screen.y, size + 1, size + 1);
  }

  if ((mode === 'conveyor' || mode === 'merger') && tiles.length >= 2) {
    const [x0, y0] = tiles[tiles.length - 2];
    const [x1, y1] = tiles[tiles.length - 1];
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    const screen = camera.worldToScreen(x1 + 0.5, y1 + 0.5, tileSize);
    const arrowSize = size * 0.25;

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.6);
    ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function renderBuildGhost(ctx, camera, preview, tileSize) {
  if (!preview) return;
  const size = tileSize * camera.zoom;

  ctx.fillStyle = preview.valid ? 'rgba(80, 220, 100, 0.4)' : 'rgba(220, 60, 60, 0.4)';
  for (const [x, y] of preview.cells) {
    const screen = camera.worldToScreen(x, y, tileSize);
    ctx.fillRect(screen.x, screen.y, size + 1, size + 1);
  }

  if (preview.valid && preview.inputCell) {
    const s = camera.worldToScreen(preview.inputCell[0] + 0.5, preview.inputCell[1] + 0.5, tileSize);
    ctx.fillStyle = 'rgba(74, 144, 217, 0.9)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  if (preview.valid && preview.inputCells) {
    ctx.fillStyle = 'rgba(74, 144, 217, 0.9)';
    for (const [ix, iy] of preview.inputCells) {
      const s = camera.worldToScreen(ix + 0.5, iy + 0.5, tileSize);
      ctx.beginPath();
      ctx.arc(s.x, s.y, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (preview.valid && preview.outputCell) {
    const s = camera.worldToScreen(preview.outputCell[0] + 0.5, preview.outputCell[1] + 0.5, tileSize);
    ctx.fillStyle = 'rgba(245, 166, 35, 0.9)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  if (preview.valid && preview.outputCells) {
    ctx.fillStyle = 'rgba(245, 166, 35, 0.9)';
    for (const [ox, oy] of preview.outputCells) {
      const s = camera.worldToScreen(ox + 0.5, oy + 0.5, tileSize);
      ctx.beginPath();
      ctx.arc(s.x, s.y, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (!preview.valid) {
    const [x, y] = preview.cells[0];
    const screen = camera.worldToScreen(x, y, tileSize);
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(screen.x + size * 0.2, screen.y + size * 0.2);
    ctx.lineTo(screen.x + size * 0.8, screen.y + size * 0.8);
    ctx.moveTo(screen.x + size * 0.8, screen.y + size * 0.2);
    ctx.lineTo(screen.x + size * 0.2, screen.y + size * 0.8);
    ctx.stroke();
  }
}
