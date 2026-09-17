export class ShopPanel {
  constructor(container, cost, sellRefund, onBuyTruck, onSellTruck) {
    this.container = container;
    this.cost = cost;
    this.sellRefund = sellRefund;
    this.container.innerHTML = `
      <button id="buy-truck-btn">Buy Truck ($${cost})</button>
      <button id="sell-truck-btn">Sell Truck (+$${sellRefund})</button>
    `;
    this.buyButton = this.container.querySelector('#buy-truck-btn');
    this.sellButton = this.container.querySelector('#sell-truck-btn');
    this.buyButton.addEventListener('click', onBuyTruck);
    this.sellButton.addEventListener('click', onSellTruck);
  }

  update(walletBalance, sellArmed) {
    this.buyButton.disabled = walletBalance < this.cost;
    this.sellButton.textContent = sellArmed ? 'Click a truck...' : `Sell Truck (+$${this.sellRefund})`;
    this.sellButton.classList.toggle('armed', !!sellArmed);
  }
}
