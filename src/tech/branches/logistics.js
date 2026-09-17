// Tab: LOGISTICS. line: 'A' Conveyors&Sorting, 'B' Truck Fleet, 'C' Warehousing+Food.
// cost:0 BEZ prerequisites = auto-otkljucano od starta (vidi TechTree.autoUnlockFreeRoots).
// cost:0 S prerequisites = "0RP placeholder" - feature jos ne postoji u igri,
// otkljucava se instantno cim je dostupan, cost se mijenja kad feature nastane.
export const LOGISTICS_NODES = [
  // --- Linija A: Conveyors & Sorting ---
  {
    id: 'L1', title: 'Basic Belts', line: 'A', tier: 1, cost: 5, prerequisites: [],
    description: 'Otključava gradnju conveyor traka.',
    effect: null,
  },
  {
    id: 'L2', title: 'High-Speed Belts', line: 'A', tier: 2, cost: 150, prerequisites: ['L1'],
    description: 'Brzina svih traka +50%.',
    effect: (ctx) => { ctx.modifiers.beltSpeedMultiplier *= 1.5; },
  },
  {
    id: 'L3', title: 'Splitters & Mergers', line: 'A', tier: 3, cost: 250, prerequisites: ['L2'],
    description: 'Otključava Merger zgrade (2-strani i 3-strani spoj više traka u jednu).',
    effect: null,
  },
  {
    id: 'L4', title: 'Express Belts', line: 'A', tier: 4, cost: 400, prerequisites: ['L3'],
    description: 'Brzina svih traka dodatnih +100% (iznad L2 bonusa).',
    effect: (ctx) => { ctx.modifiers.beltSpeedMultiplier *= 2; },
  },
  {
    id: 'L5', title: 'Overhead & Cold Conveyors', line: 'A', tier: 5, cost: 0, prerequisites: ['L4'],
    description: '[Nije još u igri] Trake koje premošćuju ceste/zgrade + hlađeni transport (hrana ne propada na traci). 0RP dok sustav ne postoji.',
    effect: null, placeholder: true,
  },

  // --- Linija B: Truck Fleet ---
  {
    id: 'L6', title: 'Truck Garage', line: 'B', tier: 1, cost: 5, prerequisites: [],
    description: 'Otključava gradnju Truck Garage zgrade (potrebna za kupnju dodatnih kamiona). Prvi kamion na otoku spawna besplatno bez ovoga.',
    effect: null,
  },
  {
    id: 'L7', title: 'Capacity Upgrade I', line: 'B', tier: 2, cost: 150, prerequisites: ['L6'],
    description: 'Standardna linija kamiona: kapacitet +15.',
    effect: (ctx) => { ctx.modifiers.truckCapacityBonus += 15; },
  },
  {
    id: 'L8', title: 'Refrigeration Unit', line: 'B', tier: 3, cost: 0, prerequisites: ['L7'],
    description: '[Nije još u igri] Otključava rashladni kamion (odvojena linija vozila, vlastiti bazni kapacitet). 0RP dok decay sustav ne postoji.',
    effect: null, placeholder: true,
  },
  {
    id: 'L9', title: 'Standard Trailer', line: 'B', tier: 4, cost: 350, prerequisites: ['L7'],
    description: 'Standardna linija kamiona: kapacitet dodatnih +20.',
    effect: (ctx) => { ctx.modifiers.truckCapacityBonus += 20; },
  },
  {
    id: 'L10', title: 'Heavy Trailer (šleper)', line: 'B', tier: 5, cost: 550, prerequisites: ['L9'],
    description: 'Standardna linija kamiona: kapacitet dodatnih +40.',
    effect: (ctx) => { ctx.modifiers.truckCapacityBonus += 40; },
  },
  {
    id: 'L11', title: 'Šleper Hladnjak', line: 'B', tier: 6, cost: 0, prerequisites: ['L8', 'L10'],
    description: '[Nije još u igri] Rashladna linija dobiva isti veliki kapacitet kao šleper. 0RP dok decay sustav ne postoji.',
    effect: null, placeholder: true,
  },

  // --- Linija C: Warehousing + Food Industry ---
  {
    id: 'L12', title: 'Small Warehouse', line: 'C', tier: 1, cost: 5, prerequisites: [],
    description: 'Otključava mali Warehouse (2 slota).',
    effect: null,
  },
  {
    id: 'L13', title: 'Large Warehouse', line: 'C', tier: 2, cost: 200, prerequisites: ['L12'],
    description: 'Otključava veliki Warehouse (5 slotova).',
    effect: null,
  },
  {
    id: 'L14', title: 'Extra Storage Bay', line: 'C', tier: 3, cost: 350, prerequisites: ['L13'],
    description: 'Kapacitet svakog warehouse slota +50.',
    effect: (ctx) => { ctx.modifiers.warehouseCapacityBonus += 50; },
  },
  {
    id: 'L15', title: 'Farming & Food Industry', line: 'C', tier: 4, cost: 0, prerequisites: ['L14'],
    description: '[Nije još u igri] Otključava farmu (novi extractor tip) + recepte prerade hrane. 0RP dok industrija ne postoji.',
    effect: null, placeholder: true,
  },
  {
    id: 'L16', title: 'Cold Storage Warehouse', line: 'C', tier: 5, cost: 0, prerequisites: ['L15', 'L8'],
    description: '[Nije još u igri] Hlađeni warehouse - hrana ne propada dok stoji uskladištena. 0RP dok sustav ne postoji.',
    effect: null, placeholder: true,
  },
];
