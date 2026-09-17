const BELT_SPEED = 1;
const ITEM_SPACING = 0.55;
// Koliko puta zaredom "cekamo" na izvor ciji je red, prije nego odustanemo
// od stroge naizmjenicnosti i pustimo koji god izvor trenutno pokusava
// (sprjecava trajni deadlock kad neki registrirani izvor ne dostavlja).
const ROUND_ROBIN_PATIENCE = 6;

export class ConveyorSegment {
  constructor(id, x, y, direction) {
    this.id = id;
    this.kind = 'conveyor';
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.items = [];
    this.next = null;
    this.incomingSources = [];
    this.turnIndex = 0;
    this.requiresPower = true;
    this.powered = true;
  }

  registerIncoming(sourceId) {
    if (!this.incomingSources.includes(sourceId)) this.incomingSources.push(sourceId);
  }

  canAccept() {
    if (this.items.length === 0) return true;
    const newest = this.items[this.items.length - 1];
    return newest.progress >= ITEM_SPACING;
  }

  // entryDir = smjer iz kojeg item ulazi u ovaj tile (obicno .direction
  // segmenta koji ga je poslao) - koristi renderer za crtanje kroz sredinu
  // tile-a na kutovima. startProgress = koliko je vec "presao" preko granice
  // (preneseni visak iz prethodnog segmenta) da ne bi vizualno skakao na 0.
  push(type, sourceId = null, entryDir = null, startProgress = 0) {
    if (!this.canAccept()) return false;

    // Pravi merge point (2+ izvora): round-robin daje prednost onome cija je
    // trenutna "runda", ali NIKAD trajno ne blokira ostale - ako "trenutni
    // red" ne dostavi nista unutar ROUND_ROBIN_PATIENCE pokusaja (npr. ta
    // strana mergera uopce nije spojena/ne dostavlja), odustajemo od cekanja
    // i pustimo koji god izvor trenutno pokusava. Bez ovoga bi jedan
    // neaktivan registrirani ulaz trajno zakocio CIJELI merger (bio bug -
    // "nece propustiti dok sva 3 inputa nisu spojena").
    if (this.incomingSources.length > 1 && sourceId !== null) {
      const currentTurn = this.incomingSources[this.turnIndex % this.incomingSources.length];
      if (sourceId !== currentTurn) {
        this._missedTurns = (this._missedTurns ?? 0) + 1;
        if (this._missedTurns < ROUND_ROBIN_PATIENCE) return false;
      }
      this._missedTurns = 0;
      this.turnIndex = this.incomingSources.indexOf(sourceId) + 1;
    }

    const newest = this.items[this.items.length - 1];
    const maxStart = newest ? newest.progress - ITEM_SPACING : startProgress;
    const progress = Math.min(startProgress, maxStart);

    this.items.push({ type, progress, entryDir: entryDir || this.direction });
    return true;
  }

  update(deltaTime, speedMultiplier = 1) {
    if (this.requiresPower && !this.powered) return;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const ahead = this.items[i - 1];
      const maxProgress = ahead ? ahead.progress - ITEM_SPACING : 1;
      const desired = item.progress + BELT_SPEED * speedMultiplier * deltaTime;
      item.progress = Math.min(desired, maxProgress);
      // Visak brzine izgubljen na granici tile-a - prenosimo ga na sljedeci
      // segment umjesto da item svaki put "cekaj do cistog 1.0" pa skoci na 0.
      if (i === 0) item._overflow = Math.min(Math.max(0, desired - maxProgress), 0.95);
    }

    if (this.items.length > 0 && this.items[0].progress >= 1 && this.next) {
      const item = this.items[0];
      // Stvarni smjer prijelaza prema fizickom polozaju .next tile-a - ne
      // nominalno .direction polje (koje se na "koljenu" ne mora poklapati).
      const crossDir = { dx: this.next.x - this.x, dy: this.next.y - this.y };
      const accepted = this.next.push(item.type, this.id, crossDir, item._overflow ?? 0);
      if (accepted) this.items.shift();
    }
  }
}
