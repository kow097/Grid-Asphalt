export const INFRASTRUCTURE_BRANCH = [
  {
    id: 'infra_truck_capacity',
    name: 'Reinforced Cargo Beds',
    cost: 20,
    requires: null,
    effect: (ctx) => { ctx.modifiers.truckCapacityBonus += 25; },
  },
  {
    id: 'infra_truck_speed',
    name: 'Tuned Engines',
    cost: 30,
    requires: 'infra_truck_capacity',
    effect: (ctx) => { ctx.modifiers.truckSpeedMultiplier *= 1.25; },
  },
  {
    id: 'infra_cheap_roads',
    name: 'Road Crew Efficiency',
    cost: 15,
    requires: null,
    effect: (ctx) => { ctx.modifiers.roadUpgradeCostMultiplier *= 0.5; },
  },
  {
    id: 'infra_warehouse_capacity',
    name: 'Bulk Storage Racks',
    cost: 30,
    requires: null,
    effect: (ctx) => {
      ctx.modifiers.warehouseCapacityBonus = (ctx.modifiers.warehouseCapacityBonus ?? 0) + 50;
      for (const w of ctx.state.warehouses) w.capacityPerSlot += 50;
    },
  },
];
