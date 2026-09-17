import { setExpanded } from './expandAnimation.js';

const REFRESH_INTERVAL = 0.5;

export class ActiveQuestsPanel {
  constructor(container, questManager) {
    this.container = container;
    this.questManager = questManager;
    this.timer = REFRESH_INTERVAL;
    this.expandedId = null;
  }

  update(deltaTime) {
    this.timer += deltaTime;
    if (this.timer < REFRESH_INTERVAL) return;
    this.timer = 0;
    this._render();
  }

  _render() {
    const { activeQuests } = this.questManager;

    const html = activeQuests.map(q => {
      const pct = Math.floor(q.fulfilledRatio() * 100);
      const reqText = q.requirements.map(r => `${r.amount}x ${r.type}`).join(', ');
      const expanded = this.expandedId === q.id;

      const totalNeeded = q.requirements.reduce((s, r) => s + r.amount, 0);
      const totalDelivered = q.requirements.reduce((s, r) => s + Math.min(r.amount, q.delivered[r.type] || 0), 0);

      return `
        <div class="quest-item quest-active" data-quest-id="${q.id}">
          <div>Port ${q.portId}: ${reqText}</div>
          <div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${pct}%"></div></div>
          <div>${pct}% - ${Math.ceil(q.executionTimer)}s left</div>
          <div class="quest-detail expand-wrap ${expanded ? 'expanded' : 'hidden'}">
            <div class="expand-inner">
              <div>Reward: ${q.rewardMoney}💰 / ${q.rewardRP} RP</div>
              <div>Items: ${totalDelivered}/${totalNeeded}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = html || '<div class="quest-empty">No active quests</div>';

    this.container.querySelectorAll('.quest-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = Number(el.dataset.questId);
        const opening = this.expandedId !== id;

        if (this.expandedId !== null && this.expandedId !== id) {
          const prevEl = this.container.querySelector(`.quest-item[data-quest-id="${this.expandedId}"] .quest-detail`);
          if (prevEl) setExpanded(prevEl, false);
        }

        setExpanded(el.querySelector('.quest-detail'), opening);
        this.expandedId = opening ? id : null;
      });
    });
  }
}
