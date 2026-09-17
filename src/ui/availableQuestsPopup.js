const REFRESH_INTERVAL = 0.5;

export class AvailableQuestsPopup {
  constructor(container, questManager) {
    this.container = container;
    this.questManager = questManager;
    this.visible = false;
    this.timer = 0;
  }

  toggle() {
    this.visible = !this.visible;
    this.container.classList.toggle('hidden', !this.visible);
    if (this.visible) this._render();
  }

  close() {
    this.visible = false;
    this.container.classList.add('hidden');
  }

  update(deltaTime) {
    if (!this.visible) return;
    this.timer += deltaTime;
    if (this.timer < REFRESH_INTERVAL) return;
    this.timer = 0;
    this._render();
  }

  _render() {
    const { offeredQuests } = this.questManager;

    const html = offeredQuests.map(q => {
      const reqText = q.requirements.map(r => `${r.amount}x ${r.type}`).join(', ');
      const pct = Math.max(0, Math.floor((q.acceptTimer / q.acceptWindow) * 100));
      return `
        <div class="quest-item">
          <div>Port ${q.portId}: ${reqText}</div>
          <div>Reward: ${q.rewardMoney}💰 / ${q.rewardRP} RP</div>
          <div class="quest-accept-timer">
            <div class="quest-progress-bar quest-accept-bar"><div class="quest-progress-fill quest-accept-fill" style="width:${pct}%"></div></div>
            <span class="quest-accept-seconds">${Math.ceil(q.acceptTimer)}s</span>
          </div>
          <button class="quest-accept-btn" data-quest-id="${q.id}">Accept</button>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="available-quests-box">
        <h3>Available Quests</h3>
        ${html || '<div class="quest-empty">none</div>'}
        <button id="available-quests-close">Close</button>
      </div>
    `;

    this.container.querySelectorAll('button.quest-accept-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.questManager.acceptQuest(Number(btn.dataset.questId));
        this._render();
      });
    });

    this.container.querySelector('#available-quests-close').addEventListener('click', () => this.close());
  }
}
