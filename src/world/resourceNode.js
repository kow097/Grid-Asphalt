export const RESOURCE_TYPES = {
  IRON: 'iron',
  COPPER: 'copper',
  COAL: 'coal',
  STONE: 'stone',
  OIL: 'oil',
};

export class ResourceNode {
  constructor(x, y, type, richness = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.richness = richness;
    this.extractorId = null;
  }

  isOccupied() {
    return this.extractorId !== null;
  }
}
