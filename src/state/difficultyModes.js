export const DIFFICULTY_MODES = {
  EASY: {
    id: 'easy',
    acceptWindowSeconds: 180,
    executionWindowSeconds: 900,
    allOrNothing: false,
    rpOnPartial: true,
    rewardMultiplier: 1.0,
  },
  NORMAL: {
    id: 'normal',
    acceptWindowSeconds: 90,
    executionWindowSeconds: 600,
    allOrNothing: false,
    rpOnPartial: false,
    rewardMultiplier: 1.5,
  },
  HARD: {
    id: 'hard',
    acceptWindowSeconds: 45,
    executionWindowSeconds: 300,
    allOrNothing: true,
    rpOnPartial: false,
    rewardMultiplier: 2.5,
  },
};
