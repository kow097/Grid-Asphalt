import { Tile } from './tile.js';
import { TERRAIN } from './terrain.js';
import { ResourceNode, RESOURCE_TYPES } from './resourceNode.js';
import { Port } from './port.js';
import { SeededRandom, ValueNoise2D, fbm } from '../utils/noise.js';

const RESOURCE_LIST = Object.values(RESOURCE_TYPES);
const WATER_THRESHOLD = 0.35;
const BEACH_WIDTH = 2;

export class IslandGenerator {
  constructor(seed, width, height, islandCount = 1) {
    this.seed = seed;
    this.width = width;
    this.height = height;
    this.islandCount = Math.max(1, islandCount);
    this.rand = new SeededRandom(seed);
    this.elevationNoise = new ValueNoise2D(seed, Math.max(20, Math.floor(Math.min(width, height) / 6)));
    this.resourceNoise = new ValueNoise2D(seed + 2, 8);
    this.islandCenters = this._generateIslandCenters();
  }

  _generateIslandCenters() {
    if (this.islandCount === 1) {
      return [{
        x: this.width / 2,
        y: this.height / 2,
        radius: Math.min(this.width, this.height) * 0.45,
        seedOffset: 0,
      }];
    }

    const centers = [];
    const marginX = this.width * 0.15;
    const marginY = this.height * 0.15;

    for (let i = 0; i < this.islandCount; i++) {
      const radius = Math.min(this.width, this.height) * (0.14 + this.rand.next() * 0.1);

      centers.push({
        x: marginX + this.rand.next() * (this.width - 2 * marginX),
        y: marginY + this.rand.next() * (this.height - 2 * marginY),
        radius,
        seedOffset: i * 5000,
      });
    }
    return centers;
  }

