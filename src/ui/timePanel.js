export class TimePanel {
  constructor(container, loop) {
    this.container = container;
    this.loop = loop;
    this.container.innerHTML = `
      <button id="pause-btn">Pause</button>
      <button data-scale="1">x1</button>
      <button data-scale="2">x2</button>
      <button data-scale="3">x3</button>
    `;
    this.pauseBtn = this.container.querySelector('#pause-btn');
    this.scaleButtons = [...this.container.querySelectorAll('button[data-scale]')];

    this.pauseBtn.addEventListener('click', () => this.loop.togglePause());
    for (const btn of this.scaleButtons) {
      btn.addEventListener('click', () => this.loop.setTimeScale(Number(btn.dataset.scale)));
    }
  }

  update() {
    this.pauseBtn.textContent = this.loop.paused ? 'Resume' : 'Pause';
    this.pauseBtn.classList.toggle('active', this.loop.paused);

    for (const btn of this.scaleButtons) {
      const isActive = !this.loop.paused && Number(btn.dataset.scale) === this.loop.timeScale;
      btn.classList.toggle('active', isActive);
    }
  }
}
