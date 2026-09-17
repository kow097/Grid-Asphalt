export const QUEST_STATE = {
  OFFERED: 'offered',
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired',
};

let questIdCounter = 0;

export class Quest {
  constructor({ portId, requirements, rewardMoney, rewardRP, acceptWindow, executionWindow }) {
    this.id = questIdCounter++;
    this.portId = portId;
    this.requirements = requirements;
    this.delivered = {};
    this.rewardMoney = rewardMoney;
    this.rewardRP = rewardRP;
    this.acceptWindow = acceptWindow;
    this.acceptTimer = acceptWindow;
    this.executionTimer = executionWindow;
    this.state = QUEST_STATE.OFFERED;
  }

  deliver(type, amount) {
    const req = this.requirements.find(r => r.type === type);
    if (!req) return 0;
    const current = this.delivered[type] || 0;
    const needed = req.amount - current;
    const accepted = Math.max(0, Math.min(amount, needed));
    this.delivered[type] = current + accepted;
    return accepted;
  }

  isFulfilled() {
    return this.requirements.every(r => (this.delivered[r.type] || 0) >= r.amount);
  }

  fulfilledRatio() {
    let totalNeeded = 0;
    let totalDelivered = 0;
    for (const r of this.requirements) {
      totalNeeded += r.amount;
      totalDelivered += Math.min(r.amount, this.delivered[r.type] || 0);
    }
    return totalNeeded === 0 ? 1 : totalDelivered / totalNeeded;
  }

  accept() {
    if (this.state !== QUEST_STATE.OFFERED) return false;
    this.state = QUEST_STATE.ACCEPTED;
    return true;
  }

  update(deltaTime) {
    if (this.state === QUEST_STATE.OFFERED) {
      this.acceptTimer -= deltaTime;
      if (this.acceptTimer <= 0) this.state = QUEST_STATE.EXPIRED;
      return;
    }

    if (this.state === QUEST_STATE.ACCEPTED) {
      if (this.isFulfilled()) {
        this.state = QUEST_STATE.COMPLETED;
        return;
      }
      this.executionTimer -= deltaTime;
      if (this.executionTimer <= 0) this.state = QUEST_STATE.FAILED;
    }
  }
}
