export const TERRAIN = {
  GRASS: 'grass',
  GRAVEL: 'gravel',
  DIRT_ROAD: 'dirt_road',
  ASPHALT: 'asphalt',
  WATER: 'water',
};

export const TERRAIN_SPEED = {
  [TERRAIN.GRASS]: 0.3,
  [TERRAIN.GRAVEL]: 0.5,
  [TERRAIN.DIRT_ROAD]: 1.0,
  [TERRAIN.ASPHALT]: 2.0,
  [TERRAIN.WATER]: 0,
};

export function isWalkable(terrainType) {
  return TERRAIN_SPEED[terrainType] > 0;
}

export function speedMultiplier(terrainType) {
  return TERRAIN_SPEED[terrainType] ?? 0;
}
