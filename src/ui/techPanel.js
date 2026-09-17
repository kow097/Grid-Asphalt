import { BRANCHES } from '../tech/techTree.js';
import { setExpanded } from './expandAnimation.js';

const REFRESH_INTERVAL = 0.5;

export class TechPanel {
  constructor(container, techTree, questManager, modifiers, state) {
    this.container = container;
    this.techTree = techTree;
    this.questManager = questManager;
    this.modifiers = modifiers;
    this.state = state;
    this.visible = false;
    this.activeBranch = null;
    this.timer = REFRESH_INTERVAL;
    this._buildShell();
  }

  toggle() {
    this.visible = !this.visible;
    this.container.classList.toggle('hidden', !this.visible);
    if (this.visible) this._renderBranches();
  }

  update(deltaTime) {
    if (!this.visible) return;
    this.timer += deltaTime;
    if (this.timer < REFRESH_INTERVAL) return;
    this.timer = 0;
    this._renderBranches();
  }

  // Skeleton (tabovi + jedan expand-wrap panel po grani) se gradi SAMO
  // jednom - sadrzaj cvorova unutra se poslije osvjezava zasebno
  // (_renderBranches), da ne bismo gubili animacijsko stanje na svaki refresh.
  _buildShell() {
    const branchNames = Object.keys(BRANCHES);

    const tabsHtml = branchNames.map(name =>
      `<button class="tech-tab-btn" data-branch="${name}">${name}</button>`
    ).join('');

    const panelsHtml = branchNames.map(name => `
      <div class="tech-branch-panel expand-wrap hidden" data-branch="${name}">
        <div class="expand-inner"></div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="tech-tabs">${tabsHtml}</div>
      <div class="tech-branches">${panelsHtml}</div>
    `;

    this.container.querySelectorAll('.tech-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this._selectBranch(btn.dataset.branch));
    });
  }

  // Klik na drugi tab istovremeno zatvara prethodnu granu i otvara novu -
  // oba setExpanded poziva idu jedan za drugim, svaki na SVOM elementu, pa
  // oba CSS prijelaza teku paralelno.
  _selectBranch(name) {
    const prev = this.activeBranch;
    this.activeBranch = this.activeBranch === name ? null : name;

    if (prev && prev !== this.activeBranch) {
      setExpanded(this.container.querySelector(`.tech-branch-panel[data-branch="${prev}"]`), false);
      this.container.querySelector(`.tech-tab-btn[data-branch="${prev}"]`)?.classList.remove('active');
    }
    if (this.activeBranch) {
      setExpanded(this.container.querySelector(`.tech-branch-panel[data-branch="${this.activeBranch}"]`), true);
      this.container.querySelector(`.tech-tab-btn[data-branch="${this.activeBranch}"]`)?.classList.add('active');
    }
  }

  _renderBranches() {
    for (const [branchName, nodes] of Object.entries(BRANCHES)) {
      const inner = this.container.querySelector(`.tech-branch-panel[data-branch="${branchName}"] .expand-inner`);
      if (!inner) continue;

      inner.innerHTML = nodes.map(node => {
        const purchased = this.techTree.isPurchased(node.id);
        const available = this.techTree.isAvailable(node);
        const affordable = this.questManager.researchPoints >= node.cost;
        const canBuy = available && affordable && !purchased;

        return `
          <div class="tech-node ${purchased ? 'tech-owned' : ''}">
            <div>${node.name} (${node.cost} RP)</div>
            <button data-node-id="${node.id}" data-branch="${branchName}" ${canBuy ? '' : 'disabled'}>
              ${purchased ? 'Owned' : 'Research'}
            </button>
          </div>
        `;
      }).join('');

      inner.querySelectorAll('button[data-node-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const branch = BRANCHES[btn.dataset.branch];
          const node = branch.find(n => n.id === btn.dataset.nodeId);
          if (!node) return;
          this.techTree.purchase(node, { modifiers: this.modifiers, questManager: this.questManager, state: this.state });
          this._renderBranches();
        });
      });
    }
  }
}
