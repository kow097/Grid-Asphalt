import { TERRAIN_COLORS, RESOURCE_COLORS, BUILDING_COLORS, DOCK_COLOR, PORT_BASE_COLOR, CONVEYOR_COLOR, MERGER_COLOR } from './spriteAtlas.js';

const TERRAIN_ASSET_KEYS = {
  grass: 'terrain_grass',
  gravel: 'terrain_gravel',
  dirt_road: 'terrain_dirt_road',
  asphalt: 'terrain_asphalt',
  water: 'terrain_water',
  bridge_wood: 'terrain_bridge_wood',
  bridge_concrete: 'terrain_bridge_concrete',
  bridge_steel: 'terrain_bridge_steel',
};

const RESOURCE_ASSET_KEYS = {
  iron: 'resource_iron',
  copper: 'resource_copper',
  coal: 'resource_coal',
  stone: 'resource_stone',
  oil: 'resource_oil',
};

// Warehouse sprite je nacrtan za rotation=0 (ulaz lijevo, izlazi desno).
// Input/output su UVIJEK nasuprotne strane (ne pod 90° kao kod mergera), pa
// se preostala 3 stanja ne mogu dobiti cistom rotacijom - 2 su MIRROR
// (horizontalni flip), ne rotacija. Provjereno numericki prije pisanja koda
// (rotira canonicalni "ulaz gleda lijevo" vektor kroz svako stanje i
// usporedjuje s ocekivanim smjerom iz warehouseRotations()).
const WAREHOUSE_SPRITE_TRANSFORMS = [
  { angle: 0, flipX: false },
  { angle: Math.PI / 2, flipX: false },
  { angle: 0, flipX: true },
  { angle: Math.PI / 2, flipX: true },
];

// Pozicije 3 kvadratica + "progress bar" vrata za SVAKI output slot, kao
// razlomak (0-1) od 256x256 platna - iz stvarnog SVG-a (output-slot-1/2
// grupe). Vrijedi TOCNO za 2-slotni (WAREHOUSE_SMALL) sprite; drugi broj
// slotova nema jos svoj asset pa se overlay/sprite tad preskace.
const WH_BAND_START_Y = 20 / 256;
const WH_BAND_HEIGHT = 120 / 256;
const WH_BOX_SIZE = 20 / 256;
const WH_BOX_A = { x: 152 / 256, relY: 16 / 256 };
const WH_BOX_B = { x: 176 / 256, relY: 16 / 256 };
const WH_BOX_C = { x: 152 / 256, relY: 40 / 256 };
const WH_BAR = { x: 204 / 256, relY: 16 / 256, w: 20 / 256, h: 64 / 256 };

function drawWarehouseOverlay(ctx, warehouse, w, h) {
  warehouse.slots.forEach((slot, i) => {
    const bandY = WH_BAND_START_Y + i * WH_BAND_HEIGHT;
    const color = slot.assignedType ? (RESOURCE_COLORS[slot.assignedType] || '#888') : 'rgba(255,255,255,0.12)';

    ctx.fillStyle = color;
    ctx.fillRect(WH_BOX_A.x * w, (bandY + WH_BOX_A.relY) * h, WH_BOX_SIZE * w, WH_BOX_SIZE * h);
    ctx.fillRect(WH_BOX_B.x * w, (bandY + WH_BOX_B.relY) * h, WH_BOX_SIZE * w, WH_BOX_SIZE * h);
    ctx.fillRect(WH_BOX_C.x * w, (bandY + WH_BOX_C.relY) * h, WH_BOX_SIZE * w, WH_BOX_SIZE * h);

    if (!slot.assignedType) return;
    const barX = WH_BAR.x * w;
    const barY = (bandY + WH_BAR.relY) * h;
    const barW = WH_BAR.w * w;
    const barH = WH_BAR.h * h;
    const pct = warehouse.capacityPerSlot > 0 ? Math.min(1, slot.amount / warehouse.capacityPerSlot) : 0;
    const fillH = barH * pct;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = color;
    // Puni se ODOZDO prema gore (kao termometar) - intuitivnije za "koliko
    // je puno" nego odozgo prema dolje.
    ctx.fillRect(barX, barY + (barH - fillH), barW, fillH);
  });
}

