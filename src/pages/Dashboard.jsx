import { episodes, getAllScenes } from '../data/episodes';
import { toDateKey } from '../shared/lib/date/dateUtils';
import { getProgress, getDailyPlan, getStreak, getStatistics, updateStreak } from '../utils/storage';

// 每次渲染时更新连续学习记录
updateStreak();

export default function Dashboard({ onNavigate }) {
  const stats = getStatistics();
  const plan = getDailyPlan();
  const streak = getStreak();

  const allScenes = getAllScenes();
  const completedPct = allScenes.length > 0
    ? Math.round((stats.totalScenes / allScenes.length) * 100)
    : 0;

  // 获取最近30天的学习日历数据
  const getLast30Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toDateKey(d);
      days.push({
        date: dateStr,
        day: d.getDate(),
        isToday: i === 0,
        isActive: streak.history?.includes(dateStr) || false,
      });
    }
    return days;
  };

  const calendarDays = getLast30Days();

  // 今日推荐台词
  const progress = getProgress();
  const nextScene = allScenes.find(s => !progress.completedScenes.includes(s.id));

  return (
    <div className="page-transition">
      <div className="page-header">
        <h2>📺 Billions English</h2>
        <div className="subtitle">跟着《亿万》学地道英语 · 第一季 12 集课程已载入 · 今日已学习 {plan.tasks.reduce((s, t) => s + t.completed, 0)} 项</div>
      </div>

      <div className="page-body">
        {/* 统计概览 */}
        <div className="dashboard-grid">
          <div className="stat-card" onClick={() => onNavigate('learn')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: 'var(--primary-glow)' }}>🎬</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalScenes}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/{allScenes.length}</span></div>
              <div className="stat-label">已学台词</div>
              <div className="progress-bar" style={{ marginTop: 6 }}>
                <div className="fill" style={{ width: `${completedPct}%` }} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>📖</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalWords}</div>
              <div className="stat-label">掌握词汇</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>🔥</div>
            <div className="stat-content">
              <div className="stat-value">{streak.current}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> 天</span></div>
              <div className="stat-label">连续学习 · 最长 {streak.longest} 天</div>
            </div>
          </div>

          <div className="stat-card" onClick={() => onNavigate('review')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: 'var(--info-bg)' }}>🔄</div>
            <div className="stat-content">
              <div className="stat-value">{stats.dueReviews}</div>
              <div className="stat-label">待复习词汇</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* 每日任务 */}
          <div className="card">
            <div className="card-title">📋 今日任务</div>
            <div className="daily-tasks">
              {plan.tasks.map(task => (
                <div
                  key={task.id}
                  className={`task-item ${task.completed >= task.target ? 'completed' : ''}`}
                  onClick={() => {
                    const pageMap = { learn: 'learn', review: 'review', quiz: 'quiz', socratic: 'socratic' };
                    const targetPage = pageMap[task.type];
                    if (targetPage) onNavigate(targetPage);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="task-icon">{task.icon}</span>
                  <div className="task-info">
                    <div className="task-label">{task.label}</div>
                    <div className="task-progress-text">{task.completed}/{task.target} 已完成</div>
                    <div className="progress-bar" style={{ marginTop: 4, height: 4 }}>
                      <div
                        className="fill"
                        style={{ width: `${(task.completed / task.target) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="task-check">
                    {task.completed >= task.target ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 学习日历 */}
          <div className="card">
            <div className="card-title">📅 学习日历</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} style={{ width: 32, textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>
            <div className="streak-calendar" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className={`streak-day ${day.isActive ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
                  title={day.date}
                >
                  {day.day}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)' }} />
                已学习
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, border: '2px solid var(--primary)', background: 'transparent' }} />
                今天
              </div>
            </div>
          </div>
        </div>

        {/* 推荐学习 */}
        {nextScene && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-title">🎯 推荐学习</div>
            <div className="dialogue-card" style={{ margin: 0 }}>
              <div className="character-info">
                <div className="character-avatar">
                  {nextScene.character.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="character-name">{nextScene.character}</div>
                  <div className="character-name-cn">{nextScene.characterCn}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <span className="tag tag-primary">{nextScene.episodeTitle}</span>
                  <div className="difficulty-dots" style={{ marginLeft: 8 }}>
                    {[1, 2, 3, 4, 5].map(d => (
                      <div key={d} className={`difficulty-dot ${d <= nextScene.difficulty ? 'active' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="dialogue-text">{nextScene.dialogue}</div>
              <div className="dialogue-translation">{nextScene.translation}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => onNavigate('learn')}>
                  开始学习 →
                </button>
                <button className="btn btn-secondary" onClick={() => onNavigate('socratic')}>
                  🏛️ 苏格拉底引导
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 剧集进度 */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">📺 剧集学习进度</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {episodes.map(ep => {
              const total = ep.scenes.length;
              const completed = ep.scenes.filter(s => progress.completedScenes.includes(s.id)).length;
              const pct = Math.round((completed / total) * 100);
              return (
                <div key={ep.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '12px 16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', minWidth: 70 }}>{ep.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{ep.title} · {ep.titleCn}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{completed}/{total}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
