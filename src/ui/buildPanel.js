import { BUILD_MODES, BUILD_COSTS } from './buildMenu.js';

const BUILDING_BUTTONS = [
  { mode: BUILD_MODES.EXTRACTOR, label: 'Extractor' },
  { mode: BUILD_MODES.SMELTER, label: 'Smelter' },
  { mode: BUILD_MODES.FACTORY, label: 'Factory' },
  { mode: BUILD_MODES.ASSEMBLER, label: 'Assembler' },
  { mode: BUILD_MODES.WAREHOUSE_SMALL, label: 'Small Warehouse' },
  { mode: BUILD_MODES.WAREHOUSE_LARGE, label: 'Large Warehouse' },
  { mode: BUILD_MODES.TRUCK_GARAGE, label: 'Truck Garage' },
  { mode: BUILD_MODES.POWER_PLANT, label: 'Power Plant' },
  { mode: BUILD_MODES.BATTERY, label: 'Battery' },
  { mode: BUILD_MODES.POWER_POLE, label: 'Power Pole' },
  { mode: BUILD_MODES.CONVEYOR, label: 'Conveyor' },
  { mode: BUILD_MODES.MERGER_TWO, label: 'Merger (2-side)' },
  { mode: BUILD_MODES.MERGER_THREE, label: 'Merger (3-side)' },
];

const ROAD_BUTTONS = [
  { mode: BUILD_MODES.ROAD_UPGRADE, label: 'Road' },
  { mode: BUILD_MODES.BRIDGE, label: 'Bridge' },
];

// Rotate ima smisla za zgrade koje se postavljaju s orijentacijom.
const ROTATABLE_MODES = [
  BUILD_MODES.FACTORY, BUILD_MODES.WAREHOUSE_SMALL, BUILD_MODES.WAREHOUSE_LARGE,
  BUILD_MODES.MERGER_TWO, BUILD_MODES.MERGER_THREE,
];

export class BuildPanel {
  constructor(container, buildController, onRotate) {
    this.container = container;
    this.inner = container.querySelector('.expand-inner');
    this.buildController = buildController;
    this.onRotate = onRotate;
    this.subTab = 'buildings'; // 'buildings' | 'roads' | 'rail'
    this._lastMode = undefined;
    this._render();
  }

  _modeButton({ mode, label }) {
    const active = this.buildController.mode === mode;
    return `<button data-mode="${mode}" class="${active ? 'active' : ''}">${label} ($${BUILD_COSTS[mode]})</button>`;
  }

  _rotateButton() {
    if (!ROTATABLE_MODES.includes(this.buildController.mode)) return '';
    return `<button id="build-rotate-btn">⟳ Rotate</button>`;
  }

  // "Force Relink" - vidljivo samo u Conveyor modu. Kad je ukljuceno, novi
  // conveyor smije oteti/preusmjeriti vec zauzet postojeci conveyor/merger
  // umjesto da tiho odustane (default je iskljuceno - sigurnija opcija).
  _forceLinkButton() {
    if (this.buildController.mode !== BUILD_MODES.CONVEYOR) return '';
    const active = this.buildController.forceLink;
    return `<button id="build-forcelink-btn" class="${active ? 'active' : ''}" title="Dopusti da novi conveyor preusmjeri vec zauzet stari">Force Relink ${active ? 'ON' : 'OFF'}</button>`;
  }

  _render() {
    this._lastMode = this.buildController.mode;
    const buildingBtns = BUILDING_BUTTONS.map(b => this._modeButton(b)).join('');
    const roadBtns = ROAD_BUTTONS.map(b => this._modeButton(b)).join('');
    const demolishActive = this.buildController.mode === BUILD_MODES.DEMOLISH;

    this.inner.innerHTML = `
      <div class="build-subtabs">
        <button data-subtab="buildings" class="${this.subTab === 'buildings' ? 'active' : ''}">Buildings</button>
        <button data-subtab="roads" class="${this.subTab === 'roads' ? 'active' : ''}">Roads</button>
        <button data-subtab="rail" class="${this.subTab === 'rail' ? 'active' : ''}" disabled title="Coming soon">Rail</button>
      </div>
      <div class="build-subtab-content">
        ${this.subTab === 'buildings' ? buildingBtns + this._rotateButton() + this._forceLinkButton() : ''}
        ${this.subTab === 'roads' ? roadBtns : ''}
        ${this.subTab === 'rail' ? '<div class="build-placeholder">Coming soon</div>' : ''}
      </div>
      <button id="build-demolish-btn" class="${demolishActive ? 'active' : ''}">Demolish</button>
    `;

    this.inner.querySelectorAll('button[data-subtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.subTab = btn.dataset.subtab;
        this._render();
      });
    });

    this.inner.querySelectorAll('button[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.buildController.setMode(this.buildController.mode === mode ? null : mode);
        this._render();
      });
    });

    const rotateBtn = this.inner.querySelector('#build-rotate-btn');
    if (rotateBtn) rotateBtn.addEventListener('click', () => this.onRotate());

    const forceLinkBtn = this.inner.querySelector('#build-forcelink-btn');
    if (forceLinkBtn) forceLinkBtn.addEventListener('click', () => {
      this.buildController.toggleForceLink();
      this._render();
    });

    this.inner.querySelector('#build-demolish-btn').addEventListener('click', () => {
      const mode = BUILD_MODES.DEMOLISH;
      this.buildController.setMode(this.buildController.mode === mode ? null : mode);
      this._render();
    });
  }

  // Poziva se svaki frame - preskace re-render ako se mode nije promijenio
  // izvana (npr. Escape tipkom), da ne trosimo DOM rebuild 60x/s uzalud.
  refresh() {
    if (this.buildController.mode !== this._lastMode) this._render();
  }
}
