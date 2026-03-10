// 本地存储管理 - 学习进度、间隔重复数据、考试记录等

const STORAGE_KEYS = {
  PROGRESS: 'billions_english_progress',
  SRS: 'billions_english_srs',
  QUIZ_HISTORY: 'billions_english_quiz_history',
  DAILY_PLAN: 'billions_english_daily_plan',
  SETTINGS: 'billions_english_settings',
  STREAK: 'billions_english_streak',
  SOCRATIC_HISTORY: 'billions_english_socratic',
};

// ==================== 通用存储操作 ====================

function getItem(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ==================== 学习进度 ====================

export function getProgress() {
  return getItem(STORAGE_KEYS.PROGRESS) || {
    completedScenes: [],      // 已完成的台词ID列表
    currentEpisode: 'S01E01', // 当前学习的集
    currentSceneIndex: 0,     // 当前台词索引
    totalStudyTime: 0,        // 总学习时间（分钟）
    wordsLearned: 0,          // 学过的单词数
    level: 1,                 // 用户等级
    xp: 0,                    // 经验值
    lastStudyDate: null,      // 上次学习日期
  };
}

export function updateProgress(updates) {
  const current = getProgress();
  const updated = { ...current, ...updates };
  setItem(STORAGE_KEYS.PROGRESS, updated);
  return updated;
}

export function markSceneCompleted(sceneId) {
  const progress = getProgress();
  if (!progress.completedScenes.includes(sceneId)) {
    progress.completedScenes.push(sceneId);
    progress.xp += 20;
    progress.wordsLearned += 3; // 平均每场景3个词
    progress.level = Math.floor(progress.xp / 100) + 1;
  }
  progress.lastStudyDate = new Date().toISOString().split('T')[0];
  setItem(STORAGE_KEYS.PROGRESS, progress);
  return progress;
}

// ==================== 间隔重复系统 (SRS) ====================

// 基于SM-2算法的简化版本
export function getSRSData() {
  return getItem(STORAGE_KEYS.SRS) || {};
}

export function updateSRS(itemId, quality) {
  // quality: 0-5 (0=完全不记得, 5=完美记住)
  const srsData = getSRSData();
  const item = srsData[itemId] || {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: new Date().toISOString().split('T')[0],
    lastReview: null,
  };

  if (quality >= 3) {
    if (item.repetitions === 0) {
      item.interval = 1;
    } else if (item.repetitions === 1) {
      item.interval = 6;
    } else {
      item.interval = Math.round(item.interval * item.easeFactor);
    }
    item.repetitions += 1;
  } else {
    item.repetitions = 0;
    item.interval = 1;
  }

  item.easeFactor = Math.max(1.3,
    item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + item.interval);
  item.nextReview = nextDate.toISOString().split('T')[0];
  item.lastReview = new Date().toISOString().split('T')[0];

  srsData[itemId] = item;
  setItem(STORAGE_KEYS.SRS, srsData);
  return item;
}

export function getDueReviews() {
  const srsData = getSRSData();
  const today = new Date().toISOString().split('T')[0];
  return Object.entries(srsData)
    .filter(([, item]) => item.nextReview <= today)
    .map(([id, item]) => ({ id, ...item }));
}

// ==================== 考试记录 ====================

export function getQuizHistory() {
  return getItem(STORAGE_KEYS.QUIZ_HISTORY) || [];
}

export function addQuizResult(result) {
  const history = getQuizHistory();
  history.push({
    ...result,
    date: new Date().toISOString(),
    id: Date.now().toString(),
  });
  setItem(STORAGE_KEYS.QUIZ_HISTORY, history);
  return history;
}

// ==================== 每日计划 ====================

export function getDailyPlan() {
  const plan = getItem(STORAGE_KEYS.DAILY_PLAN);
  const today = new Date().toISOString().split('T')[0];
  if (plan && plan.date === today) {
    return plan;
  }
  // 生成新的每日计划
  return createDailyPlan();
}

export function createDailyPlan() {
  const today = new Date().toISOString().split('T')[0];
  const dueReviews = getDueReviews();
  const plan = {
    date: today,
    tasks: [
      { id: 'new_scenes', type: 'learn', label: '学习新台词', target: 3, completed: 0, icon: '📖' },
      { id: 'review', type: 'review', label: '复习旧词汇', target: Math.min(dueReviews.length, 10), completed: 0, icon: '🔄' },
      { id: 'quiz', type: 'quiz', label: '完成测验', target: 1, completed: 0, icon: '📝' },
      { id: 'socratic', type: 'socratic', label: '苏格拉底对话', target: 1, completed: 0, icon: '💬' },
    ],
    totalXP: 0,
  };
  setItem(STORAGE_KEYS.DAILY_PLAN, plan);
  return plan;
}

export function updateDailyTask(taskId, increment = 1) {
  const plan = getDailyPlan();
  const task = plan.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = Math.min(task.completed + increment, task.target);
  }
  plan.totalXP = plan.tasks.reduce((sum, t) => sum + (t.completed * 10), 0);
  setItem(STORAGE_KEYS.DAILY_PLAN, plan);
  return plan;
}

