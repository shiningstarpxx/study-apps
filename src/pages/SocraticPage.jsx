import { useState, useRef, useEffect } from 'react';
import { getAllScenes } from '../data/episodes';
import { generateSocraticDialogue, generateFeedback, createSocraticSession } from '../utils/socratic';
import { addSocraticSession, updateDailyTask } from '../utils/storage';

function evaluateResponse(text) {
  const length = text.length;
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  let score = 2;
  if (length > 20) score += 1;
  if (length > 50) score += 1;
  if (hasChinese && hasEnglish) score += 1;
  if (text.includes('因为') || text.includes('because') || text.includes('所以')) score += 1;

  return Math.min(score, 5);
}

function getRandomDelay() {
  return 800 + Math.random() * 800;
}

export default function SocraticPage() {
  const [selectedScene, setSelectedScene] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [session, setSession] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const allScenes = getAllScenes();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = (scene) => {
    setSelectedScene(scene);
    const newSession = createSocraticSession(scene);
    setSession(newSession);
    setCurrentPhase(0);
    setCurrentStage(0);
    setSessionComplete(false);

    const phase = newSession.phases[0];
    const firstQuestion = generateSocraticDialogue(scene, phase.type, phase.stages[0], true);

    setMessages([
      {
        role: 'system',
        content: `🏛️ 欢迎来到苏格拉底式英语学习！\n\n我们将一起深入探讨这句台词：\n\n"${scene.dialogue}"\n\n— ${scene.character}`,
      },
      {
        role: 'system',
        content: `📍 第一阶段：${phase.title} ${phase.icon}\n\n${firstQuestion}`,
      },
    ]);

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = () => {
    if (!input.trim() || !session || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);

    // 模拟苏格拉底式回应（延迟以模拟思考）
    setTimeout(() => {
      // 评估回答质量（简单启发式）
      const quality = evaluateResponse(userMessage);
      const feedback = generateFeedback(quality, selectedScene?.characterCn, true);

      const phase = session.phases[currentPhase];
      const nextStageIdx = currentStage + 1;

      if (nextStageIdx < phase.stages.length) {
        // 进入下一阶段
        const nextQuestion = generateSocraticDialogue(
          selectedScene, phase.type, phase.stages[nextStageIdx], true
        );
        setCurrentStage(nextStageIdx);
        setMessages(prev => [
          ...prev,
          { role: 'system', content: feedback },
          { role: 'system', content: nextQuestion },
        ]);
      } else if (currentPhase + 1 < session.phases.length) {
        // 进入下一个主题
        const nextPhase = session.phases[currentPhase + 1];
        const nextQuestion = generateSocraticDialogue(
          selectedScene, nextPhase.type, nextPhase.stages[0], true
        );
        setCurrentPhase(currentPhase + 1);
        setCurrentStage(0);
        setMessages(prev => [
          ...prev,
          { role: 'system', content: `${feedback}\n\n✅ 这个阶段完成了！` },
          { role: 'system', content: `📍 下一阶段：${nextPhase.title} ${nextPhase.icon}\n\n${nextQuestion}` },
        ]);
      } else {
        // 会话完成
        setSessionComplete(true);
        updateDailyTask('socratic');
        addSocraticSession({
          sceneId: selectedScene.id,
          messagesCount: messages.length + 2,
          phases: session.phases.length,
        });
        setMessages(prev => [
          ...prev,
          { role: 'system', content: feedback },
          {
            role: 'system',
            content: `🎉 太棒了！苏格拉底对话完成！\n\n你已经从 **理解→词汇→语法** 三个维度深入学习了这句台词。\n\n记住：真正的学习不是记住答案，而是学会提问。苏格拉底说过："我知道我一无所知。" 保持好奇心！\n\n💡 建议：去做一个小测验来巩固学习效果吧！`,
          },
        ]);
      }
      setIsThinking(false);
    }, getRandomDelay());
  };

  // 场景选择界面
  if (!selectedScene) {
    return (
      <div className="page-transition">
        <div className="page-header">
          <h2>🏛️ 苏格拉底式学习</h2>
          <div className="subtitle">通过引导式提问深入理解每句台词 · 选择一句台词开始对话</div>
        </div>
        <div className="page-body">
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">💡 什么是苏格拉底式学习？</div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <p>苏格拉底式教学法（Socratic Method）是通过提问引导你主动思考的学习方式。与传统的"老师讲、学生听"不同，
              这里我会不断向你提问，引导你自己发现答案。</p>
              <p style={{ marginTop: 8 }}>每次对话包含三个阶段：</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div style={{ flex: 1, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🎯</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>理解台词</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>表面理解 → 深层含义 → 批判思考</div>
                </div>
                <div style={{ flex: 1, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📚</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>词汇探索</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>探索 → 关联 → 应用</div>
                </div>
                <div style={{ flex: 1, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔧</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>语法发现</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>观察 → 假设 → 验证</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🎬 选择台词开始对话</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allScenes.map(scene => (
                <div
                  key={scene.id}
                  onClick={() => startSession(scene)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px',
                    background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'var(--primary-glow)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                >
                  <div className="character-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                    {scene.character.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '0.9rem', fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      "{scene.dialogue.slice(0, 70)}..."
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {scene.character} · {scene.episodeTitle}
                    </div>
                  </div>
                  <div className="difficulty-dots">
                    {[1, 2, 3, 4, 5].map(d => (
                      <div key={d} className={`difficulty-dot ${d <= scene.difficulty ? 'active' : ''}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 对话界面
  return (
    <div className="page-transition">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>🏛️ 苏格拉底对话</h2>
            <div className="subtitle">
              {selectedScene.character}: "{selectedScene.dialogue.slice(0, 40)}..."
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {session?.phases.map((phase, i) => (
              <div key={i} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                background: i === currentPhase ? 'var(--primary-glow)' : i < currentPhase ? 'var(--success-bg)' : 'var(--bg-elevated)',
                color: i === currentPhase ? 'var(--primary)' : i < currentPhase ? 'var(--success)' : 'var(--text-muted)',
                border: `1px solid ${i === currentPhase ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
              }}>
                {phase.icon} {phase.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="socratic-container">
          <div className="chat-messages" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="avatar">
                  {msg.role === 'system' ? '🏛️' : '👤'}
                </div>
                <div className="bubble">
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} style={{ marginBottom: line ? 6 : 0 }}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="chat-message system">
                <div className="avatar">🏛️</div>
                <div className="bubble" style={{ display: 'flex', gap: 4 }}>
                  <span className="dot-typing">思考中</span>
                  <span style={{ animation: 'pulse 1s infinite' }}>...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!sessionComplete ? (
            <div className="chat-input-area">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="输入你的思考和回答... (中英文均可)"
                disabled={isThinking}
              />
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
              >
                发送
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <button className="btn btn-primary btn-lg" onClick={() => {
                setSelectedScene(null);
                setMessages([]);
                setSession(null);
              }}>
                选择新台词继续学习 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
