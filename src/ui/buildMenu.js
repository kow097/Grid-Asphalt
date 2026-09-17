import { Extractor } from '../production/extractor.js';
import { Smelter } from '../production/smelter.js';
import { Factory } from '../production/factory.js';
import { Assembler } from '../production/assembler.js';
import { RECIPES } from '../production/recipe.js';
import { TERRAIN } from '../world/terrain.js';
import { Warehouse } from '../logistics/warehouse.js';
import { Merger, MERGER_VARIANTS, mergerRotations } from '../logistics/merger.js';
import { TruckGarage } from '../logistics/truckGarage.js';
import { PowerPlant } from '../production/powerPlant.js';
import { Battery } from '../logistics/battery.js';
import { PowerPole } from '../logistics/powerPole.js';

const ROAD_TIERS = [TERRAIN.GRAVEL, TERRAIN.DIRT_ROAD, TERRAIN.ASPHALT];
const BRIDGE_TIERS = [TERRAIN.BRIDGE_WOOD, TERRAIN.BRIDGE_CONCRETE, TERRAIN.BRIDGE_STEEL];
const BEACH_ROAD_SURCHARGE = 1.3;

const EXTRACTOR_SHAPES = [
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[-1, 0], [0, 0], [-1, 1], [0, 1]],
  [[0, -1], [1, -1], [0, 0], [1, 0]],
  [[-1, -1], [0, -1], [-1, 0], [0, 0]],
];

function rect(w, h) {
  const cells = [];
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      cells.push([x, y]);
    }
  }
  return cells;
}

function buildRotations(baseW, baseH) {
  return [
    { cells: rect(baseW, baseH), inputSide: 'top', outputSide: 'bottom' },
    { cells: rect(baseH, baseW), inputSide: 'right', outputSide: 'left' },
    { cells: rect(baseW, baseH), inputSide: 'bottom', outputSide: 'top' },
    { cells: rect(baseH, baseW), inputSide: 'left', outputSide: 'right' },
  ];
}

const SMELTER_ROTATIONS = buildRotations(2, 2);
const ASSEMBLER_ROTATIONS = buildRotations(2, 2);
const FACTORY_ROTATIONS = buildRotations(3, 4);

function warehouseShape(slotCount) {
  const cells = [];
  for (let y = 0; y < slotCount; y++) {
    cells.push([0, y]);
    cells.push([1, y]);
  }
  return cells;
}

// 4 rotacije: vertikalno (ulaz lijevo/desno) i horizontalno (ulaz gore/dolje).
// inputOffsets = SVI tileovi ulazne strane (bilo koji red/stupac). outputOffsets[i]
// odgovara TOCNO slots[i] - isti poredak u sva 4 stanja da se slot-dodjela
// (koju je igrac vec podesio) ne izmijesa kad se rotira NAKON gradnje... u
// praksi rotacija se bira PRIJE gradnje, ali poredak cuvamo dosljednim ionako.
function warehouseRotations(slotCount) {
  const vertical = warehouseShape(slotCount);
  const horizontal = [];
  for (let x = 0; x < slotCount; x++) { horizontal.push([x, 0]); horizontal.push([x, 1]); }

  const vIn = Array.from({ length: slotCount }, (_, y) => [0, y]);
  const vOut = Array.from({ length: slotCount }, (_, y) => [1, y]);
  const hIn = Array.from({ length: slotCount }, (_, x) => [x, 0]);
  const hOut = Array.from({ length: slotCount }, (_, x) => [x, 1]);

  return [
    { cells: vertical, inputOffsets: vIn, outputOffsets: vOut },   // 0: ulaz lijevo, izlaz desno
    { cells: horizontal, inputOffsets: hIn, outputOffsets: hOut }, // 1: ulaz gore, izlaz dolje
    { cells: vertical, inputOffsets: vOut, outputOffsets: vIn },   // 2: ulaz desno, izlaz lijevo
    { cells: horizontal, inputOffsets: hOut, outputOffsets: hIn }, // 3: ulaz dolje, izlaz gore
  ];
}

export const WAREHOUSE_SMALL_SLOTS = 2;
export const WAREHOUSE_LARGE_SLOTS = 5;
export const WAREHOUSE_SMALL_CAPACITY = 100;
export const WAREHOUSE_LARGE_CAPACITY = 150;

