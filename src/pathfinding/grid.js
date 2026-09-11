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
    return isWalkable(tile.terrain) && !tile.isOccupied();
  }

  moveCost(x, y) {
    const mult = speedMultiplier(this.tileAt(x, y).terrain);
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
