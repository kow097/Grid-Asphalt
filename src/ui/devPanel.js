// Ne-modalni plutajuci panel (ne blokira klikove na canvas ispod sebe,
// vidi CSS: pointer-events samo na .dev-panel-box) - ukljucuje se/gasi
// preko "Developer Tools" checkboxa u Settings.
export class DevPanel {
  constructor(container, state, questManager, techTree, callbacks) {
    this.container = container;
    this.state = state;
    this.questManager = questManager;
    this.techTree = techTree;
    this.callbacks = callbacks;
    this.visible = false;
    this.freeBuilding = false;
    this.unlimitedPower = false;
    this.timer = 0;
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

  update(deltaTime) {
    if (!this.visible) return;
    this.timer += deltaTime;
    if (this.timer < 0.5) return;
    this.timer = 0;
    this._render();
  }

  _render() {
    const s = this.state;
    const activeCount = this.questManager.activeQuests.length;
    const purchasedCount = this.techTree.purchased.size;

    this.container.innerHTML = `
      <div class="dev-panel-box">
        <h3>🛠 Developer Tools</h3>

        <div class="dev-section">
          <div class="dev-section-title">Economy</div>
          <div class="dev-row">Balance: $${Math.floor(s.wallet.balance)}</div>
          <div class="dev-row">
            <input id="dev-money-input" type="number" placeholder="amount" style="width:90px" />
            <button data-action="set-money">Set</button>
            <button data-action="add-money">Add</button>
          </div>
          <div class="dev-row">
            <button data-action="add-money-1k">+$1,000</button>
            <button data-action="add-money-10k">+$10,000</button>
          </div>
        </div>

        <div class="dev-section">
          <div class="dev-section-title">Research Points</div>
          <div class="dev-row">RP: ${Math.floor(this.questManager.researchPoints)}</div>
          <div class="dev-row">
            <input id="dev-rp-input" type="number" placeholder="amount" style="width:90px" />
            <button data-action="set-rp">Set</button>
            <button data-action="add-rp">Add</button>
          </div>
          <div class="dev-row">
            <button data-action="add-rp-50">+50 RP</button>
            <button data-action="add-rp-500">+500 RP</button>
          </div>
        </div>

        <div class="dev-section">
          <div class="dev-section-title">Tech Tree (${purchasedCount} unlocked)</div>
          <div class="dev-row">
            <button data-action="unlock-all-tech">Unlock All</button>
            <button data-action="reset-tech">Reset Tech Tree</button>
          </div>
        </div>

        <div class="dev-section">
          <div class="dev-section-title">Trucks (${s.trucks.length} owned)</div>
          <div class="dev-row">
            <button data-action="spawn-truck">Spawn Free Truck</button>
            <button data-action="max-truck-upgrades">Max Truck Upgrades</button>
          </div>
        </div>

        <div class="dev-section">
          <div class="dev-section-title">Quests (${activeCount} active)</div>
          <div class="dev-row">
            <button data-action="complete-quests">Complete All Active</button>
          </div>
        </div>

        <div class="dev-section">
          <div class="dev-section-title">Toggles</div>
          <div class="dev-row">
            <label><input type="checkbox" id="dev-free-building" ${this.freeBuilding ? 'checked' : ''}/> Free building (cost $0)</label>
          </div>
          <div class="dev-row">
            <label><input type="checkbox" id="dev-unlimited-power" ${this.unlimitedPower ? 'checked' : ''}/> Unlimited power (all buildings always powered)</label>
          </div>
        </div>

        <button data-action="close">Close</button>
      </div>
    `;

    const box = this.container.querySelector('.dev-panel-box');
    const moneyInput = box.querySelector('#dev-money-input');
    const rpInput = box.querySelector('#dev-rp-input');

    box.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const moneyVal = Number(moneyInput.value);
        const rpVal = Number(rpInput.value);
        switch (action) {
          case 'close': this.close(); return;
          case 'set-money': if (!Number.isNaN(moneyVal)) this.callbacks.setMoney(moneyVal); break;
          case 'add-money': if (!Number.isNaN(moneyVal)) this.callbacks.addMoney(moneyVal); break;
          case 'add-money-1k': this.callbacks.addMoney(1000); break;
          case 'add-money-10k': this.callbacks.addMoney(10000); break;
          case 'set-rp': if (!Number.isNaN(rpVal)) this.callbacks.setRP(rpVal); break;
          case 'add-rp': if (!Number.isNaN(rpVal)) this.callbacks.addRP(rpVal); break;
          case 'add-rp-50': this.callbacks.addRP(50); break;
          case 'add-rp-500': this.callbacks.addRP(500); break;
          case 'unlock-all-tech': this.callbacks.unlockAllTech(); break;
          case 'reset-tech': this.callbacks.resetTechTree(); break;
          case 'spawn-truck': this.callbacks.spawnFreeTruck(); break;
          case 'max-truck-upgrades': this.callbacks.maxTruckUpgrades(); break;
          case 'complete-quests': this.callbacks.completeAllQuests(); break;
          default: return;
        }
        this._render();
      });
    });

    box.querySelector('#dev-free-building').addEventListener('change', (e) => {
      this.freeBuilding = e.target.checked;
      this.callbacks.toggleFreeBuilding(this.freeBuilding);
    });
    box.querySelector('#dev-unlimited-power').addEventListener('change', (e) => {
      this.unlimitedPower = e.target.checked;
      this.callbacks.toggleUnlimitedPower(this.unlimitedPower);
    });
  }
}
