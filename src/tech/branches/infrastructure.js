// Tab: INFRASTRUCTURE. line: 'A' Roads&Traffic, 'B' Bridges&Marine, 'C' Power Grid.
export const INFRASTRUCTURE_NODES = [
  // --- Linija A: Roads & Traffic ---
  {
    id: 'I1', title: 'Dirt Roads', line: 'A', tier: 1, cost: 0, prerequisites: [],
    description: 'Otključava prvi stupanj ceste (Gravel/Dirt Road).',
    effect: null,
  },
  {
    id: 'I2', title: 'Asphalt Paving', line: 'A', tier: 2, cost: 5, prerequisites: ['I1'],
    description: 'Otključava asfalt (najbrži cestovni stupanj, 2x brzina kamiona nad zemljanom cestom).',
    effect: null,
  },
  {
    id: 'I3', title: 'Traffic Signals', line: 'A', tier: 3, cost: 0, prerequisites: ['I2', 'L6'],
    description: '[Nije još u igri] Auto-semafori na raskrižjima kod gužve. 0RP dok sustav ne postoji.',
    effect: null, placeholder: true,
  },
  {
    id: 'I4', title: 'Expressways', line: 'A', tier: 4, cost: 0, prerequisites: ['I3'],
    description: '[Nije još u igri] Višetračne ceste (novi geometrijski model). 0RP dok sustav ne postoji.',
    effect: null, placeholder: true,
  },
  {
    id: 'I5', title: 'Grade Separated Junctions', line: 'A', tier: 5, cost: 0, prerequisites: ['I4'],
    description: '[Nije još u igri] Nadvožnjaci (cesta preko ceste). 0RP dok sustav ne postoji.',
    effect: null, placeholder: true,
  },

  // --- Linija B: Bridges & Marine ---
  {
    id: 'I6', title: 'Wooden Bridges', line: 'B', tier: 1, cost: 5, prerequisites: [],
    description: 'Otključava prvi stupanj mosta (drveni).',
    effect: null,
  },
  {
    id: 'I7', title: 'Concrete Bridges', line: 'B', tier: 2, cost: 6, prerequisites: ['I6'],
    description: 'Otključava betonski most (drugi stupanj).',
    effect: null,
  },
  {
    id: 'I8', title: 'Steel Girder Bridges', line: 'B', tier: 3, cost: 7, prerequisites: ['I7'],
    description: 'Otključava čelični most (treći, najbrži stupanj).',
    effect: null,
  },
  {
    id: 'I9', title: 'Deep Water Ports & Shipping', line: 'B', tier: 4, cost: 0, prerequisites: ['I8'],
    description: '[Nije još u igri] Brod entitet + port kapacitet (roba čeka brod umjesto instant-prodaje). 0RP dok sustav ne postoji.',
    effect: null, placeholder: true,
  },
  {
    id: 'I10', title: 'Land Reclamation', line: 'B', tier: 5, cost: 0, prerequisites: ['I9'],
    description: '[Nije još u igri] Nasipavanje obale - trajno pretvara vodu u kopno. 0RP dok sustav ne postoji.',
    effect: null, placeholder: true,
  },

  // --- Linija C: Power Grid ---
  {
    id: 'I11', title: 'Basic Generators', line: 'C', tier: 1, cost: 300, prerequisites: [],
    description: 'Otključava gradnju Power Plant zgrade (fiksni output 50 struje).',
    effect: null,
  },
  {
    id: 'I12', title: 'Power Substation', line: 'C', tier: 2, cost: 400, prerequisites: ['I11'],
    description: 'Otključava gradnju dalekovoda (Power Pole) - spaja elektrane/baterije/potrošače u mrežu.',
    effect: null,
  },
  {
    id: 'I13', title: 'Battery Storage', line: 'C', tier: 3, cost: 450, prerequisites: ['I12'],
    description: 'Otključava gradnju Battery zgrade (sprema višak struje, pokriva manjak).',
    effect: null,
  },
  {
    id: 'I14', title: 'Renewable Energy', line: 'C', tier: 4, cost: 0, prerequisites: ['I11'],
    description: '[Nije još u igri] Vjetro/solarne elektrane, besplatan pogon. 0RP dok varijanta ne postoji.',
    effect: null, placeholder: true,
  },
  {
    id: 'I15', title: 'High-Voltage Grid', line: 'C', tier: 5, cost: 0, prerequisites: ['I12'],
    description: '[Nije još u igri] Smanjuje gubitke u prijenosu energije. 0RP dok gubici ne postoje u modelu.',
    effect: null, placeholder: true,
  },
];