const WAREHOUSE_SMALL_ROTATIONS = warehouseRotations(WAREHOUSE_SMALL_SLOTS);
const WAREHOUSE_LARGE_ROTATIONS = warehouseRotations(WAREHOUSE_LARGE_SLOTS);

const MERGER_TWO_ROTATIONS = mergerRotations(MERGER_VARIANTS.TWO_SIDE);
const MERGER_THREE_ROTATIONS = mergerRotations(MERGER_VARIANTS.THREE_SIDE);

const GARAGE_SHAPES = [{ cells: rect(2, 2) }];

function sideCell(anchorX, anchorY, w, h, side) {
  switch (side) {
    case 'top': return [anchorX, anchorY];
    case 'bottom': return [anchorX, anchorY + h - 1];
    case 'left': return [anchorX, anchorY];
    case 'right': return [anchorX + w - 1, anchorY];
    default: return [anchorX, anchorY];
  }
}

let entityIdCounter = 0;

// Koristi saveLoad.js nakon ucitavanja spremljene igre - sprjecava da nova
// zgrada dobije ID koji se poklapa s nekim vec ucitanim entitetom (brojac
// je modul-scope pa inace ne resetira izmedju Load i sljedece gradnje).
export function setEntityIdCounter(value) {
  entityIdCounter = value;
}

export function getEntityIdCounter() {
  return entityIdCounter;
}

export const BUILD_MODES = {
  EXTRACTOR: 'extractor',
  SMELTER: 'smelter',
  FACTORY: 'factory',
  ASSEMBLER: 'assembler',
  WAREHOUSE_SMALL: 'warehouse_small',
  WAREHOUSE_LARGE: 'warehouse_large',
  CONVEYOR: 'conveyor',
  MERGER_TWO: 'merger_two',
  MERGER_THREE: 'merger_three',
  TRUCK_GARAGE: 'truck_garage',
  POWER_PLANT: 'power_plant',
  BATTERY: 'battery',
  POWER_POLE: 'power_pole',
  ROAD_UPGRADE: 'road_upgrade',
  BRIDGE: 'bridge',
  DEMOLISH: 'demolish',
};

export const BUILD_COSTS = {
  [BUILD_MODES.EXTRACTOR]: 50,
  [BUILD_MODES.SMELTER]: 200,
  [BUILD_MODES.FACTORY]: 450,
  [BUILD_MODES.ASSEMBLER]: 150,
  [BUILD_MODES.WAREHOUSE_SMALL]: 120,
  [BUILD_MODES.WAREHOUSE_LARGE]: 400,
  [BUILD_MODES.CONVEYOR]: 65,
  [BUILD_MODES.MERGER_TWO]: 400,
  [BUILD_MODES.MERGER_THREE]: 550,
  [BUILD_MODES.TRUCK_GARAGE]: 300,
  [BUILD_MODES.POWER_PLANT]: 800,
  [BUILD_MODES.BATTERY]: 350,
  [BUILD_MODES.POWER_POLE]: 15,
  [BUILD_MODES.ROAD_UPGRADE]: 20,
  [BUILD_MODES.BRIDGE]: 40,
  [BUILD_MODES.DEMOLISH]: 0,
};

const SHAPES_BY_MODE = {
  [BUILD_MODES.SMELTER]: SMELTER_ROTATIONS,
  [BUILD_MODES.FACTORY]: FACTORY_ROTATIONS,
  [BUILD_MODES.ASSEMBLER]: ASSEMBLER_ROTATIONS,
  [BUILD_MODES.WAREHOUSE_SMALL]: WAREHOUSE_SMALL_ROTATIONS,
  [BUILD_MODES.WAREHOUSE_LARGE]: WAREHOUSE_LARGE_ROTATIONS,
  [BUILD_MODES.MERGER_TWO]: MERGER_TWO_ROTATIONS,
  [BUILD_MODES.MERGER_THREE]: MERGER_THREE_ROTATIONS,
  [BUILD_MODES.TRUCK_GARAGE]: GARAGE_SHAPES,
};

