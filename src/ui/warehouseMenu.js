import { RESOURCE_TYPES } from '../world/resourceNode.js';

const RESOURCE_COLORS = {
  iron: '#c97b4a',
  copper: '#d4915a',
  coal: '#2b2b2b',
  stone: '#9a9a9a',
  oil: '#1a1a1a',
};

export class WarehouseMenu {
  constructor(container) {
    this.container = container;
    this.warehouse = null;
    this.slotIndex = null;
    this.mode = null; // 'config' (izlazni slot) | 'info' (pregled ulazne strane)
  }

  get isOpen() {
    return this.warehouse !== null;
  }

  // Klik na IZLAZNI tile - biranje koji tip robe taj slot izdaje.
  open(warehouse, slotIndex) {
    this.warehouse = warehouse;
    this.slotIndex = slotIndex;
    this.mode = 'config';
    this._render();
    this.container.classList.remove('hidden');
  }

  // Klik na ULAZNI tile - pregled sto je trenutno pohranjeno (read-only).
  openInfo(warehouse) {
    this.warehouse = warehouse;
    this.slotIndex = null;
    this.mode = 'info';
    this._render();
    this.container.classList.remove('hidden');
  }

  close() {
    this.warehouse = null;
    this.slotIndex = null;
    this.mode = null;
    this.container.classList.add('hidden');
  }

  _render() {
    if (this.mode === 'info') {
      this._renderInfo();
      return;
    }
    this._renderConfig();
  }

  _renderConfig() {
    const options = Object.values(RESOURCE_TYPES);
    const buttons = options.map(type => `
      <button data-type="${type}" style="background:${RESOURCE_COLORS[type] || '#888'}">${type}</button>
    `).join('');

    this.container.innerHTML = `
      <div class="warehouse-menu-box">
        <h3>Select Output Resource</h3>
        <div class="warehouse-menu-grid">${buttons}</div>
        <button id="warehouse-menu-clear">Clear (empty)</button>
      </div>
    `;

    this.container.querySelectorAll('button[data-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = this.warehouse.slots[this.slotIndex];
        slot.assignedType = btn.dataset.type;
        slot.amount = 0;
        this.close();
      });
    });

    this.container.querySelector('#warehouse-menu-clear').addEventListener('click', () => {
      const slot = this.warehouse.slots[this.slotIndex];
      slot.assignedType = null;
      slot.amount = 0;
      this.close();
    });
  }

  // Grupira slotove po tipu (npr. 2 slota na 'oil' -> JEDAN red "140/200")
  // - koristi Warehouse.summarizeByType(), samo iscrtava.
  _renderInfo() {
    const { types, unassignedSlots } = this.warehouse.summarizeByType();

    const rows = types.map(({ type, stored, max }) => {
      const pct = max > 0 ? Math.min(100, Math.floor((stored / max) * 100)) : 0;
      return `
        <div class="warehouse-info-row">
          <div class="warehouse-info-label">
            <span class="warehouse-info-swatch" style="background:${RESOURCE_COLORS[type] || '#888'}"></span>
            ${type}
          </div>
          <div class="warehouse-info-bar"><div class="warehouse-info-fill" style="width:${pct}%; background:${RESOURCE_COLORS[type] || '#888'}"></div></div>
          <div class="warehouse-info-amount">${stored} / ${max}</div>
        </div>
      `;
    }).join('');

    const emptyNote = unassignedSlots > 0
      ? `<div class="warehouse-info-empty">${unassignedSlots} slot(ova) još nije podešeno (klikni izlaznu stranu)</div>`
      : '';

    this.container.innerHTML = `
      <div class="warehouse-menu-box">
        <h3>Warehouse - stanje</h3>
        ${rows || '<div class="warehouse-info-empty">Prazno - nijedan slot nije podešen</div>'}
        ${emptyNote}
        <button id="warehouse-menu-close">Close</button>
      </div>
    `;

    this.container.querySelector('#warehouse-menu-close').addEventListener('click', () => this.close());
  }
}
