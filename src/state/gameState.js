export class GameState {
  constructor(world, wallet, questManager) {
    this.world = world;
    this.wallet = wallet;
    this.questManager = questManager;
    this.trucks = [];
    this.extractors = [];
    this.smelters = [];
    this.assemblers = [];
  }
}
