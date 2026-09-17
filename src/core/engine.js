import { Camera } from './camera.js';
import { ASSEMBLER_RECIPES, FACTORY_RECIPES } from '../production/recipe.js';
import { InputHandler } from './input.js';
import { GameLoop } from './gameLoop.js';
import { CONFIG } from './config.js';
import { Renderer } from '../rendering/renderer.js';
import { IslandGenerator } from '../world/islandGenerator.js';
import { PathGrid } from '../pathfinding/grid.js';
import { Truck, TRUCK_STATE } from '../logistics/truck.js';
import { ConveyorSegment } from '../logistics/conveyor.js';
import { findPath } from '../pathfinding/astar.js';
import { Wallet } from '../economy/currency.js';
import { QuestManager } from '../economy/questManager.js';
import { Market } from '../economy/market.js';
import { transferAdjacentOutputs, getOutputType, takeOutput, deliverToPort } from '../logistics/router.js';
import { DIFFICULTY_MODES } from '../state/difficultyModes.js';
import { GameState } from '../state/gameState.js';
import { AssetRegistry } from '../rendering/assetRegistry.js';
import { allAssetKeys } from '../rendering/assetManifest.js';
import { BuildController, BUILD_MODES, BUILD_COSTS } from '../ui/buildMenu.js';
import { HUD } from '../ui/hud.js';
import { Tooltip } from '../ui/tooltip.js';
import { TechTree } from '../tech/techTree.js';
import { TechPanel } from '../ui/techPanel.js';
import { TimePanel } from '../ui/timePanel.js';
import { PauseMenu } from '../ui/pauseMenu.js';
import { RecipePanel } from '../ui/recipePanel.js';
import { WarehouseMenu } from '../ui/warehouseMenu.js';
import { GarageMenu } from '../ui/garageMenu.js';
import { TabBar } from '../ui/tabBar.js';
import { BuildPanel } from '../ui/buildPanel.js';
import { VehiclePanel } from '../ui/vehiclePanel.js';
import { ActiveQuestsPanel } from '../ui/activeQuestsPanel.js';
import { AvailableQuestsPopup } from '../ui/availableQuestsPopup.js';
import { Minimap } from '../ui/minimap.js';
import { EventTicker } from '../ui/eventTicker.js';
import { MobileControls } from '../ui/mobileControls.js';
import { SettingsPanel } from '../ui/settingsPanel.js';
import { SaveLoadMenu } from '../ui/saveLoadMenu.js';
import { applySaveData } from '../state/saveLoad.js';

