import { Vector2 } from '../utils/vector2.js';
import { findPath } from '../pathfinding/astar.js';
import { speedMultiplier } from '../world/terrain.js';

export const TRUCK_STATE = {
  IDLE: 'idle',
  MOVING: 'moving',
  LOADING: 'loading',
  UNLOADING: 'unloading',
};

const BASE_SPEED = 2;

export class Truck {
  constructor(id, x, y, capacity = 50) {
    this.id = id;
    this.position = new Vector2(x, y);
    this.capacity = capacity;
    this.cargo = null;
    this.path = null;
    this.pathIndex = 0;
    this.state = TRUCK_STATE.IDLE;
  }

  loadCargo(type, amount) {
    const loaded = Math.min(amount, this.capacity);
    this.cargo = { type, amount: loaded };
    return loaded;
  }

  unloadCargo() {
    const cargo = this.cargo;
    this.cargo = null;
    return cargo;
  }

  isFull() {
    return this.cargo !== null && this.cargo.amount >= this.capacity;
  }

  setDestination(grid, destination) {
    const start = [Math.round(this.position.x), Math.round(this.position.y)];
    const path = findPath(grid, start, destination);
    if (!path) return false;
    this.path = path;
    this.pathIndex = 0;
    this.state = TRUCK_STATE.MOVING;
    return true;
  }

  update(deltaTime, grid) {
    if (this.state !== TRUCK_STATE.MOVING || !this.path) return;
    if (this.pathIndex >= this.path.length - 1) {
      this.state = TRUCK_STATE.IDLE;
      this.path = null;
      return;
    }

    const [tx, ty] = this.path[this.pathIndex + 1];
    const target = new Vector2(tx, ty);
    const toTarget = target.sub(this.position);
    const distance = toTarget.length();

    const currentTile = grid.tileAt(Math.round(this.position.x), Math.round(this.position.y));
    const speed = BASE_SPEED * speedMultiplier(currentTile.terrain);
    const step = speed * deltaTime;

    if (step >= distance) {
      this.position = target;
      this.pathIndex++;
    } else {
      this.position = this.position.add(toTarget.normalized().scale(step));
    }
  }
}
