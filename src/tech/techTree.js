import { LOGISTICS_NODES } from './branches/logistics.js';
import { INFRASTRUCTURE_NODES } from './branches/infrastructure.js';
import { INDUSTRY_NODES } from './branches/industry.js';
import { MANAGEMENT_NODES } from './branches/management.js';

export const TABS = {
  logistics: LOGISTICS_NODES,
  infrastructure: INFRASTRUCTURE_NODES,
  industry: INDUSTRY_NODES,
  management: MANAGEMENT_NODES,
};

const ALL_NODES = new Map();
for (const nodes of Object.values(TABS)) for (const n of nodes) ALL_NODES.set(n.id, n);

export function getNode(id) {
  return ALL_NODES.get(id);
}

export const NODE_STATE = {
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  RESEARCHING: 'RESEARCHING',
  PAUSED: 'PAUSED',
  UNLOCKED: 'UNLOCKED',
};

// RP Pool mehanika (RimWorld-stil): questManager.researchPoints djeluje kao
// "unallocatedRP" bazen. Dok postoji activeProjectId, svaki tick se iz tog
// bazena povlaci RP u progress tog cvora (_drain) dok se ne dosegne node.cost.
// Napusteni projekt (activeProjectId promijenjen/null) ostaje u PAUSED -
// njegov progress u this.progress Mapi se NE gubi, samo se vise ne puni.
export class TechTree {
  constructor() {
    this.purchased = new Set();
    this.progress = new Map(); // nodeId -> RP vec uloženih
    this.activeProjectId = null;
  }

  isPurchased(id) {
    return this.purchased.has(id);
  }

  getState(node) {
    if (this.purchased.has(node.id)) return NODE_STATE.UNLOCKED;
    if (this.activeProjectId === node.id) return NODE_STATE.RESEARCHING;
    const prereqsMet = (node.prerequisites ?? []).every((id) => this.purchased.has(id));
    if (!prereqsMet) return NODE_STATE.LOCKED;
    if ((this.progress.get(node.id) ?? 0) > 0) return NODE_STATE.PAUSED;
    return NODE_STATE.AVAILABLE;
  }

  // cvorovi s cost:0 i BEZ prerequisites predstavljaju stvari koje su od
  // starta dostupne (D1 Extractor, I1 cesta, M1 questovi...) - otkljucaju se
  // odmah bez igraceve akcije. Poziva se JEDNOM pri stvaranju nove igre
  // (NE nakon Load-a - ucitana igra vec ima svoj purchased set iz savea).
  autoUnlockFreeRoots(ctx) {
    for (const node of ALL_NODES.values()) {
      if (node.cost === 0 && (!node.prerequisites || node.prerequisites.length === 0) && !this.purchased.has(node.id)) {
        this.purchased.add(node.id);
        node.effect?.(ctx);
      }
    }
  }

  // Postavlja cvor kao aktivan projekt (mora biti AVAILABLE ili PAUSED) i
  // odmah povuce RP iz bazena ako ga ima. Vraca false ako cvor nije
  // istrazivo (LOCKED/UNLOCKED/vec drugi RESEARCHING cvor je nebitan - taj
  // jednostavno prelazi u PAUSED time sto activeProjectId vise ne pokazuje
  // na njega).
  setActiveProject(nodeId, ctx) {
    const node = ALL_NODES.get(nodeId);
    if (!node) return false;
    const state = this.getState(node);
    if (state !== NODE_STATE.AVAILABLE && state !== NODE_STATE.PAUSED) return false;
    this.activeProjectId = nodeId;
    this._drain(ctx);
    return true;
  }

  cancelActiveProject() {
    this.activeProjectId = null;
  }

  // Poziva se svaki tick iz Engine._update() - jedino mjesto koje trosi RP
  // iz questManager.researchPoints bazena.
  update(ctx) {
    this._drain(ctx);
  }

  _drain(ctx) {
    if (!this.activeProjectId) return;
    const node = ALL_NODES.get(this.activeProjectId);
    if (!node || this.purchased.has(node.id)) {
      this.activeProjectId = null;
      return;
    }

    const invested = this.progress.get(node.id) ?? 0;
    const needed = node.cost - invested;
    const available = ctx.questManager.researchPoints;
    const spend = Math.max(0, Math.min(needed, available));

    if (spend > 0) {
      ctx.questManager.researchPoints -= spend;
      this.progress.set(node.id, invested + spend);
    }

    if (invested + spend >= node.cost) {
      this.purchased.add(node.id);
      this.progress.delete(node.id);
      node.effect?.(ctx);
      this.activeProjectId = null;
    }
  }
}
