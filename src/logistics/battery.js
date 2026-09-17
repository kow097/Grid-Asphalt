export class Battery {
  constructor(id, capacity = 200) {
    this.id = id;
    this.kind = 'battery';
    this.capacity = capacity;
    this.charge = 0;
  }
}
