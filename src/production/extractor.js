const BASE_EXTRACTION_TIME = 3;

export class Extractor {
  constructor(id, resourceNode, tier = 1) {
    this.id = id;
    this.resourceNode = resourceNode;
    this.tier = tier;
    this.progress = 0;
    this.outputBuffer = 0;
    this.maxBuffer = 10;
  }

  update(deltaTime) {
    if (this.outputBuffer >= this.maxBuffer) return;
    this.progress += deltaTime * this.tier;
    const cycleTime = BASE_EXTRACTION_TIME / this.resourceNode.richness;
    if (this.progress >= cycleTime) {
      this.progress -= cycleTime;
      this.outputBuffer += 1;
    }
  }

  collect(amount) {
    const taken = Math.min(amount, this.outputBuffer);
    this.outputBuffer -= taken;
    return taken;
  }
}