  generate(portCount) {
    const tiles = new Array(this.width * this.height);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const elevation = this._elevationAt(x, y);
        const terrain = elevation < WATER_THRESHOLD ? TERRAIN.WATER : TERRAIN.GRASS;
        tiles[y * this.width + x] = new Tile(x, y, terrain);
      }
    }

    this._applyBeaches(tiles);
    const ports = this._placePorts(tiles, portCount);
    const resourceNodes = this._scatterResources(tiles);

    return { tiles, ports, resourceNodes, width: this.width, height: this.height };
  }

  _elevationAt(x, y) {
    let maxElevation = 0;
    for (const island of this.islandCenters) {
      const dx = (x - island.x) / island.radius;
      const dy = (y - island.y) / island.radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const falloff = Math.max(0, 1 - dist);
      const noiseVal = fbm(this.elevationNoise, x + island.seedOffset, y + island.seedOffset, 4, 0.5);
      const elevation = falloff * 0.62 + noiseVal * 0.38;
      if (elevation > maxElevation) maxElevation = elevation;
    }
    return maxElevation;
  }

  _applyBeaches(tiles) {
    const { width, height } = this;
    const dist = new Int16Array(width * height).fill(-1);
    const frontier = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y * width + x].terrain === TERRAIN.WATER) {
          dist[y * width + x] = 0;
          frontier.push(x, y);
        }
      }
    }

    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let i = 0;
    while (i < frontier.length) {
      const x = frontier[i++];
      const y = frontier[i++];
      const d = dist[y * width + x];
      if (d >= BEACH_WIDTH) continue;

      for (const [dx, dy] of deltas) {
        const nx = x + dx;
        const ny = y + dy;
        if (!this._inBounds(nx, ny)) continue;
        const idx = ny * width + nx;
        if (dist[idx] !== -1 || tiles[idx].terrain === TERRAIN.WATER) continue;
        dist[idx] = d + 1;
        tiles[idx].terrain = TERRAIN.BEACH;
        frontier.push(nx, ny);
      }
    }
  }

  _inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  _seaDirection(tiles, x, y) {
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let best = null;
    let bestScore = 0;

    for (const [dx, dy] of deltas) {
      const nx = x + dx;
      const ny = y + dy;
      if (!this._inBounds(nx, ny) || tiles[ny * this.width + nx].terrain !== TERRAIN.WATER) continue;

      let score = 0;
      for (let d = 1; d <= 4; d++) {
        const cx = x + dx * d;
        const cy = y + dy * d;
        if (this._inBounds(cx, cy) && tiles[cy * this.width + cx].terrain === TERRAIN.WATER) score++;
        else break;
      }
      if (score > bestScore) {
        bestScore = score;
        best = [dx, dy];
      }
    }

    return best;
  }

  _tangentFor(dir) {
    return dir[0] !== 0 ? [0, 1] : [1, 0];
  }

  _beachDepthAt(tiles, x, y, seaDir) {
    let depth = 0;
    let cx = x;
    let cy = y;
    while (this._inBounds(cx, cy) && tiles[cy * this.width + cx].terrain === TERRAIN.BEACH && depth < 6) {
      depth++;
      cx -= seaDir[0];
      cy -= seaDir[1];
    }
    return Math.max(depth, 1);
  }

  _placePorts(tiles, desiredPortCount) {
    const ports = [];
    const coastSpots = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (tiles[y * this.width + x].terrain === TERRAIN.WATER) continue;
        const dir = this._seaDirection(tiles, x, y);
        if (dir) coastSpots.push({ x, y, dir });
      }
    }

    const portCount = Math.max(1, Math.min(desiredPortCount ?? this.islandCount, coastSpots.length));
    const step = Math.max(1, Math.floor(coastSpots.length / portCount));

    for (let i = 0; i < portCount; i++) {
      let port = null;
      for (let attempt = 0; attempt < 25 && !port; attempt++) {
        const spot = coastSpots[(i * step + attempt) % coastSpots.length];
        if (!spot) break;
        port = this._buildPort(tiles, spot, ports.length);
      }
      if (port) ports.push(port);
    }

    return ports;
  }

  _buildPort(tiles, spot, id) {
    const PORT_WIDTH_OFFSETS = [-1, 0, 1];
    const DOCK_LENGTH = 3;

    const [sx, sy] = spot.dir;
    const [tx, ty] = this._tangentFor(spot.dir);
    const depth = this._beachDepthAt(tiles, spot.x, spot.y, spot.dir);

    const columns = PORT_WIDTH_OFFSETS
      .map(t => ({ t, x: spot.x + tx * t, y: spot.y + ty * t }))
      .filter(c => this._inBounds(c.x, c.y) && tiles[c.y * this.width + c.x].terrain !== TERRAIN.WATER);

    if (columns.length < 3) return null;

    const inlandX = spot.x - sx * (depth + 1);
    const inlandY = spot.y - sy * (depth + 1);
    if (!this._inBounds(inlandX, inlandY) || tiles[inlandY * this.width + inlandX].terrain === TERRAIN.WATER) {
      return null;
    }

    const shuffled = [...columns].sort(() => this.rand.next() - 0.5);
    const dockCol = shuffled[0];
    const inputCol = shuffled[1];

    const landCells = [];
    for (const col of columns) {
      for (let d = 0; d < depth; d++) {
        const cx = col.x - sx * d;
        const cy = col.y - sy * d;
        if (this._inBounds(cx, cy)) landCells.push({ x: cx, y: cy });
      }
    }

    const inputCell = {
      x: inputCol.x - sx * (depth - 1),
      y: inputCol.y - sy * (depth - 1),
    };
    if (!this._inBounds(inputCell.x, inputCell.y)) return null;

    const dockCells = [];
    for (let d = 1; d <= DOCK_LENGTH; d++) {
      const dx2 = dockCol.x + sx * d;
      const dy2 = dockCol.y + sy * d;
      if (this._inBounds(dx2, dy2)) dockCells.push({ x: dx2, y: dy2 });
    }

    const port = new Port(inputCell.x, inputCell.y, `Port ${id}`);
    port.landCells = landCells;
    port.dockCells = dockCells;

    tiles[inputCell.y * this.width + inputCell.x].port = port;

    for (const cell of landCells) {
      const t = tiles[cell.y * this.width + cell.x];
      if (t) t.portDecoration = { port, role: 'land' };
    }
    tiles[inputCell.y * this.width + inputCell.x].portDecoration = { port, role: 'inputBase' };

    for (const cell of dockCells) {
      const t = tiles[cell.y * this.width + cell.x];
      if (t) t.portDecoration = { port, role: 'dockPier' };
    }

    return port;
  }

  _scatterResources(tiles) {
    const nodes = [];
    const minSpacing = 6;
    const placed = [];

    for (let y = 0; y < this.height; y += 3) {
      for (let x = 0; x < this.width; x += 3) {
        const tile = tiles[y * this.width + x];
        if (tile.terrain === TERRAIN.WATER || tile.terrain === TERRAIN.BEACH || tile.port) continue;

        const density = this.resourceNoise.sample(x, y);
        if (density < 0.78) continue;

        const tooClose = placed.some(p => Math.hypot(p.x - x, p.y - y) < minSpacing);
        if (tooClose) continue;

        const typeRoll = this.resourceNoise.sample(x + 1000, y + 1000);
        const type = RESOURCE_LIST[Math.floor(typeRoll * RESOURCE_LIST.length) % RESOURCE_LIST.length];
        const richness = 1 + Math.floor(this.resourceNoise.sample(x + 2000, y + 2000) * 3);

        const node = new ResourceNode(x, y, type, richness);
        tile.resourceNode = node;
        nodes.push(node);
        placed.push({ x, y });
      }
    }

    this._ensureAllTypesPresent(tiles, nodes);
    return nodes;
  }

  _ensureAllTypesPresent(tiles, nodes) {
    const presentTypes = new Set(nodes.map(n => n.type));
    const missingTypes = RESOURCE_LIST.filter(t => !presentTypes.has(t));
    if (missingTypes.length === 0) return;

    const candidates = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = tiles[y * this.width + x];
        if (tile.terrain === TERRAIN.WATER || tile.terrain === TERRAIN.BEACH || tile.port || tile.resourceNode) continue;
        candidates.push({ x, y });
      }
    }

    for (const type of missingTypes) {
      if (candidates.length === 0) break;
      const idx = Math.floor(this.rand.next() * candidates.length);
      const spot = candidates.splice(idx, 1)[0];
      const tile = tiles[spot.y * this.width + spot.x];
      const richness = 1 + Math.floor(this.rand.next() * 3);
      const node = new ResourceNode(spot.x, spot.y, type, richness);
      tile.resourceNode = node;
      nodes.push(node);
    }
  }
}
