import { Processor } from './processor.js';

export class Factory extends Processor {
  constructor(id, recipe) {
    super(id, recipe, 'factory');
  }
}