// ==================== 学习连续天数 ====================

export function getStreak() {
  const streak = getItem(STORAGE_KEYS.STREAK) || {
    current: 0,
    longest: 0,
    lastDate: null,
    history: [] // 最近30天的学习记录
  };
  return streak;
}

export function updateStreak() {
  const streak = getStreak();
  const today = new Date().toISOString().split('T')[0];

  if (streak.lastDate === today) return streak; // 今天已更新

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (streak.lastDate === yesterdayStr) {
    streak.current += 1;
  } else if (streak.lastDate !== today) {
    streak.current = 1;
  }

  streak.longest = Math.max(streak.longest, streak.current);
  streak.lastDate = today;

  // 记录到历史
  if (!streak.history.includes(today)) {
    streak.history.push(today);
    // 只保留最近30天
    if (streak.history.length > 30) {
      streak.history = streak.history.slice(-30);
    }
  }

  setItem(STORAGE_KEYS.STREAK, streak);
  return streak;
}

// ==================== 苏格拉底对话记录 ====================

export function getSocraticHistory() {
  return getItem(STORAGE_KEYS.SOCRATIC_HISTORY) || [];
}

export function addSocraticSession(session) {
  const history = getSocraticHistory();
  history.push({
    ...session,
    date: new Date().toISOString(),
    id: Date.now().toString(),
  });
  // 只保留最近50条
  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }
  setItem(STORAGE_KEYS.SOCRATIC_HISTORY, history);
  return history;
}

// ==================== 设置 ====================

export function getSettings() {
  return getItem(STORAGE_KEYS.SETTINGS) || {
    dailyGoal: 15, // 每日目标（分钟）
    showTranslation: true,
    autoPlayAudio: false,
    theme: 'dark',
    fontSize: 'medium',
    notificationsEnabled: true,
  };
}

export function updateSettings(updates) {
  const current = getSettings();
  const updated = { ...current, ...updates };
  setItem(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

// ==================== 统计数据 ====================

export function getStatistics() {
  const progress = getProgress();
  const streak = getStreak();
  const quizHistory = getQuizHistory();
  const srsData = getSRSData();

  const recentQuizzes = quizHistory.slice(-10);
  const avgScore = recentQuizzes.length > 0
    ? Math.round(recentQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / recentQuizzes.length)
    : 0;

  return {
    totalScenes: progress.completedScenes.length,
    totalWords: progress.wordsLearned,
    totalStudyTime: progress.totalStudyTime,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    level: progress.level,
    xp: progress.xp,
    avgQuizScore: avgScore,
    totalQuizzes: quizHistory.length,
    srsItems: Object.keys(srsData).length,
    dueReviews: getDueReviews().length,
  };
}
