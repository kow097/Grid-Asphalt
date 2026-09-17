import { quickSave, hasQuickSave, loadQuickSave, downloadSaveFile, readSaveFile } from '../state/saveLoad.js';

export class SaveLoadMenu {
  constructor(container, engine) {
    this.container = container;
    this.engine = engine;
    this.visible = false;
  }

  open() {
    this.visible = true;
    this.container.classList.remove('hidden');
    this._render();
  }

  close() {
    this.visible = false;
    this.container.classList.add('hidden');
  }

  toggle() {
    if (this.visible) this.close();
    else this.open();
  }

  _flash(msg) {
    const el = this.container.querySelector('#saveload-status');
    if (el) el.textContent = msg;
  }

  _render() {
    const quickSaveExists = hasQuickSave();

    this.container.innerHTML = `
      <div class="pause-menu-box">
        <h2>Save / Load</h2>
        <button id="sl-quicksave-btn">Quick Save</button>
        <button id="sl-quickload-btn" ${quickSaveExists ? '' : 'disabled'}>Quick Load</button>
        <button id="sl-export-btn">Export to file…</button>
        <button id="sl-import-btn">Import from file…</button>
        <input type="file" id="sl-import-input" accept=".json" class="hidden" />
        <p id="saveload-status" class="saveload-status"></p>
        <button id="sl-close-btn">Close</button>
      </div>
    `;

    this.container.querySelector('#sl-quicksave-btn').addEventListener('click', () => {
      quickSave(this.engine);
      this._flash('Spremljeno.');
      this._render();
    });

    this.container.querySelector('#sl-quickload-btn').addEventListener('click', () => {
      const data = loadQuickSave();
      if (!data) return;
      this.close();
      this.engine.onLoadGame?.(data);
    });

    this.container.querySelector('#sl-export-btn').addEventListener('click', () => {
      downloadSaveFile(this.engine);
      this._flash('Datoteka preuzeta.');
    });

    const importInput = this.container.querySelector('#sl-import-input');
    this.container.querySelector('#sl-import-btn').addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', async () => {
      const file = importInput.files[0];
      if (!file) return;
      try {
        const data = await readSaveFile(file);
        this.close();
        this.engine.onLoadGame?.(data);
      } catch (err) {
        this._flash('Datoteka nije valjana.');
      }
    });

    this.container.querySelector('#sl-close-btn').addEventListener('click', () => this.close());
  }
}
