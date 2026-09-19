// Popup koji se otvara klikom na Truck Garage zgradu u svijetu - sadrzi
// Groups & Upgrades. Grupe (Create/Manage/Assign Route) su OpenTTD Faza A;
// Upgrade gumbi ostaju disabled (Faza B, kasnije).
export class GarageMenu {
  constructor(container, state, callbacks) {
    this.container = container;
    this.state = state;
    this.callbacks = callbacks; // { onCreateGroup, onDeleteGroup, onRenameGroup, onToggleTruckInGroup, onArmGroupRoute }
    this.garage = null;
    this.view = 'main'; // 'main' | 'create' | 'manage' | 'route-pick'
    this.editingGroupId = null; // koja se grupa trenutno prosiruje u 'manage' view-u (truck checkbox lista)
  }

  get isOpen() {
    return this.garage !== null;
  }

  open(garage) {
    this.garage = garage;
    this.view = 'main';
    this.editingGroupId = null;
    this._render();
    this.container.classList.remove('hidden');
  }

  close() {
    this.garage = null;
    this.container.classList.add('hidden');
  }

  _groupTruckCount(groupId) {
    return this.state.trucks.filter((t) => t.groupId === groupId).length;
  }

  _renderMain() {
    const { trailerLevel, engineLevel } = this.state.truckUpgrades;
    const maxLevel = 5;
    const trailerMaxed = trailerLevel >= maxLevel;
    const engineMaxed = engineLevel >= maxLevel;
    const trailerCost = this.callbacks.trailerCost(trailerLevel);
    const engineCost = this.callbacks.engineCost(engineLevel);
    const canAffordTrailer = this.state.wallet.balance >= trailerCost;
    const canAffordEngine = this.state.wallet.balance >= engineCost;

    return `
      <h3>Groups &amp; Upgrades</h3>
      <button data-action="create">Create Group</button>
      <button data-action="manage">Manage Groups</button>
      <button data-action="route-pick">Assign Route to Group</button>
      <button data-action="buy-trailer" ${trailerMaxed || !canAffordTrailer ? 'disabled' : ''}>
        ${trailerMaxed ? 'Trailer: MAX level' : `Upgrade: Trailer (Lv.${trailerLevel}→${trailerLevel + 1}, +${10} cap, $${trailerCost})`}
      </button>
      <button data-action="buy-engine" ${engineMaxed || !canAffordEngine ? 'disabled' : ''}>
        ${engineMaxed ? 'Engine: MAX level' : `Upgrade: Suspension/Engine (Lv.${engineLevel}→${engineLevel + 1}, +8% speed, $${engineCost})`}
      </button>
      <p class="garage-menu-hint">Upgrades apply to trucks bought AFTER purchase, not retroactively.</p>
      <button data-action="close">Close</button>
    `;
  }

  _renderCreate() {
    return `
      <h3>New Group</h3>
      <input id="gm-group-name" type="text" placeholder="Group name" maxlength="24" />
      <button data-action="confirm-create">Create</button>
      <button data-action="back">Back</button>
    `;
  }

  _renderManage() {
    const groups = this.state.truckGroups;
    if (groups.length === 0) {
      return `<h3>Manage Groups</h3><p class="garage-menu-hint">No groups yet.</p><button data-action="back">Back</button>`;
    }
    const rows = groups.map((g) => {
      const count = this._groupTruckCount(g.id);
      const expanded = this.editingGroupId === g.id;
      let truckListHtml = '';
      if (expanded) {
        const checkboxes = this.state.trucks.map((t) => `
          <label class="garage-truck-row">
            <input type="checkbox" data-toggle-truck="${t.id}" ${t.groupId === g.id ? 'checked' : ''} />
            ${t.id}${t.groupId && t.groupId !== g.id ? ' (in another group)' : ''}
          </label>
        `).join('');
        truckListHtml = `<div class="garage-truck-list">${checkboxes || '<p class="garage-menu-hint">No trucks.</p>'}</div>`;
      }
      return `
        <div class="garage-group-row">
          <div class="garage-group-header">
            <span>${g.name} (${count})${g.route ? ' 🛣' : ''}</span>
            <button data-assign-trucks="${g.id}">${expanded ? 'Done' : 'Assign Trucks'}</button>
            <button data-delete-group="${g.id}">Delete</button>
          </div>
          ${truckListHtml}
        </div>
      `;
    }).join('');
    return `<h3>Manage Groups</h3>${rows}<button data-action="back">Back</button>`;
  }

  _renderRoutePick() {
    const groups = this.state.truckGroups;
    if (groups.length === 0) {
      return `<h3>Assign Route to Group</h3><p class="garage-menu-hint">Create a group first.</p><button data-action="back">Back</button>`;
    }
    const rows = groups.map((g) => `
      <div class="garage-group-row">
        <div class="garage-group-header">
          <span>${g.name} (${this._groupTruckCount(g.id)})${g.route ? ' - has a route' : ''}</span>
          <button data-set-route="${g.id}">Set Route</button>
        </div>
      </div>
    `).join('');
    return `<h3>Assign Route to Group</h3>${rows}<p class="garage-menu-hint">Click a group, then click waypoints on the map. Every truck in the group keeps this route, and any truck added later inherits it too.</p><button data-action="back">Back</button>`;
  }

  _render() {
    let inner;
    if (this.view === 'create') inner = this._renderCreate();
    else if (this.view === 'manage') inner = this._renderManage();
    else if (this.view === 'route-pick') inner = this._renderRoutePick();
    else inner = this._renderMain();

    this.container.innerHTML = `<div class="garage-menu-box">${inner}</div>`;
    const box = this.container.querySelector('.garage-menu-box');

    box.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'close') { this.close(); return; }
        if (action === 'back') { this.view = 'main'; this.editingGroupId = null; this._render(); return; }
        if (action === 'confirm-create') {
          const input = box.querySelector('#gm-group-name');
          const name = (input?.value ?? '').trim();
          if (!name) return;
          this.callbacks.onCreateGroup(name);
          this.view = 'main';
          this._render();
          return;
        }
        if (action === 'buy-trailer') { this.callbacks.onBuyTrailerUpgrade(); this._render(); return; }
        if (action === 'buy-engine') { this.callbacks.onBuyEngineUpgrade(); this._render(); return; }
        this.view = action; // 'create' | 'manage' | 'route-pick'
        this.editingGroupId = null;
        this._render();
      });
    });

    box.querySelectorAll('[data-assign-trucks]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const groupId = btn.dataset.assignTrucks;
        this.editingGroupId = this.editingGroupId === groupId ? null : groupId;
        this._render();
      });
    });

    box.querySelectorAll('[data-delete-group]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.callbacks.onDeleteGroup(btn.dataset.deleteGroup);
        if (this.editingGroupId === btn.dataset.deleteGroup) this.editingGroupId = null;
        this._render();
      });
    });

    box.querySelectorAll('[data-toggle-truck]').forEach((cb) => {
      cb.addEventListener('change', () => {
        this.callbacks.onToggleTruckInGroup(this.editingGroupId, cb.dataset.toggleTruck);
        this._render();
      });
    });

    box.querySelectorAll('[data-set-route]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = this.state.truckGroups.find((g) => g.id === btn.dataset.setRoute);
        if (group) this.callbacks.onArmGroupRoute(group);
        // onArmGroupRoute zatvara ovaj meni (treba klikanje po mapi) - vidi engine.js.
      });
    });
  }
}
