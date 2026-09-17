import { TABS, NODE_STATE } from '../tech/techTree.js';

const TAB_LABELS = {
  logistics: 'Logistics',
  infrastructure: 'Infrastructure',
  industry: 'Industry',
  management: 'Management',
};

const LINE_LABELS = {
  logistics: { A: 'Conveyors & Sorting', B: 'Truck Fleet', C: 'Warehousing & Food' },
  infrastructure: { A: 'Roads & Traffic', B: 'Bridges & Marine', C: 'Power Grid' },
  industry: { A: 'Mining & Extraction', B: 'Smelting & Materials', C: 'Assembly & Manufacturing' },
  management: { A: 'Contracts & Quests', B: 'R&D & Market', C: 'Financial & Efficiency' },
};

const STATE_LABEL = {
  [NODE_STATE.LOCKED]: '🔒 Locked',
  [NODE_STATE.AVAILABLE]: 'Available',
  [NODE_STATE.RESEARCHING]: 'Researching…',
  [NODE_STATE.PAUSED]: 'Paused',
  [NODE_STATE.UNLOCKED]: '✓ Unlocked',
};

const ALL_NODES = Object.values(TABS).flat();

export class TechPanel {
  constructor(container, techTree, questManager, modifiers, state) {
    this.container = container;
    this.techTree = techTree;
    this.questManager = questManager;
    this.modifiers = modifiers;
    this.state = state;
    this.ctx = { modifiers, questManager, state, techTree };
    this.visible = false;
    this.activeTab = 'logistics';
    this.timer = 0;
    // Snapshot koji _refreshDynamic koristi da odluci treba li PUNI _render()
    // (struktura/stanja cvorova promijenjeni) ili samo lagano osvjezavanje
    // brojki (RP/progress) - vidi update(). Bez ovoga bismo morali rusiti i
    // ponovno graditi CIJELI DOM svakih ~0.3s, sto je uzrokovalo treperenje
    // tooltipa (izgubio bi "hidden" stanje pod kursorom) i povremeno
    // "progutane" klikove na tab/node gumbe (event listener zamijenjen
    // usred klika).
    this._lastPurchasedCount = -1;
    this._lastActiveId = undefined;
  }

  toggle() {
    this.visible = !this.visible;
    this.container.classList.toggle('hidden', !this.visible);
    if (this.visible) this._render();
  }

  update(deltaTime) {
    if (!this.visible) return;
    this.timer += deltaTime;
    if (this.timer < 0.3) return;
    this.timer = 0;

    const purchasedCount = this.techTree.purchased.size;
    const activeId = this.techTree.activeProjectId;
    if (purchasedCount !== this._lastPurchasedCount || activeId !== this._lastActiveId) {
      this._lastPurchasedCount = purchasedCount;
      this._lastActiveId = activeId;
      this._render();
      return;
    }
    this._refreshDynamic();
  }

  // Lagano osvjezavanje - MIJENJA samo tekst/sirinu postojecih elemenata,
  // NE dira DOM strukturu ni listenere. Ovo je ono sto se izvrsava svaki
  // tick dok se nista bitno nije promijenilo (99% vremena).
  _refreshDynamic() {
    const rpEl = this.container.querySelector('.tech-rp-status');
    if (rpEl) rpEl.textContent = this._rpStatusText();

    if (this.techTree.activeProjectId) {
      const node = ALL_NODES.find((n) => n.id === this.techTree.activeProjectId);
      const bar = this.container.querySelector(`.tech-node[data-node-id="${this.techTree.activeProjectId}"] .tech-node-progress span`);
      if (node && bar) {
        const progress = this.techTree.progress.get(node.id) ?? 0;
        bar.style.width = `${node.cost > 0 ? Math.min(100, Math.round((progress / node.cost) * 100)) : 100}%`;
      }
    }
  }

  _rpStatusText() {
    const activeNode = this.techTree.activeProjectId ? ALL_NODES.find((n) => n.id === this.techTree.activeProjectId) : null;
    let text = `RP: ${Math.floor(this.questManager.researchPoints)}`;
    if (activeNode) text += ` — researching: ${activeNode.title} (${Math.floor(this.techTree.progress.get(activeNode.id) ?? 0)}/${activeNode.cost})`;
    return text;
  }

  _prereqLabel(node) {
    if (!node.prerequisites?.length) return '';
    return `Requires: ${node.prerequisites.join(', ')}`;
  }

