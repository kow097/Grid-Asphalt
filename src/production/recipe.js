export class Recipe {
  constructor(id, inputs, output, outputAmount, processTime) {
    this.id = id;
    this.inputs = inputs;
    this.output = output;
    this.outputAmount = outputAmount;
    this.processTime = processTime;
  }
}

export const RECIPES = {
  IRON_INGOT: new Recipe('iron_ingot', [{ type: 'iron', amount: 1 }], 'iron_ingot', 1, 2),
  COPPER_INGOT: new Recipe('copper_ingot', [{ type: 'copper', amount: 1 }], 'copper_ingot', 1, 2),
  STEEL: new Recipe('steel', [{ type: 'iron_ingot', amount: 2 }, { type: 'coal', amount: 1 }], 'steel', 1, 4),
  MOTOR: new Recipe(
    'motor',
    [{ type: 'iron_ingot', amount: 2 }, { type: 'copper_ingot', amount: 1 }],
    'motor',
    1,
    6
  ),
  CIRCUIT: new Recipe(
    'circuit',
    [{ type: 'copper_ingot', amount: 2 }, { type: 'stone', amount: 1 }],
    'circuit',
    1,
    5
  ),
  GEAR: new Recipe('gear', [{ type: 'iron_ingot', amount: 1 }], 'gear', 1, 3),
  WIRE: new Recipe('wire', [{ type: 'copper_ingot', amount: 1 }], 'wire', 1, 3),
};

export const ASSEMBLER_RECIPES = [RECIPES.GEAR, RECIPES.WIRE];
export const FACTORY_RECIPES = [RECIPES.STEEL, RECIPES.MOTOR, RECIPES.CIRCUIT];