// Koji tech-tree cvor otkljucuje koji BUILD_MODES (osim ROAD_UPGRADE/BRIDGE,
// koji su tier-based - vidi _roadTierUnlocked/_bridgeTierUnlocked).
const MODE_UNLOCK_NODE = {
  [BUILD_MODES.EXTRACTOR]: 'D1',
  [BUILD_MODES.SMELTER]: 'D8',
  [BUILD_MODES.FACTORY]: 'D15',
  [BUILD_MODES.ASSEMBLER]: 'D14',
  [BUILD_MODES.WAREHOUSE_SMALL]: 'L14',
  [BUILD_MODES.WAREHOUSE_LARGE]: 'L15',
  [BUILD_MODES.CONVEYOR]: 'L1',
  [BUILD_MODES.MERGER_TWO]: 'L3',
  [BUILD_MODES.MERGER_THREE]: 'L3',
  [BUILD_MODES.TRUCK_GARAGE]: 'L8',
  [BUILD_MODES.POWER_PLANT]: 'I14',
  [BUILD_MODES.POWER_POLE]: 'I15',
  [BUILD_MODES.BATTERY]: 'I16',
};
const ROAD_TIER_NODES = ['I1', 'I2', 'I3']; // GRAVEL, DIRT_ROAD, ASPHALT - svaki sad zaseban cvor
const BRIDGE_TIER_NODES = ['I8', 'I9', 'I10'];

export class BuildController {
  constructor(state, techTree) {
    this.state = state;
    this.techTree = techTree;
    this.mode = null;
    this.rotation = 0;
    this.forceLink = false;
  }

  // Je li trenutno odabrani mode uopce istrazen. ROAD_UPGRADE/BRIDGE/
  // DEMOLISH/POWER_POLE(preko I12 u MODE_UNLOCK_NODE) provjeravaju se
  // razlicito - road/bridge su tier-based, DEMOLISH nema cvor (uvijek
  // dopusteno).
  isModeUnlocked(mode = this.mode) {
    if (!mode || mode === BUILD_MODES.DEMOLISH) return true;
    if (mode === BUILD_MODES.ROAD_UPGRADE || mode === BUILD_MODES.BRIDGE) return true; // provjera je po-tier, vidi placeAt
    const nodeId = MODE_UNLOCK_NODE[mode];
    if (!nodeId) return true;
    return this.techTree?.isPurchased(nodeId) ?? true;
  }

  _roadTierUnlocked(targetIndex) {
    const nodeId = ROAD_TIER_NODES[targetIndex];
    return this.techTree?.isPurchased(nodeId) ?? true;
  }

  _bridgeTierUnlocked(targetIndex) {
    const nodeId = BRIDGE_TIER_NODES[targetIndex];
    return this.techTree?.isPurchased(nodeId) ?? true;
  }

  setMode(mode) {
    this.mode = mode;
    this.rotation = 0;
    this.forceLink = false;
  }

  // "Force Relink" - dopusta da NOVI conveyor otme vec zauzet (.next
  // postavljen) postojeci conveyor/merger umjesto da tiho odustane. Bez ovoga
  // (default) itemi na novom komadu ostaju zaglavljeni ako je stari komad
  // vec dio nekog drugog lanca - namjerna zastita od slucajnog otimanja
  // postojece rute, ali igrac mora imati nacin to eksplicitno zatraziti.
  toggleForceLink() {
    this.forceLink = !this.forceLink;
  }

  rotate() {
    const shapes = this.mode === BUILD_MODES.EXTRACTOR ? EXTRACTOR_SHAPES : SHAPES_BY_MODE[this.mode];
    if (!shapes) return;
    this.rotation = (this.rotation + 1) % shapes.length;
  }

  // Ukupna cijena AKO bi se trenutna drag-linija stvarno izgradila - koristi
  // se za tooltip ($X pored kursora) tijekom drag-buildanja ceste/mosta/
  // conveyora. Replicira TOCNO istu formulu koju placeAt() koristi po tileu
  // (ukljucujuci beach surcharge za ROAD_UPGRADE), samo bez trosenja novca.
  estimateLineCost(cells) {
    const base = BUILD_COSTS[this.mode] ?? 0;
    if (base === 0 || !cells) return 0;

    const { world } = this.state;
    return cells.reduce((sum, [x, y]) => {
      let cost = base;
      if (this.mode === BUILD_MODES.ROAD_UPGRADE) {
        cost = Math.round(cost * (this.state.modifiers?.roadUpgradeCostMultiplier ?? 1));
        const tile = world.tiles[y * world.width + x];
        if (tile?.terrain === TERRAIN.BEACH) cost = Math.round(cost * BEACH_ROAD_SURCHARGE);
      }
      return sum + cost;
    }, 0);
  }

