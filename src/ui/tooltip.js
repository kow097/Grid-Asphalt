const RESOURCE_LABELS = {
  iron: 'Iron',
  copper: 'Copper',
  coal: 'Coal',
  stone: 'Stone',
  oil: 'Oil',
};

const BUILDING_LABELS = {
  smelter: 'Smelter',
  factory: 'Factory',
  assembler: 'Assembler',
  warehouse: 'Warehouse',
};

export function labelForTile(tile) {
  if (tile.building) {
    if (tile.building.kind === 'extractor') {
      const resourceType = tile.building.resourceNode.type;
      const label = `${RESOURCE_LABELS[resourceType] ?? resourceType} Extractor`;
      return `${label} (${tile.building.outputBuffer}/${tile.building.maxBuffer})`;
    }
    return BUILDING_LABELS[tile.building.kind] ?? tile.building.kind;
  }
  if (tile.resourceNode) return RESOURCE_LABELS[tile.resourceNode.type] ?? tile.resourceNode.type;
  if (tile.port) return `Port ${tile.port.id}`;
  return null;
}

export class Tooltip {
  constructor(container) {
    this.container = container;
  }

  showAt(screenX, screenY, tile) {
    const label = tile ? labelForTile(tile) : null;
    if (!label) {
      this.hide();
      return;
    }
    this.container.textContent = label;
    this.container.style.display = 'block';
    this.container.style.left = `${screenX + 14}px`;
    this.container.style.top = `${screenY + 14}px`;
  }

  showCost(screenX, screenY, cost) {
    this.container.textContent = `$${cost}`;
    this.container.style.display = 'block';
    this.container.style.left = `${screenX + 14}px`;
    this.container.style.top = `${screenY + 14}px`;
  }

  hide() {
    this.container.style.display = 'none';
  }
}
