import { Vector2 } from '../utils/vector2.js';
import { findPath } from '../pathfinding/astar.js';
import { speedMultiplier as terrainSpeedMultiplier } from '../world/terrain.js';

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
    this.position = new Vector2(x + 0.5, y + 0.5);
    this.capacity = capacity;
    this.cargo = null;
    this.path = null;
    this.pathIndex = 0;
    this.state = TRUCK_STATE.IDLE;
    this.manualControl = false;
    // Smjer zadnjeg aktivnog pomaka (grid-osi vektor, npr {dx:1,dy:0}).
    // Ostaje postavljen i dok kamion miruje - koristi se za desnostranu
    // traku (lane offset) pri crtanju i za odlucivanje blokiraju li se
    // dva kamiona na istom tileu (isti smjer = ista traka = blokira,
    // razlicit smjer = razlicita traka = ne blokira). OVO OSTAJE TRENUTNO
    // (bez zaglađivanja) - koristi ga logika blokiranja, ne smije kasniti.
    this.heading = null;
    // ISKLJUČIVO za crtanje: glatko "sustiže" heading svaki tick umjesto da
    // skoci na novu vrijednost istog trenutka kad kamion skrene na kutu -
    // bez ovoga bi desnostrani pomak (LANE_OFFSET) instant-skociso s jedne
    // strane na drugu tocno na kutu ("teleportira se kad skrece").
    this.visualHeading = { dx: 0, dy: 1 };
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
    const start = [Math.floor(this.position.x), Math.floor(this.position.y)];
    const path = findPath(grid, start, destination);
    if (!path) return false;
    this.path = path;
    this.pathIndex = 0;
    this.state = TRUCK_STATE.MOVING;
    return true;
  }

  update(deltaTime, grid, speedMultiplier = 1, blocked = false) {
    if (this.state !== TRUCK_STATE.MOVING || !this.path) return;
    if (this.pathIndex >= this.path.length - 1) {
      this.state = TRUCK_STATE.IDLE;
      this.path = null;
      return;
    }
    if (blocked) return;

    const [cx, cy] = this.path[this.pathIndex];
    const [tx, ty] = this.path[this.pathIndex + 1];
    this.heading = { dx: Math.sign(tx - cx), dy: Math.sign(ty - cy) };

    const target = new Vector2(tx + 0.5, ty + 0.5);
    const toTarget = target.sub(this.position);
    const distance = toTarget.length();

    const currentTile = grid.tileAt(Math.floor(this.position.x), Math.floor(this.position.y));
    const speed = BASE_SPEED * terrainSpeedMultiplier(currentTile.terrain) * speedMultiplier;
    const step = speed * deltaTime;

    // Zaglađivanje vezano uz STVARNO PRIJEĐENU UDALJENOST (ne uz vrijeme) -
    // zavoj se uvijek "otvori" nakon iste razmjerne kolicine voznje, bez
    // obzira na trenutnu brzinu (teren, x1/x2/x3 ubrzanje). Da je vezano uz
    // vrijeme, na vecoj brzini bi ista vremenska duljina odgovarala puno
    // vecoj prijedjenoj udaljenosti pa bi zavoj izgledao "prebrzo"/trznuto.
    const VISUAL_LERP_DISTANCE = 0.8;
    const lerpT = Math.min(1, step / VISUAL_LERP_DISTANCE);
    this.visualHeading = {
      dx: this.visualHeading.dx + (this.heading.dx - this.visualHeading.dx) * lerpT,
      dy: this.visualHeading.dy + (this.heading.dy - this.visualHeading.dy) * lerpT,
    };

    if (step >= distance) {
      this.position = target;
      this.pathIndex++;
    } else {
      this.position = this.position.add(toTarget.normalized().scale(step));
    }
  }
}
