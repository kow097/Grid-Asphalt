export class Warehouse {
  constructor(id, slotCount, capacityPerSlot) {
    this.id = id;
    this.kind = 'warehouse';
    this.capacityPerSlot = capacityPerSlot;
    this.slots = Array.from({ length: slotCount }, () => ({ assignedType: null, amount: 0 }));
    // Apsolutne [x,y] pozicije - postavlja buildMenu.js pri gradnji, ovisno
    // o rotaciji. inputCells = SVI tileovi na ulaznoj strani (bilo koji
    // prima bilo koji tip, acceptInput sam raspodijeli po odgovarajucem
    // slotu). outputCells[i] odgovara TOCNO slots[i] (1-na-1, kao i prije).
    this.inputCells = [];
    this.outputCells = [];
  }

  acceptInput(type, amount) {
    let remaining = amount;
    for (const slot of this.slots) {
      if (remaining <= 0) break;
      if (slot.assignedType !== type) continue;
      const space = this.capacityPerSlot - slot.amount;
      const accepted = Math.max(0, Math.min(remaining, space));
      slot.amount += accepted;
      remaining -= accepted;
    }
    return amount - remaining;
  }

  collectFromSlot(slotIndex, amount) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.assignedType || slot.amount <= 0) return { type: null, amount: 0 };
    const taken = Math.min(amount, slot.amount);
    slot.amount -= taken;
    return { type: slot.assignedType, amount: taken };
  }

  cycleSlotType(slotIndex, availableTypes) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    const options = [null, ...availableTypes];
    const currentIndex = options.indexOf(slot.assignedType);
    slot.assignedType = options[(currentIndex + 1) % options.length];
    slot.amount = 0;
  }

  isInputCell(x, y) {
    return this.inputCells.some(([ix, iy]) => ix === x && iy === y);
  }

  // Vraca indeks slota ciji je output bas na (x,y), ili -1.
  outputSlotIndexAt(x, y) {
    return this.outputCells.findIndex(([ox, oy]) => ox === x && oy === y);
  }

  // Grupira slotove po dodijeljenom tipu - npr. 2 slota na 'oil' postaju
  // JEDAN red {type:'oil', stored:140, max:200}. Koristi UI info popup.
  summarizeByType() {
    const groups = new Map();
    let unassigned = 0;
    for (const slot of this.slots) {
      if (!slot.assignedType) { unassigned++; continue; }
      const g = groups.get(slot.assignedType) ?? { type: slot.assignedType, stored: 0, max: 0 };
      g.stored += slot.amount;
      g.max += this.capacityPerSlot;
      groups.set(slot.assignedType, g);
    }
    return { types: [...groups.values()], unassignedSlots: unassigned };
  }
}
