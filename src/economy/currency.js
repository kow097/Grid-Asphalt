export class Wallet {
  constructor(startingBalance = 0) {
    this.balance = startingBalance;
  }

  add(amount) {
    this.balance += amount;
  }

  spend(amount) {
    if (amount > this.balance) return false;
    this.balance -= amount;
    return true;
  }
}
