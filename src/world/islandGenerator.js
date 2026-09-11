import { Tile } from './tile.js';
import { TERRAIN } from './terrain.js';
import { ResourceNode, RESOURCE_TYPES } from './resourceNode.js';
import { Port } from './port.js';
import { ValueNoise2D } from '../utils/noise.js';

const RESOURCE_LIST = Object.values(RESOURCE_TYPES);

export class IslandGenerator {
  constructor(seed, width, height) {
    this.seed = seed;
    this.width = width;
    this.height = height;
    this.elevationNoise = new ValueNoise2D(seed, 40);
    this.resourceNoise = new ValueNoise2D(seed + 2, 8);
  }

  generate() {
    const tiles = new Array(this.width * this.height);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const elevation = this._islandElevation(x, y);
        const terrain = elevation < 0.35 ? TERRAIN.WATER : TERRAIN.GRASS;
        tiles[y * this.width + x] = new Tile(x, y, terrain);
      }
    }

    const ports = this._placePorts(tiles);
    const resourceNodes = this._scatterResources(tiles);

    return { tiles, ports, resourceNodes, width: this.width, height: this.height };
  }

  _islandElevation(x, y) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const dx = (x - cx) / cx;
    const dy = (y - cy) / cy;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    const falloff = Math.max(0, 1 - distFromCenter);
    const noiseVal = this.elevationNoise.sample(x, y);
    return falloff * 0.7 + noiseVal * 0.3;
  }

  _placePorts(tiles) {
    const ports = [];
    const coastTiles = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = tiles[y * this.width + x];
        if (tile.terrain === TERRAIN.WATER) continue;
        if (this._isCoastal(tiles, x, y)) coastTiles.push(tile);
      }
    }

    const portCount = Math.max(3, Math.floor(coastTiles.length / 150));
    const step = Math.max(1, Math.floor(coastTiles.length / portCount));

    for (let i = 0; i < portCount; i++) {
      const tile = coastTiles[i * step];
      if (!tile) continue;
      const port = new Port(tile.x, tile.y, `Port ${i + 1}`);
      tile.port = port;
      ports.push(port);
    }

    return ports;
  }

  _isCoastal(tiles, x, y) {
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of deltas) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) return true;
      const neighbor = tiles[ny * this.width + nx];
      if (neighbor.terrain === TERRAIN.WATER) return true;
    }
    return false;
  }

  _scatterResources(tiles) {
    const nodes = [];
    const minSpacing = 6;
    const placed = [];

    for (let y = 0; y < this.height; y += 3) {
      for (let x = 0; x < this.width; x += 3) {
        const tile = tiles[y * this.width + x];
        if (tile.terrain === TERRAIN.WATER || tile.port) continue;

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

    return nodes;
  }
}
