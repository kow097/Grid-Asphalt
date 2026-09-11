export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.lastTime = 0;
    this.running = false;
    this._tick = this._tick.bind(this);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
  }

  _tick(now) {
    if (!this.running) return;
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this._tick);
  }
}
