import { ConveyorSegment } from './conveyor.js';

export const MERGER_VARIANTS = {
  TWO_SIDE: 'two_side',
  THREE_SIDE: 'three_side',
};

// Kanonski ulazi KAD izlaz gleda dolje (prije rotacije).
const CANON_INPUT_OFFSETS = {
  [MERGER_VARIANTS.TWO_SIDE]: [[0, -1], [1, 0]], // gore, desno
  [MERGER_VARIANTS.THREE_SIDE]: [[0, -1], [-1, 0], [1, 0]], // gore, lijevo, desno
};

// 90-stupnjeva rotacija vektora, primjenjuje se na izlaz I ulaze ZAJEDNO kao
// krutu cjelinu - relativna geometrija medju stranama ostaje ista.
function rotateOffset([dx, dy], steps) {
  let x = dx, y = dy;
  for (let i = 0; i < steps; i++) {
    const nx = -y, ny = x;
    x = nx; y = ny;
  }
  return [x, y];
}

// Sve 4 rotacije za dani variant - koristi buildMenu.js (SHAPES_BY_MODE stil).
export function mergerRotations(variant) {
  const canonInputs = CANON_INPUT_OFFSETS[variant];
  const rotations = [];
  for (let steps = 0; steps < 4; steps++) {
    rotations.push({
      cells: [[0, 0]],
      inputOffsets: canonInputs.map(o => rotateOffset(o, steps)),
      outputOffset: rotateOffset([0, 1], steps),
    });
  }
  return rotations;
}

// Prava 1x1 zgrada (ne drag-conveyor) s VISE eksplicitnih ulaznih strana i
// JEDNIM izlazom. Nasljeduje ConveyorSegment cisto radi ponovne upotrebe
// items/progress/round-robin (incomingSources+turnIndex) logike - fer
// naizmjenicno spajanje kad 2-3 conveyora istovremeno vode u ovaj merger
// vec radi iz ConveyorSegment.push(), besplatno.
export class Merger extends ConveyorSegment {
  constructor(id, x, y, variant, inputOffsets, outputDir) {
    super(id, x, y, { dx: outputDir[0], dy: outputDir[1] });
    this.kind = 'merger';
    this.variant = variant;
    this.inputOffsets = inputOffsets;
  }

  acceptsFrom(fromX, fromY) {
    return this.inputOffsets.some(([dx, dy]) => this.x + dx === fromX && this.y + dy === fromY);
  }
}