  previewAt(x, y) {
    if (!this.mode) return null;
    if (!this.isModeUnlocked()) return { valid: false, cells: [[x, y]] };
    const { world } = this.state;
    if (x < 0 || y < 0 || x >= world.width || y >= world.height) return null;
    const tile = world.tiles[y * world.width + x];

    if (this.mode === BUILD_MODES.EXTRACTOR) return this._previewExtractor(tile);
    if (this.mode === BUILD_MODES.MERGER_TWO || this.mode === BUILD_MODES.MERGER_THREE) {
      return this._previewMerger(tile);
    }
    if (this.mode === BUILD_MODES.WAREHOUSE_SMALL) return this._previewWarehouse(tile, WAREHOUSE_SMALL_ROTATIONS);
    if (this.mode === BUILD_MODES.WAREHOUSE_LARGE) return this._previewWarehouse(tile, WAREHOUSE_LARGE_ROTATIONS);
    if (this.mode === BUILD_MODES.POWER_PLANT || this.mode === BUILD_MODES.BATTERY || this.mode === BUILD_MODES.POWER_POLE) {
      const valid = !tile.building && tile.terrain !== TERRAIN.WATER && !tile.port;
      return { valid, cells: [[tile.x, tile.y]] };
    }
    const shapes = SHAPES_BY_MODE[this.mode];
    if (shapes) return this._previewFootprint(tile, shapes);
    return null;
  }

  _previewWarehouse(tile, rotations) {
    const state = rotations[this.rotation % rotations.length];
    const cells = state.cells.map(([dx, dy]) => [tile.x + dx, tile.y + dy]);
    if (!this._footprintValid(cells)) return { valid: false, cells: [[tile.x, tile.y]] };
    return {
      valid: true,
      cells,
      inputCells: state.inputOffsets.map(([dx, dy]) => [tile.x + dx, tile.y + dy]),
      outputCells: state.outputOffsets.map(([dx, dy]) => [tile.x + dx, tile.y + dy]),
    };
  }

  _previewMerger(tile) {
    const blockedByBuilding = tile.building && tile.building.kind !== 'conveyor';
    if (blockedByBuilding || tile.terrain === TERRAIN.WATER || tile.port) {
      return { valid: false, cells: [[tile.x, tile.y]] };
    }
    const rotations = this.mode === BUILD_MODES.MERGER_TWO ? MERGER_TWO_ROTATIONS : MERGER_THREE_ROTATIONS;
    const state = rotations[this.rotation % rotations.length];
    return {
      valid: true,
      cells: [[tile.x, tile.y]],
      inputCells: state.inputOffsets.map(([dx, dy]) => [tile.x + dx, tile.y + dy]),
      outputCell: [tile.x + state.outputOffset[0], tile.y + state.outputOffset[1]],
    };
  }

  _previewExtractor(tile) {
    if (!tile.resourceNode || tile.resourceNode.isOccupied()) {
      return { valid: false, cells: [[tile.x, tile.y]] };
    }
    const shape = EXTRACTOR_SHAPES[this.rotation];
    const cells = shape.map(([dx, dy]) => [tile.x + dx, tile.y + dy]);
    if (this._footprintValid(cells)) return { valid: true, cells };
    return { valid: false, cells: [[tile.x, tile.y]] };
  }

  _previewFootprint(tile, shapes) {
    const state = shapes[this.rotation % shapes.length];
    const cells = state.cells.map(([dx, dy]) => [tile.x + dx, tile.y + dy]);
    if (!this._footprintValid(cells)) return { valid: false, cells: [[tile.x, tile.y]] };

    if (!state.inputSide) return { valid: true, cells };

    const xs = cells.map(c => c[0]);
    const ys = cells.map(c => c[1]);
    const anchorX = Math.min(...xs);
    const anchorY = Math.min(...ys);
    const w = Math.max(...xs) - anchorX + 1;
    const h = Math.max(...ys) - anchorY + 1;

    return {
      valid: true,
      cells,
      inputCell: sideCell(anchorX, anchorY, w, h, state.inputSide),
      outputCell: sideCell(anchorX, anchorY, w, h, state.outputSide),
    };
  }

