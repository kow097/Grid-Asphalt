export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.lastTime = 0;
    this.running = false;
    this.paused = false;
    this.timeScale = 1;
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

  togglePause() {
    this.paused = !this.paused;
  }

  setTimeScale(scale) {
    this.timeScale = scale;
    this.paused = false;
  }

  _tick(now) {
    if (!this.running) return;
    const rawDelta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.paused) this.update(rawDelta * this.timeScale);
    this.render();

    requestAnimationFrame(this._tick);
  }
}
