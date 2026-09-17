import { TABS, NODE_STATE } from '../tech/techTree.js';

const TAB_LABELS = {
  logistics: 'Logistics',
  infrastructure: 'Infrastructure',
  industry: 'Industry',
  management: 'Management',
};

const STATE_LABEL = {
  [NODE_STATE.LOCKED]: '🔒 Locked',
  [NODE_STATE.AVAILABLE]: 'Available',
  [NODE_STATE.RESEARCHING]: 'Researching…',
  [NODE_STATE.PAUSED]: 'Paused',
  [NODE_STATE.UNLOCKED]: '✓ Unlocked',
};

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
  }

  toggle() {
    this.visible = !this.visible;
    this.container.classList.toggle('hidden', !this.visible);
    if (this.visible) this._render();
  }

  update(deltaTime) {
    if (!this.visible) return;
    this.timer += deltaTime;
    if (this.timer < 0.4) return;
    this.timer = 0;
    this._render();
  }

  _lineLabel(tab, line) {
    const names = {
      logistics: { A: 'Conveyors & Sorting', B: 'Truck Fleet', C: 'Warehousing & Food' },
      infrastructure: { A: 'Roads & Traffic', B: 'Bridges & Marine', C: 'Power Grid' },
      industry: { A: 'Mining & Extraction', B: 'Smelting & Materials', C: 'Assembly & Manufacturing' },
      management: { A: 'Contracts & Quests', B: 'R&D & Market', C: 'Financial & Efficiency' },
    };
    return names[tab]?.[line] ?? line;
  }

  _prereqLabel(node) {
    if (!node.prerequisites?.length) return '';
    return `Zahtijeva: ${node.prerequisites.join(', ')}`;
  }

  _nodeNode(node) {
    const nodeState = this.techTree.getState(node);
    const progress = this.techTree.progress.get(node.id) ?? 0;
    const pct = node.cost > 0 ? Math.min(100, Math.round((progress / node.cost) * 100)) : 100;
    const clickable = nodeState === NODE_STATE.AVAILABLE || nodeState === NODE_STATE.PAUSED || nodeState === NODE_STATE.RESEARCHING;
    const costLabel = node.cost === 0 ? '0 RP' : `${node.cost} RP`;

    return `
      <div class="tech-node-wrap" data-tier="${node.tier}">
        <button class="tech-node tech-node--${nodeState.toLowerCase()} ${clickable ? '' : 'tech-node--inert'}" data-node-id="${node.id}">
          <span class="tech-node-title">${node.title}</span>
          <span class="tech-node-cost">${costLabel}</span>
          ${nodeState === NODE_STATE.RESEARCHING || (nodeState === NODE_STATE.PAUSED)
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
    const lines = [...new Set(nodes.map((n) => n.line))].sort();
    const maxTier = Math.max(...nodes.map((n) => n.tier));

    const columnsHtml = lines.map((line) => {
      const lineNodes = nodes.filter((n) => n.line === line).sort((a, b) => a.tier - b.tier);
      const cellsHtml = [];
      for (let tier = 1; tier <= maxTier; tier++) {
        const node = lineNodes.find((n) => n.tier === tier);
        cellsHtml.push(node
          ? `<div class="tech-tier-cell">${tier > 1 ? '<span class="tech-connector"></span>' : ''}${this._nodeNode(node)}</div>`
          : '<div class="tech-tier-cell tech-tier-cell--empty"></div>');
      }
      return `
        <div class="tech-line-col">
          <div class="tech-line-label">${this._lineLabel(this.activeTab, line)}</div>
          ${cellsHtml.join('')}
        </div>
      `;
    }).join('');

    const activeNode = this.techTree.activeProjectId ? nodes.find((n) => n.id === this.techTree.activeProjectId)
      ?? Object.values(TABS).flat().find((n) => n.id === this.techTree.activeProjectId) : null;

    this.container.innerHTML = `
      <div class="tech-fullscreen-header">
        <div class="tech-main-tabs">${tabsHtml}</div>
        <div class="tech-rp-status">
          RP: ${Math.floor(this.questManager.researchPoints)}
          ${activeNode ? ` — istražuje: ${activeNode.title} (${Math.floor(this.techTree.progress.get(activeNode.id) ?? 0)}/${activeNode.cost})` : ''}
        </div>
        <button id="tech-close-btn">✕</button>
      </div>
      <div class="tech-tab-content">${columnsHtml}</div>
      <div id="tech-tooltip" class="tech-tooltip hidden"></div>
    `;

    this.container.querySelectorAll('.tech-main-tab').forEach((btn) => {
      btn.addEventListener('click', () => { this.activeTab = btn.dataset.tab; this._render(); });
    });
    this.container.querySelector('#tech-close-btn').addEventListener('click', () => this.toggle());

    this.container.querySelectorAll('button.tech-node').forEach((btn) => {
      btn.addEventListener('click', () => {
        const node = nodes.find((n) => n.id === btn.dataset.nodeId);
        if (!node) return;
        const nodeState = this.techTree.getState(node);
        if (nodeState === NODE_STATE.RESEARCHING) this.techTree.cancelActiveProject();
        else if (nodeState === NODE_STATE.AVAILABLE || nodeState === NODE_STATE.PAUSED) this.techTree.setActiveProject(node.id, this.ctx);
        this._render();
      });
    });

    const tooltip = this.container.querySelector('#tech-tooltip');
    this.container.querySelectorAll('.tech-info-icon').forEach((icon) => {
      const node = nodes.find((n) => n.id === icon.dataset.tooltipId);
      if (!node) return;
      const show = (e) => {
        const nodeState = this.techTree.getState(node);
        const progress = this.techTree.progress.get(node.id) ?? 0;
        tooltip.innerHTML = `
          <strong>${node.title}</strong><br/>
          ${node.description}<br/>
          <em>Cijena: ${node.cost} RP${progress > 0 && nodeState !== NODE_STATE.UNLOCKED ? ` (uloženo ${Math.floor(progress)})` : ''}</em><br/>
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
      icon.addEventListener('touchstart', (e) => { e.preventDefault(); show(e); }, { passive: false });
      icon.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));
    });
  }
}