  _nodeHtml(node) {
    const nodeState = this.techTree.getState(node);
    const progress = this.techTree.progress.get(node.id) ?? 0;
    const pct = node.cost > 0 ? Math.min(100, Math.round((progress / node.cost) * 100)) : 100;
    const clickable = nodeState === NODE_STATE.AVAILABLE || nodeState === NODE_STATE.PAUSED || nodeState === NODE_STATE.RESEARCHING;
    const costLabel = `${node.cost} RP`;

    return `
      <div class="tech-node-wrap">
        <button class="tech-node tech-node--${nodeState.toLowerCase()} ${clickable ? '' : 'tech-node--inert'}" data-node-id="${node.id}">
          <span class="tech-node-title">${node.title}</span>
          <span class="tech-node-cost">${costLabel}</span>
          ${(nodeState === NODE_STATE.RESEARCHING || nodeState === NODE_STATE.PAUSED)
            ? `<span class="tech-node-progress"><span style="width:${pct}%"></span></span>` : ''}
          <span class="tech-node-state">${STATE_LABEL[nodeState]}</span>
        </button>
        <span class="tech-info-icon" data-tooltip-id="${node.id}">i</span>
      </div>
    `;
  }

  _render() {
    const tabsHtml = Object.keys(TABS).map((tab) => `
      <button class="tech-main-tab ${this.activeTab === tab ? 'active' : ''}" data-tab="${tab}">${TAB_LABELS[tab]}</button>
    `).join('');

    const nodes = TABS[this.activeTab];
    const root = nodes.find((n) => !n.line);
    const lineNodes = nodes.filter((n) => n.line);
    const lines = [...new Set(lineNodes.map((n) => n.line))].sort();
    const maxTier = Math.max(...lineNodes.map((n) => n.tier));

    const columnsHtml = lines.map((line) => {
      const col = lineNodes.filter((n) => n.line === line).sort((a, b) => a.tier - b.tier);
      const cellsHtml = [];
      for (let tier = 2; tier <= maxTier; tier++) {
        const node = col.find((n) => n.tier === tier);
        cellsHtml.push(node
          ? `<div class="tech-tier-cell"><span class="tech-connector"></span>${this._nodeHtml(node)}</div>`
          : '<div class="tech-tier-cell tech-tier-cell--empty"></div>');
      }
      return `
        <div class="tech-line-col">
          <div class="tech-line-label">${LINE_LABELS[this.activeTab]?.[line] ?? line}</div>
          ${cellsHtml.join('')}
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="tech-fullscreen-header">
        <div class="tech-main-tabs">${tabsHtml}</div>
        <div class="tech-rp-status">${this._rpStatusText()}</div>
        <button id="tech-close-btn">✕</button>
      </div>
      <div class="tech-tab-content">
        <div class="tech-root-row">
          ${root ? this._nodeHtml(root) : ''}
        </div>
        <div class="tech-root-connector"></div>
        <div class="tech-columns-row">${columnsHtml}</div>
      </div>
      <div id="tech-tooltip" class="tech-tooltip hidden"></div>
    `;

    this.container.querySelectorAll('.tech-main-tab').forEach((btn) => {
      btn.addEventListener('click', () => { this.activeTab = btn.dataset.tab; this._render(); });
    });
    this.container.querySelector('#tech-close-btn').addEventListener('click', () => this.toggle());

    const allTabNodes = [root, ...lineNodes].filter(Boolean);
    this.container.querySelectorAll('button.tech-node').forEach((btn) => {
      btn.addEventListener('click', () => {
        const node = allTabNodes.find((n) => n.id === btn.dataset.nodeId);
        if (!node) return;
        const nodeState = this.techTree.getState(node);
        if (nodeState === NODE_STATE.RESEARCHING) this.techTree.cancelActiveProject();
        else if (nodeState === NODE_STATE.AVAILABLE || nodeState === NODE_STATE.PAUSED) this.techTree.setActiveProject(node.id, this.ctx);
        this._render();
      });
    });

    const tooltip = this.container.querySelector('#tech-tooltip');
    this.container.querySelectorAll('.tech-info-icon').forEach((icon) => {
      const node = allTabNodes.find((n) => n.id === icon.dataset.tooltipId);
      if (!node) return;
      const show = () => {
        const nodeState = this.techTree.getState(node);
        const progress = this.techTree.progress.get(node.id) ?? 0;
        tooltip.innerHTML = `
          <strong>${node.title}</strong><br/>
          ${node.description}<br/>
          <em>Cost: ${node.cost} RP${progress > 0 && nodeState !== NODE_STATE.UNLOCKED ? ` (invested ${Math.floor(progress)})` : ''}</em><br/>
          ${this._prereqLabel(node) ? `<em>${this._prereqLabel(node)}</em><br/>` : ''}
          <em>Status: ${STATE_LABEL[nodeState]}</em>
        `;
        tooltip.classList.remove('hidden');
        const rect = icon.getBoundingClientRect();
        const panelRect = this.container.getBoundingClientRect();
        tooltip.style.left = `${rect.left - panelRect.left + 20}px`;
        tooltip.style.top = `${rect.top - panelRect.top}px`;
      };
      icon.addEventListener('mouseenter', show);
      icon.addEventListener('touchstart', (e) => { e.preventDefault(); show(); }, { passive: false });
      icon.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));
    });
  }
}