export class Engine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this._resize();
    // Reference cuvamo (ne inline arrow u addEventListener) da bi destroy()
    // mogao stvarno ukloniti TOCNO ovaj listener - bez ovoga bi svaki
    // Exit->Start Again ciklus ostavljao "zombie" listenere koji i dalje
    // reagiraju na resize/tipke iako je engine odavno zamijenjen.
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);

    this.camera = new Camera(canvas);
    this.input = new InputHandler(canvas, this.camera, CONFIG);
    this.renderer = new Renderer(canvas, this.camera, CONFIG);

    const worldWidth = options.worldWidth ?? CONFIG.WORLD_WIDTH;
    const worldHeight = options.worldHeight ?? CONFIG.WORLD_HEIGHT;
    const islandCount = options.islandCount ?? 1;
    const portCount = options.portCount ?? 1;
    const seed = options.seed ?? CONFIG.WORLD_SEED;
    // Cuvamo parametre generacije (koristi ih saveLoad.js kao metapodatke
    // u save fileu - sama Load logika ne ovisi o njima, world se pri
    // ucitavanju u potpunosti prepisuje spremljenim podacima).
    this.worldOptions = { worldWidth, worldHeight, islandCount, portCount, seed };
    this.onLoadGame = options.onLoadGame ?? null;

    const generator = new IslandGenerator(seed, worldWidth, worldHeight, islandCount);
    const world = generator.generate(portCount);
    this.pathGrid = new PathGrid(world.tiles, world.width, world.height);

    const wallet = new Wallet(1500);
    const questManager = new QuestManager(wallet, DIFFICULTY_MODES.NORMAL);

    this.state = new GameState(world, wallet, questManager);
    this.market = new Market(wallet, this.state.modifiers);

    this.truckIdCounter = 0;
    this.conveyorIdCounter = 0;
    // Pocetni kamion spawna na SREDINI otoka (prvog, ako ih ima vise) umjesto
    // na portu - kamera se centrira na njega isto tako.
    const spawnPos = this._findNearestWalkable(generator.islandCenters[0]);
    this._spawnDemoTruck(spawnPos);
    this.camera.x = (spawnPos.x + 0.5) * CONFIG.TILE_SIZE;
    this.camera.y = (spawnPos.y + 0.5) * CONFIG.TILE_SIZE;

    this.selectedTruck = null;
    this.pendingWaypoints = [];
    this.pendingPreviewPaths = [];
    this.routeArmed = false;
    this.sellTruckArmed = false;

    this.buildController = new BuildController(this.state);
    this._wireBuildInput();
    this._wireHover();

    this.hud = new HUD(document.getElementById('hud'));

    this.tabBar = new TabBar(
      document.getElementById('tab-bar'),
      document.getElementById('build-panel-body'),
      document.getElementById('vehicle-panel-body'),
      () => this.techPanel.toggle()
    );
    this.buildPanel = new BuildPanel(document.getElementById('build-panel-body'), this.buildController, () => this.buildController.rotate());
    this.vehiclePanel = new VehiclePanel(document.getElementById('vehicle-panel-body'), {
      cost: CONFIG.TRUCK_COST,
      sellRefund: CONFIG.TRUCK_SELL_REFUND,
      onBuyTruck: () => this._buyTruck(),
      onSellTruck: () => this._armSellTruck(),
      onCreateRoute: () => this._armRoute(),
      onFinishRoute: () => this._finishRoute(),
    });

    this.activeQuestsPanel = new ActiveQuestsPanel(document.getElementById('active-quests-panel'), questManager);
    this.availableQuestsPopup = new AvailableQuestsPopup(document.getElementById('available-quests-popup'), questManager);
    document.getElementById('available-quests-btn').addEventListener('click', () => this.availableQuestsPopup.toggle());

    this.minimap = new Minimap(document.getElementById('minimap'), document.getElementById('minimap-overlay'));
    this.eventTicker = new EventTicker(document.getElementById('event-ticker'));

    this.tooltip = new Tooltip(document.getElementById('tooltip'));

    this.techTree = new TechTree();
    this.techPanel = new TechPanel(document.getElementById('tech-panel'), this.techTree, questManager, this.state.modifiers, this.state);

    this.assets = new AssetRegistry();
    this.assets.preload(allAssetKeys());

    this.loop = new GameLoop(this._update.bind(this), this._render.bind(this));
    this.timePanel = new TimePanel(document.getElementById('time-panel'), this.loop);
    this.settingsPanel = new SettingsPanel(document.getElementById('settings-panel'));
    this.saveLoadMenu = new SaveLoadMenu(document.getElementById('saveload-panel'), this);
    this.pauseMenu = new PauseMenu(
      document.getElementById('pause-menu'), this.loop, options.onExit ?? (() => {}),
      () => { this.pauseMenu.close(); this.settingsPanel.toggle(); },
      () => { this.pauseMenu.close(); this.saveLoadMenu.open(); }
    );
    this.recipePanel = new RecipePanel(document.getElementById('recipe-panel'));
    this.warehouseMenu = new WarehouseMenu(document.getElementById('warehouse-menu'));
    this.garageMenu = new GarageMenu(document.getElementById('garage-menu'));

    // Cuvamo referencu (ne inline arrow) da destroy() moze stvarno ukloniti
    // TOCNO ovaj listener - vidi napomenu kod resize gore.
    this._onKeydown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        this.loop.togglePause();
        if (!this.loop.paused) this.pauseMenu.close();
      } else if (e.key === 'Escape') {
        if (this.pauseMenu.visible) this.pauseMenu.close();
        else if (!this._cancelAction()) this.pauseMenu.open();
      } else if (e.key.toLowerCase() === 'g') {
        this._toggleGrid();
      } else if (e.key.toLowerCase() === 'r') {
        this.buildController.rotate();
      } else if (e.key === 'Enter') {
        this._finishRoute();
      } else if (e.key.toLowerCase() === 't') {
        this.techPanel.toggle();
      }
    };
    window.addEventListener('keydown', this._onKeydown);

    this.mobileControls = new MobileControls({
      gridBtn: document.getElementById('mobile-grid-btn'),
      cancelBtn: document.getElementById('mobile-cancel-btn'),
      menuBtn: document.getElementById('mobile-menu-btn'),
      onToggleGrid: () => this._toggleGrid(),
      onCancel: () => this._cancelAction(),
      onMenu: () => this.pauseMenu.open(),
    });
  }

  _toggleGrid() {
    this.gridOverlayEnabled = !this.gridOverlayEnabled;
  }

  // Isti "otkazi trenutnu akciju" korak koji je nekad zivio samo u Escape
  // grani - sad ga dijele i tipkovnica (Escape) i mobilni "Cancel" gumb.
  // Vraca true ako je nesto stvarno otkazano (znaci: NE otvaraj pause meni).
  _cancelAction() {
    if (this.input.dragBuildActive) {
      this.input.cancelDragBuild();
    } else if (this.garageMenu.isOpen) {
      this.garageMenu.close();
    } else if (this.warehouseMenu.isOpen) {
      this.warehouseMenu.close();
    } else if (this.recipePanel.isOpen) {
      this.recipePanel.close();
    } else if (this.techPanel.visible) {
      this.techPanel.toggle();
    } else if (this.availableQuestsPopup.visible) {
      this.availableQuestsPopup.close();
    } else if (this.settingsPanel.visible) {
      this.settingsPanel.close();
    } else if (this.saveLoadMenu.visible) {
      this.saveLoadMenu.close();
    } else if (this.minimap.visible) {
      this.minimap.close();
    } else if (this.sellTruckArmed) {
      this.sellTruckArmed = false;
    } else if (this.buildController.mode) {
      this.buildController.setMode(null);
    } else if (this.selectedTruck) {
      this.selectedTruck = null;
      this.routeArmed = false;
      this.pendingWaypoints = [];
      this.pendingPreviewPaths = [];
    } else {
      return false;
    }
    return true;
  }

  _wireHover() {
    this.hoverScreenPos = null;
    this.hoverTile = null;
    this.gridOverlayEnabled = true;
    this.dragBuildPreview = null;

    this.input.onHover = (screenX, screenY) => {
      if (screenX === null) {
        this.tooltip.hide();
        this.hoverScreenPos = null;
        this.hoverTile = null;
        return;
      }
      this.hoverScreenPos = { x: screenX, y: screenY };

      const worldPos = this.camera.screenToWorld(screenX, screenY, CONFIG.TILE_SIZE);
      const gx = Math.floor(worldPos.x);
      const gy = Math.floor(worldPos.y);
      this.hoverTile = { x: gx, y: gy };

      if (this.dragBuildPreview) {
        this.dragBuildPreview.endX = gx;
        this.dragBuildPreview.endY = gy;
      }

      const { world } = this.state;
      if (gx < 0 || gy < 0 || gx >= world.width || gy >= world.height) {
        this.tooltip.hide();
        return;
      }
      this.tooltip.showAt(screenX, screenY, world.tiles[gy * world.width + gx]);
    };

    this.input.onDragStart = (screenX, screenY) => {
      const worldPos = this.camera.screenToWorld(screenX, screenY, CONFIG.TILE_SIZE);
      const x = Math.floor(worldPos.x);
      const y = Math.floor(worldPos.y);
      this.dragBuildPreview = { startX: x, startY: y, endX: x, endY: y };
    };

    this.input.onDragEnd = () => {
      this.dragBuildPreview = null;
    };
  }

  _armRoute() {
    if (!this.selectedTruck) return;
    this.routeArmed = true;
    this.pendingWaypoints = [];
    this.pendingPreviewPaths = [];
  }

  _armSellTruck() {
    this.sellTruckArmed = true;
    this.routeArmed = false;
    this.pendingWaypoints = [];
    this.pendingPreviewPaths = [];
  }

  _sellTruck(truck) {
    const idx = this.state.trucks.indexOf(truck);
    if (idx === -1) return;
    this.state.trucks.splice(idx, 1);
    this.state.wallet.add(CONFIG.TRUCK_SELL_REFUND);
    if (this.selectedTruck === truck) this.selectedTruck = null;
  }

  _buyTruck() {
    if (this.state.truckGarages.length === 0) return;
    if (this.state.wallet.balance < CONFIG.TRUCK_COST) return;
    this.state.wallet.spend(CONFIG.TRUCK_COST);
    const garage = this.state.truckGarages[0];
    const capacity = 50 + this.state.modifiers.truckCapacityBonus;
    const truck = new Truck(`truck-${this.truckIdCounter++}`, garage.x, garage.y, capacity);
    this.state.trucks.push(truck);
    this._retarget(truck);
  }

  // Build-mod odabir sad ide iskljucivo preko BuildPanel gumbova (tab "Build")
  // umjesto tipkovnickih precica - vidi HANDOFF/UI redizajn napomenu.
  _wireBuildInput() {
    this.input.onClick = (screenX, screenY) => {
      const worldPos = this.camera.screenToWorld(screenX, screenY, CONFIG.TILE_SIZE);
      const gx = Math.floor(worldPos.x);
      const gy = Math.floor(worldPos.y);

      if (this.sellTruckArmed) {
        const truck = this._truckAt(worldPos.x, worldPos.y);
        if (truck) this._sellTruck(truck);
        this.sellTruckArmed = false;
        return;
      }

      if (this.buildController.mode) {
        this.buildController.placeAt(gx, gy);
        return;
      }

      const clickedTruck = this._truckAt(worldPos.x, worldPos.y);
      if (clickedTruck) {
        this.selectedTruck = clickedTruck;
        this.pendingWaypoints = [];
        this.pendingPreviewPaths = [];
        this.routeArmed = false;
        this.tabBar.openTab('vehicles');
        return;
      }

      if (!this.selectedTruck) {
        const { world } = this.state;
        if (gx >= 0 && gy >= 0 && gx < world.width && gy < world.height) {
          const tile = world.tiles[gy * world.width + gx];
          const wh = tile.building?.kind === 'warehouse' ? tile.building : null;
          const outSlot = wh ? wh.outputSlotIndexAt(gx, gy) : -1;
          if (wh && outSlot !== -1) {
            this.warehouseMenu.open(wh, outSlot);
          } else if (wh && wh.isInputCell(gx, gy)) {
            this.warehouseMenu.openInfo(wh);
          } else if (tile.building?.kind === 'assembler') {
            this.recipePanel.open(tile.building, ASSEMBLER_RECIPES);
          } else if (tile.building?.kind === 'factory') {
            this.recipePanel.open(tile.building, FACTORY_RECIPES);
          } else if (tile.building?.kind === 'truck_garage') {
            this.garageMenu.open(tile.building);
          }
        }
        return;
      }

      if (!this.routeArmed) {
        this.selectedTruck = null;
        return;
      }

      this.pendingWaypoints.push([gx, gy]);

      const prev = this.pendingWaypoints.length > 1
        ? this.pendingWaypoints[this.pendingWaypoints.length - 2]
        : [Math.floor(this.selectedTruck.position.x), Math.floor(this.selectedTruck.position.y)];
      const leg = findPath(this.pathGrid, prev, [gx, gy]);
      this.pendingPreviewPaths.push(leg);
    };

    this.input.isDragBuildMode = () =>
      this.buildController.mode === BUILD_MODES.ROAD_UPGRADE ||
      this.buildController.mode === BUILD_MODES.BRIDGE ||
      this.buildController.mode === BUILD_MODES.DEMOLISH ||
      this.buildController.mode === BUILD_MODES.CONVEYOR;

    this.input.onDragBuild = (sx0, sy0, sx1, sy1) => {
      const w0 = this.camera.screenToWorld(sx0, sy0, CONFIG.TILE_SIZE);
      const w1 = this.camera.screenToWorld(sx1, sy1, CONFIG.TILE_SIZE);
      const x0 = Math.floor(w0.x), y0 = Math.floor(w0.y);
      const x1 = Math.floor(w1.x), y1 = Math.floor(w1.y);

      if (this.buildController.mode === BUILD_MODES.CONVEYOR) {
        const [cx1, cy1] = this._clampToStraight(x0, y0, x1, y1);
        this._placeConveyorLine([x0, y0], [cx1, cy1], this.buildController.forceLink);
        return;
      }

      const line = this._bresenhamLine(x0, y0, x1, y1);
      for (const [x, y] of line) this.buildController.placeAt(x, y);
    };
  }

  _clampToStraight(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    return Math.abs(dx) >= Math.abs(dy) ? [x1, y0] : [x0, y1];
  }

  _straightLineTiles(x0, y0, x1, y1) {
    const points = [];
    if (y0 === y1) {
      const step = x1 >= x0 ? 1 : -1;
      for (let x = x0; step > 0 ? x <= x1 : x >= x1; x += step) points.push([x, y0]);
    } else {
      const step = y1 >= y0 ? 1 : -1;
      for (let y = y0; step > 0 ? y <= y1 : y >= y1; y += step) points.push([x0, y]);
    }
    return points;
  }

  _bresenhamLine(x0, y0, x1, y1) {
    const points = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;

    while (true) {
      points.push([x, y]);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    return points;
  }

  _assignMultiRoute(truck, waypoints) {
    if (waypoints.length < 2) return false;

    const start = [Math.floor(truck.position.x), Math.floor(truck.position.y)];
    const pathToFirst = findPath(this.pathGrid, start, waypoints[0]);
    if (!pathToFirst) return false;

    const legs = [];
    for (let i = 0; i < waypoints.length; i++) {
      const from = waypoints[i];
      const to = waypoints[(i + 1) % waypoints.length];
      const leg = findPath(this.pathGrid, from, to);
      if (!leg) return false;
      legs.push(leg);
    }

    truck.route = { waypoints, legs };
    truck.manualControl = true;
    truck.routeLegIndex = -1;
    truck.path = pathToFirst;
    truck.pathIndex = 0;
    truck.state = TRUCK_STATE.MOVING;
    return true;
  }

  _finishRoute() {
    if (!this.selectedTruck || this.pendingWaypoints.length < 2) return;
    this._assignMultiRoute(this.selectedTruck, this.pendingWaypoints);
    this.pendingWaypoints = [];
    this.pendingPreviewPaths = [];
    this.routeArmed = false;
  }

  _handleArrival(truck, [px, py]) {
    const tile = this.state.world.tiles[py * this.state.world.width + px];

    if (tile.port) {
      if (truck.cargo) {
        deliverToPort(tile.port, this.state.questManager, this.market, truck.cargo.type, truck.cargo.amount);
        truck.unloadCargo();
      }
      return;
    }

    if (!tile.building) return;

    if (tile.building.kind === 'warehouse') {
      const warehouse = tile.building;

      if (warehouse.isInputCell(px, py) && truck.cargo) {
        const accepted = warehouse.acceptInput(truck.cargo.type, truck.cargo.amount);
        if (accepted === 0) this.eventTicker.push(`Warehouse ne prima ${truck.cargo.type} (slot nije podešen za taj tip)`);
        truck.cargo.amount -= accepted;
        if (truck.cargo.amount <= 0) truck.unloadCargo();
        return;
      }

      const outSlot = warehouse.outputSlotIndexAt(px, py);
      if (outSlot !== -1 && !truck.cargo) {
        const { type, amount } = warehouse.collectFromSlot(outSlot, truck.capacity);
        if (amount > 0) truck.loadCargo(type, amount);
      }
      return;
    }

    if (!truck.cargo && tile.building.outputBuffer > 0) {
      if (tile.building.outputCell && (px !== tile.building.outputCell[0] || py !== tile.building.outputCell[1])) return;
      const outputType = getOutputType(tile.building);
      if (!outputType) return;
      const taken = takeOutput(tile.building, truck.capacity);
      if (taken > 0) truck.loadCargo(outputType, taken);
      return;
    }

    if (truck.cargo && tile.building.acceptInput) {
      if (tile.building.inputCell && (px !== tile.building.inputCell[0] || py !== tile.building.inputCell[1])) return;
      const accepted = tile.building.acceptInput(truck.cargo.type, truck.cargo.amount);
      if (accepted === 0) this.eventTicker.push(`${tile.building.kind} ne prima ${truck.cargo.type} - krivi resurs za recept`);
      truck.cargo.amount -= accepted;
      if (truck.cargo.amount <= 0) truck.unloadCargo();
    }
  }

  _placeConveyorLine(a, b, forceLink = false) {
    const [ax, ay] = a;
    const [bx, by] = b;
    if (ax !== bx && ay !== by) return false;
    // 0-duljinska "linija" (a===b, npr. klik bez pomaka tijekom drag-builda)
    // nema smisleni smjer - bez ovoga bi dx=dy=0 zavrsio s afterX,Y === last
    // tile sam sebi, pa bi belt dobio .next koji pokazuje na SAMOG SEBE.
    if (ax === bx && ay === by) return false;

    const dx = Math.sign(bx - ax);
    const dy = Math.sign(by - ay);
    const length = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) + 1;
    const cost = BUILD_COSTS[BUILD_MODES.CONVEYOR] * length;
    if (this.state.wallet.balance < cost) return false;

    const { world } = this.state;
    const cells = [];
    for (let i = 0; i < length; i++) {
      const x = ax + dx * i;
      const y = ay + dy * i;
      if (x < 0 || y < 0 || x >= world.width || y >= world.height) return false;
      const tile = world.tiles[y * world.width + x];
      if (tile.building || tile.terrain === 'water' || tile.port) return false;
      cells.push(tile);
    }

    this.state.wallet.spend(cost);

    const segments = cells.map(tile => {
      const seg = new ConveyorSegment(`conv-${this.conveyorIdCounter++}`, tile.x, tile.y, { dx, dy });
      tile.building = seg;
      this.state.conveyors.push(seg);
      return seg;
    });

    for (let i = 0; i < segments.length - 1; i++) {
      segments[i].next = segments[i + 1];
      segments[i + 1].registerIncoming(segments[i].id);
    }

    const first = segments[0];
    const last = segments[segments.length - 1];

    // "Koljeno" - spajanje na SLIJEPI KRAJ postojeceg belta ILI mergera je
    // uvijek sigurno (samo nastavlja njegov tok u novom smjeru). Ako postojeci
    // vec ima .next, automatski spoj bi ga otelo/preusmjerilo - to dopustamo
    // SAMO uz forceLink. Radi SAMO na direktno susjednim (edge-to-edge)
    // tile-ovima - nikad se ne stvara nijedan dodatni tile koji igrac nije
    // sam platio/postavio.
    const beforeX = first.x - dx;
    const beforeY = first.y - dy;
    if (beforeX >= 0 && beforeY >= 0 && beforeX < world.width && beforeY < world.height) {
      const beforeBuilding = world.tiles[beforeY * world.width + beforeX].building;
      const isChainable = beforeBuilding?.kind === 'conveyor' || beforeBuilding?.kind === 'merger';
      if (isChainable && (forceLink || !beforeBuilding.next)) {
        beforeBuilding.next = first;
        first.registerIncoming(beforeBuilding.id);
      }
    }

    // Ulazak NAŠEG belta u postojeci conveyor ne dira taj postojeci lanac,
    // uvijek sigurno. Ulazak u MERGER radi samo ako je afterTile stvarno
    // jedna od NJEGOVIH definiranih ulaznih strana (ne bilo koja strana).
    const afterX = last.x + dx;
    const afterY = last.y + dy;
    if (afterX >= 0 && afterY >= 0 && afterX < world.width && afterY < world.height) {
      const afterBuilding = world.tiles[afterY * world.width + afterX].building;
      if (afterBuilding?.kind === 'conveyor') {
        last.next = afterBuilding;
        afterBuilding.registerIncoming(last.id);
      } else if (afterBuilding?.kind === 'merger' && afterBuilding.acceptsFrom(last.x, last.y)) {
        last.next = afterBuilding;
        afterBuilding.registerIncoming(last.id);
      }
    }

    return true;
  }

  _feedConveyors() {
    const { world } = this.state;
    for (const belt of this.state.conveyors) {
      if (!belt.canAccept()) continue;

      // Obican conveyor gleda SAMO tile iza sebe (suprotno od .direction).
      // Merger gleda SVE svoje definirane ulazne strane (inputOffsets).
      const upstreamPositions = belt.kind === 'merger'
        ? belt.inputOffsets.map(([dx, dy]) => [belt.x + dx, belt.y + dy])
        : [[belt.x - belt.direction.dx, belt.y - belt.direction.dy]];

      for (const [upX, upY] of upstreamPositions) {
        if (upX < 0 || upY < 0 || upX >= world.width || upY >= world.height) continue;

        const upstream = world.tiles[upY * world.width + upX].building;
        if (!upstream) continue;

        if (upstream.kind === 'warehouse') {
          const slotIndex = upstream.outputSlotIndexAt(upX, upY);
          if (slotIndex === -1) continue;
          const { type, amount } = upstream.collectFromSlot(slotIndex, 1);
          if (amount > 0) {
            belt.registerIncoming(upstream.id);
            belt.push(type, upstream.id);
            break;
          }
          continue;
        }

        if (upstream.outputCell && (upX !== upstream.outputCell[0] || upY !== upstream.outputCell[1])) continue;
        if (upstream.kind === 'conveyor' || upstream.kind === 'merger' || !(upstream.outputBuffer > 0)) continue;

        const outputType = getOutputType(upstream);
        if (!outputType) continue;
        if (takeOutput(upstream, 1) > 0) {
          belt.registerIncoming(upstream.id);
          belt.push(outputType, upstream.id);
          break;
        }
      }
    }
  }

  _drainConveyors() {
    const { world } = this.state;
    for (const belt of this.state.conveyors) {
      if (belt.next || belt.items.length === 0 || belt.items[0].progress < 1) continue;

      const downX = belt.x + belt.direction.dx;
      const downY = belt.y + belt.direction.dy;
      if (downX < 0 || downY < 0 || downX >= world.width || downY >= world.height) continue;

      const downTile = world.tiles[downY * world.width + downX];
      const item = belt.items[0];

      if (downTile.building?.kind === 'warehouse') {
        const wh = downTile.building;
        // Cijela ulazna strana footprinta prima bilo koji red/stupac (ne
        // samo jedan konkretan tile) - dosljedno s izlazom koji vec prihvaca
        // bilo koji output tile (_feedConveyors/collectFromSlot po slotu).
        if (wh.isInputCell(downX, downY) && wh.acceptInput(item.type, 1) > 0) belt.items.shift();
        continue;
      }

      if (downTile.building?.acceptInput) {
        if (downTile.building.inputCell && (downX !== downTile.building.inputCell[0] || downY !== downTile.building.inputCell[1])) continue;
        if (downTile.building.acceptInput(item.type, 1) > 0) belt.items.shift();
      } else if (downTile.port && CONFIG.ALLOW_DIRECT_CONVEYOR_SALE) {
        deliverToPort(downTile.port, this.state.questManager, this.market, item.type, 1);
        belt.items.shift();
      }
    }
  }

  // Vraca smjer (grid-osi vektor) kojim se kamion trenutno krece ili bi se
  // kretao ulaskom u sljedeci tile na svom putu - koristi se za odredivanje
  // trake (desnostrana voznja), neovisno o tome je li .heading vec azuriran
  // za OVAJ segment (blocking-check se radi PRIJE truck.update() u istom ticku).
  _headingFor(truck) {
    if (!truck.path || truck.pathIndex >= truck.path.length - 1) return truck.heading ?? { dx: 0, dy: 1 };
    const [cx, cy] = truck.path[truck.pathIndex];
    const [tx, ty] = truck.path[truck.pathIndex + 1];
    return { dx: Math.sign(tx - cx), dy: Math.sign(ty - cy) };
  }

  _isNextTileBlocked(truck) {
    if (truck.state !== TRUCK_STATE.MOVING || !truck.path || truck.pathIndex >= truck.path.length - 1) return false;
    const [tx, ty] = truck.path[truck.pathIndex + 1];
    const heading = this._headingFor(truck);

    // Dva kamiona smiju dijeliti isti tile ako voze RAZLICITIM smjerom (svaki
    // svoju traku, desnostrana voznja) - blokira samo isti smjer (ista traka).
    return this.state.trucks.some(other => {
      if (other === truck) return false;
      if (Math.floor(other.position.x) !== tx || Math.floor(other.position.y) !== ty) return false;
      const otherHeading = other.heading ?? this._headingFor(other);
      return otherHeading.dx === heading.dx && otherHeading.dy === heading.dy;
    });
  }

  _truckAt(wx, wy) {
    const SELECT_RADIUS = 0.6;
    return this.state.trucks.find(t => Math.hypot(t.position.x - wx, t.position.y - wy) < SELECT_RADIUS);
  }

  // Spiralna pretraga od zadane tocke prema van dok se ne nadje hodljiv tile
  // - sredina otoka (generator.islandCenters) je float seed-tocka generacije,
  // ne garantirano tocno hodljiv teren (moze pasti na rub/vodu), pa treba
  // "zalijepiti" na najblizi stvarni kopneni tile.
  _findNearestWalkable(center) {
    const cx = Math.round(center.x);
    const cy = Math.round(center.y);
    const { width, height } = this.state.world;
    const maxRadius = Math.max(width, height);

    for (let r = 0; r <= maxRadius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; // samo obod trenutnog prstena
          const x = cx + dx, y = cy + dy;
          if (x < 0 || y < 0 || x >= width || y >= height) continue;
          if (this.pathGrid.isWalkable(x, y)) return { x, y };
        }
      }
    }
    return { x: Math.max(0, Math.min(width - 1, cx)), y: Math.max(0, Math.min(height - 1, cy)) };
  }

  _spawnDemoTruck(pos) {
    const truck = new Truck(`truck-${this.truckIdCounter++}`, pos.x, pos.y, 50);
    this.state.trucks.push(truck);
    this._retarget(truck);
  }

  _retarget(truck) {
    const { width, height } = this.state.world;
    for (let attempt = 0; attempt < 30; attempt++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      if (this.pathGrid.isWalkable(x, y)) {
        truck.setDestination(this.pathGrid, [x, y]);
        return;
      }
    }
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _update(deltaTime) {
    this.elapsedTime = (this.elapsedTime ?? 0) + deltaTime;
    const { modifiers } = this.state;
    for (const truck of this.state.trucks) {
      const blocked = this._isNextTileBlocked(truck);
      truck.update(deltaTime, this.pathGrid, modifiers.truckSpeedMultiplier, blocked);

      if (truck.state === TRUCK_STATE.IDLE) {
        if (truck.route) {
          const arrivedIndex = (truck.routeLegIndex + 1) % truck.route.waypoints.length;
          this._handleArrival(truck, truck.route.waypoints[arrivedIndex]);

          truck.routeLegIndex = arrivedIndex;
          truck.path = truck.route.legs[arrivedIndex];
          truck.pathIndex = 0;
          truck.state = TRUCK_STATE.MOVING;
        } else if (!truck.manualControl) {
          this._retarget(truck);
        }
      }
    }
    for (const extractor of this.state.extractors) extractor.update(deltaTime, modifiers.extractorSpeedMultiplier);
    for (const smelter of this.state.smelters) smelter.update(deltaTime, modifiers.processorSpeedMultiplier);
    for (const factory of this.state.factories) factory.update(deltaTime, modifiers.processorSpeedMultiplier);
    for (const assembler of this.state.assemblers) assembler.update(deltaTime, modifiers.processorSpeedMultiplier * modifiers.assemblerSpeedMultiplier);

    this._feedConveyors();
    for (const belt of this.state.conveyors) belt.update(deltaTime, modifiers.beltSpeedMultiplier);
    this._drainConveyors();

    transferAdjacentOutputs(this.state.world, this.market, this.state.questManager);
    this.state.questManager.trySpawnQuests(this.state.world.ports, deltaTime);
    this.state.questManager.update(deltaTime);
    this.activeQuestsPanel.update(deltaTime);
    this.availableQuestsPopup.update(deltaTime);
    this.eventTicker.update(deltaTime);
    this.techPanel.update(deltaTime);
  }

  _render() {
    let previewTiles = null;
    if (this.dragBuildPreview) {
      const { startX, startY, endX, endY } = this.dragBuildPreview;
      const isStraightMode = this.buildController.mode === BUILD_MODES.CONVEYOR;
      previewTiles = isStraightMode
        ? this._straightLineTiles(startX, startY, ...this._clampToStraight(startX, startY, endX, endY))
        : this._bresenhamLine(startX, startY, endX, endY);
    }

    // Cijena drag-linije uzivo pored kursora (cesta/most/conveyor) - dok se
    // ne pusti klik, samo pregled, ne trosi novac.
    if (previewTiles && this.hoverScreenPos) {
      const cost = this.buildController.estimateLineCost(previewTiles);
      if (cost > 0) this.tooltip.showCost(this.hoverScreenPos.x, this.hoverScreenPos.y, cost);
    }

    const GHOST_MODES = [BUILD_MODES.EXTRACTOR, BUILD_MODES.SMELTER, BUILD_MODES.FACTORY, BUILD_MODES.ASSEMBLER, BUILD_MODES.WAREHOUSE_SMALL, BUILD_MODES.WAREHOUSE_LARGE, BUILD_MODES.TRUCK_GARAGE, BUILD_MODES.MERGER_TWO, BUILD_MODES.MERGER_THREE];
    const buildGhost = this.hoverTile && GHOST_MODES.includes(this.buildController.mode)
      ? this.buildController.previewAt(this.hoverTile.x, this.hoverTile.y)
      : null;

    this.renderer.render(
      this.state.world, this.state.trucks, this.assets, this.selectedTruck, this.pendingWaypoints,
      this.gridOverlayEnabled ? this.hoverScreenPos : null,
      previewTiles, this.buildController.mode, buildGhost, this.pendingPreviewPaths, this.elapsedTime ?? 0
    );
    this.hud.update(this.state.wallet, this.state.questManager.researchPoints);
    this.buildPanel.refresh();
    this.vehiclePanel.update(this.state.wallet.balance, this.sellTruckArmed, this.selectedTruck, this.routeArmed, this.pendingWaypoints, this.state.truckGarages.length > 0);
    this.timePanel.update();
    this.tabBar.setTechActive(this.techPanel.visible);
  }

  start() {
    this.loop.start();
  }

  // Uklanja SVE sto je konstruktor registrirao izvan Engine instance same
  // (window i static DOM listenere) i zaustavlja render loop. main.js ovo
  // zove PRIJE nego stvori novi Engine na Exit->Start Again - bez toga stari
  // Engine ostaje "zombie" koji i dalje reagira na tipke/resize/touch iako
  // ga nitko vise ne koristi (isti canvas/DOM elementi se recikliraju).
  // Prepisuje trenutno stanje (world, entiteti, wallet, tech tree, kamera...)
  // spremljenim podacima. Poziva se na tek konstruiranom Engineu (main.js
  // gradi Engine s dimenzijama iz save.world pa odmah zove ovo) - world.tiles
  // je vec ispravne velicine, applySaveData ga u potpunosti prepisuje.
  applySaveData(saveData) {
    applySaveData(this, saveData);
  }

  destroy() {
    this.loop.stop();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKeydown);
    this.input.destroy();
    this.mobileControls.destroy();
  }
}
