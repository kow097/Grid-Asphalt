// Tab: INDUSTRY. line: 'A' Mining&Extraction, 'B' Smelting&Materials, 'C' Assembly&Manufacturing.
export const INDUSTRY_NODES = [
  // --- Linija A: Mining & Extraction ---
  {
    id: 'D1', title: 'Basic Extractor', line: 'A', tier: 1, cost: 0, prerequisites: [],
    description: 'Otključava gradnju Extractor zgrade.',
    effect: null,
  },
  {
    id: 'D2', title: 'Advanced Mining', line: 'A', tier: 2, cost: 200, prerequisites: ['D1'],
    description: 'Brzina svih extractora +30%.',
    effect: (ctx) => { ctx.modifiers.extractorSpeedMultiplier *= 1.3; },
  },
  {
    id: 'D3', title: 'Deep Drilling', line: 'A', tier: 3, cost: 0, prerequisites: ['D2'],
    description: '[Neprovjereno/nije još u igri] Vađenje nafte/plina. 0RP dok se ne potvrdi je li oil vadiv i doda poseban node ako treba.',
    effect: null, placeholder: true,
  },
  {
    id: 'D4', title: 'Forestry & Lumbering', line: 'A', tier: 4, cost: 0, prerequisites: ['D1'],
    description: '[Nije još u igri] Sječa drva - nova sirovina. 0RP dok industrija ne postoji.',
    effect: null, placeholder: true,
  },
  {
    id: 'D5', title: 'Automated Extraction', line: 'A', tier: 5, cost: 450, prerequisites: ['D2'],
    description: 'Extractori (postojeći i budući) rade bez potrebe za strujom - ima najviše smisla nakon Power Grid linije (I11-I15), ali radi i bez nje.',
    effect: (ctx) => {
      ctx.modifiers.extractorPowerExempt = true;
      for (const e of ctx.state.extractors) e.requiresPower = false;
    },
  },

  // --- Linija B: Smelting & Materials ---
  {
    id: 'D6', title: 'Basic Smelter', line: 'B', tier: 1, cost: 7, prerequisites: [],
    description: 'Otključava gradnju Smelter zgrade.',
    effect: null,
  },
  {
    id: 'D7', title: 'Alloy Production', line: 'B', tier: 2, cost: 0, prerequisites: ['D6'],
    description: '[Nije još u igri] Legure (čelik, bronca) - novi recepti. 0RP dok recepti ne postoje.',
    effect: null, placeholder: true,
  },
  {
    id: 'D8', title: 'Chemical Processing', line: 'B', tier: 3, cost: 0, prerequisites: ['D7', 'D3'],
    description: '[Nije još u igri] Kemikalije/plastika - novi recepti, ovisi o nafti (D3). 0RP dok recepti ne postoje.',
    effect: null, placeholder: true,
  },
  {
    id: 'D9', title: 'Advanced Metallurgy', line: 'B', tier: 4, cost: 0, prerequisites: ['D7'],
    description: '[Nije još povezano] Smanjuje potrošnju sirovina pri topljenju za 15% - čeka izmjenu Processor klase. 0RP dok se ne poveže.',
    effect: null, placeholder: true,
  },
  {
    id: 'D10', title: 'High-Tech Foundry', line: 'B', tier: 5, cost: 600, prerequisites: ['D9'],
    description: 'Brzina svih procesora (smelter/factory/assembler) +50%.',
    effect: (ctx) => { ctx.modifiers.processorSpeedMultiplier *= 1.5; },
  },

  // --- Linija C: Assembly & Manufacturing ---
  {
    id: 'D11', title: 'Basic Assembler', line: 'C', tier: 1, cost: 7, prerequisites: [],
    description: 'Otključava gradnju Assembler zgrade.',
    effect: null,
  },
  {
    id: 'D12', title: 'Advanced Factory', line: 'C', tier: 2, cost: 250, prerequisites: ['D11'],
    description: 'Otključava gradnju Factory zgrade.',
    effect: null,
  },
  {
    id: 'D13', title: 'Precision Tools', line: 'C', tier: 3, cost: 0, prerequisites: ['D12'],
    description: '[Nije još u igri] Recepti za elektroniku/motore. 0RP dok recepti ne postoje.',
    effect: null, placeholder: true,
  },
  {
    id: 'D14', title: 'Heavy Machinery Plant', line: 'C', tier: 4, cost: 0, prerequisites: ['D13'],
    description: '[Nije još u igri] Recepti za industrijske sklopove. 0RP dok recepti ne postoje.',
    effect: null, placeholder: true,
  },
  {
    id: 'D15', title: 'Overclocking', line: 'C', tier: 5, cost: 0, prerequisites: ['D14'],
    description: '[Nije još u igri] Privremeno ubrzanje tvornica uz veću potrošnju struje. 0RP dok sustav ne postoji.',
    effect: null, placeholder: true,
  },
];
