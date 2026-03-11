import { useState } from 'react';
import { generateQuiz, gradeQuiz, generateWrongAnswerQuiz, QUIZ_TYPES } from '../utils/quizGenerator';
import { addQuizResult, updateProgress, getProgress, updateDailyTask, addWrongAnswers, getDueWrongAnswers, updateWrongAnswerSRS, getWrongAnswerStats } from '../utils/storage';

const typeLabels = {
  [QUIZ_TYPES.VOCABULARY_CHOICE]: { label: '词汇选择', icon: '📖' },
  [QUIZ_TYPES.FILL_IN_BLANK]: { label: '填空题', icon: '✏️' },
  [QUIZ_TYPES.TRANSLATION]: { label: '翻译题', icon: '🌐' },
  [QUIZ_TYPES.SCENE_CONTEXT]: { label: '场景理解', icon: '🎬' },
  [QUIZ_TYPES.WORD_MATCHING]: { label: '词汇配对', icon: '🔗' },
  [QUIZ_TYPES.GRAMMAR_CHOICE]: { label: '语法选择', icon: '🔧' },
};

// 为错误题目生成改进建议
function getImprovementTip(question, userAnswer) {
  switch (question.type) {
    case QUIZ_TYPES.VOCABULARY_CHOICE:
      return `💡 记忆技巧：将 "${question.options?.find(o => o === question.correctAnswer) || question.correctAnswer}" 和原句 "${(question.context || '').slice(0, 40)}..." 绑定记忆。下次遇到这个语境时，回忆这句台词。`;
    case QUIZ_TYPES.FILL_IN_BLANK:
      return `💡 你填了 "${userAnswer || '（空）'}"，正确答案是 "${question.correctAnswer}"（${question.hint}）。建议把这个词放回原句里默读三遍，感受它在句中的位置和语感。`;
    case QUIZ_TYPES.TRANSLATION:
      return `💡 翻译题的关键不是逐字对应，而是抓住核心关键词：${(question.keywords || []).join('、')}。试着用这些关键词重新组织你的翻译。`;
    case QUIZ_TYPES.GRAMMAR_CHOICE:
      return `💡 语法模式：${question.grammarPoint || ''}。建议用这个句型自己造一个新句子，加深对结构的理解。`;
    case QUIZ_TYPES.WORD_MATCHING:
      return `💡 配对题考察的是词义快速回忆。建议对错误的词汇，用"词 → 造句 → 中文"的方式加强关联。`;
    case QUIZ_TYPES.SCENE_CONTEXT:
      return `💡 场景理解需要结合角色意图和表达方式。重新阅读台词，思考：说话人想达成什么目的？用了什么语言策略？`;
    default:
      return `💡 建议回到原句反复阅读，关注词汇用法和句式结构。`;
  }
}

