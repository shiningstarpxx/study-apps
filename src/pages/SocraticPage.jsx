import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllScenes } from '../data/episodes';
import { createSocraticSession } from '../utils/socratic';
import { addSocraticSession, getSocraticHistory, updateDailyTask } from '../utils/storage';
import {
  chatWithAI,
  checkBridgeHealth,
  getBridgeSettings,
  getSocraticSystemPrompt,
} from '../utils/ai';

const defaultBridgeSettings = getBridgeSettings();

function formatBridgeError(error) {
  const message = error?.message || String(error);
  if (message.includes('Failed to fetch')) return '连接不到本地 AI Bridge。请先启动桥接服务。';
  if (message.includes('BRIDGE_NOT_CONFIGURED')) return 'Bridge 已启动，但还没有配置 CLI 命令。';
  return message;
}

export default function SocraticPage() {
  const [selectedScene, setSelectedScene] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [session, setSession] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [phaseTurnCount, setPhaseTurnCount] = useState(0);
  const [bridgeSettings] = useState(defaultBridgeSettings);
  const [bridgeStatus, setBridgeStatus] = useState('idle');
  const [history, setHistory] = useState(getSocraticHistory());
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasMarkedDailyTaskRef = useRef(false);

  const allScenes = getAllScenes();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (!selectedScene || messages.length <= 2) return;

    const updatedHistory = addSocraticSession({
      sceneId: selectedScene.id,
      messages,
      currentPhase,
      phaseTurnCount,
      sessionComplete,
      isPartial: !sessionComplete,
    });
    setHistory(updatedHistory);

    if (sessionComplete && !hasMarkedDailyTaskRef.current) {
      updateDailyTask('socratic');
      hasMarkedDailyTaskRef.current = true;
    }
  }, [messages, selectedScene, currentPhase, phaseTurnCount, sessionComplete]);

  const runBridgeHealthCheck = useCallback(async (settings = bridgeSettings) => {
    setBridgeStatus('checking');
    try {
      const info = await checkBridgeHealth(settings);
      setBridgeStatus(info.configured ? 'ready' : 'warning');
      return info;
    } catch {
      setBridgeStatus('error');
      return null;
    }
  }, [bridgeSettings]);

  useEffect(() => {
    runBridgeHealthCheck().catch(() => {});
  }, [runBridgeHealthCheck]);

  const startSession = async (scene, existingMessages = null) => {
    const info = await runBridgeHealthCheck();
    if (bridgeStatus === 'error' || !info?.configured) {
       // 如果没连上，也可以进入，但在发送时会报错
    }

    setSelectedScene(scene);
    const newSession = createSocraticSession(scene);
    setSession(newSession);

    if (existingMessages) {
      setMessages(existingMessages);
      // 这里简单处理，恢复到历史保存的 phase。实际生产环境可能需要更精细的分析。
      const lastState = history.find(h => h.sceneId === scene.id);
      hasMarkedDailyTaskRef.current = Boolean(lastState?.sessionComplete);
      if (lastState) {
        setCurrentPhase(lastState.currentPhase || 0);
        setPhaseTurnCount(lastState.phaseTurnCount || 0);
        setSessionComplete(lastState.sessionComplete || false);
      }
    } else {
      hasMarkedDailyTaskRef.current = false;
      setMessages([]);
      setCurrentPhase(0);
      setPhaseTurnCount(0);
      setSessionComplete(false);
      setIsThinking(true);

      const welcomeMsgs = [
        {
          role: 'model',
          parts: [{ text: `🏛️ 欢迎！我们将深度探讨这句台词：\n\n"${scene.dialogue}"\n\n— ${scene.character}` }]
        },
        {
          role: 'model',
          parts: [{ text: `📏 英语主线约束\n${newSession.guardrails.map((r, i) => `${i + 1}. ${r}`).join('\n')}` }]
        }
      ];
      setMessages(welcomeMsgs);

      try {
        const systemPrompt = getSocraticSystemPrompt(scene, newSession.phases[0], newSession);
        const firstQuestion = await chatWithAI([], systemPrompt, bridgeSettings);
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: firstQuestion }] }]);
      } catch (error) {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: `❌ 连接失败：${formatBridgeError(error)}` }] }]);
      } finally {
        setIsThinking(false);
      }
    }
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleSend = async () => {
    if (!input.trim() || !session || isThinking || sessionComplete) return;

    const userText = input.trim();
    const newUserMsg = { role: 'user', parts: [{ text: userText }] };
    const nextMessages = [...messages, newUserMsg];

    setInput('');
    setMessages(nextMessages);
    setIsThinking(true);

    try {
      const phase = session.phases[currentPhase];
      const systemPrompt = getSocraticSystemPrompt(selectedScene, phase, session);
      const reply = await chatWithAI(nextMessages, systemPrompt, bridgeSettings);

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: reply }] }]);

      const nextPhaseTurnCount = phaseTurnCount + 1;
      if (nextPhaseTurnCount >= 2) {
        if (currentPhase + 1 < session.phases.length) {
          setCurrentPhase(prev => prev + 1);
          setPhaseTurnCount(0);
        } else {
          setSessionComplete(true);
        }
      } else {
        setPhaseTurnCount(nextPhaseTurnCount);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: `❌ 交互异常：${formatBridgeError(error)}` }] }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!selectedScene) {
    return (
      <div className="page-transition">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>🏛️ 苏格拉底式学习</h2>
              <div className="subtitle">使用 AI 追问引导深度理解</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-sm" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? '🔙 返回列表' : '🕒 历史记录'}
              </button>
            </div>
          </div>
        </div>

        <div className="page-body">
          {showHistory ? (
            <div className="card">
              <div className="card-title">最近的对话历史</div>
              {history.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>暂无历史记录</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {history.map(item => {
                    const scene = allScenes.find(s => s.id === item.sceneId);
                    if (!scene) return null;
                    return (
                      <div key={item.id} className="nav-item" style={{ background: 'var(--bg-elevated)', padding: 12 }} onClick={() => startSession(scene, item.messages)}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>"{scene.dialogue.slice(0, 40)}..."</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(item.date).toLocaleString()} · {item.sessionComplete ? '✅ 已完成' : '🕒 进行中'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="card-title">选择台词开启对话</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allScenes.slice(0, 6).map(scene => (
                  <div key={scene.id} className="nav-item" style={{ background: 'var(--bg-elevated)', padding: 12 }} onClick={() => startSession(scene)}>
                    <span>{scene.character}: "{scene.dialogue.slice(0, 50)}..."</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <button className="btn btn-sm" onClick={() => setSelectedScene(null)} style={{ marginBottom: 8 }}>← 返回</button>
            <h2>🏛️ 对话中: {selectedScene.character}</h2>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {session?.phases.map((p, i) => (
              <span key={i} style={{ 
                fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10,
                background: i === currentPhase ? 'var(--primary-glow)' : 'var(--bg-elevated)',
                color: i === currentPhase ? 'var(--primary)' : 'var(--text-muted)'
              }}>{p.title}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="chat-messages" style={{ height: 'calc(100vh - 350px)', overflowY: 'auto', marginBottom: 20 }}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role === 'model' ? 'system' : 'user'}`}>
              <div className="bubble">{m.parts[0].text}</div>
            </div>
          ))}
          {isThinking && <div className="chat-message system"><div className="bubble">AI 正在思考...</div></div>}
          <div ref={messagesEndRef} />
        </div>

        {!sessionComplete ? (
          <div className="chat-input-area" style={{ display: 'flex', gap: 10 }}>
            <input 
              ref={inputRef}
              style={{ flex: 1 }}
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="输入你的理解或提问..."
            />
            <button className="btn btn-primary" onClick={handleSend} disabled={isThinking}>发送</button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <p>🎉 本轮苏格拉底学习已完成！</p>
            <button className="btn btn-primary" onClick={() => setSelectedScene(null)}>返回台词列表</button>
          </div>
        )}
      </div>
    </div>
  );
}