  placeAt(x, y) {
    if (!this.mode) return false;
    if (!this.isModeUnlocked()) return false;

    const { world } = this.state;
    if (x < 0 || y < 0 || x >= world.width || y >= world.height) return false;
    const tile = world.tiles[y * world.width + x];

    let cost = BUILD_COSTS[this.mode] ?? 0;
    if (this.mode === BUILD_MODES.ROAD_UPGRADE) {
      cost = Math.round(cost * (this.state.modifiers?.roadUpgradeCostMultiplier ?? 1));
      if (tile.terrain === TERRAIN.BEACH) cost = Math.round(cost * BEACH_ROAD_SURCHARGE);
    } else if (cost > 0) {
      cost = Math.round(cost * (this.state.modifiers?.buildCostMultiplier ?? 1));
    }
    if (cost > 0 && this.state.wallet.balance < cost) return false;

    let success = false;
    switch (this.mode) {
      case BUILD_MODES.EXTRACTOR:
        success = this._placeExtractor(tile);
        break;
      case BUILD_MODES.SMELTER:
        success = this._placeFootprintBuilding(tile, SMELTER_ROTATIONS, Smelter, RECIPES.IRON_INGOT, this.state.smelters);
        break;
      case BUILD_MODES.FACTORY:
        success = this._placeFootprintBuilding(tile, FACTORY_ROTATIONS, Factory, RECIPES.MOTOR, this.state.factories);
        break;
      case BUILD_MODES.ASSEMBLER:
        success = this._placeFootprintBuilding(tile, ASSEMBLER_ROTATIONS, Assembler, RECIPES.GEAR, this.state.assemblers);
        break;
      case BUILD_MODES.WAREHOUSE_SMALL:
        success = this._placeWarehouse(tile, WAREHOUSE_SMALL_ROTATIONS, WAREHOUSE_SMALL_SLOTS, WAREHOUSE_SMALL_CAPACITY);
        break;
      case BUILD_MODES.WAREHOUSE_LARGE:
        success = this._placeWarehouse(tile, WAREHOUSE_LARGE_ROTATIONS, WAREHOUSE_LARGE_SLOTS, WAREHOUSE_LARGE_CAPACITY);
        break;
      case BUILD_MODES.MERGER_TWO:
        success = this._placeMerger(tile, MERGER_TWO_ROTATIONS, MERGER_VARIANTS.TWO_SIDE);
        break;
      case BUILD_MODES.MERGER_THREE:
        success = this._placeMerger(tile, MERGER_THREE_ROTATIONS, MERGER_VARIANTS.THREE_SIDE);
        break;
      case BUILD_MODES.TRUCK_GARAGE:
        success = this._placeGarage(tile);
        break;
      case BUILD_MODES.POWER_PLANT:
        success = this._placeSingleCell(tile, this.state.powerPlants, () => new PowerPlant(`power_plant-${entityIdCounter++}`));
        break;
      case BUILD_MODES.BATTERY:
        success = this._placeSingleCell(tile, this.state.batteries, () => new Battery(`battery-${entityIdCounter++}`));
        break;
      case BUILD_MODES.POWER_POLE:
        success = this._placeSingleCell(tile, this.state.powerPoles, () => new PowerPole(`power_pole-${entityIdCounter++}`, tile.x, tile.y));
        break;
      case BUILD_MODES.ROAD_UPGRADE:
        success = this._upgradeRoad(tile);
        break;
      case BUILD_MODES.BRIDGE:
        success = this._placeBridge(tile);
        break;
      case BUILD_MODES.DEMOLISH:
        success = this._demolish(tile);
        break;
    }

    if (success && cost > 0) this.state.wallet.spend(cost);
    return success;
  }

  _placeExtractor(tile) {
    if (!tile.resourceNode || tile.resourceNode.isOccupied()) return false;

    const shape = EXTRACTOR_SHAPES[this.rotation];
    const cells = shape.map(([dx, dy]) => [tile.x + dx, tile.y + dy]);
    if (!this._footprintValid(cells)) return false;

    const extractor = new Extractor(`extractor-${entityIdCounter++}`, tile.resourceNode, 1);
    extractor.maxBuffer += this.state.modifiers?.extractorBufferBonus ?? 0;
    extractor.requiresPower = !(this.state.modifiers?.extractorPowerExempt ?? false);
    this._applyFootprint(extractor, cells);

    tile.resourceNode.extractorId = extractor.id;
    this.state.extractors.push(extractor);
    return true;
  }

