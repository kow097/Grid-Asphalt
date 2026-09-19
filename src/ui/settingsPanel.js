import { CONFIG } from '../core/config.js';

const SCALE_MIN = 0.8;
const SCALE_MAX = 1.6;
const SCALE_STEP = 0.05;
export const DEFAULT_UI_SCALE = 1.15;

export class SettingsPanel {
  constructor(container, onToggleDevTools) {
    this.container = container;
    this.visible = false;
    this.scale = DEFAULT_UI_SCALE;
    this.onToggleDevTools = onToggleDevTools ?? (() => {});
    this.devToolsEnabled = false;
    this._applyScale();
  }

  toggle() {
    this.visible = !this.visible;
    this.container.classList.toggle('hidden', !this.visible);
    if (this.visible) this._render();
  }

  close() {
    this.visible = false;
    this.container.classList.add('hidden');
  }

  _applyScale() {
    document.documentElement.style.setProperty('--ui-scale', this.scale);
  }

  _render() {
    this.container.innerHTML = `
      <div class="settings-box">
        <h3>Settings</h3>
        <div class="settings-row">
          <label for="settings-ui-scale">UI size: <span id="settings-ui-scale-value">${Math.round(this.scale * 100)}%</span></label>
          <input type="range" id="settings-ui-scale" min="${SCALE_MIN}" max="${SCALE_MAX}" step="${SCALE_STEP}" value="${this.scale}" />
        </div>
        <div class="settings-row settings-row-toggle">
          <label>
            <input type="checkbox" id="settings-direct-sale" ${CONFIG.ALLOW_DIRECT_CONVEYOR_SALE ? 'checked' : ''} />
            Allow direct conveyor&rarr;port sale
          </label>
        </div>
        <div class="settings-row settings-row-toggle">
          <label>
            <input type="checkbox" id="settings-dev-tools" ${this.devToolsEnabled ? 'checked' : ''} />
            Developer Tools
          </label>
        </div>
        <button id="settings-close-btn">Close</button>
      </div>
    `;

    const rangeInput = this.container.querySelector('#settings-ui-scale');
    const valueLabel = this.container.querySelector('#settings-ui-scale-value');
    rangeInput.addEventListener('input', () => {
      this.scale = Number(rangeInput.value);
      valueLabel.textContent = `${Math.round(this.scale * 100)}%`;
      this._applyScale();
    });

    this.container.querySelector('#settings-direct-sale').addEventListener('change', (e) => {
      CONFIG.ALLOW_DIRECT_CONVEYOR_SALE = e.target.checked;
    });

    this.container.querySelector('#settings-dev-tools').addEventListener('change', (e) => {
      this.devToolsEnabled = e.target.checked;
      this.onToggleDevTools(this.devToolsEnabled);
    });

    this.container.querySelector('#settings-close-btn').addEventListener('click', () => this.close());
  }
}
