import { useState, useEffect } from 'react';
import { getProgress, getStreak, getDueReviews } from '../utils/storage';

const navItems = [
  { id: 'dashboard', label: '学习首页', icon: '🏠', section: 'main' },
  { id: 'learn', label: '台词学习', icon: '🎬', section: 'main' },
  { id: 'review', label: '间隔复习', icon: '🔄', section: 'main', badgeKey: 'dueReviews' },
  { id: 'quiz', label: '考试测验', icon: '📝', section: 'practice' },
  { id: 'socratic', label: '苏格拉底', icon: '🏛️', section: 'practice' },
  { id: 'vocabulary', label: '词汇本', icon: '📚', section: 'tools' },
  { id: 'stats', label: '学习统计', icon: '📊', section: 'tools' },
];

const sections = {
  main: '学习',
  practice: '练习',
  tools: '工具',
};

export default function Sidebar({ currentPage, onNavigate, isOpen }) {
  const [progress, setProgress] = useState(getProgress());
  const [streak, setStreak] = useState(getStreak());
  const [dueCount, setDueCount] = useState(getDueReviews().length);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(getProgress());
      setStreak(getStreak());
      setDueCount(getDueReviews().length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const grouped = {};
  navItems.forEach(item => {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  });

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">B</div>
        <div>
          <h1>Billions English</h1>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>亿万美剧学英语</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(grouped).map(([section, items]) => (
          <div className="nav-section" key={section}>
            <div className="nav-section-title">{sections[section]}</div>
            {items.map(item => (
              <div
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badgeKey === 'dueReviews' && dueCount > 0 && (
                  <span className="nav-badge">{dueCount}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-stats-mini">
          <div className="stat">
            <div className="stat-value">{streak.current}</div>
            <div className="stat-label">连续天数</div>
          </div>
          <div className="stat">
            <div className="stat-value">Lv.{progress.level}</div>
            <div className="stat-label">等级</div>
          </div>
          <div className="stat">
            <div className="stat-value">{progress.xp}</div>
            <div className="stat-label">XP</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
