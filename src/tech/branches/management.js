// Tab: MANAGEMENT. line: 'A' Contracts&Quests, 'B' R&D&Market, 'C' Financial&Efficiency.
export const MANAGEMENT_NODES = [
  // --- Linija A: Contracts & Quests ---
  {
    id: 'M1', title: 'Local Contracts', line: 'A', tier: 1, cost: 0, prerequisites: [],
    description: '2 aktivna questa (postojeće stanje). IZUZETAK od "sve se otključava" pravila - zaključavanje OVOGA bi spriječilo igrača da ikad zaradi RP (questovi su jedini izvor RP), pa ostaje besplatan root.',
    effect: null,
  },
  {
    id: 'M2', title: 'Contract Slots II', line: 'A', tier: 2, cost: 250, prerequisites: ['M1'],
    description: 'Broj aktivnih questova: 3.',
    effect: (ctx) => { ctx.questManager.maxActiveQuests = 3; },
  },
  {
    id: 'M3', title: 'Contract Slots III', line: 'A', tier: 3, cost: 350, prerequisites: ['M2'],
    description: 'Broj aktivnih questova: 4.',
    effect: (ctx) => { ctx.questManager.maxActiveQuests = 4; },
  },
  {
    id: 'M4', title: 'Regional Contracts', line: 'A', tier: 4, cost: 450, prerequisites: ['M3'],
    description: 'Broj aktivnih questova: 5.',
    effect: (ctx) => { ctx.questManager.maxActiveQuests = 5; },
  },
  {
    id: 'M5', title: 'Global Monopolies', line: 'A', tier: 5, cost: 600, prerequisites: ['M4'],
    description: 'Broj aktivnih questova: 6 (maksimum).',
    effect: (ctx) => { ctx.questManager.maxActiveQuests = 6; },
  },

  // --- Linija B: R&D & Market ---
  {
    id: 'M6', title: 'Research Center', line: 'B', tier: 1, cost: 300, prerequisites: [],
    description: 'Svaki dovršeni quest daje +3 RP bonus (flat, iznad quest nagrade).',
    effect: (ctx) => { ctx.modifiers.researchPointBonusPerQuest += 3; },
  },
  {
    id: 'M7', title: 'Market Speculation', line: 'B', tier: 2, cost: 350, prerequisites: ['M6'],
    description: 'Cijena auto-prodaje (market sell) +15%.',
    effect: (ctx) => { ctx.modifiers.marketPriceMultiplier *= 1.15; },
  },
  {
    id: 'M8', title: 'Contract Refinement', line: 'B', tier: 3, cost: 300, prerequisites: ['M6'],
    description: 'Produžuje accept-timer quest ponuda za +30 sekundi.',
    effect: (ctx) => { ctx.modifiers.questAcceptWindowBonus += 30; },
  },
  {
    id: 'M9', title: 'Auto-Accept Contracts', line: 'B', tier: 4, cost: 400, prerequisites: ['M8'],
    description: '[Nije još povezano] QuestManager bi trebao pratiti stvarni protok robe u luku i auto-prihvaćati questove - čeka novi sustav (vlastiti tier-limit, odvojen od M1-M5). Čvor je kupljiv, efekt je stub.',
    effect: null, placeholder: true,
  },
  {
    id: 'M10', title: 'Research Queueing', line: 'B', tier: 5, cost: 0, prerequisites: ['M6'],
    description: '[Nije još u igri] Red čekanja istraživanja (nizanje projekata). 0RP, niski prioritet.',
    effect: null, placeholder: true,
  },

  // --- Linija C: Financial & Efficiency ---
  {
    id: 'M11', title: 'Tax Exemptions', line: 'C', tier: 1, cost: 250, prerequisites: [],
    description: 'Troškovi gradnje svih zgrada -10%.',
    effect: (ctx) => { ctx.modifiers.buildCostMultiplier *= 0.9; },
  },
  {
    id: 'M12', title: 'Subsidized Infrastructure', line: 'C', tier: 2, cost: 300, prerequisites: ['M11'],
    description: 'Trošak polaganja/nadogradnje cesta -15%.',
    effect: (ctx) => { ctx.modifiers.roadUpgradeCostMultiplier *= 0.85; },
  },
  {
    id: 'M13', title: 'Bulk Purchasing', line: 'C', tier: 3, cost: 350, prerequisites: ['M12'],
    description: 'Dodatnih -10% na trošak zgrada (kumulativno s M11) i -15% na cijenu kamiona.',
    effect: (ctx) => {
      ctx.modifiers.buildCostMultiplier *= 0.9;
      ctx.modifiers.truckCostMultiplier *= 0.85;
    },
  },
  {
    id: 'M14', title: 'Emergency Loans', line: 'C', tier: 4, cost: 500, prerequisites: ['M13'],
    description: '[Nije još povezano] Kredit/dug sustav (posudi novac, otplati s kamatom) - dolazi kasnije, poseban rad. Čvor je kupljiv, efekt je stub.',
    effect: null, placeholder: true,
  },
  {
    id: 'M15', title: 'Corporate Synergy', line: 'C', tier: 5, cost: 550, prerequisites: ['M13'],
    description: '[Nije još povezano] Dovršeni quest bi trebao dati privremeni bonus brzine svim tvornicama - čeka timed-buff sustav. Čvor je kupljiv, efekt je stub.',
    effect: null, placeholder: true,
  },
];
