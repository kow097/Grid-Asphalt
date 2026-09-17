import { Quest, QUEST_STATE } from './quest.js';

const RESOURCE_POOL = ['iron', 'copper', 'coal', 'stone', 'oil'];
const SPAWN_INTERVAL = 20;
const MAX_OFFERED_PER_PORT = 2;

export class QuestManager {
  constructor(wallet, difficultyConfig) {
    this.wallet = wallet;
    this.difficultyConfig = difficultyConfig;
    this.offeredQuests = [];
    this.activeQuests = [];
    this.researchPoints = 0;
    this.spawnTimer = SPAWN_INTERVAL;
    this.maxActiveQuests = 2;
  }

  trySpawnQuests(ports, deltaTime) {
    this.spawnTimer += deltaTime;
    if (this.spawnTimer < SPAWN_INTERVAL) return;
    this.spawnTimer = 0;

    for (const port of ports) {
      const offeredForPort = this.offeredQuests.filter(q => q.portId === port.id).length;
      if (offeredForPort >= MAX_OFFERED_PER_PORT) continue;

      const type = RESOURCE_POOL[Math.floor(Math.random() * RESOURCE_POOL.length)];
      const amount = 20 + Math.floor(Math.random() * 80);

      this.offerQuest({
        portId: port.id,
        requirements: [{ type, amount }],
        rewardMoney: amount * 3,
        rewardRP: Math.ceil(amount / 10),
      });
    }
  }

  offerQuest(questParams) {
    const bonus = this.modifiers?.questAcceptWindowBonus ?? 0;
    const quest = new Quest({
      ...questParams,
      acceptWindow: (questParams.acceptWindow ?? this.difficultyConfig.acceptWindowSeconds) + bonus,
      executionWindow: questParams.executionWindow ?? this.difficultyConfig.executionWindowSeconds,
    });
    this.offeredQuests.push(quest);
    return quest;
  }

  acceptQuest(questId) {
    if (this.activeQuests.length >= this.maxActiveQuests) return false;
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
      const bonus = this.modifiers?.researchPointBonusPerQuest ?? 0;
      this.researchPoints += (quest.rewardRP * effectiveRatio * rewardMultiplier) + bonus;
    }
  }
}
