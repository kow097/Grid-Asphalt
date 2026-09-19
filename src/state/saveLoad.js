import { TERRAIN } from '../world/terrain.js';
import { ResourceNode } from '../world/resourceNode.js';
import { Port } from '../world/port.js';
import { Extractor } from '../production/extractor.js';
import { Smelter } from '../production/smelter.js';
import { Factory } from '../production/factory.js';
import { Assembler } from '../production/assembler.js';
import { RECIPES } from '../production/recipe.js';
import { Warehouse } from '../logistics/warehouse.js';
import { ConveyorSegment } from '../logistics/conveyor.js';
import { Merger } from '../logistics/merger.js';
import { TruckGarage } from '../logistics/truckGarage.js';
import { PowerPlant } from '../production/powerPlant.js';
import { Battery } from '../logistics/battery.js';
import { PowerPole } from '../logistics/powerPole.js';
import { TruckGroup } from '../logistics/truckGroup.js';
import { Truck } from '../logistics/truck.js';
import { Vector2 } from '../utils/vector2.js';
import { findPath } from '../pathfinding/astar.js';
import { Quest, setQuestIdCounter } from '../economy/quest.js';
import { DIFFICULTY_MODES } from './difficultyModes.js';
import { setEntityIdCounter } from '../ui/buildMenu.js';

const QUICKSAVE_KEY = 'gridAsphalt.quicksave';
const SAVE_VERSION = 1;

const TERRAIN_CODES = {
  [TERRAIN.GRASS]: 'g',
  [TERRAIN.BEACH]: 'b',
  [TERRAIN.GRAVEL]: 'v',
  [TERRAIN.DIRT_ROAD]: 'd',
  [TERRAIN.ASPHALT]: 'a',
  [TERRAIN.WATER]: 'w',
  [TERRAIN.BRIDGE_WOOD]: '1',
  [TERRAIN.BRIDGE_CONCRETE]: '2',
  [TERRAIN.BRIDGE_STEEL]: '3',
};
const TERRAIN_FROM_CODE = Object.fromEntries(
  Object.entries(TERRAIN_CODES).map(([terrain, code]) => [code, terrain])
);

const RECIPE_BY_ID = new Map(Object.values(RECIPES).map((r) => [r.id, r]));

function idSuffixNumber(id) {
  const n = Number(String(id).split('-').pop());
  return Number.isNaN(n) ? -1 : n;
}

function footprintOf(building) {
  return {
    footprint: building.footprint,
    anchorX: building.anchorX,
    anchorY: building.anchorY,
    footprintWidth: building.footprintWidth,
    footprintHeight: building.footprintHeight,
  };
}

function applyFootprint(world, building, data) {
  building.footprint = data.footprint;
  building.anchorX = data.anchorX;
  building.anchorY = data.anchorY;
  building.footprintWidth = data.footprintWidth;
  building.footprintHeight = data.footprintHeight;
  for (const [cx, cy] of data.footprint) {
    world.tiles[cy * world.width + cx].building = building;
  }
}

function questToJSON(q) {
  return {
    id: q.id,
    portId: q.portId,
    requirements: q.requirements,
    delivered: q.delivered,
    rewardMoney: q.rewardMoney,
    rewardRP: q.rewardRP,
    acceptWindow: q.acceptWindow,
    acceptTimer: q.acceptTimer,
    executionTimer: q.executionTimer,
    state: q.state,
  };
}

function buildQuest(qd) {
  const q = new Quest({
    portId: qd.portId,
    requirements: qd.requirements,
    rewardMoney: qd.rewardMoney,
    rewardRP: qd.rewardRP,
    acceptWindow: qd.acceptWindow,
    executionWindow: qd.executionTimer,
  });
  q.id = qd.id;
  q.delivered = qd.delivered;
  q.acceptTimer = qd.acceptTimer;
  q.executionTimer = qd.executionTimer;
  q.state = qd.state;
  return q;
}

function processorToJSON(p) {
  return {
    id: p.id, kind: p.kind, ...footprintOf(p),
    rotation: p.rotation, inputSide: p.inputSide, outputSide: p.outputSide,
    inputCell: p.inputCell, outputCell: p.outputCell, recipeId: p.recipe.id,
    inputBuffer: p.inputBuffer, outputBuffer: p.outputBuffer, maxOutputBuffer: p.maxOutputBuffer,
    progress: p.progress, active: p.active, requiresPower: p.requiresPower, powered: p.powered,
  };
}

// --- Serijalizacija ---------------------------------------------------------

