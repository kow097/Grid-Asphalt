export function createDefaultModifiers() {
  return {
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
    buildCostMultiplier: 1,
    truckCostMultiplier: 1,
    questAcceptWindowBonus: 0,
    researchPointBonusPerQuest: 0,
    extractorPowerExempt: false,
    corporateSynergyUnlocked: false,
    truckUpkeepMultiplier: 1,
  };
}

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
    this.powerPlants = [];
    this.batteries = [];
    this.powerPoles = [];
    this.truckGroups = [];
    this.truckUpgrades = { trailerLevel: 0, engineLevel: 0 };
    this.modifiers = createDefaultModifiers();
  }
}