// Kanonicna umjetnina za "conveyor_corner" mora biti nacrtana kao: ulaz
// odozgora (item dolazi krecuci se prema dolje, dy=+1), izlaz udesno
// (dx=+1). Ova funkcija racuna rotaciju (kut) + eventualno zrcaljenje
// (flip po lokalnoj Y osi NAKON rotacije) koji tu JEDNU umjetninu prebacuju
// u bilo koju od 8 mogucih ulaz/izlaz kombinacija - tako se ne mora raditi
// zaseban sprite za svaki smjer/kut, engine sam racuna transformaciju.
function cornerTransform(fromDir, toDir) {
  const CANON_HANDEDNESS = 0 * 0 - 1 * 1; // cross(fromCanon=(0,1), toCanon=(1,0))
  const handedness = fromDir.dx * toDir.dy - fromDir.dy * toDir.dx;
  return {
    angle: Math.atan2(toDir.dy, toDir.dx),
    flip: handedness !== CANON_HANDEDNESS,
  };
}

function drawSideStripe(ctx, screen, w, h, pad, side, color, segmentCount) {
  const thickness = Math.max(2, Math.min(w, h) * 0.15);
  const gap = Math.min(w, h) * 0.08;
  const isHorizontal = side === 'top' || side === 'bottom';

  ctx.fillStyle = color;

  if (isHorizontal) {
    const segW = (w - pad * 2 - gap * (segmentCount - 1)) / segmentCount;
    const y = side === 'top' ? screen.y + pad : screen.y + h - pad - thickness;
    for (let i = 0; i < segmentCount; i++) {
      ctx.fillRect(screen.x + pad + i * (segW + gap), y, segW, thickness);
    }
  } else {
    const segH = (h - pad * 2 - gap * (segmentCount - 1)) / segmentCount;
    const x = side === 'left' ? screen.x + pad : screen.x + w - pad - thickness;
    for (let i = 0; i < segmentCount; i++) {
      ctx.fillRect(x, screen.y + pad + i * (segH + gap), thickness, segH);
    }
  }
}

function visibleRange(ctx, camera, world, tileSize) {
  const topLeft = camera.screenToWorld(0, 0, tileSize);
  const bottomRight = camera.screenToWorld(ctx.canvas.width, ctx.canvas.height, tileSize);
  return {
    startX: Math.max(0, Math.floor(topLeft.x) - 1),
    startY: Math.max(0, Math.floor(topLeft.y) - 1),
    endX: Math.min(world.width - 1, Math.ceil(bottomRight.x) + 1),
    endY: Math.min(world.height - 1, Math.ceil(bottomRight.y) + 1),
  };
}

