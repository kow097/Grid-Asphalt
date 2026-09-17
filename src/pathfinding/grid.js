import { isWalkable, speedMultiplier } from '../world/terrain.js';

export class PathGrid {
  constructor(tiles, width, height) {
    this.tiles = tiles;
    this.width = width;
    this.height = height;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  tileAt(x, y) {
    return this.tiles[y * this.width + x];
  }

  isWalkable(x, y) {
    if (!this.inBounds(x, y)) return false;
    const tile = this.tileAt(x, y);
    // Dock/pristanisni tileovi (portDecoration) su vizualno cvrsta platforma
    // preko vode - hodljivi su bez obzira sto im je terrain jos uvijek 'water'
    // ispod (nikad se ne mijenja pri generaciji porta).
    if (tile.portDecoration) return true;
    return isWalkable(tile.terrain);
  }

  moveCost(x, y) {
    const tile = this.tileAt(x, y);
    if (tile.portDecoration) return 1;
    const mult = speedMultiplier(tile.terrain);
    return mult === 0 ? Infinity : 1 / mult;
  }

  neighbors(x, y) {
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const result = [];
    for (const [dx, dy] of deltas) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isWalkable(nx, ny)) result.push([nx, ny]);
    }
    return result;
  }
}
