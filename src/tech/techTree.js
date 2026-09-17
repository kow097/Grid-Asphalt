import { LOGISTICS_BRANCH } from './branches/logistics.js';
import { INFRASTRUCTURE_BRANCH } from './branches/infrastructure.js';
import { INDUSTRY_BRANCH } from './branches/industry.js';
import { MANAGEMENT_BRANCH } from './branches/management.js';

export const BRANCHES = {
  logistics: LOGISTICS_BRANCH,
  infrastructure: INFRASTRUCTURE_BRANCH,
  industry: INDUSTRY_BRANCH,
  management: MANAGEMENT_BRANCH,
};

export class TechTree {
  constructor() {
    this.purchased = new Set();
  }

  isPurchased(nodeId) {
    return this.purchased.has(nodeId);
  }

  isAvailable(node) {
    if (this.isPurchased(node.id)) return false;
    if (node.requires && !this.isPurchased(node.requires)) return false;
    return true;
  }

  purchase(node, ctx) {
    if (!this.isAvailable(node)) return false;
    if (ctx.questManager.researchPoints < node.cost) return false;

    ctx.questManager.researchPoints -= node.cost;
    this.purchased.add(node.id);
    node.effect(ctx);
    return true;
  }
}
