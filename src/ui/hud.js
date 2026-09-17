export class HUD {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="hud-stat"><span class="hud-label">Money:</span> <span id="hud-money">0</span></div>
      <div class="hud-stat"><span class="hud-label">RP:</span> <span id="hud-rp">0</span></div>
    `;
    this.moneyEl = this.container.querySelector('#hud-money');
    this.rpEl = this.container.querySelector('#hud-rp');
  }

  update(wallet, researchPoints) {
    this.moneyEl.textContent = Math.floor(wallet.balance);
    this.rpEl.textContent = Math.floor(researchPoints);
  }
}
