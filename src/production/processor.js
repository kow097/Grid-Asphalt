export class Processor {
  constructor(id, recipe, kind) {
    this.id = id;
    this.recipe = recipe;
    this.kind = kind;
    this.inputBuffer = {};
    this.outputBuffer = 0;
    this.maxOutputBuffer = 10;
    this.progress = 0;
    this.active = false;
    this.requiresPower = true;
    this.powered = true;
  }

  canStart() {
    return this.recipe.inputs.every(inp => (this.inputBuffer[inp.type] || 0) >= inp.amount);
  }

  acceptInput(type, amount) {
    const needed = this.recipe.inputs.find(inp => inp.type === type);
    if (!needed) return 0;
    const current = this.inputBuffer[type] || 0;
    const cap = needed.amount * 4;
    const accepted = Math.max(0, Math.min(amount, cap - current));
    this.inputBuffer[type] = current + accepted;
    return accepted;
  }

  update(deltaTime, speedMultiplier = 1) {
    if (this.requiresPower && !this.powered) return;

    if (!this.active) {
      if (this.canStart() && this.outputBuffer < this.maxOutputBuffer) {
        for (const inp of this.recipe.inputs) this.inputBuffer[inp.type] -= inp.amount;
        this.active = true;
        this.progress = 0;
      }
      return;
    }

    this.progress += deltaTime * speedMultiplier;
    if (this.progress >= this.recipe.processTime) {
      this.outputBuffer += this.recipe.outputAmount;
      this.active = false;
      this.progress = 0;
    }
  }

  collectOutput(amount) {
    const taken = Math.min(amount, this.outputBuffer);
    this.outputBuffer -= taken;
    return taken;
  }
}
