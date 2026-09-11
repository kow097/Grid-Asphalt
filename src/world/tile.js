import { TERRAIN } from './terrain.js';

export class Tile {
  constructor(x, y, terrain = TERRAIN.GRASS) {
    this.x = x;
    this.y = y;
    this.terrain = terrain;
    this.resourceNode = null;
    this.building = null;
    this.port = null;
  }

  isOccupied() {
    return this.building !== null;
  }
}