function renderDust(ctx, cx, cy, size, time) {
  const count = 5;
  for (let i = 0; i < count; i++) {
    const t = (time * 0.6 + i / count) % 1;
    const angle = (i * 137.5) * (Math.PI / 180);
    const dist = t * size * 0.4;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist - t * size * 0.25;
    const alpha = (1 - t) * 0.45;

    ctx.fillStyle = `rgba(180, 160, 130, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.05 * (1 - t * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
}

export function renderTiles(ctx, camera, world, tileSize, assets, elapsedTime = 0) {
  const { tiles, width } = world;
  const { startX, startY, endX, endY } = visibleRange(ctx, camera, world, tileSize);
  const size = tileSize * camera.zoom;

  // PASS 1: terrain, resource nodes, port decoration - nista ovdje ne smije
  // biti prekriveno kasnijim crtanjem, pa zgrade idu tek u drugom prolazu.
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const tile = tiles[y * width + x];
      const screen = camera.worldToScreen(x, y, tileSize);

      const terrainSprite = assets?.get(TERRAIN_ASSET_KEYS[tile.terrain]);
      if (terrainSprite) {
        terrainSprite.draw(ctx, screen.x, screen.y, size + 1);
      } else {
        ctx.fillStyle = TERRAIN_COLORS[tile.terrain] || '#000';
        ctx.fillRect(screen.x, screen.y, size + 1, size + 1);
      }

      if (tile.resourceNode) {
        const pad = size * 0.25;
        const resourceSprite = assets?.get(RESOURCE_ASSET_KEYS[tile.resourceNode.type]);
        if (resourceSprite) {
          resourceSprite.draw(ctx, screen.x + pad, screen.y + pad, size - pad * 2);
        } else {
          ctx.fillStyle = RESOURCE_COLORS[tile.resourceNode.type] || '#fff';
          ctx.fillRect(screen.x + pad, screen.y + pad, size - pad * 2, size - pad * 2);
        }
      }

      if (tile.portDecoration) {
        const { role } = tile.portDecoration;

        if (role === 'dockPier') {
          ctx.fillStyle = DOCK_COLOR;
          ctx.fillRect(screen.x, screen.y, size + 1, size + 1);
        } else {
          ctx.fillStyle = PORT_BASE_COLOR;
          ctx.fillRect(screen.x, screen.y, size + 1, size + 1);
        }

        if (role === 'inputBase') {
          ctx.fillStyle = '#e8c547';
          ctx.beginPath();
          ctx.arc(screen.x + size / 2, screen.y + size / 2, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // PASS 2: zgrade. Nakon svih terrain crtanja, tako da multi-tile
  // zgrade koje se protezu u susjedne celije ne mogu biti prekrivene
  // travom/plazom te celije kad na nju dodje red u petlji.
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const tile = tiles[y * width + x];
      if (!tile.building) continue;
      const screen = camera.worldToScreen(x, y, tileSize);

      if (tile.building.kind === 'merger') {
        const { dx, dy } = tile.building.direction;
        const cx = screen.x + size / 2;
        const cy = screen.y + size / 2;

        // Fallback dok ne postoji pravi sprite: drukcija boja od conveyora,
        // izlazna strelica (puna, prema .direction) + male strelice UNUTRA na
        // svakoj definiranoj ulaznoj strani.
        ctx.fillStyle = MERGER_COLOR;
        ctx.fillRect(screen.x, screen.y, size + 1, size + 1);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.atan2(dy, dx));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        const arrowSize = size * 0.2;
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.6);
        ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        for (const [idx, idy] of tile.building.inputOffsets) {
          ctx.save();
          ctx.translate(cx + idx * size * 0.38, cy + idy * size * 0.38);
          ctx.rotate(Math.atan2(-idy, -idx));
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          const s = size * 0.12;
          ctx.beginPath();
          ctx.moveTo(s, 0);
          ctx.lineTo(-s * 0.6, -s * 0.6);
          ctx.lineTo(-s * 0.6, s * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        continue;
      }

      if (tile.building.kind === 'conveyor') {
        const { dx, dy } = tile.building.direction;
        const cx = screen.x + size / 2;
        const cy = screen.y + size / 2;

        // "Koljeno" = tile ciji .next fizicki NIJE ondje gdje bi vlastiti
        // .direction ocekivao - tada treba L (corner) sprite umjesto ravnog.
        const nextSeg = tile.building.next;
        const isCorner = !!nextSeg && (nextSeg.x - x !== dx || nextSeg.y - y !== dy);
        const exitDir = isCorner ? { dx: nextSeg.x - x, dy: nextSeg.y - y } : { dx, dy };
        const sprite = assets?.get(isCorner ? 'conveyor_corner' : 'conveyor_straight');

        if (sprite) {
          const animState = { time: elapsedTime, active: tile.building.powered };
          ctx.save();
          ctx.translate(cx, cy);
          if (isCorner) {
            const { angle, flip } = cornerTransform({ dx, dy }, exitDir);
            ctx.rotate(angle);
            if (flip) ctx.scale(1, -1);
          } else {
            ctx.rotate(Math.atan2(dy, dx));
          }
          sprite.draw(ctx, -size / 2, -size / 2, size, size, animState);
          ctx.restore();
          continue;
        }

        // Fallback dok sprite-ovi nisu ucitani/postoje: puno polje + strelica
        // rotirana na simetralu izmedju vlastitog i stvarnog izlaznog smjera.
        ctx.fillStyle = CONVEYOR_COLOR;
        ctx.fillRect(screen.x, screen.y, size + 1, size + 1);

        const arrowSize = size * 0.18;
        let angle = Math.atan2(dy, dx);
        if (isCorner) {
          const sx = dx + exitDir.dx, sy = dy + exitDir.dy;
          if (sx !== 0 || sy !== 0) angle = Math.atan2(sy, sx);
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.6);
        ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        continue;
      }

      const isMultiTile = Number.isFinite(tile.building.anchorX);

      if (isMultiTile) {
        if (tile.x !== tile.building.anchorX || tile.y !== tile.building.anchorY) continue;

        const w = tile.building.footprintWidth * size;
        const h = tile.building.footprintHeight * size;
        const pad = size * 0.08;

        const buildingSprite = assets?.get(tile.building.kind);
        const isWorking = tile.building.kind === 'extractor' && tile.building.outputBuffer < tile.building.maxBuffer;
        const animState = { time: elapsedTime, active: isWorking };

        // Warehouse - poseban slucaj: sprite je nacrtan za rotation=0 i mora
        // se rotirati/zrcaliti da prati stvarnu orijentaciju (vidi
        // WAREHOUSE_SPRITE_TRANSFORMS), plus overlay (boje resursa +
        // "termometar" popunjenosti po slotu) iscrtan PREKO spritea u ISTOM
        // transformiranom prostoru. Sprite/overlay postoje samo za 2-slotni
        // (WAREHOUSE_SMALL) raspored - drugi broj slotova nema svoj asset.
        const isKnownWarehouseLayout = tile.building.kind === 'warehouse' && tile.building.slots?.length === 2;
        if (buildingSprite && isKnownWarehouseLayout) {
          const cx = screen.x + w / 2;
          const cy = screen.y + h / 2;
          const t = WAREHOUSE_SPRITE_TRANSFORMS[tile.building.rotation ?? 0];
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(t.angle);
          if (t.flipX) ctx.scale(-1, 1);
          const dw = w - pad * 2;
          const dh = h - pad * 2;
          buildingSprite.draw(ctx, -dw / 2, -dh / 2, dw, dh, animState);
          drawWarehouseOverlay(ctx, tile.building, dw, dh);
          ctx.restore();
        } else if (buildingSprite) {
          buildingSprite.draw(ctx, screen.x + pad, screen.y + pad, w - pad * 2, h - pad * 2, animState);
        } else if (tile.building.kind === 'warehouse') {
          // Fallback bez spritea (5-slotni Large Warehouse, ili ako asset
          // nije ucitan) - po-celijski, koristeci generic inputCells/
          // outputCells umjesto stare tvrdo-kodirane anchorX pretpostavke,
          // pa i dalje ispravno prati rotaciju.
          const wh = tile.building;
          const cellPad = size * 0.1;
          for (const [cx, cy] of [...wh.inputCells, ...wh.outputCells]) {
            const cellScreen = camera.worldToScreen(cx, cy, tileSize);
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(cellScreen.x + 2, cellScreen.y + 2, size - 4, size - 4);

            const outSlot = wh.outputSlotIndexAt(cx, cy);
            if (outSlot !== -1) {
              const slot = wh.slots[outSlot];
              ctx.fillStyle = slot?.assignedType ? (RESOURCE_COLORS[slot.assignedType] || '#ffffff') : '#888888';
            } else {
              ctx.fillStyle = '#4a90d9';
            }
            ctx.fillRect(cellScreen.x + cellPad, cellScreen.y + cellPad, size - cellPad * 2, size - cellPad * 2);
          }
        } else {
          ctx.fillStyle = BUILDING_COLORS[tile.building.kind] || '#ffffff';
          ctx.fillRect(screen.x + pad, screen.y + pad, w - pad * 2, h - pad * 2);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(1, size * 0.03);
          ctx.strokeRect(screen.x + pad, screen.y + pad, w - pad * 2, h - pad * 2);
        }

        if (tile.building.resourceNode) {
          const node = tile.building.resourceNode;
          const nodeScreen = camera.worldToScreen(node.x + 0.5, node.y + 0.5, tileSize);
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = RESOURCE_COLORS[node.type] || '#ffffff';
          ctx.lineWidth = Math.max(1, size * 0.025);
          ctx.beginPath();
          ctx.arc(nodeScreen.x, nodeScreen.y, size * 0.16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;

          if (isWorking) renderDust(ctx, nodeScreen.x, nodeScreen.y, size, elapsedTime);
        }

        if (tile.building.kind === 'smelter' || tile.building.kind === 'factory' || tile.building.kind === 'assembler') {
          const inputSide = tile.building.inputSide ?? 'top';
          const outputSide = tile.building.outputSide ?? 'bottom';
          const inputCount = (inputSide === 'top' || inputSide === 'bottom')
            ? tile.building.footprintWidth
            : tile.building.footprintHeight;
          const outputCount = (outputSide === 'top' || outputSide === 'bottom')
            ? tile.building.footprintWidth
            : tile.building.footprintHeight;

          drawSideStripe(ctx, screen, w, h, pad, inputSide, 'rgba(74, 144, 217, 0.5)', inputCount);
          drawSideStripe(ctx, screen, w, h, pad, outputSide, 'rgba(245, 166, 35, 0.5)', outputCount);
        }
      } else {
        const buildingSprite = assets?.get(tile.building.kind);
        const pad = size * 0.12;
        if (buildingSprite) {
          buildingSprite.draw(ctx, screen.x + pad, screen.y + pad, size - pad * 2);
        } else {
          ctx.fillStyle = BUILDING_COLORS[tile.building.kind] || '#ffffff';
          ctx.fillRect(screen.x + pad, screen.y + pad, size - pad * 2, size - pad * 2);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(1, size * 0.03);
          ctx.strokeRect(screen.x + pad, screen.y + pad, size - pad * 2, size - pad * 2);
        }
      }
    }
  }

  // PASS 3: conveyor itemi. Crtaju se nakon SVIH belt pozadina (PASS 2),
  // inace item cija kruznica blago prijedje u susjedni tile biva prekriven
  // kad na taj susjedni tile dodje red u PASS 2 petlji.
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const tile = tiles[y * width + x];
      if (tile.building?.kind !== 'conveyor') continue;
      const screen = camera.worldToScreen(x, y, tileSize);
      const cx = screen.x + size / 2;
      const cy = screen.y + size / 2;
      const { dx, dy } = tile.building.direction;

      for (const item of tile.building.items) {
        const entry = item.entryDir || { dx, dy };
        const nextSeg = tile.building.next;
        const exit = nextSeg ? { dx: nextSeg.x - x, dy: nextSeg.y - y } : { dx, dy };
        let px, py;
        if (item.progress <= 0.5) {
          const t = item.progress / 0.5;
          px = cx - entry.dx * 0.5 * size * (1 - t);
          py = cy - entry.dy * 0.5 * size * (1 - t);
        } else {
          const t = (item.progress - 0.5) / 0.5;
          px = cx + exit.dx * 0.5 * size * t;
          py = cy + exit.dy * 0.5 * size * t;
        }
        ctx.fillStyle = RESOURCE_COLORS[item.type] || '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export function renderPorts(ctx, camera, ports, tileSize) {
  for (const port of ports) {
    const size = tileSize * camera.zoom;
    if (size <= 10) continue;

    const screen = camera.worldToScreen(port.x + 0.5, port.y + 0.5, tileSize);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(9, size * 0.32)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Port ${port.id}`, screen.x, screen.y - size * 0.4);
  }
}
