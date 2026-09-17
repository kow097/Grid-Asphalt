// Popup koji "iskace" odozdo prema gore (kao u OpenTTD) za production-event
// notifikacije (npr. "Extractor X: povecana/smanjena proizvodnja"). Stvarno
// okidanje tih eventa (detekcija promjene proizvodnje) je odvojen zadatak -
// ovo je samo prikazni red cekanja, spreman primiti poruke preko .push().
const DISPLAY_DURATION = 4;

export class EventTicker {
  constructor(container) {
    this.container = container;
    this.queue = [];
    this.current = null;
    this.timer = 0;
  }

  push(message) {
    this.queue.push(message);
  }

  update(deltaTime) {
    if (!this.current) {
      if (this.queue.length === 0) return;
      this.current = this.queue.shift();
      this.timer = 0;
      this.container.textContent = this.current;
      this.container.classList.add('event-ticker-visible');
      return;
    }

    this.timer += deltaTime;
    if (this.timer >= DISPLAY_DURATION) {
      this.container.classList.remove('event-ticker-visible');
      this.current = null;
    }
  }
}
