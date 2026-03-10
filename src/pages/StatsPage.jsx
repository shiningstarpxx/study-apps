import { getStatistics, getQuizHistory, getStreak, getProgress } from '../utils/storage';
import { getAllScenes, episodes } from '../data/episodes';

export default function StatsPage() {
  const stats = getStatistics();
  const quizHistory = getQuizHistory();
  const streak = getStreak();
  const progress = getProgress();

  const allScenes = getAllScenes();
  const totalPct = allScenes.length > 0 ? Math.round((stats.totalScenes / allScenes.length) * 100) : 0;

  const currentLevelXP = (stats.level - 1) * 100;
  const nextLevelXP = stats.level * 100;
  const levelProgress = ((stats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const recentQuizzes = quizHistory.slice(-10).reverse();

  return (
    <div className="page-transition">
      <div className="page-header">
        <h2>📊 学习统计</h2>
        <div className="subtitle">追踪你的学习进度和成就</div>
      </div>

      <div className="page-body">
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-glow)' }}>⭐</div>
            <div className="stat-content">
              <div className="stat-value">Lv.{stats.level}</div>
              <div className="stat-label">当前等级</div>
              <div className="progress-bar" style={{ marginTop: 6 }}>
                <div className="fill" style={{ width: `${levelProgress}%` }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {stats.xp} / {nextLevelXP} XP
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>🎬</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalScenes}</div>
              <div className="stat-label">已学台词</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--info-bg)' }}>📖</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalWords}</div>
              <div className="stat-label">掌握词汇</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>🔥</div>
            <div className="stat-content">
              <div className="stat-value">{streak.current} 天</div>
              <div className="stat-label">当前连续 · 最长 {streak.longest} 天</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--error-bg)' }}>📝</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalQuizzes}</div>
              <div className="stat-label">完成测验</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(155, 89, 182, 0.1)' }}>📈</div>
            <div className="stat-content">
              <div className="stat-value">{stats.avgQuizScore}%</div>
              <div className="stat-label">平均测验分数</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 4 }}>
          <div className="card">
            <div className="card-title">📈 总体学习进度</div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 140, height: 140, borderRadius: '50%',
                border: '8px solid var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
                background: `conic-gradient(var(--primary) ${totalPct * 3.6}deg, var(--bg-elevated) 0deg)`
              }}>
                <div style={{
                  width: 112, height: 112, borderRadius: '50%',
                  background: 'var(--bg-card)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{totalPct}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>总进度</div>
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 32 }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.totalScenes}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>已学 / {allScenes.length} 总计</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{allScenes.length - stats.totalScenes}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>剩余台词</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">📝 近期测验</div>
            {recentQuizzes.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: '0.9rem' }}>还没有测验记录</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>完成测验后会在这里显示</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentQuizzes.map((quiz, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>{quiz.grade?.emoji || '📝'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {quiz.grade?.letter} · {quiz.questionCount} 题
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(quiz.date).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.1rem', fontWeight: 700,
                      color: quiz.score >= 80 ? 'var(--success)' : quiz.score >= 60 ? 'var(--warning)' : 'var(--error)'
                    }}>
                      {quiz.score}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">📺 各集学习详情</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {episodes.map(ep => {
              const total = ep.scenes.length;
              const completed = ep.scenes.filter(s => progress.completedScenes.includes(s.id)).length;
              const pct = Math.round((completed / total) * 100);
              return (
                <div key={ep.id} style={{
                  padding: 16, background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{ep.id}</span>
                      <span style={{ marginLeft: 8 }}>{ep.title}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 8 }}>
                    <div className="fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{completed}/{total} 台词</span>
                    <span>{ep.scenes.reduce((sum, s) => sum + s.keywords.length, 0)} 个词汇</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">💡 学习方法论</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {[
              { icon: '🔄', title: '间隔重复 (SRS)', desc: '基于 SM-2 算法，在最佳时机复习，记忆效率提升 3 倍' },
              { icon: '🏛️', title: '苏格拉底式教学', desc: '通过引导式提问激活深度思考，理解而非死记' },
              { icon: '🎬', title: '情境学习', desc: '真实美剧场景提供自然语境，学以致用' },
              { icon: '🧠', title: 'i+1 理论', desc: '略高于当前水平的输入，最优学习区间' },
              { icon: '🎯', title: '主动回忆', desc: '测试驱动学习，主动检索比被动阅读有效 40%' },
              { icon: '🎭', title: '多维度学习', desc: '词汇、语法、语境、文化四维一体' },
            ].map((method, i) => (
              <div key={i} style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{method.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{method.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{method.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
