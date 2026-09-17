export class GameState {
  constructor(world, wallet, questManager) {
    this.world = world;
    this.wallet = wallet;
    this.questManager = questManager;
    this.trucks = [];
    this.extractors = [];
    this.smelters = [];
    this.factories = [];
    this.assemblers = [];
    this.warehouses = [];
    this.conveyors = [];
    this.truckGarages = [];
    this.modifiers = {
      truckCapacityBonus: 0,
      truckSpeedMultiplier: 1,
      extractorSpeedMultiplier: 1,
      extractorBufferBonus: 0,
      processorSpeedMultiplier: 1,
      assemblerSpeedMultiplier: 1,
      beltSpeedMultiplier: 1,
      roadUpgradeCostMultiplier: 1,
      warehouseCapacityBonus: 0,
      marketPriceMultiplier: 1,
      smartRoutingUnlocked: false,
    };
  }
}