export default function QuizPage() {
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [expandedResult, setExpandedResult] = useState(null); // 展开的题目索引
  const [resultTab, setResultTab] = useState('wrong'); // 'wrong' | 'all'
  const [quizConfig, setQuizConfig] = useState({
    questionCount: 8,
    difficulty: null,
  });

  const startQuiz = () => {
    try {
      const newQuiz = generateQuiz(quizConfig);
      if (!newQuiz || !newQuiz.questions || newQuiz.questions.length === 0) {
        alert('题目生成失败，请调整设置后重试。');
        return;
      }
      setQuiz(newQuiz);
      setCurrentQ(0);
      setAnswers({});
      setShowResult(false);
      setResult(null);
      setShowExplanation(false);
    } catch {
      alert('测验生成出错，请重试。');
    }
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentQ]: answer }));
  };

  const handleNext = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setShowExplanation(false);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setShowExplanation(false);
    }
  };

  const handleSubmit = () => {
    const graded = gradeQuiz(quiz, answers);
    setResult(graded);
    setShowResult(true);
    setExpandedResult(null);
    setResultTab('wrong');

    addQuizResult({
      quizId: quiz.id,
      score: graded.percentage,
      totalScore: graded.totalScore,
      maxScore: graded.maxScore,
      questionCount: quiz.questions.length,
      grade: graded.grade,
    });
    updateDailyTask('quiz');

    // 加 XP
    const progress = getProgress();
    updateProgress({ xp: progress.xp + Math.round(graded.percentage / 10) });

    // 收集错题到错题本
    const wrongItems = [];
    graded.results.forEach((r, i) => {
      const q = quiz.questions[i];
      if (!r.correct) {
        wrongItems.push({
          type: q.type,
          questionKey: q.sceneId ? `${q.sceneId}_${q.type}` : `gen_${q.index}_${q.type}`,
          sceneId: q.sceneId || null,
          questionCn: q.questionCn,
          correctAnswer: r.correctAnswer,
          userAnswer: r.userAnswer,
          explanation: q.explanationCn || q.explanation || '',
          context: q.context || '',
          difficulty: q.difficulty || 2,
        });
      }
      // 如果是错题复习 quiz，更新错题 SRS
      if (q.wrongAnswerId) {
        updateWrongAnswerSRS(q.wrongAnswerId, r.correct ? 5 : 1);
      }
    });

    if (wrongItems.length > 0) {
      addWrongAnswers(wrongItems);
    }
  };

  // 启动错题复习测验
  const startWrongAnswerReview = () => {
    const dueItems = getDueWrongAnswers();
    if (dueItems.length === 0) {
      alert('暂无到期错题需要复习！');
      return;
    }
    try {
      const reviewQuiz = generateWrongAnswerQuiz(dueItems, 8);
      if (!reviewQuiz || !reviewQuiz.questions || reviewQuiz.questions.length === 0) {
        alert('错题复习 Quiz 生成失败，请稍后重试。');
        return;
      }
      setQuiz(reviewQuiz);
      setCurrentQ(0);
      setAnswers({});
      setShowResult(false);
      setResult(null);
      setShowExplanation(false);
      setExpandedResult(null);
    } catch {
      alert('错题复习生成出错。');
    }
  };

  // 考试配置界面
  if (!quiz) {
    const wrongStats = getWrongAnswerStats();
    const dueWrongCount = wrongStats.dueCount;

    return (
      <div className="page-transition">
        <div className="page-header">
          <h2>📝 考试测验</h2>
          <div className="subtitle">测试你的学习成果 · 支持多种题型 · 错题智能复训</div>
        </div>
        <div className="page-body">
          {/* 错题复习入口 */}
          {wrongStats.total > 0 && (
            <div className="card" style={{ maxWidth: 600, margin: '0 auto 20px', border: dueWrongCount > 0 ? '1px solid var(--warning)' : '1px solid var(--border)' }}>
              <div className="card-title">📋 错题本</div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--error)' }}>{wrongStats.active}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>待攻克</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)' }}>{dueWrongCount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>今日到期</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{wrongStats.mastered}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>已掌握</div>
                </div>
              </div>
              {Object.keys(wrongStats.byType).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {Object.entries(wrongStats.byType).map(([type, count]) => (
                    <span key={type} className="tag" style={{ fontSize: '0.7rem' }}>
                      {typeLabels[type]?.icon} {typeLabels[type]?.label}: {count}
                    </span>
                  ))}
                </div>
              )}
              <button
                className="btn btn-primary btn-lg"
                onClick={startWrongAnswerReview}
                disabled={dueWrongCount === 0}
                style={{ width: '100%', opacity: dueWrongCount === 0 ? 0.5 : 1 }}
              >
                {dueWrongCount > 0 ? `🔄 开始错题复习（${dueWrongCount} 题到期）` : '✅ 暂无到期错题'}
              </button>
              {dueWrongCount === 0 && wrongStats.active > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                  还有 {wrongStats.active} 道错题未掌握，系统会按记忆曲线安排复习时间
                </div>
              )}
            </div>
          )}

          <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="card-title">⚙️ 新测验设置</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                  题目数量
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[5, 8, 10, 15].map(n => (
                    <button
                      key={n}
                      className={`btn ${quizConfig.questionCount === n ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setQuizConfig(c => ({ ...c, questionCount: n }))}
                    >
                      {n} 题
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                  难度限制
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`btn ${!quizConfig.difficulty ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setQuizConfig(c => ({ ...c, difficulty: null }))}
                  >
                    全部
                  </button>
                  {[2, 3, 4, 5].map(d => (
                    <button
                      key={d}
                      className={`btn ${quizConfig.difficulty === d ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setQuizConfig(c => ({ ...c, difficulty: d }))}
                    >
                      ≤ {d}级
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>📋 题型包含</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(typeLabels).map(([type, { label, icon }]) => (
                    <span key={type} className="tag">{icon} {label}</span>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-lg" onClick={startQuiz} style={{ width: '100%' }}>
                🚀 开始测验
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 结果页面
  if (showResult && result) {
    const wrongResults = result.results.filter(r => !r.correct);
    const correctResults = result.results.filter(r => r.correct);
    const displayResults = resultTab === 'wrong' ? wrongResults : result.results;

    return (
      <div className="page-transition">
        <div className="page-header">
          <h2>📝 {quiz.isReviewQuiz ? '错题复习结果' : '测验结果'}</h2>
        </div>
        <div className="page-body">
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* 总体得分 */}
            <div className="card result-card" style={{ marginBottom: 20 }}>
              <div className="result-emoji">{result.grade.emoji}</div>
              <div className="result-score">{result.percentage}%</div>
              <div className="result-grade">{result.grade.letter} · {result.grade.label}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                {result.totalScore} / {result.maxScore} 分
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    {correctResults.length}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>正确</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>
                    {wrongResults.length}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>错误</div>
                </div>
              </div>

              {wrongResults.length > 0 && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(231,76,94,0.2)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--error)', fontWeight: 600 }}>
                    📋 {wrongResults.length} 道错题已自动加入错题本，系统会按记忆曲线安排复习
                  </div>
                </div>
              )}
            </div>

            {/* 薄弱点分析 */}
            {wrongResults.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">🎯 薄弱点分析</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {(() => {
                    const typeCount = {};
                    wrongResults.forEach(r => {
                      typeCount[r.type] = (typeCount[r.type] || 0) + 1;
                    });
                    return Object.entries(typeCount)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <span key={type} className="tag" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid rgba(231,76,94,0.2)' }}>
                          {typeLabels[type]?.icon} {typeLabels[type]?.label} ×{count}
                        </span>
                      ));
                  })()}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {wrongResults.length >= 3 && '错误较多，建议回到台词学习页重新复习相关场景，再来测验。'}
                  {wrongResults.length >= 1 && wrongResults.length < 3 && '少量错误，已记入错题本。系统会在最佳时间点安排你重新练习。'}
                </div>
              </div>
            )}

            {/* 逐题分析 Tab */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => setResultTab('wrong')}
                  style={{
                    padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                    fontWeight: resultTab === 'wrong' ? 700 : 400, fontSize: '0.9rem',
                    color: resultTab === 'wrong' ? 'var(--error)' : 'var(--text-muted)',
                    borderBottom: resultTab === 'wrong' ? '2px solid var(--error)' : '2px solid transparent',
                  }}
                >
                  ❌ 错题分析 ({wrongResults.length})
                </button>
                <button
                  onClick={() => setResultTab('all')}
                  style={{
                    padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                    fontWeight: resultTab === 'all' ? 700 : 400, fontSize: '0.9rem',
                    color: resultTab === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: resultTab === 'all' ? '2px solid var(--primary)' : '2px solid transparent',
                  }}
                >
                  📊 全部题目 ({result.results.length})
                </button>
              </div>

              {displayResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
                  <div>全部正确，太棒了！</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {displayResults.map((r) => {
                    const q = quiz.questions[r.questionIndex];
                    const isExpanded = expandedResult === r.questionIndex;

                    return (
                      <div key={r.questionIndex} style={{
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${r.correct ? 'rgba(78,203,113,0.2)' : 'rgba(231,76,94,0.2)'}`,
                        overflow: 'hidden',
                      }}>
                        {/* 折叠头部 */}
                        <div
                          onClick={() => setExpandedResult(isExpanded ? null : r.questionIndex)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 16px', cursor: 'pointer',
                            background: r.correct ? 'var(--success-bg)' : 'var(--error-bg)',
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>{r.correct ? '✅' : '❌'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                              {typeLabels[r.type]?.icon} 第 {r.questionIndex + 1} 题 · {typeLabels[r.type]?.label}
                            </div>
                            {!r.correct && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                点击展开查看详细分析
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {r.earned}/{r.maxPoints}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                            ▼
                          </span>
                        </div>

                        {/* 展开详情 */}
                        {isExpanded && q && (
                          <div style={{ padding: 16, background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                            {/* 题目 */}
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>
                              {q.questionCn}
                            </div>

                            {/* 原文语境 */}
                            {q.context && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)', marginBottom: 12, fontStyle: 'italic' }}>
                                {q.character && <span style={{ fontWeight: 600 }}>{q.character}: </span>}
                                {q.context}
                              </div>
                            )}

                            {/* 你的回答 vs 正确答案 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: r.correct ? 'var(--success-bg)' : 'var(--error-bg)', border: `1px solid ${r.correct ? 'rgba(78,203,113,0.3)' : 'rgba(231,76,94,0.3)'}` }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>你的回答</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                  {r.userAnswer
                                    ? (Array.isArray(r.userAnswer) ? r.userAnswer.filter(Boolean).join(' → ') : String(r.userAnswer).slice(0, 80))
                                    : '（未作答）'}
                                </div>
                              </div>
                              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', border: '1px solid rgba(78,203,113,0.3)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>正确答案</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--success)' }}>
                                  {r.correctAnswer
                                    ? (typeof r.correctAnswer === 'string' ? r.correctAnswer.slice(0, 80) : JSON.stringify(r.correctAnswer))
                                    : '（开放题）'}
                                </div>
                              </div>
                            </div>

                            {/* 解析 */}
                            {(q.explanationCn || q.explanation) && (
                              <div style={{ padding: '10px 14px', background: 'var(--info-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(91,155,245,0.2)', marginBottom: 12 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--info)', marginBottom: 4 }}>💡 解析</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                  {q.explanationCn || q.explanation}
                                </div>
                              </div>
                            )}

                            {/* 改进建议（仅错题） */}
                            {!r.correct && (
                              <div style={{ padding: '10px 14px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(243,156,18,0.2)' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--warning)', marginBottom: 4 }}>🎯 改进建议</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                  {getImprovementTip(q, r.userAnswer)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {wrongResults.length > 0 && (
                <button className="btn btn-primary" onClick={startWrongAnswerReview}>
                  🔄 立即复习错题
                </button>
              )}
              <button className="btn btn-secondary" onClick={startQuiz}>
                📝 再测一次
              </button>
              <button className="btn btn-secondary" onClick={() => setQuiz(null)}>
                返回设置
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 答题界面
  const question = quiz.questions[currentQ];
  const answered = answers[currentQ] !== undefined;
  const isLastQ = currentQ === quiz.questions.length - 1;
  const allAnswered = Object.keys(answers).length === quiz.questions.length;

  return (
    <div className="page-transition">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>📝 测验进行中</h2>
            <div className="subtitle">第 {currentQ + 1} / {quiz.questions.length} 题</div>
          </div>
          <div className="quiz-progress">
            <span>{Object.keys(answers).length}/{quiz.questions.length} 已答</span>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div className="fill" style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
        </div>
        {/* 题号导航 */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentQ(i); setShowExplanation(false); }}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                border: i === currentQ ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: answers[i] !== undefined ? 'var(--primary-glow)' : 'var(--bg-elevated)',
                color: i === currentQ ? 'var(--primary)' : answers[i] !== undefined ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        <div className="quiz-container">
          <div className="question-card">
            <div className="question-type-badge">
              {typeLabels[question.type]?.icon} {typeLabels[question.type]?.label}
              <span style={{ marginLeft: 8, opacity: 0.7 }}>{question.points} 分</span>
            </div>

            <div className="question-text">{question.questionCn}</div>

            {question.context && (
              <div className="question-context">
                {question.character && <span style={{ fontWeight: 600 }}>{question.character}: </span>}
                {question.context}
              </div>
            )}

            {/* 选择题 */}
            {(question.type === QUIZ_TYPES.VOCABULARY_CHOICE ||
              question.type === QUIZ_TYPES.GRAMMAR_CHOICE) && (
              <div className="options-list">
                {question.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`option-item ${answers[currentQ] === opt ? 'selected' : ''} ${
                      showExplanation && opt === question.correctAnswer ? 'correct' : ''
                    } ${
                      showExplanation && answers[currentQ] === opt && opt !== question.correctAnswer ? 'incorrect' : ''
                    }`}
                    onClick={() => !showExplanation && handleAnswer(opt)}
                  >
                    <div className="option-marker">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 填空题 */}
            {question.type === QUIZ_TYPES.FILL_IN_BLANK && (
              <div>
                <div style={{ marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  💡 提示: {question.hint}
                </div>
                <input
                  type="text"
                  value={answers[currentQ] || ''}
                  onChange={e => handleAnswer(e.target.value)}
                  placeholder="输入缺失的单词..."
                  style={{ width: '100%', padding: '14px 18px', fontSize: '1rem' }}
                  disabled={showExplanation}
                />
              </div>
            )}

            {/* 翻译题 */}
            {question.type === QUIZ_TYPES.TRANSLATION && (
              <div>
                <textarea
                  value={answers[currentQ] || ''}
                  onChange={e => handleAnswer(e.target.value)}
                  placeholder={question.direction === 'en2cn' ? '请输入中文翻译...' : 'Please enter English translation...'}
                  rows={3}
                  style={{ width: '100%', padding: '14px 18px', fontSize: '0.95rem', resize: 'vertical' }}
                  disabled={showExplanation}
                />
              </div>
            )}

            {/* 场景理解题 */}
            {question.type === QUIZ_TYPES.SCENE_CONTEXT && (
              <div>
                {question.sceneContextCn && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>
                    🎬 场景: {question.sceneContextCn}
                  </div>
                )}
                <textarea
                  value={answers[currentQ] || ''}
                  onChange={e => handleAnswer(e.target.value)}
                  placeholder="写下你的理解..."
                  rows={4}
                  style={{ width: '100%', padding: '14px 18px', fontSize: '0.95rem', resize: 'vertical' }}
                  disabled={showExplanation}
                />
              </div>
            )}

            {/* 词汇配对题 */}
            {question.type === QUIZ_TYPES.WORD_MATCHING && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-muted)' }}>单词</div>
                  {question.pairs.map((pair, i) => {
                    const currentAnswers = answers[currentQ] || [];
                    return (
                      <div key={i} style={{
                        padding: '10px 14px', marginBottom: 6,
                        background: currentAnswers[i] ? 'var(--primary-glow)' : 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600, color: 'var(--primary)',
                        border: currentAnswers[i] ? '1px solid var(--primary)' : '1px solid transparent',
                        cursor: currentAnswers[i] ? 'pointer' : 'default',
                      }}
                        onClick={() => {
                          if (currentAnswers[i] && !showExplanation) {
                            // 点击已配对的单词可以取消配对
                            const updated = [...currentAnswers];
                            updated[i] = undefined;
                            handleAnswer(updated);
                          }
                        }}
                      >
                        {i + 1}. {pair.word}
                        {currentAnswers[i] && (
                          <span style={{ float: 'right', fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                            → {currentAnswers[i]} ✕
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-muted)' }}>含义（点击选择）</div>
                  {question.shuffledMeanings.map((meaning, i) => {
                    const currentAnswers = answers[currentQ] || [];
                    const alreadyUsed = currentAnswers.includes(meaning);
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (showExplanation || alreadyUsed) return;
                          const updated = [...currentAnswers];
                          // 找到第一个未填的位置
                          const nextEmpty = updated.findIndex((v, idx) => idx < question.pairs.length && !v);
                          const pos = nextEmpty === -1 ? updated.length : nextEmpty;
                          if (pos < question.pairs.length) {
                            updated[pos] = meaning;
                            handleAnswer(updated);
                          }
                        }}
                        style={{
                          padding: '10px 14px', marginBottom: 6,
                          background: alreadyUsed ? 'var(--bg-dark)' : 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: alreadyUsed || showExplanation ? 'not-allowed' : 'pointer',
                          border: '1px solid var(--border)',
                          transition: 'all 0.2s',
                          opacity: alreadyUsed ? 0.4 : 1,
                        }}
                      >
                        {meaning}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 解析 */}
            {showExplanation && question.explanationCn && (
              <div style={{
                marginTop: 16, padding: 16,
                background: 'var(--info-bg)', borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(91,155,245,0.2)'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--info)' }}>💡 解析</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{question.explanationCn}</div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={handlePrev} disabled={currentQ === 0}>
              ← 上一题
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              {answered && !showExplanation && (
                <button className="btn btn-ghost" onClick={() => setShowExplanation(true)}>
                  💡 查看解析
                </button>
              )}
              {!isLastQ && (
                <button className="btn btn-primary" onClick={handleNext}>
                  下一题 →
                </button>
              )}
              {allAnswered && (
                <button className="btn btn-success btn-lg" onClick={handleSubmit}>
                  ✅ 提交测验
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
