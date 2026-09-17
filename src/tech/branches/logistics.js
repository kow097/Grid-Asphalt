// Tab: LOGISTICS. Root (L1) je sam u tier 1, sve tri linije granaju se iz njega.
// line: 'A' Conveyors & Sorting, 'B' Truck Fleet, 'C' Warehousing & Food.
// cost:0 + no prerequisites = auto-unlocked at game start.
// placeholder:true = feature doesn't exist in-game yet; node is purchasable
// (contributes to prerequisites) but its effect is a no-op stub.
export const LOGISTICS_NODES = [
  {
    id: 'L1', title: 'Basic Belts', tier: 1, cost: 0, prerequisites: [],
    description: 'The foundation of all logistics. Unlocks conveyor belt construction.',
    effect: null,
  },

  // --- Line A: Conveyors & Sorting ---
  { id: 'L2', title: 'High-Speed Belts', line: 'A', tier: 2, cost: 20, prerequisites: ['L1'],
    description: 'Belt speed +50%.', effect: (ctx) => { ctx.modifiers.beltSpeedMultiplier *= 1.5; } },
  { id: 'L3', title: 'Splitters & Mergers', line: 'A', tier: 3, cost: 45, prerequisites: ['L2'],
    description: 'Unlocks Merger buildings (2-way and 3-way belt merges).', effect: null },
  { id: 'L4', title: 'Express Belts', line: 'A', tier: 4, cost: 90, prerequisites: ['L3'],
    description: 'Belt speed +100% on top of the High-Speed bonus.', effect: (ctx) => { ctx.modifiers.beltSpeedMultiplier *= 2; } },
  { id: 'L5', title: 'Smart Routing', line: 'A', tier: 5, cost: 160, prerequisites: ['L4'],
    description: 'Enables smart routing on splitters/mergers.', effect: (ctx) => { ctx.modifiers.smartRoutingUnlocked = true; } },
  { id: 'L6', title: 'Turbo Belts', line: 'A', tier: 6, cost: 300, prerequisites: ['L5'],
    description: 'Belt speed +25% on top of all previous bonuses.', effect: (ctx) => { ctx.modifiers.beltSpeedMultiplier *= 1.25; } },
  { id: 'L7', title: 'Overhead & Cold Conveyors', line: 'A', tier: 7, cost: 0, prerequisites: ['L6'],
    description: '[Not in game yet] Belts that bridge over roads/buildings, plus refrigerated transport (food no longer decays on belt). 0RP until the system exists.',
    effect: null, placeholder: true },

  // --- Line B: Truck Fleet ---
  { id: 'L8', title: 'Truck Garage', line: 'B', tier: 2, cost: 20, prerequisites: ['L1'],
    description: 'Unlocks the Truck Garage building (needed to buy extra trucks). The starting truck spawns free without this.', effect: null },
  { id: 'L9', title: 'Capacity Upgrade I', line: 'B', tier: 3, cost: 45, prerequisites: ['L8'],
    description: 'Standard truck line: capacity +15.', effect: (ctx) => { ctx.modifiers.truckCapacityBonus += 15; } },
  { id: 'L10', title: 'Refrigeration Unit', line: 'B', tier: 4, cost: 0, prerequisites: ['L9'],
    description: '[Not in game yet] Unlocks the refrigerated truck (separate vehicle line, own base capacity). 0RP until the decay system exists.',
    effect: null, placeholder: true },
  { id: 'L11', title: 'Standard Trailer', line: 'B', tier: 5, cost: 160, prerequisites: ['L9'],
    description: 'Standard truck line: capacity +20 on top of previous bonuses.', effect: (ctx) => { ctx.modifiers.truckCapacityBonus += 20; } },
  { id: 'L12', title: 'Heavy Trailer', line: 'B', tier: 6, cost: 300, prerequisites: ['L11'],
    description: 'Standard truck line: capacity +40 on top of previous bonuses.', effect: (ctx) => { ctx.modifiers.truckCapacityBonus += 40; } },
  { id: 'L13', title: 'Refrigerated Trailer', line: 'B', tier: 7, cost: 0, prerequisites: ['L10', 'L12'],
    description: '[Not in game yet] The refrigerated line gets the same large capacity as the Heavy Trailer. 0RP until the decay system exists.',
    effect: null, placeholder: true },

  // --- Line C: Warehousing & Food ---
  { id: 'L14', title: 'Small Warehouse', line: 'C', tier: 2, cost: 20, prerequisites: ['L1'],
    description: 'Unlocks the small Warehouse (2 slots).', effect: null },
  { id: 'L15', title: 'Large Warehouse', line: 'C', tier: 3, cost: 45, prerequisites: ['L14'],
    description: 'Unlocks the large Warehouse (5 slots).', effect: null },
  { id: 'L16', title: 'Extra Storage Bay', line: 'C', tier: 4, cost: 90, prerequisites: ['L15'],
    description: 'Warehouse slot capacity +50.', effect: (ctx) => { ctx.modifiers.warehouseCapacityBonus += 50; } },
  { id: 'L17', title: 'Bulk Storage Expansion', line: 'C', tier: 5, cost: 160, prerequisites: ['L16'],
    description: 'Warehouse slot capacity +75 on top of the previous bonus.', effect: (ctx) => { ctx.modifiers.warehouseCapacityBonus += 75; } },
  { id: 'L18', title: 'Farming & Food Industry', line: 'C', tier: 6, cost: 0, prerequisites: ['L17'],
    description: '[Not in game yet] Unlocks the Farm (new extractor type) and food-processing recipes. 0RP until the industry exists.',
    effect: null, placeholder: true },
  { id: 'L19', title: 'Cold Storage Warehouse', line: 'C', tier: 7, cost: 0, prerequisites: ['L18', 'L10'],
    description: '[Not in game yet] Refrigerated warehouse - stored food no longer decays. 0RP until the system exists.',
    effect: null, placeholder: true },
];
