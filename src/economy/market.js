const BASE_PRICES = {
  iron: 2,
  copper: 3,
  coal: 1.5,
  stone: 1,
  oil: 4,
  iron_ingot: 5,
  copper_ingot: 7,
  steel: 12,
  motor: 30,
  circuit: 25,
};

export class Market {
  constructor(wallet) {
    this.wallet = wallet;
  }

  sell(type, amount) {
    const price = BASE_PRICES[type] || 0;
    const revenue = price * amount;
    this.wallet.add(revenue);
    return revenue;
  }
}
