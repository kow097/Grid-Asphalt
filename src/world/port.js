let portIdCounter = 0;

export class Port {
  constructor(x, y, name) {
    this.id = portIdCounter++;
    this.x = x;
    this.y = y;
    this.name = name;
    this.inventory = {};
    this.activeQuests = [];
  }

  deposit(resourceType, amount) {
    this.inventory[resourceType] = (this.inventory[resourceType] || 0) + amount;
  }
}