  _placeFootprintBuilding(tile, shapes, BuildingClass, recipe, list) {
    const state = shapes[this.rotation % shapes.length];
    const cells = state.cells.map(([dx, dy]) => [tile.x + dx, tile.y + dy]);
    if (!this._footprintValid(cells)) return false;

    const building = new BuildingClass(`${BuildingClass.name.toLowerCase()}-${entityIdCounter++}`, recipe);
    this._applyFootprint(building, cells);
    building.rotation = this.rotation % shapes.length;
    building.inputSide = state.inputSide;
    building.outputSide = state.outputSide;
    building.inputCell = sideCell(building.anchorX, building.anchorY, building.footprintWidth, building.footprintHeight, state.inputSide);
    building.outputCell = sideCell(building.anchorX, building.anchorY, building.footprintWidth, building.footprintHeight, state.outputSide);
    list.push(building);
    return true;
  }

  _placeWarehouse(tile, rotations, slotCount, capacity) {
    const rotationIndex = this.rotation % rotations.length;
    const state = rotations[rotationIndex];
    const cells = state.cells.map(([dx, dy]) => [tile.x + dx, tile.y + dy]);
    if (!this._footprintValid(cells)) return false;

    const totalCapacity = capacity + (this.state.modifiers?.warehouseCapacityBonus ?? 0);
    const warehouse = new Warehouse(`warehouse-${entityIdCounter++}`, slotCount, totalCapacity);
    this._applyFootprint(warehouse, cells);
    warehouse.rotation = rotationIndex;
    warehouse.inputCells = state.inputOffsets.map(([dx, dy]) => [tile.x + dx, tile.y + dy]);
    warehouse.outputCells = state.outputOffsets.map(([dx, dy]) => [tile.x + dx, tile.y + dy]);
    this.state.warehouses.push(warehouse);
    return true;
  }

  // Zajednicka logika za PowerPlant/Battery/PowerPole - sva tri su 1x1,
  // bez rotacije, bez footprint/anchorX polja (isti render/demolish put
  // kao conveyor: fallback obojeni kvadratic, cells = [[x,y]]).
  _placeSingleCell(tile, list, factory) {
    if (tile.building || tile.terrain === TERRAIN.WATER || tile.port) return false;
    const building = factory();
    building.x = tile.x;
    building.y = tile.y;
    tile.building = building;
    list.push(building);
    return true;
  }

  _placeGarage(tile) {
    const cells = GARAGE_SHAPES[0].cells.map(([dx, dy]) => [tile.x + dx, tile.y + dy]);
    if (!this._footprintValid(cells)) return false;

    const garage = new TruckGarage(`garage-${entityIdCounter++}`, tile.x, tile.y);
    this._applyFootprint(garage, cells);
    this.state.truckGarages.push(garage);
    return true;
  }

  // Merger je prava 1x1 zgrada (ne drag-conveyor) - vise eksplicitnih ulaznih
  // strana + jedan izlaz, orijentacija se bira rotacijom PRIJE postavljanja.
  // Zivi u istom this.state.conveyors nizu kao obicni ConveyorSegment (dijeli
  // update/items/round-robin logiku), samo s drugacijim nacinom hranjenja
  // (_feedConveyors u engine.js provjerava sve inputOffsets, ne samo jedan).
  // Merger se smije postaviti PREKO postojeceg conveyora - automatski ga
  // rusi (cisti dangling .next reference) prije gradnje, i auto-spaja
  // postojece susjedne conveyore na ulazne/izlazne strane (isti "koljeno"
  // obrazac kao kod ravnih traka). Preko bilo cega DRUGOG (zgrada, drugi
  // merger...) i dalje se ne smije postaviti.
  _placeMerger(tile, rotations, variant) {
    const state = rotations[this.rotation % rotations.length];
    const { x, y } = tile;
    if (tile.terrain === TERRAIN.WATER || tile.port) return false;

    if (tile.building) {
      if (tile.building.kind !== 'conveyor') return false;
      this._demolish(tile);
    }

    const merger = new Merger(`merger-${entityIdCounter++}`, x, y, variant, state.inputOffsets, state.outputOffset);
    tile.building = merger;
    this.state.conveyors.push(merger);

    const { world } = this.state;
    for (const [dx, dy] of state.inputOffsets) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;
      const neighbor = world.tiles[ny * world.width + nx].building;
      if (neighbor?.kind === 'conveyor' && !neighbor.next
        && neighbor.x + neighbor.direction.dx === x && neighbor.y + neighbor.direction.dy === y) {
        neighbor.next = merger;
        merger.registerIncoming(neighbor.id);
      }
    }

