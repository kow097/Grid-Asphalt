import { Processor } from './processor.js';

export class Smelter extends Processor {
  constructor(id, recipe) {
    super(id, recipe, 'smelter');
  }
}
