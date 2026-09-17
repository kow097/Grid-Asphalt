export const INDUSTRY_BRANCH = [
  {
    id: 'ind_fast_extractors',
    name: 'Improved Drills',
    cost: 20,
    requires: null,
    effect: (ctx) => { ctx.modifiers.extractorSpeedMultiplier *= 1.3; },
  },
  {
    id: 'ind_extractor_buffer',
    name: 'Extended Hoppers',
    cost: 20,
    requires: null,
    effect: (ctx) => {
      ctx.modifiers.extractorBufferBonus = (ctx.modifiers.extractorBufferBonus ?? 0) + 10;
      for (const e of ctx.state.extractors) e.maxBuffer += 10;
    },
  },
  {
    id: 'ind_fast_processors',
    name: 'Advanced Furnaces',
    cost: 30,
    requires: 'ind_fast_extractors',
    effect: (ctx) => { ctx.modifiers.processorSpeedMultiplier *= 1.3; },
  },
  {
    id: 'ind_assemblers',
    name: 'Automated Factories',
    cost: 40,
    requires: 'ind_fast_processors',
    effect: (ctx) => { ctx.modifiers.processorSpeedMultiplier *= 1.2; },
  },
  {
    id: 'ind_assembler_precision',
    name: 'Precision Tooling',
    cost: 30,
    requires: 'ind_fast_processors',
    effect: (ctx) => { ctx.modifiers.assemblerSpeedMultiplier *= 1.4; },
  },
];
