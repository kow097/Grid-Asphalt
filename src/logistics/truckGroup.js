export class TruckGroup {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    // Route se primjenjuje na SVAKI kamion u grupi kad se postavi, I na
    // svaki NOVI kamion koji se naknadno doda u grupu (vidi
    // Engine._onToggleTruckInGroup). Svaki kamion i dalje racuna SVOJ put
    // do prvog waypointa sa SVOJE trenutne pozicije - dijeli se samo lista
    // waypointa, ne stvarni path.
    this.route = null; // { waypoints: [[x,y], ...] } | null
  }
}
