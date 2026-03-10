import { useState, useEffect } from 'react';
import { getDueReviews, updateSRS, updateDailyTask } from '../utils/storage';
import { getAllScenes, getAllKeywords } from '../data/episodes';

export default function ReviewPage() {
  const [dueItems] = useState(() => getDueReviews());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, easy: 0, hard: 0 });
  const [isComplete, setIsComplete] = useState(() => getDueReviews().length === 0);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && !showAnswer) {
        event.preventDefault();
        setShowAnswer(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer]);

  const allKeywords = getAllKeywords();
  const allScenes = getAllScenes();

  const currentItem = dueItems[currentIdx];
  const currentKeyword = currentItem ? allKeywords.find(k => k.word === currentItem.id) : null;
  const relatedScene = currentKeyword?.scenes?.[0]
    ? allScenes.find(s => s.id === currentKeyword.scenes[0])
    : null;

  const handleRating = (quality) => {
    if (!currentItem) return;
    updateSRS(currentItem.id, quality);
    updateDailyTask('review');

    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      easy: prev.easy + (quality >= 4 ? 1 : 0),
      hard: prev.hard + (quality < 3 ? 1 : 0),
    }));

    setShowAnswer(false);

    if (currentIdx < dueItems.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsComplete(true);
    }
  };

  // 复习完成
  if (isComplete) {
    return (
      <div className="page-transition">
        <div className="page-header">
          <h2>🔄 间隔复习</h2>
          <div className="subtitle">基于 SM-2 算法的科学记忆系统</div>
        </div>
        <div className="page-body">
          <div className="card result-card" style={{ maxWidth: 500, margin: '0 auto' }}>
            {dueItems.length === 0 ? (
              <>
                <div className="result-emoji">🎉</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>今日复习已完成！</div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                  没有待复习的词汇。继续学习新台词，词汇会自动加入复习队列。
                </div>
                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>复习系统说明</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    当你在台词学习中标记完成后，词汇会自动进入间隔复习系统。系统根据你对每个词汇的掌握程度，
                    在最佳时间点安排复习，符合记忆遗忘曲线规律。
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="result-emoji">✅</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>复习会话完成！</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, margin: '24px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{sessionStats.reviewed}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>已复习</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{sessionStats.easy}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>轻松记住</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--error)' }}>{sessionStats.hard}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>需要加强</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>🔄 间隔复习</h2>
            <div className="subtitle">
              今日待复习 {dueItems.length} 个词汇 · 已完成 {sessionStats.reviewed}
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {currentIdx + 1} / {dueItems.length}
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div className="fill success" style={{ width: `${((currentIdx) / dueItems.length) * 100}%` }} />
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 700, margin: '0 auto' }}>
        {currentKeyword && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            {/* 词汇卡片正面 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: '2.5rem', fontWeight: 800,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', marginBottom: 8
              }}>
                {currentKeyword.word}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {currentKeyword.partOfSpeech}
              </div>
            </div>

            {!showAnswer ? (
              <div>
                <div style={{
                  padding: 20, background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)', marginBottom: 24,
                  border: '2px dashed var(--border)', cursor: 'pointer'
                }}
                  onClick={() => setShowAnswer(true)}
                >
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                    🤔 你还记得这个词的意思吗？
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    点击或按空格键显示答案
                  </div>
                </div>

                {relatedScene && (
                  <div style={{
                    padding: 16, background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)', textAlign: 'left',
                    borderLeft: '3px solid var(--primary)', fontSize: '0.9rem',
                    color: 'var(--text-secondary)', fontStyle: 'italic'
                  }}>
                    💡 来自: {relatedScene.character} - "{relatedScene.dialogue.slice(0, 60)}..."
                  </div>
                )}

                <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={() => setShowAnswer(true)}>
                  显示答案 (空格)
                </button>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div style={{
                  fontSize: '1.3rem', fontWeight: 600,
                  color: 'var(--text-primary)', marginBottom: 12
                }}>
                  {currentKeyword.meaning}
                </div>
                <div style={{
                  padding: 16, background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)', marginBottom: 24,
                  fontSize: '0.9rem', color: 'var(--text-secondary)',
                  fontStyle: 'italic'
                }}>
                  📝 {currentKeyword.example}
                </div>

                {/* 评分按钮 */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  你记住了多少？
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleRating(1)}
                    style={{ flex: 1 }}
                  >
                    😰 完全不记得
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleRating(3)}
                    style={{ flex: 1, borderColor: 'var(--warning)', color: 'var(--warning)' }}
                  >
                    🤔 有点印象
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => handleRating(5)}
                    style={{ flex: 1 }}
                  >
                    😄 完全记住
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  评分会影响下次复习时间 · 越难的词会越快再次出现
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
