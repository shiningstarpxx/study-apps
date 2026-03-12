// 本地存储管理 - 学习进度、间隔重复数据、考试记录等

import { getOffsetDateKey, getTodayDateKey } from '../shared/lib/date/dateUtils';
import { STORAGE_KEYS } from '../shared/lib/storage/storageKeys';

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

export function markSceneCompleted(sceneId, learnedWordCount = 3) {
  const progress = getProgress();
  if (!progress.completedScenes.includes(sceneId)) {
    progress.completedScenes.push(sceneId);
    progress.xp += 20;
    progress.wordsLearned += learnedWordCount;
    progress.level = Math.floor(progress.xp / 100) + 1;
  }
  progress.lastStudyDate = getTodayDateKey();
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
    nextReview: getTodayDateKey(),
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

  item.nextReview = getOffsetDateKey(item.interval);
  item.lastReview = getTodayDateKey();

  srsData[itemId] = item;
  setItem(STORAGE_KEYS.SRS, srsData);
  return item;
}

export function getDueReviews() {
  const srsData = getSRSData();
  const today = getTodayDateKey();
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
  const today = getTodayDateKey();
  if (plan && plan.date === today) {
    return plan;
  }
  // 生成新的每日计划
  return createDailyPlan();
}

export function createDailyPlan() {
  const today = getTodayDateKey();
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
  const today = getTodayDateKey();

  if (streak.lastDate === today) return streak; // 今天已更新

  const yesterdayStr = getOffsetDateKey(-1);

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
  const newEntry = {
    ...session,
    date: new Date().toISOString(),
    id: Date.now().toString(),
  };

  // 如果已经存在相同 sceneId 的记录，可以选择更新或保留多条。这里我们保留最新的。
  const updatedHistory = [newEntry, ...history.filter(s => s.sceneId !== session.sceneId || session.isPartial)].slice(0, 50);

  setItem(STORAGE_KEYS.SOCRATIC_HISTORY, updatedHistory);
  return updatedHistory;
}

// ==================== 错题本系统 (基于记忆曲线) ====================

export function getWrongAnswers() {
  return getItem(STORAGE_KEYS.WRONG_ANSWERS) || {};
}

// 添加错题（提交测验时调用）
export function addWrongAnswers(wrongItems) {
  const data = getWrongAnswers();
  const today = getTodayDateKey();

  wrongItems.forEach(item => {
    const key = `${item.type}__${item.questionKey}`;
    const existing = data[key];

    if (existing) {
      // 已存在 → 重置 SRS（又错了，说明没掌握）
      existing.wrongCount += 1;
      existing.lastWrongDate = today;
      existing.interval = 1;
      existing.repetitions = 0;
      existing.nextReview = today;
    } else {
      data[key] = {
        ...item,
        wrongCount: 1,
        firstWrongDate: today,
        lastWrongDate: today,
        // SRS 调度字段
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReview: today,
        lastReview: null,
        mastered: false,
      };
    }
  });

  setItem(STORAGE_KEYS.WRONG_ANSWERS, data);
  return data;
}

// 获取到期的错题（需要复习的）
export function getDueWrongAnswers() {
  const data = getWrongAnswers();
  const today = getTodayDateKey();
  return Object.entries(data)
    .filter(([, item]) => !item.mastered && item.nextReview <= today)
    .map(([id, item]) => ({ id, ...item }))
    .sort((a, b) => b.wrongCount - a.wrongCount);
}

// 更新错题 SRS（复习后调用）
export function updateWrongAnswerSRS(itemId, quality) {
  const data = getWrongAnswers();
  const item = data[itemId];
  if (!item) return null;

  const today = getTodayDateKey();

  if (quality >= 4) {
    // 答对了
    if (item.repetitions === 0) {
      item.interval = 1;
    } else if (item.repetitions === 1) {
      item.interval = 3;
    } else if (item.repetitions === 2) {
      item.interval = 7;
    } else {
      item.interval = Math.round(item.interval * item.easeFactor);
    }
    item.repetitions += 1;

    // 连续正确 >= 4 次 → 标记为已掌握
    if (item.repetitions >= 4) {
      item.mastered = true;
    }
  } else {
    // 又答错了 → 重置
    item.repetitions = 0;
    item.interval = 1;
    item.wrongCount += 1;
    item.lastWrongDate = today;
  }

  item.easeFactor = Math.max(1.3,
    item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  item.nextReview = getOffsetDateKey(item.interval);
  item.lastReview = today;

  data[itemId] = item;
  setItem(STORAGE_KEYS.WRONG_ANSWERS, data);
  return item;
}

// 错题统计
export function getWrongAnswerStats() {
  const data = getWrongAnswers();
  const entries = Object.values(data);
  const today = getTodayDateKey();
  const due = entries.filter(e => !e.mastered && e.nextReview <= today);
  const mastered = entries.filter(e => e.mastered);
  const active = entries.filter(e => !e.mastered);

  // 按题型分组统计
  const byType = {};
  active.forEach(e => {
    byType[e.type] = (byType[e.type] || 0) + 1;
  });

  return {
    total: entries.length,
    active: active.length,
    mastered: mastered.length,
    dueCount: due.length,
    byType,
  };
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
