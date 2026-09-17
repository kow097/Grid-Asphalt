// Jednostavna zgrada - nema recept, input/output. Jedina svrha: mjesto gdje
// se kupljeni kamioni spawnaju (VehiclePanel "Buy Truck" gumb), umjesto na
// portu. Bez barem jednog garaznog spremista kupnja kamiona nije moguca.
export class TruckGarage {
  constructor(id, x, y) {
    this.id = id;
    this.kind = 'truck_garage';
    this.x = x;
    this.y = y;
  }
}