export function buildSaveData(engine) {
  const { state, camera, loop, techTree } = engine;
  const { world } = state;

  const terrain = world.tiles.map((t) => TERRAIN_CODES[t.terrain] ?? 'g').join('');

  const resourceNodes = world.resourceNodes.map((n) => ({
    x: n.x, y: n.y, type: n.type, richness: n.richness, extractorId: n.extractorId,
  }));

  const ports = world.ports.map((p) => ({
    id: p.id, x: p.x, y: p.y, name: p.name, inventory: p.inventory,
    landCells: p.landCells ?? [], dockCells: p.dockCells ?? [],
  }));

  const extractors = state.extractors.map((e) => ({
    id: e.id, ...footprintOf(e), nodeX: e.resourceNode.x, nodeY: e.resourceNode.y,
    tier: e.tier, progress: e.progress, outputBuffer: e.outputBuffer, maxBuffer: e.maxBuffer,
    requiresPower: e.requiresPower, powered: e.powered,
  }));

  const warehouses = state.warehouses.map((w) => ({
    id: w.id, ...footprintOf(w), rotation: w.rotation,
    capacityPerSlot: w.capacityPerSlot, slots: w.slots,
    inputCells: w.inputCells, outputCells: w.outputCells,
  }));

  const truckGarages = state.truckGarages.map((g) => ({ id: g.id, ...footprintOf(g) }));

  const powerPlants = state.powerPlants.map((p) => ({ id: p.id, x: p.x, y: p.y, output: p.output }));
  const batteries = state.batteries.map((b) => ({ id: b.id, x: b.x, y: b.y, capacity: b.capacity, charge: b.charge }));
  const powerPoles = state.powerPoles.map((p) => ({ id: p.id, x: p.x, y: p.y }));

  const conveyors = state.conveyors.map((c) => ({
    id: c.id, kind: c.kind, x: c.x, y: c.y, direction: c.direction,
    items: c.items, nextId: c.next ? c.next.id : null,
    incomingSources: c.incomingSources, turnIndex: c.turnIndex,
    requiresPower: c.requiresPower, powered: c.powered,
    variant: c.variant ?? null, inputOffsets: c.inputOffsets ?? null,
  }));

  const trucks = state.trucks.map((t) => ({
    id: t.id, x: t.position.x, y: t.position.y, capacity: t.capacity, cargo: t.cargo,
    path: t.path, pathIndex: t.pathIndex, state: t.state, manualControl: t.manualControl,
    heading: t.heading, visualHeading: t.visualHeading,
    route: t.route ? { waypoints: t.route.waypoints } : null,
    routeLegIndex: t.routeLegIndex ?? null,
    groupId: t.groupId ?? null,
  }));

  const truckGroups = state.truckGroups.map((g) => ({
    id: g.id, name: g.name, route: g.route ? { waypoints: g.route.waypoints } : null,
  }));

  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    world: {
      width: world.width,
      height: world.height,
      seed: engine.worldOptions?.seed ?? null,
      islandCount: engine.worldOptions?.islandCount ?? 1,
      portCount: world.ports.length,
    },
    terrain,
    resourceNodes,
    ports,
    wallet: state.wallet.balance,
    difficultyId: state.questManager.difficultyConfig?.id ?? 'normal',
    modifiers: { ...state.modifiers },
    techTree: {
      purchased: [...techTree.purchased],
      progress: [...techTree.progress.entries()],
      activeProjectId: techTree.activeProjectId,
    },
    questManager: {
      offeredQuests: state.questManager.offeredQuests.map(questToJSON),
      activeQuests: state.questManager.activeQuests.map(questToJSON),
      researchPoints: state.questManager.researchPoints,
      spawnTimer: state.questManager.spawnTimer,
      maxActiveQuests: state.questManager.maxActiveQuests,
    },
    camera: { x: camera.x, y: camera.y, zoom: camera.zoom },
    timeScale: loop.timeScale,
    truckGroups,
    truckUpgrades: { ...state.truckUpgrades },
    entities: {
      extractors,
      smelters: state.smelters.map(processorToJSON),
      factories: state.factories.map(processorToJSON),
      assemblers: state.assemblers.map(processorToJSON),
      warehouses,
      truckGarages,
      powerPlants,
      batteries,
      powerPoles,
      conveyors,
      trucks,
    },
  };
}

// --- Deserijalizacija --------------------------------------------------------

