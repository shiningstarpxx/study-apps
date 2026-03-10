import { useState } from 'react';
import { generateQuiz, gradeQuiz, QUIZ_TYPES } from '../utils/quizGenerator';
import { addQuizResult, updateProgress, getProgress, updateDailyTask } from '../utils/storage';

const typeLabels = {
  [QUIZ_TYPES.VOCABULARY_CHOICE]: { label: '词汇选择', icon: '📖' },
  [QUIZ_TYPES.FILL_IN_BLANK]: { label: '填空题', icon: '✏️' },
  [QUIZ_TYPES.TRANSLATION]: { label: '翻译题', icon: '🌐' },
  [QUIZ_TYPES.SCENE_CONTEXT]: { label: '场景理解', icon: '🎬' },
  [QUIZ_TYPES.WORD_MATCHING]: { label: '词汇配对', icon: '🔗' },
  [QUIZ_TYPES.GRAMMAR_CHOICE]: { label: '语法选择', icon: '🔧' },
};

export default function QuizPage() {
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizConfig, setQuizConfig] = useState({
    questionCount: 8,
    difficulty: null,
  });

  const startQuiz = () => {
    const newQuiz = generateQuiz(quizConfig);
    setQuiz(newQuiz);
    setCurrentQ(0);
    setAnswers({});
    setShowResult(false);
    setResult(null);
    setShowExplanation(false);
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
  };

  // 考试配置界面
  if (!quiz) {
    return (
      <div className="page-transition">
        <div className="page-header">
          <h2>📝 考试测验</h2>
          <div className="subtitle">测试你的学习成果 · 支持多种题型</div>
        </div>
        <div className="page-body">
          <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="card-title">⚙️ 测验设置</div>
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
    return (
      <div className="page-transition">
        <div className="page-header">
          <h2>📝 测验结果</h2>
        </div>
        <div className="page-body">
          <div className="card result-card" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="result-emoji">{result.grade.emoji}</div>
            <div className="result-score">{result.percentage}%</div>
            <div className="result-grade">{result.grade.letter} · {result.grade.label}</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              {result.totalScore} / {result.maxScore} 分
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                  {result.results.filter(r => r.correct).length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>正确</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>
                  {result.results.filter(r => !r.correct).length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>错误</div>
              </div>
            </div>

            {/* 详细结果 */}
            <div style={{ textAlign: 'left', marginTop: 32 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>📊 详细结果</div>
              {result.results.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: r.correct ? 'var(--success-bg)' : 'var(--error-bg)',
                  marginBottom: 6,
                  border: `1px solid ${r.correct ? 'rgba(78,203,113,0.2)' : 'rgba(231,76,94,0.2)'}`
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{r.correct ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      {typeLabels[r.type]?.icon} 第 {r.questionIndex + 1} 题 · {typeLabels[r.type]?.label}
                    </div>
                    {!r.correct && r.correctAnswer && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        正确答案: {typeof r.correctAnswer === 'string' ? r.correctAnswer.slice(0, 50) : ''}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {r.earned}/{r.maxPoints}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={startQuiz}>
                🔄 再测一次
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
                  {question.pairs.map((pair, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', marginBottom: 6,
                      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                      fontWeight: 600, color: 'var(--primary)'
                    }}>
                      {i + 1}. {pair.word}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-muted)' }}>含义（点击选择）</div>
                  {question.shuffledMeanings.map((meaning, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        const current = answers[currentQ] || [];
                        const updated = [...current];
                        // 找到第一个未填的位置
                        const nextEmpty = updated.findIndex((v) => !v);
                        const pos = nextEmpty === -1 ? updated.length : nextEmpty;
                        if (pos < question.pairs.length) {
                          updated[pos] = meaning;
                          handleAnswer(updated);
                        }
                      }}
                      style={{
                        padding: '10px 14px', marginBottom: 6,
                        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer', border: '1px solid var(--border)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {meaning}
                    </div>
                  ))}
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
