export class VehiclePanel {
  constructor(container, { cost, sellRefund, onBuyTruck, onSellTruck, onCreateRoute, onFinishRoute }) {
    this.container = container;
    this.inner = container.querySelector('.expand-inner');
    this.cost = cost;
    this.sellRefund = sellRefund;
    this.onBuyTruck = onBuyTruck;
    this.onSellTruck = onSellTruck;
    this.onCreateRoute = onCreateRoute;
    this.onFinishRoute = onFinishRoute;
    // Zadnje stanje route gumba koje smo REALNO iscrtali - update() usporeduje
    // s ovim i mijenja DOM samo kad se nesto stvarno promijenilo (izbjegava
    // rebuild svaki frame, koji je znao "pojesti" klik usred geste).
    this._routeBtnState = null;
    this._render();
  }

  _render() {
    this.inner.innerHTML = `
      <div class="vehicle-actions">
        <button id="vp-buy-btn">Buy Truck ($${this.cost})</button>
        <button id="vp-sell-btn">Sell Truck (+$${this.sellRefund})</button>
      </div>
      <div id="vp-route-section"></div>
      <div class="vehicle-hint">Groups &amp; Upgrades: klikni na Truck Garage zgradu na mapi</div>
    `;

    this.buyBtn = this.inner.querySelector('#vp-buy-btn');
    this.sellBtn = this.inner.querySelector('#vp-sell-btn');
    this.routeSection = this.inner.querySelector('#vp-route-section');
    this._routeBtnState = null;

    this.buyBtn.addEventListener('click', this.onBuyTruck);
    this.sellBtn.addEventListener('click', this.onSellTruck);

    // JEDAN listener na roditelju koji se NIKAD ne unistava - klik radi bez
    // obzira koliko puta se sam gumb iznutra promijeni (text/disabled).
    this.routeSection.addEventListener('click', (e) => {
      if (e.target.id !== 'vp-route-btn' || e.target.disabled) return;
      this._routeClickAction?.();
    });
  }

  update(walletBalance, sellArmed, selectedTruck, routeArmed, pendingWaypoints, hasGarage) {
    this.buyBtn.disabled = walletBalance < this.cost || !hasGarage;
    this.buyBtn.textContent = hasGarage ? `Buy Truck ($${this.cost})` : 'Buy Truck (build a Garage first)';
    this.sellBtn.textContent = sellArmed ? 'Click a truck...' : `Sell Truck (+$${this.sellRefund})`;
    this.sellBtn.classList.toggle('armed', !!sellArmed);

    if (!selectedTruck) {
      if (this._routeBtnState !== null) {
        this.routeSection.innerHTML = '';
        this._routeBtnState = null;
        this._routeClickAction = null;
      }
      return;
    }

    const n = pendingWaypoints?.length ?? 0;
    const canFinish = routeArmed && n >= 2;
    let label;
    if (canFinish) label = `Finish Route (${n} points)`;
    else if (routeArmed) label = n === 0 ? 'Click point 1...' : `Click point ${n + 1}... (min 2)`;
    else label = 'Create Route';
    const disabled = routeArmed && !canFinish;

    const key = `${label}|${disabled}`;
    this._routeClickAction = canFinish ? this.onFinishRoute : (!routeArmed ? this.onCreateRoute : null);
    if (this._routeBtnState === key) return; // nista se ne promijenilo - ne diraj DOM

    if (this._routeBtnState === null) {
      this.routeSection.innerHTML = `<button id="vp-route-btn"></button>`;
    }
    this._routeBtnState = key;
    const btn = this.routeSection.querySelector('#vp-route-btn');
    btn.textContent = label;
    btn.disabled = disabled;
  }
}
