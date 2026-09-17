// Popup koji se otvara klikom na Truck Garage zgradu u svijetu - sadrzi
// Groups & Upgrades (grupe kamiona, nadogradnje) koje su MAKNUTE iz stalnog
// Vehicles taba i sad su dostupne SAMO ovako, preko garaze.
export class GarageMenu {
  constructor(container) {
    this.container = container;
    this.garage = null;
  }

  get isOpen() {
    return this.garage !== null;
  }

  open(garage) {
    this.garage = garage;
    this._render();
    this.container.classList.remove('hidden');
  }

  close() {
    this.garage = null;
    this.container.classList.add('hidden');
  }

  _render() {
    this.container.innerHTML = `
      <div class="garage-menu-box">
        <h3>Groups &amp; Upgrades</h3>
        <button disabled title="Uskoro">Create Group</button>
        <button disabled title="Uskoro">Manage Groups</button>
        <button disabled title="Uskoro">Assign Route to Group</button>
        <button disabled title="Uskoro">Upgrade: Trailer</button>
        <button disabled title="Uskoro">Upgrade: Suspension/Engine</button>
        <button id="garage-menu-close">Close</button>
      </div>
    `;

    this.container.querySelector('#garage-menu-close').addEventListener('click', () => this.close());
  }
}
