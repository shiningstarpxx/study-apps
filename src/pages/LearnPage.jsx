import { useState, useEffect, useRef, useCallback } from 'react';
import { episodes, getAllScenes } from '../data/episodes';
import { getProgress, markSceneCompleted, updateProgress, updateSRS, updateDailyTask } from '../utils/storage';

export default function LearnPage({ onNavigate }) {
  const savedProgress = getProgress();
  const savedEpisodeIdx = episodes.findIndex(ep => ep.id === savedProgress.currentEpisode);
  const initialEpisodeIdx = savedEpisodeIdx >= 0 ? savedEpisodeIdx : 0;
  const initialSceneIdx = Math.min(
    savedProgress.currentSceneIndex || 0,
    Math.max((episodes[initialEpisodeIdx]?.scenes.length || 1) - 1, 0)
  );

  const [currentEpisodeIdx, setCurrentEpisodeIdx] = useState(initialEpisodeIdx);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(initialSceneIdx);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showKeywords, setShowKeywords] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState(null);
  const [studyMode, setStudyMode] = useState('sequential'); // sequential, random, review
  const dialogueRef = useRef(null);

  const allScenes = getAllScenes();
  const episode = episodes[currentEpisodeIdx];
  const scene = episode?.scenes[currentSceneIdx];

  const progress = getProgress();
  const sceneIsCompleted = progress.completedScenes.includes(scene?.id);

  // 高亮关键词
  const renderHighlightedDialogue = () => {
    if (!scene) return '';
    let text = scene.dialogue;
    const parts = [];
    let lastIndex = 0;

    // 按关键词位置排序
    const sortedKeywords = [...scene.keywords].sort((a, b) => {
      const idxA = text.toLowerCase().indexOf(a.word.toLowerCase());
      const idxB = text.toLowerCase().indexOf(b.word.toLowerCase());
      return idxA - idxB;
    });

    sortedKeywords.forEach(kw => {
      const idx = text.toLowerCase().indexOf(kw.word.toLowerCase(), lastIndex);
      if (idx !== -1) {
        if (idx > lastIndex) {
          parts.push({ text: text.slice(lastIndex, idx), isKeyword: false });
        }
        parts.push({ text: text.slice(idx, idx + kw.word.length), isKeyword: true, keyword: kw });
        lastIndex = idx + kw.word.length;
      }
    });

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), isKeyword: false });
    }

    if (parts.length === 0) {
      parts.push({ text, isKeyword: false });
    }

    return parts.map((part, i) =>
      part.isKeyword ? (
        <span
          key={i}
          className="highlight-word"
          onClick={() => setActiveKeyword(activeKeyword === part.keyword ? null : part.keyword)}
          title={part.keyword.meaning}
        >
          {part.text}
        </span>
      ) : (
        <span key={i}>{part.text}</span>
      )
    );
  };

  const handleComplete = useCallback(() => {
    if (!scene) return;
    markSceneCompleted(scene.id, scene.keywords.length);
    updateDailyTask('new_scenes');

    // 更新 SRS
    scene.keywords.forEach(kw => {
      updateSRS(kw.word, 3);
    });

    setIsCompleted(true);
    setTimeout(() => setIsCompleted(false), 2000);
  }, [scene]);

  const handleNext = useCallback(() => {
    if (studyMode === 'random') {
      const randomEp = Math.floor(Math.random() * episodes.length);
      const randomScene = Math.floor(Math.random() * episodes[randomEp].scenes.length);
      setCurrentEpisodeIdx(randomEp);
      setCurrentSceneIdx(randomScene);
    } else {
      if (currentSceneIdx < episode.scenes.length - 1) {
        setCurrentSceneIdx(currentSceneIdx + 1);
      } else if (currentEpisodeIdx < episodes.length - 1) {
        setCurrentEpisodeIdx(currentEpisodeIdx + 1);
        setCurrentSceneIdx(0);
      }
    }
    setShowTranslation(false);
    setShowKeywords(false);
    setShowGrammar(false);
    setActiveKeyword(null);
  }, [studyMode, currentSceneIdx, currentEpisodeIdx, episode]);

  const handlePrev = useCallback(() => {
    if (currentSceneIdx > 0) {
      setCurrentSceneIdx(currentSceneIdx - 1);
    } else if (currentEpisodeIdx > 0) {
      setCurrentEpisodeIdx(currentEpisodeIdx - 1);
      setCurrentSceneIdx(episodes[currentEpisodeIdx - 1].scenes.length - 1);
    }
    setShowTranslation(false);
    setShowKeywords(false);
    setShowGrammar(false);
    setActiveKeyword(null);
  }, [currentSceneIdx, currentEpisodeIdx]);

  useEffect(() => {
    if (!episode) return;
    updateProgress({
      currentEpisode: episode.id,
      currentSceneIndex: currentSceneIdx,
    });
  }, [episode, currentSceneIdx]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 't') {
        setShowTranslation(v => !v);
      } else if (e.key === 'k') {
        setShowKeywords(v => !v);
      } else if (e.key === 'g') {
        setShowGrammar(v => !v);
      } else if (e.key === 'Enter') {
        handleComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleComplete]);

  if (!scene) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎉</div>
        <div className="empty-text">恭喜！你已学完所有台词</div>
        <button className="btn btn-primary" onClick={() => onNavigate('quiz')}>去做测试 →</button>
      </div>
    );
  }

  const globalIdx = allScenes.findIndex(s => s.id === scene.id);
  const totalScenes = allScenes.length;

  return (
    <div className="page-transition">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>🎬 台词学习</h2>
            <div className="subtitle">
              {episode.id} · {episode.title} · {episode.titleCn} · {episode.contentStatus === 'detailed' ? '精编课程' : '扩展课程'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['sequential', 'random'].map(mode => (
                <button
                  key={mode}
                  className={`btn btn-sm ${studyMode === mode ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setStudyMode(mode)}
                >
                  {mode === 'sequential' ? '顺序' : '随机'}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {globalIdx + 1} / {totalScenes}
            </span>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div className="fill" style={{ width: `${((globalIdx + 1) / totalScenes) * 100}%` }} />
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 860, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">🗺️ 第一季课程导航</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            {episode.teachingGoal}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {episode.learningFocus?.map(focus => (
              <span key={focus} className="tag tag-primary">{focus}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {episodes.map((ep, idx) => {
              const completedScenes = ep.scenes.filter(item => progress.completedScenes.includes(item.id)).length;
              const isActiveEpisode = idx === currentEpisodeIdx;
              return (
                <button
                  key={ep.id}
                  className={`btn btn-sm ${isActiveEpisode ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => {
                    setCurrentEpisodeIdx(idx);
                    setCurrentSceneIdx(0);
                    setShowTranslation(false);
                    setShowKeywords(false);
                    setShowGrammar(false);
                    setActiveKeyword(null);
                  }}
                  title={`${ep.titleCn} · ${completedScenes}/${ep.scenes.length}`}
                >
                  {ep.id} · {completedScenes}/{ep.scenes.length}
                </button>
              );
            })}
          </div>
        </div>

        {/* 台词卡片 */}
        <div className="dialogue-card animate-slide-in" ref={dialogueRef}>
          <div className="character-info">
            <div className="character-avatar">
              {scene.character.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="character-name">{scene.character}</div>
              <div className="character-name-cn">{scene.characterCn}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {sceneIsCompleted && <span className="tag tag-primary">✓ 已学</span>}
              <div className="difficulty-dots">
                {[1, 2, 3, 4, 5].map(d => (
                  <div key={d} className={`difficulty-dot ${d <= scene.difficulty ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </div>

          {/* 场景描述 */}
          <div className="scene-context">
            🎬 {scene.contextCn}
          </div>

          {/* 原文台词（可高亮关键词） */}
          <div className="dialogue-text" style={{ fontSize: '1.3rem', cursor: 'pointer' }}>
            {renderHighlightedDialogue()}
          </div>

          {/* 翻译（可切换显示） */}
          <div
            onClick={() => setShowTranslation(!showTranslation)}
            style={{
              padding: '12px 16px',
              background: showTranslation ? 'transparent' : 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              marginBottom: 16,
              border: '1px dashed var(--border)',
              textAlign: showTranslation ? 'left' : 'center',
              transition: 'all 0.3s ease'
            }}
          >
            {showTranslation ? (
              <div className="dialogue-translation" style={{ margin: 0, fontStyle: 'normal' }}>
                {scene.translation}
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                👆 点击显示中文翻译 (快捷键 T)
              </span>
            )}
          </div>

          {/* 活跃关键词弹窗 */}
          {activeKeyword && (
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-md)',
              padding: 20,
              marginBottom: 16,
              animation: 'fadeInUp 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{activeKeyword.word}</span>
                <span className="keyword-pos">{activeKeyword.partOfSpeech}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{activeKeyword.meaning}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                📝 {activeKeyword.example}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button
              className={`btn ${showKeywords ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setShowKeywords(!showKeywords)}
            >
              📚 词汇 (K)
            </button>
            <button
              className={`btn ${showGrammar ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setShowGrammar(!showGrammar)}
            >
              🔧 语法 (G)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('socratic')}
            >
              🏛️ 苏格拉底
            </button>
            <div style={{ flex: 1 }} />
            {!sceneIsCompleted && (
              <button
                className={`btn ${isCompleted ? 'btn-success' : 'btn-primary'}`}
                onClick={handleComplete}
              >
                {isCompleted ? '✓ 已标记完成!' : '✓ 标记已学 (Enter)'}
              </button>
            )}
          </div>

          {/* 关键词列表 */}
          {showKeywords && (
            <div className="keywords-section animate-fade-in" style={{ marginTop: 20 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
                📚 关键词汇
              </div>
              {scene.keywords.map((kw, i) => (
                <div key={i} className="keyword-item">
                  <div className="keyword-word">{kw.word}</div>
                  <div>
                    <div className="keyword-meaning">{kw.meaning}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                      {kw.example}
                    </div>
                  </div>
                  <div className="keyword-pos">{kw.partOfSpeech}</div>
                </div>
              ))}
            </div>
          )}

          {/* 语法点 */}
          {showGrammar && scene.grammar && (
            <div className="animate-fade-in" style={{
              marginTop: 20,
              padding: 20,
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
                🔧 语法要点
              </div>
              <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 8 }}>
                {scene.grammar.point}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                例句：{scene.grammar.example}
              </div>
            </div>
          )}

          {/* 标签 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
            {scene.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* 导航按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={handlePrev} disabled={currentEpisodeIdx === 0 && currentSceneIdx === 0}>
            ← 上一句
          </button>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            快捷键: ← → 翻页 | T 翻译 | K 词汇 | G 语法 | Enter 完成
          </div>
          <button className="btn btn-primary" onClick={handleNext}>
            下一句 →
          </button>
        </div>

        {/* 本集台词列表 */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title">📋 本集台词列表</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {episode.scenes.map((s, i) => (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSceneIdx(i);
                  setShowTranslation(false);
                  setShowKeywords(false);
                  setShowGrammar(false);
                  setActiveKeyword(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: i === currentSceneIdx ? 'var(--primary-glow)' : 'transparent',
                  border: `1px solid ${i === currentSceneIdx ? 'rgba(201,168,76,0.2)' : 'transparent'}`,
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', fontSize: '0.7rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: progress.completedScenes.includes(s.id)
                    ? 'var(--success)' : i === currentSceneIdx ? 'var(--primary)' : 'var(--bg-elevated)',
                  color: progress.completedScenes.includes(s.id) || i === currentSceneIdx ? 'var(--bg-dark)' : 'var(--text-muted)',
                  fontWeight: 600
                }}>
                  {progress.completedScenes.includes(s.id) ? '✓' : i + 1}
                </span>
                <span style={{
                  fontSize: '0.85rem', flex: 1,
                  color: i === currentSceneIdx ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: i === currentSceneIdx ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {s.character}: {s.dialogue.slice(0, 60)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
