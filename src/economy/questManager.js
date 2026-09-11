import { Quest, QUEST_STATE } from './quest.js';

export class QuestManager {
  constructor(wallet, difficultyConfig) {
    this.wallet = wallet;
    this.difficultyConfig = difficultyConfig;
    this.offeredQuests = [];
    this.activeQuests = [];
    this.researchPoints = 0;
  }

  offerQuest(questParams) {
    const quest = new Quest({
      ...questParams,
      acceptWindow: questParams.acceptWindow ?? this.difficultyConfig.acceptWindowSeconds,
      executionWindow: questParams.executionWindow ?? this.difficultyConfig.executionWindowSeconds,
    });
    this.offeredQuests.push(quest);
    return quest;
  }

  acceptQuest(questId) {
    const quest = this.offeredQuests.find(q => q.id === questId);
    if (!quest || !quest.accept()) return false;
    this.offeredQuests = this.offeredQuests.filter(q => q.id !== questId);
    this.activeQuests.push(quest);
    return true;
  }

  deliverToQuest(questId, type, amount) {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) return 0;
    return quest.deliver(type, amount);
  }

  update(deltaTime) {
    for (const quest of this.offeredQuests) quest.update(deltaTime);
    this.offeredQuests = this.offeredQuests.filter(q => q.state === QUEST_STATE.OFFERED);

    for (const quest of this.activeQuests) quest.update(deltaTime);

    for (const quest of this.activeQuests) {
      if (quest.state === QUEST_STATE.COMPLETED || quest.state === QUEST_STATE.FAILED) {
        this._resolveReward(quest, quest.fulfilledRatio());
      }
    }

    this.activeQuests = this.activeQuests.filter(
      q => q.state !== QUEST_STATE.COMPLETED && q.state !== QUEST_STATE.FAILED
    );
  }

  _resolveReward(quest, ratio) {
    const { allOrNothing, rewardMultiplier, rpOnPartial } = this.difficultyConfig;

    if (allOrNothing && ratio < 1) return;

    const effectiveRatio = allOrNothing ? 1 : ratio;
    this.wallet.add(quest.rewardMoney * effectiveRatio * rewardMultiplier);

    if (ratio >= 1 || rpOnPartial) {
      this.researchPoints += quest.rewardRP * effectiveRatio * rewardMultiplier;
    }
  }
}