    const [odx, ody] = state.outputOffset;
    const ox = x + odx, oy = y + ody;
    if (ox >= 0 && oy >= 0 && ox < world.width && oy < world.height) {
      const outNeighbor = world.tiles[oy * world.width + ox].building;
      if (outNeighbor?.kind === 'conveyor') {
        merger.next = outNeighbor;
        outNeighbor.registerIncoming(merger.id);
      }
    }

    return true;
  }

  _applyFootprint(building, cells) {
    const xs = cells.map(c => c[0]);
    const ys = cells.map(c => c[1]);
    const anchorX = Math.min(...xs);
    const anchorY = Math.min(...ys);

    building.footprint = cells;
    building.anchorX = anchorX;
    building.anchorY = anchorY;
    building.footprintWidth = Math.max(...xs) - anchorX + 1;
    building.footprintHeight = Math.max(...ys) - anchorY + 1;

    const { world } = this.state;
    for (const [cx, cy] of cells) {
      world.tiles[cy * world.width + cx].building = building;
    }
  }

  _footprintValid(cells) {
    const { world } = this.state;
    for (const [x, y] of cells) {
      if (x < 0 || y < 0 || x >= world.width || y >= world.height) return false;
      const t = world.tiles[y * world.width + x];
      if (t.terrain === TERRAIN.WATER || t.building || t.port) return false;
    }
    return true;
  }

  _upgradeRoad(tile) {
    if (tile.terrain === TERRAIN.WATER) return false;
    if (tile.terrain === TERRAIN.GRASS || tile.terrain === TERRAIN.BEACH) {
      if (!this._roadTierUnlocked(0)) return false;
      tile.terrain = ROAD_TIERS[0];
      return true;
    }
    const index = ROAD_TIERS.indexOf(tile.terrain);
    if (index === -1 || index >= ROAD_TIERS.length - 1) return false;
    if (!this._roadTierUnlocked(index + 1)) return false;
    tile.terrain = ROAD_TIERS[index + 1];
    return true;
  }

  // Most ide SAMO preko vode - odvojen sustav od cesta (ne moze se "nadograditi"
  // cesta u most niti obrnuto). Isti tier-progression obrazac kao ROAD_TIERS.
  _placeBridge(tile) {
    if (tile.terrain === TERRAIN.WATER) {
      if (!this._bridgeTierUnlocked(0)) return false;
      tile.terrain = BRIDGE_TIERS[0];
      return true;
    }
    const index = BRIDGE_TIERS.indexOf(tile.terrain);
    if (index === -1 || index >= BRIDGE_TIERS.length - 1) return false;
    if (!this._bridgeTierUnlocked(index + 1)) return false;
    tile.terrain = BRIDGE_TIERS[index + 1];
    return true;
  }

  _demolish(tile) {
    if (tile.building) {
      const building = tile.building;
      if (building.resourceNode) building.resourceNode.extractorId = null;
      if (building.kind === 'conveyor' || building.kind === 'merger') {
        for (const other of this.state.conveyors) {
          if (other.next === building) other.next = null;
        }
      }

      const { world } = this.state;
      const cells = building.footprint ?? [[tile.x, tile.y]];
      for (const [x, y] of cells) {
        world.tiles[y * world.width + x].building = null;
      }

      this._removeFromLists(building);
      return true;
    }

    if (ROAD_TIERS.includes(tile.terrain)) {
      tile.terrain = TERRAIN.GRASS;
      return true;
    }

    if (BRIDGE_TIERS.includes(tile.terrain)) {
      tile.terrain = TERRAIN.WATER;
      return true;
    }

    return false;
  }

  _removeFromLists(entity) {
    const lists = [
      this.state.extractors, this.state.smelters, this.state.factories,
      this.state.assemblers, this.state.warehouses, this.state.conveyors,
      this.state.truckGarages, this.state.powerPlants, this.state.batteries, this.state.powerPoles,
    ];
    for (const list of lists) {
      const idx = list.indexOf(entity);
      if (idx !== -1) list.splice(idx, 1);
    }
  }
}
