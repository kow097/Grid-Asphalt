export const TERRAIN = {
  GRASS: 'grass',
  BEACH: 'beach',
  GRAVEL: 'gravel',
  DIRT_ROAD: 'dirt_road',
  ASPHALT: 'asphalt',
  WATER: 'water',
  BRIDGE_WOOD: 'bridge_wood',
  BRIDGE_CONCRETE: 'bridge_concrete',
  BRIDGE_STEEL: 'bridge_steel',
};

export const TERRAIN_SPEED = {
  [TERRAIN.GRASS]: 0.3,
  [TERRAIN.BEACH]: 0.4,
  [TERRAIN.GRAVEL]: 0.5,
  [TERRAIN.DIRT_ROAD]: 1.0,
  [TERRAIN.ASPHALT]: 2.0,
  [TERRAIN.WATER]: 0,
  [TERRAIN.BRIDGE_WOOD]: 0.5,
  [TERRAIN.BRIDGE_CONCRETE]: 1.0,
  [TERRAIN.BRIDGE_STEEL]: 2.0,
};

export function isWalkable(terrainType) {
  return TERRAIN_SPEED[terrainType] > 0;
}

export function speedMultiplier(terrainType) {
  return TERRAIN_SPEED[terrainType] ?? 0;
}
