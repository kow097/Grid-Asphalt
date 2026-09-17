export const LOGISTICS_BRANCH = [
  {
    id: 'log_mk2',
    name: 'Mk2 Conveyor Belts',
    cost: 15,
    requires: null,
    effect: (ctx) => { ctx.modifiers.beltSpeedMultiplier *= 1.5; },
  },
  {
    id: 'log_mk3',
    name: 'Mk3 Conveyor Belts',
    cost: 35,
    requires: 'log_mk2',
    effect: (ctx) => { ctx.modifiers.beltSpeedMultiplier *= 1.5; },
  },
  {
    id: 'log_smart_router',
    name: 'Smart Splitters/Mergers',
    cost: 25,
    requires: 'log_mk2',
    effect: (ctx) => { ctx.modifiers.smartRoutingUnlocked = true; },
  },
];
