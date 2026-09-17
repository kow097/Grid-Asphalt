import { setExpanded } from './expandAnimation.js';

export class TabBar {
  constructor(container, buildBody, vehicleBody, onTechToggle) {
    this.container = container;
    this.buildBody = buildBody;
    this.vehicleBody = vehicleBody;
    this.onTechToggle = onTechToggle;
    this.active = null; // 'build' | 'vehicles' | null

    this.techBtn = container.querySelector('#tab-tech');
    this.buildBtn = container.querySelector('#tab-build');
    this.vehiclesBtn = container.querySelector('#tab-vehicles');

    this.techBtn.addEventListener('click', () => this.onTechToggle());
    this.buildBtn.addEventListener('click', () => this._select('build'));
    this.vehiclesBtn.addEventListener('click', () => this._select('vehicles'));
  }

  _select(tab) {
    this.active = this.active === tab ? null : tab;
    setExpanded(this.buildBody, this.active === 'build');
    setExpanded(this.vehicleBody, this.active === 'vehicles');
    this.buildBtn.classList.toggle('active', this.active === 'build');
    this.vehiclesBtn.classList.toggle('active', this.active === 'vehicles');
  }

  // Za programatsko otvaranje (npr. klik na kamion u svijetu treba OTVORITI
  // Vehicles tab, ne ga togglati) - za razliku od _select() uvijek postavlja
  // na dani tab, nikad ga ne zatvara ako je vec otvoren.
  openTab(tab) {
    if (this.active === tab) return;
    this.active = tab;
    setExpanded(this.buildBody, this.active === 'build');
    setExpanded(this.vehicleBody, this.active === 'vehicles');
    this.buildBtn.classList.toggle('active', this.active === 'build');
    this.vehiclesBtn.classList.toggle('active', this.active === 'vehicles');
  }

  setTechActive(isActive) {
    this.techBtn.classList.toggle('active', isActive);
  }
}