export function applySaveData(engine, save) {
  const { state, camera, loop } = engine;
  const { world } = state;

  for (let i = 0; i < world.tiles.length && i < save.terrain.length; i++) {
    world.tiles[i].terrain = TERRAIN_FROM_CODE[save.terrain[i]] ?? world.tiles[i].terrain;
  }

  world.resourceNodes.length = 0;
  for (const t of world.tiles) t.resourceNode = null;
  const nodeByPos = new Map();
  for (const n of save.resourceNodes) {
    const node = new ResourceNode(n.x, n.y, n.type, n.richness);
    node.extractorId = n.extractorId;
    world.resourceNodes.push(node);
    world.tiles[n.y * world.width + n.x].resourceNode = node;
    nodeByPos.set(`${n.x},${n.y}`, node);
  }

  world.ports.length = 0;
  for (const t of world.tiles) { t.port = null; t.portDecoration = null; }
  for (const p of save.ports) {
    const port = new Port(p.x, p.y, p.name);
    port.id = p.id;
    port.inventory = p.inventory ?? {};
    port.landCells = p.landCells ?? [];
    port.dockCells = p.dockCells ?? [];
    world.ports.push(port);
    world.tiles[p.y * world.width + p.x].port = port;
    world.tiles[p.y * world.width + p.x].portDecoration = { port, role: 'inputBase' };
    for (const c of port.landCells) {
      const t = world.tiles[c.y * world.width + c.x];
      if (t) t.portDecoration = { port, role: 'land' };
    }
    for (const c of port.dockCells) {
      const t = world.tiles[c.y * world.width + c.x];
      if (t) t.portDecoration = { port, role: 'dockPier' };
    }
  }

  for (const t of world.tiles) t.building = null;

  state.extractors = save.entities.extractors.map((d) => {
    const node = nodeByPos.get(`${d.nodeX},${d.nodeY}`);
    const e = new Extractor(d.id, node, d.tier);
    e.progress = d.progress;
    e.outputBuffer = d.outputBuffer;
    e.maxBuffer = d.maxBuffer;
    e.requiresPower = d.requiresPower;
    e.powered = d.powered;
    applyFootprint(world, e, d);
    return e;
  });

  const buildProcessor = (d, Cls) => {
    const recipe = RECIPE_BY_ID.get(d.recipeId);
    const p = new Cls(d.id, recipe);
    p.rotation = d.rotation;
    p.inputSide = d.inputSide;
    p.outputSide = d.outputSide;
    p.inputCell = d.inputCell;
    p.outputCell = d.outputCell;
    p.inputBuffer = d.inputBuffer;
    p.outputBuffer = d.outputBuffer;
    p.maxOutputBuffer = d.maxOutputBuffer;
    p.progress = d.progress;
    p.active = d.active;
    p.requiresPower = d.requiresPower;
    p.powered = d.powered;
    applyFootprint(world, p, d);
    return p;
  };
  state.smelters = save.entities.smelters.map((d) => buildProcessor(d, Smelter));
  state.factories = save.entities.factories.map((d) => buildProcessor(d, Factory));
  state.assemblers = save.entities.assemblers.map((d) => buildProcessor(d, Assembler));

  state.warehouses = save.entities.warehouses.map((d) => {
    const w = new Warehouse(d.id, d.slots.length, d.capacityPerSlot);
    w.slots = d.slots;
    w.rotation = d.rotation;
    w.inputCells = d.inputCells;
    w.outputCells = d.outputCells;
    applyFootprint(world, w, d);
    return w;
  });

  state.truckGarages = save.entities.truckGarages.map((d) => {
    const g = new TruckGarage(d.id, d.anchorX, d.anchorY);
    applyFootprint(world, g, d);
    return g;
  });

  state.powerPlants = (save.entities.powerPlants ?? []).map((d) => {
    const p = new PowerPlant(d.id, d.output);
    p.x = d.x; p.y = d.y;
    world.tiles[d.y * world.width + d.x].building = p;
    return p;
  });
  state.batteries = (save.entities.batteries ?? []).map((d) => {
    const b = new Battery(d.id, d.capacity);
    b.x = d.x; b.y = d.y; b.charge = d.charge;
    world.tiles[d.y * world.width + d.x].building = b;
    return b;
  });
  state.powerPoles = (save.entities.powerPoles ?? []).map((d) => {
    const p = new PowerPole(d.id, d.x, d.y);
    world.tiles[d.y * world.width + d.x].building = p;
    return p;
  });

  const conveyorById = new Map();
  state.conveyors = save.entities.conveyors.map((d) => {
    const c = d.kind === 'merger'
      ? new Merger(d.id, d.x, d.y, d.variant, d.inputOffsets, [d.direction.dx, d.direction.dy])
      : new ConveyorSegment(d.id, d.x, d.y, d.direction);
    c.items = d.items;
    c.incomingSources = d.incomingSources;
    c.turnIndex = d.turnIndex;
    c.requiresPower = d.requiresPower;
    c.powered = d.powered;
    world.tiles[d.y * world.width + d.x].building = c;
    conveyorById.set(c.id, c);
    return c;
  });
  for (const d of save.entities.conveyors) {
    if (d.nextId) conveyorById.get(d.id).next = conveyorById.get(d.nextId) ?? null;
  }

  state.truckGroups = (save.truckGroups ?? []).map((d) => {
    const g = new TruckGroup(d.id, d.name);
    g.route = d.route ? { waypoints: d.route.waypoints } : null;
    return g;
  });
  if (save.truckUpgrades) Object.assign(state.truckUpgrades, save.truckUpgrades);

  state.trucks = save.entities.trucks.map((d) => {
    const t = new Truck(d.id, 0, 0, d.capacity);
    t.position = new Vector2(d.x, d.y);
    t.cargo = d.cargo;
    t.path = d.path;
    t.pathIndex = d.pathIndex;
    t.state = d.state;
    t.manualControl = d.manualControl;
    t.heading = d.heading;
    t.visualHeading = d.visualHeading;
    t.groupId = d.groupId ?? null;
    if (d.route) {
      const legs = [];
      for (let i = 0; i < d.route.waypoints.length; i++) {
        const from = d.route.waypoints[i];
        const to = d.route.waypoints[(i + 1) % d.route.waypoints.length];
        legs.push(findPath(engine.pathGrid, from, to) ?? []);
      }
      t.route = { waypoints: d.route.waypoints, legs };
      t.routeLegIndex = d.routeLegIndex;
    }
    return t;
  });

  state.wallet.balance = save.wallet;
  state.questManager.difficultyConfig =
    DIFFICULTY_MODES[save.difficultyId?.toUpperCase()] ?? state.questManager.difficultyConfig;

  Object.assign(state.modifiers, save.modifiers);
  engine.techTree.purchased = new Set(save.techTree.purchased);
  engine.techTree.progress = new Map(save.techTree.progress ?? []);
  engine.techTree.activeProjectId = save.techTree.activeProjectId ?? null;

  const qm = state.questManager;
  qm.offeredQuests = save.questManager.offeredQuests.map(buildQuest);
  qm.activeQuests = save.questManager.activeQuests.map(buildQuest);
  qm.researchPoints = save.questManager.researchPoints;
  qm.spawnTimer = save.questManager.spawnTimer;
  qm.maxActiveQuests = save.questManager.maxActiveQuests;

  const maxQuestId = [...qm.offeredQuests, ...qm.activeQuests]
    .reduce((max, q) => Math.max(max, q.id), -1);
  setQuestIdCounter(maxQuestId + 1);

  camera.x = save.camera.x;
  camera.y = save.camera.y;
  camera.zoom = save.camera.zoom;
  loop.timeScale = save.timeScale ?? 1;

  const maxNum = (list) => list.reduce((max, item) => Math.max(max, idSuffixNumber(item.id)), -1);
  setEntityIdCounter(
    1 + Math.max(
      maxNum(state.extractors), maxNum(state.smelters), maxNum(state.factories),
      maxNum(state.assemblers), maxNum(state.warehouses), maxNum(state.truckGarages),
      maxNum(state.powerPlants), maxNum(state.batteries), maxNum(state.powerPoles)
    )
  );
  engine.conveyorIdCounter = 1 + maxNum(state.conveyors);
  engine.truckIdCounter = 1 + maxNum(state.trucks);
  engine.groupIdCounter = 1 + maxNum(state.truckGroups);
}

// --- Pohrana (localStorage + datoteka) ---------------------------------------

export function quickSave(engine) {
  const data = buildSaveData(engine);
  localStorage.setItem(QUICKSAVE_KEY, JSON.stringify(data));
  return data;
}

export function hasQuickSave() {
  return localStorage.getItem(QUICKSAVE_KEY) !== null;
}

export function loadQuickSave() {
  const raw = localStorage.getItem(QUICKSAVE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function downloadSaveFile(engine) {
  const data = buildSaveData(engine);
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grid-and-asphalt-save-${data.savedAt.replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readSaveFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}
