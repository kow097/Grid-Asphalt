export class PauseMenu {
  constructor(container, loop, onExit, onSettings, onSaveLoad) {
    this.container = container;
    this.loop = loop;
    this.visible = false;

    this.container.innerHTML = `
      <div class="pause-menu-box">
        <h2>Paused</h2>
        <button id="resume-btn">Resume</button>
        <button id="settings-btn">Settings</button>
        <button id="saveload-btn">Save / Load</button>
        <button id="exit-btn">Exit</button>
      </div>
    `;

    this.container.querySelector('#resume-btn').addEventListener('click', () => this.close());
    this.container.querySelector('#settings-btn').addEventListener('click', () => onSettings?.());
    this.container.querySelector('#saveload-btn').addEventListener('click', () => onSaveLoad?.());
    this.container.querySelector('#exit-btn').addEventListener('click', onExit);
  }

  open() {
    this.visible = true;
    this.container.classList.remove('hidden');
    this.loop.paused = true;
  }

  close() {
    this.visible = false;
    this.container.classList.add('hidden');
    this.loop.paused = false;
  }

  toggle() {
    if (this.visible) this.close();
    else this.open();
  }
}
