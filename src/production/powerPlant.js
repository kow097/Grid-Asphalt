// Namjerno bez recepta/goriva (MVP - "priprema" iz ROADMAP.md trazi samo
// da se building.powered postavlja po mrezi, ostalo je otvoreno). Fiksni
// stalni output - kasnije se lako doda fuel-input varijanta (npr. Processor
// stil s coal inputom) bez diranja powerNetwork.js.
export class PowerPlant {
  constructor(id, output = 50) {
    this.id = id;
    this.kind = 'power_plant';
    this.output = output;
  }
}
