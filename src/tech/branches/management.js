export const MANAGEMENT_BRANCH = [
  {
    id: 'mgmt_more_quests',
    name: 'Logistics Coordinator',
    cost: 15,
    requires: null,
    effect: (ctx) => { ctx.questManager.maxActiveQuests += 1; },
  },
  {
    id: 'mgmt_more_quests2',
    name: 'Regional Dispatch',
    cost: 35,
    requires: 'mgmt_more_quests',
    effect: (ctx) => { ctx.questManager.maxActiveQuests += 1; },
  },
  {
    id: 'mgmt_trade_deals',
    name: 'Better Trade Deals',
    cost: 30,
    requires: null,
    effect: (ctx) => { ctx.modifiers.marketPriceMultiplier *= 1.1; },
  },
];
