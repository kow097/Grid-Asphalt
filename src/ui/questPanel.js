const REFRESH_INTERVAL = 0.5;

export class QuestPanel {
  constructor(container, questManager) {
    this.container = container;
    this.questManager = questManager;
    this.timer = REFRESH_INTERVAL;
  }

  update(deltaTime) {
    this.timer += deltaTime;
    if (this.timer < REFRESH_INTERVAL) return;
    this.timer = 0;
    this._render();
  }

  _render() {
    const { offeredQuests, activeQuests } = this.questManager;

    const offeredHtml = offeredQuests.map(q => `
      <div class="quest-item">
        <div>Port ${q.portId}: ${this._reqText(q)}</div>
        <div>Reward: ${q.rewardMoney}💰 / ${q.rewardRP} RP</div>
        <div>Accept within: ${Math.ceil(q.acceptTimer)}s</div>
        <button data-quest-id="${q.id}">Accept</button>
      </div>
    `).join('');

    const activeHtml = activeQuests.map(q => `
      <div class="quest-item quest-active">
        <div>Port ${q.portId}: ${this._reqText(q)}</div>
        <div>Reward: ${q.rewardMoney}💰 / ${q.rewardRP} RP</div>
        <div>Progress: ${Math.floor(q.fulfilledRatio() * 100)}%</div>
        <div>Deadline: ${Math.ceil(q.executionTimer)}s</div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <h3>Offered Quests</h3>
      ${offeredHtml || '<div class="quest-empty">none</div>'}
      <h3>Active Quests</h3>
      ${activeHtml || '<div class="quest-empty">none</div>'}
    `;

    this.container.querySelectorAll('button[data-quest-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.questManager.acceptQuest(Number(btn.dataset.questId));
      });
    });
  }

  _reqText(quest) {
    return quest.requirements.map(r => `${r.amount}x ${r.type}`).join(', ');
  }
}
