import { useState } from 'react';
import { localBridgeSettingsRepository } from '../modules/settings';
import { getSettings, updateSettings } from '../utils/storage';
import { checkBridgeHealth } from '../utils/ai';

export default function SettingsPage() {
  const [settings, setSettings] = useState(getSettings());
  const [bridgeUrl, setBridgeUrl] = useState(localBridgeSettingsRepository.getSettings().bridgeUrl);
  const [bridgeStatus, setBridgeStatus] = useState('idle'); // idle, checking, ready, error
  const [saveStatus, setSaveStatus] = useState('');

  const handleSaveSettings = () => {
    updateSettings(settings);

    // Save bridge settings
    localBridgeSettingsRepository.saveSettings({ bridgeUrl: bridgeUrl.trim() });

    setSaveStatus('保存成功！');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleTestBridge = async () => {
    setBridgeStatus('checking');
    try {
      const info = await checkBridgeHealth({ bridgeUrl: bridgeUrl.trim() });
      setBridgeStatus(info.configured ? 'ready' : 'error');
    } catch {
      setBridgeStatus('error');
    }
  };

  return (
    <div className="page-transition">
      <div className="page-header">
        <div>
          <h2>⚙️ 系统设置</h2>
          <div className="subtitle">配置学习偏好与 AI 模型连接</div>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">学习偏好</div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              每日学习目标（分钟）
            </label>
            <input
              type="number"
              value={settings.dailyGoal}
              onChange={(e) => setSettings({ ...settings, dailyGoal: parseInt(e.target.value) || 15 })}
              style={{ width: '100%', maxWidth: '200px' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.showTranslation}
                onChange={(e) => setSettings({ ...settings, showTranslation: e.target.checked })}
              />
              <span>默认显示中文翻译</span>
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.autoPlayAudio}
                onChange={(e) => setSettings({ ...settings, autoPlayAudio: e.target.checked })}
              />
              <span>自动播放台词音频</span>
            </label>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">AI Bridge 配置</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            苏格拉底对话依赖 AI Bridge 连接大模型（如 gemini-internal）。
            开发环境下默认通过 <code>/api/ai</code> 代理到本地 Bridge；单机部署时也建议保留这个同源地址。
          </p>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Bridge 服务地址
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={bridgeUrl}
                onChange={(e) => setBridgeUrl(e.target.value)}
                placeholder="/api/ai"
                style={{ flex: 1, minWidth: '200px' }}
              />
              <button className="btn btn-secondary" onClick={handleTestBridge}>
                {bridgeStatus === 'checking' ? '检测中...' : '测试连接'}
              </button>
            </div>
            {bridgeStatus === 'ready' && (
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--success)' }}>✅ 连接成功</div>
            )}
            {bridgeStatus === 'error' && (
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--error)' }}>❌ 连接失败，请检查服务是否运行</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            保存全部设置
          </button>
          {saveStatus && <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>{saveStatus}</span>}
        </div>
      </div>
    </div>
  );
}
