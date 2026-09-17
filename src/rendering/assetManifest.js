const ASSET_KEYS = {
  truck: 'sprites/truck',
  port: 'sprites/port',
  extractor: 'sprites/extractor',
  smelter: 'sprites/smelter',
  factory: 'sprites/factory',
  assembler: 'sprites/assembler',
  warehouse: 'sprites/warehouse',
  truck_garage: 'sprites/truck_garage',
  conveyor_straight: 'sprites/conveyor_straight',
  conveyor_corner: 'sprites/conveyor_corner',
  terrain_grass: 'tiles/grass',
  terrain_gravel: 'tiles/gravel',
  terrain_dirt_road: 'tiles/dirt_road',
  terrain_asphalt: 'tiles/asphalt',
  terrain_water: 'tiles/water',
  terrain_bridge_wood: 'tiles/bridge_wood',
  terrain_bridge_concrete: 'tiles/bridge_concrete',
  terrain_bridge_steel: 'tiles/bridge_steel',
  resource_iron: 'sprites/resource_iron',
  resource_copper: 'sprites/resource_copper',
  resource_coal: 'sprites/resource_coal',
  resource_stone: 'sprites/resource_stone',
  resource_oil: 'sprites/resource_oil',
};

// Svaki asset = JSON manifest (npr. assets/sprites/extractor.json) koji
// referencira jedan ili vise PNG-ova. Vidi src/rendering/assetLoader.js.
export function resolveAsset(key) {
  const relPath = ASSET_KEYS[key];
  if (!relPath) return null;

  return { key, path: `assets/${relPath}.json` };
}

export function allAssetKeys() {
  return Object.keys(ASSET_KEYS);
}
