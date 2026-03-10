import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllScenes } from '../data/episodes';
import { createSocraticSession } from '../utils/socratic';
import { addSocraticSession, updateDailyTask } from '../utils/storage';
import {
  chatWithAI,
  checkBridgeHealth,
  getBridgeSettings,
  getSocraticSystemPrompt,
  saveBridgeSettings,
} from '../utils/ai';

const defaultBridgeSettings = getBridgeSettings();

function formatBridgeError(error) {
  const message = error?.message || String(error);

  if (message.includes('Failed to fetch')) {
    return '连接不到本地 AI Bridge。请先启动桥接服务，再测试连接。';
  }
  if (message.includes('BRIDGE_NOT_CONFIGURED')) {
    return 'Bridge 已启动，但还没有配置 CLI 命令。请先设置 `LLM_CLI_COMMAND` 或 `LLM_CLI_TEMPLATE`。';
  }
  if (message.includes('CLI_TIMEOUT')) {
    return '本地大模型响应超时，请检查你的命令行封装是否卡住。';
  }
  if (message.includes('CLI_EMPTY_RESPONSE')) {
    return 'CLI 已执行，但没有返回任何内容。请检查包装命令的 stdout 输出。';
  }

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
  const [bridgeSettings, setBridgeSettings] = useState(defaultBridgeSettings);
  const [bridgeUrlInput, setBridgeUrlInput] = useState(defaultBridgeSettings.bridgeUrl);
  const [bridgeStatus, setBridgeStatus] = useState('idle');
  const [bridgeInfo, setBridgeInfo] = useState(null);
  const [bridgeError, setBridgeError] = useState('');
  const [showBridgeSetup, setShowBridgeSetup] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const allScenes = getAllScenes();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const runBridgeHealthCheck = useCallback(async (settings = bridgeSettings) => {
    setBridgeStatus('checking');
    setBridgeError('');

    try {
      const info = await checkBridgeHealth(settings);
      setBridgeInfo(info);
      setBridgeStatus(info.configured ? 'ready' : 'warning');
      if (!info.configured) {
        setBridgeError('Bridge 已启动，但还没有绑定你的 CLI 命令。');
      }
      return info;
    } catch (error) {
      setBridgeInfo(null);
      setBridgeStatus('error');
      setBridgeError(formatBridgeError(error));
      throw error;
    }
  }, [bridgeSettings]);

  useEffect(() => {
    runBridgeHealthCheck(defaultBridgeSettings).catch(() => {});
  }, [runBridgeHealthCheck]);

  const handleSaveBridge = async () => {
    const nextSettings = saveBridgeSettings({
      bridgeUrl: bridgeUrlInput.trim() || defaultBridgeSettings.bridgeUrl,
    });

    setBridgeSettings(nextSettings);

    try {
      await runBridgeHealthCheck(nextSettings);
      setShowBridgeSetup(false);
    } catch {
      setShowBridgeSetup(true);
    }
  };

  const startSession = async (scene) => {
    try {
      const info = await runBridgeHealthCheck(bridgeSettings);
      if (!info.configured) {
        setShowBridgeSetup(true);
        return;
      }
    } catch {
      setShowBridgeSetup(true);
      return;
    }

    setSelectedScene(scene);
    const newSession = createSocraticSession(scene);
    setSession(newSession);
    setCurrentPhase(0);
    setPhaseTurnCount(0);
    setSessionComplete(false);
    setIsThinking(true);

    setMessages([
      {
        role: 'model',
        parts: [{
          text: `🏛️ 本轮将调用你的本地命令行大模型，围绕这句台词做真实苏格拉底对话：\n\n"${scene.dialogue}"\n\n— ${scene.character}`,
        }],
      },
      {
        role: 'model',
        parts: [{
          text: `📏 英语主线约束\n\n${newSession.guardrails.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}`,
        }],
      },
    ]);

    try {
      const systemPrompt = getSocraticSystemPrompt(scene, newSession.phases[0], newSession);
      const firstQuestion = await chatWithAI([], systemPrompt, bridgeSettings);

      setMessages((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: firstQuestion }] },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          parts: [{ text: `❌ 连接本地模型失败：${formatBridgeError(error)}` }],
        },
      ]);
    } finally {
      setIsThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !session || isThinking || sessionComplete) return;

    const userText = input.trim();
    const userMessage = { role: 'user', parts: [{ text: userText }] };
    const nextMessages = [...messages, userMessage];

    setInput('');
    setMessages(nextMessages);
    setIsThinking(true);

    try {
      const phase = session.phases[currentPhase];
      const systemPrompt = getSocraticSystemPrompt(selectedScene, phase, session);
      const history = nextMessages.filter((message) => message.role === 'user' || message.role === 'model');
      const reply = await chatWithAI(history, systemPrompt, bridgeSettings);

      setMessages((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: reply }] },
      ]);

      const nextPhaseTurnCount = phaseTurnCount + 1;
      if (nextPhaseTurnCount >= 2) {
        if (currentPhase + 1 < session.phases.length) {
          setCurrentPhase((prev) => prev + 1);
          setPhaseTurnCount(0);
        } else {
          setSessionComplete(true);
          updateDailyTask('socratic');
          addSocraticSession({
            sceneId: selectedScene.id,
            messagesCount: nextMessages.length + 1,
            phases: session.phases.length,
          });
        }
      } else {
        setPhaseTurnCount(nextPhaseTurnCount);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          parts: [{ text: `❌ 本地模型交互异常：${formatBridgeError(error)}` }],
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  if (showBridgeSetup) {
    return (
      <div className="page-transition" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ maxWidth: 560, width: '100%' }}>
          <div className="card-title">🖥️ 连接本地 AI Bridge</div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
            浏览器和 iOS WebView 不能直接调用你电脑上的命令行模型，所以需要先启动一个本地 Bridge 服务，
            再由 Bridge 去执行你的 CLI 封装命令。
          </p>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Bridge 地址</div>
            <input
              type="text"
              value={bridgeUrlInput}
              onChange={(event) => setBridgeUrlInput(event.target.value)}
              placeholder="http://127.0.0.1:8787"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>启动方式（默认使用 gemini-internal）</div>
            <div>1. 在终端执行 <code style={{ color: 'var(--primary)' }}>npm run ai:bridge</code></div>
            <div>2. 回到这里点"测试连接"或"保存并开始"</div>
            <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              已默认绑定 <code>gemini-internal -p</code>，如需更换可设置环境变量 LLM_CLI_COMMAND
            </div>
          </div>

          {bridgeStatus !== 'idle' && (
            <div style={{ marginBottom: 14, fontSize: '0.84rem', color: bridgeStatus === 'ready' ? 'var(--success)' : bridgeStatus === 'warning' ? 'var(--warning)' : 'var(--error)' }}>
              {bridgeStatus === 'checking' && '正在检测 Bridge 状态...'}
              {bridgeStatus === 'ready' && `Bridge 已连接 · 命令模式：${bridgeInfo?.mode || 'unknown'} · 命令：${bridgeInfo?.commandPreview || 'unknown'}`}
              {bridgeStatus === 'warning' && `Bridge 已启动，但未配置 CLI 命令。`}
              {bridgeStatus === 'error' && bridgeError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => runBridgeHealthCheck({ bridgeUrl: bridgeUrlInput.trim() || defaultBridgeSettings.bridgeUrl }).catch(() => {})}
            >
              测试连接
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveBridge}>
              保存并开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedScene) {
    return (
      <div className="page-transition">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <h2>🏛️ 苏格拉底式学习</h2>
              <div className="subtitle">使用 gemini-internal 驱动真实 AI 追问式英语学习</div>
            </div>
            <button className="btn btn-sm" onClick={() => setShowBridgeSetup(true)}>⚙️ Bridge 设置</button>
          </div>
        </div>

        <div className="page-body">
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">🔌 当前连接状态</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <div>Bridge 地址：`{bridgeSettings.bridgeUrl}`</div>
              <div>
                状态：
                <span style={{ color: bridgeStatus === 'ready' ? 'var(--success)' : bridgeStatus === 'warning' ? 'var(--warning)' : bridgeStatus === 'error' ? 'var(--error)' : 'var(--text-muted)', marginLeft: 6 }}>
                  {bridgeStatus === 'ready' && '已就绪'}
                  {bridgeStatus === 'warning' && 'Bridge 已启动，但 CLI 未配置'}
                  {bridgeStatus === 'error' && '连接失败'}
                  {bridgeStatus === 'checking' && '检测中'}
                  {bridgeStatus === 'idle' && '未检测'}
                </span>
              </div>
              {bridgeInfo?.commandPreview && <div>命令预览：`{bridgeInfo.commandPreview}`</div>}
              {bridgeError && <div style={{ color: 'var(--error)', marginTop: 6 }}>{bridgeError}</div>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">💡 gemini-internal 驱动</div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              苏格拉底对话通过本地 Bridge 调用 <code>gemini-internal -p</code>，前端只负责展示和上下文组织。
              它会持续把提问拉回到 <strong>句意、关键词、句式、迁移应用</strong> 这条英语主线。
            </div>
          </div>

          <div className="card">
            <div className="card-title">🎬 选择台词开启真实 AI 对话</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allScenes.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => startSession(scene)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px',
                    background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor = 'var(--primary)';
                    event.currentTarget.style.background = 'var(--primary-glow)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = 'var(--border)';
                    event.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                >
                  <div className="character-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                    {scene.character.split(' ').map((name) => name[0]).join('')}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{scene.dialogue.slice(0, 70)}..."
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {scene.character} · {scene.episodeTitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2>🏛️ 苏格拉底对话</h2>
            <div className="subtitle">
              {selectedScene.character}: "{selectedScene.dialogue.slice(0, 40)}..."
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {session?.phases.map((phase, index) => (
              <div
                key={phase.type}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: index === currentPhase ? 'var(--primary-glow)' : index < currentPhase ? 'var(--success-bg)' : 'var(--bg-elevated)',
                  color: index === currentPhase ? 'var(--primary)' : index < currentPhase ? 'var(--success)' : 'var(--text-muted)',
                  border: `1px solid ${index === currentPhase ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                }}
              >
                {phase.icon} {phase.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div className="card-title" style={{ marginBottom: 10 }}>📏 英语主线约束</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {session?.guardrails.map((rule, index) => (
              <div key={rule}>{index + 1}. {rule}</div>
            ))}
          </div>
        </div>

        <div className="socratic-container">
          <div className="chat-messages" style={{ height: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <div key={index} className={`chat-message ${message.role === 'model' ? 'system' : 'user'}`}>
                <div className="avatar">{message.role === 'model' ? '🏛️' : '👤'}</div>
                <div className="bubble">
                  {message.parts[0].text.split('\n').map((line, lineIndex) => (
                    <p key={lineIndex} style={{ marginBottom: line ? 6 : 0 }}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="chat-message system">
                <div className="avatar">🏛️</div>
                <div className="bubble" style={{ display: 'flex', gap: 4 }}>
                  <span className="dot-typing">本地模型思考中</span>
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
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                placeholder="先解释句意 / 关键词 / 句式，再尝试给一个英文迁移例句..."
                disabled={isThinking}
              />
              <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim() || isThinking}>
                发送
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  setSelectedScene(null);
                  setMessages([]);
                  setSession(null);
                  setInput('');
                }}
              >
                学习完成！选择新台词 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
