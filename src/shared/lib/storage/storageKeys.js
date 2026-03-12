export const STORAGE_KEYS = Object.freeze({
  PROGRESS: 'billions_english_progress',
  SRS: 'billions_english_srs',
  QUIZ_HISTORY: 'billions_english_quiz_history',
  DAILY_PLAN: 'billions_english_daily_plan',
  SETTINGS: 'billions_english_settings',
  STREAK: 'billions_english_streak',
  SOCRATIC_HISTORY: 'billions_english_socratic',
  WRONG_ANSWERS: 'billions_english_wrong_answers',
  AI_BRIDGE_SETTINGS: 'AI_BRIDGE_SETTINGS',
});

export const STORAGE_KEY_REGISTRY = Object.freeze([
  { name: 'PROGRESS', key: STORAGE_KEYS.PROGRESS, domain: 'learning', repository: 'progressRepository' },
  { name: 'SRS', key: STORAGE_KEYS.SRS, domain: 'review', repository: 'reviewRepository' },
  { name: 'QUIZ_HISTORY', key: STORAGE_KEYS.QUIZ_HISTORY, domain: 'quiz', repository: 'quizRepository' },
  { name: 'DAILY_PLAN', key: STORAGE_KEYS.DAILY_PLAN, domain: 'learning', repository: 'dailyPlanRepository' },
  { name: 'SETTINGS', key: STORAGE_KEYS.SETTINGS, domain: 'settings', repository: 'settingsRepository' },
  { name: 'STREAK', key: STORAGE_KEYS.STREAK, domain: 'stats', repository: 'streakRepository' },
  { name: 'SOCRATIC_HISTORY', key: STORAGE_KEYS.SOCRATIC_HISTORY, domain: 'socratic', repository: 'socraticRepository' },
  { name: 'WRONG_ANSWERS', key: STORAGE_KEYS.WRONG_ANSWERS, domain: 'quiz', repository: 'wrongAnswerRepository' },
  { name: 'AI_BRIDGE_SETTINGS', key: STORAGE_KEYS.AI_BRIDGE_SETTINGS, domain: 'settings', repository: 'bridgeSettingsRepository' },
]);
