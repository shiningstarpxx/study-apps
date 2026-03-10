import { useState } from 'react';
import { getAllKeywords, getAllScenes, tagCategories } from '../data/episodes';
import { getSRSData } from '../utils/storage';

export default function VocabularyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [sortBy, setSortBy] = useState('alpha');

  const allKeywords = getAllKeywords();
  const allScenes = getAllScenes();
  const srsData = getSRSData();

  let filteredKeywords = allKeywords;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredKeywords = filteredKeywords.filter(keyword =>
      keyword.word.toLowerCase().includes(term) ||
      keyword.meaning.includes(term) ||
      keyword.example?.toLowerCase().includes(term)
    );
  }

  if (selectedTag) {
    const scenesWithTag = allScenes.filter(scene => scene.tags.includes(selectedTag)).map(scene => scene.id);
    filteredKeywords = filteredKeywords.filter(keyword => keyword.scenes?.some(sceneId => scenesWithTag.includes(sceneId)));
  }

  filteredKeywords = [...filteredKeywords].sort((left, right) => {
    if (sortBy === 'alpha') return left.word.localeCompare(right.word);
    if (sortBy === 'srs') {
      const leftRepetitions = srsData[left.word]?.repetitions || 0;
      const rightRepetitions = srsData[right.word]?.repetitions || 0;
      return leftRepetitions - rightRepetitions;
    }
    return 0;
  });

  const getSRSStatus = (word) => {
    const srs = srsData[word];
    if (!srs) return { label: '未学习', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
    if (srs.repetitions === 0) return { label: '学习中', color: 'var(--warning)', bg: 'var(--warning-bg)' };
    if (srs.repetitions < 3) return { label: '巩固中', color: 'var(--info)', bg: 'var(--info-bg)' };
    return { label: '已掌握', color: 'var(--success)', bg: 'var(--success-bg)' };
  };

  const allTags = [...new Set(allScenes.flatMap(scene => scene.tags))];

  return (
    <div className="page-transition">
      <div className="page-header">
        <h2>📚 词汇本</h2>
        <div className="subtitle">
          共 {allKeywords.length} 个词汇 · 已进入复习系统 {Object.keys(srsData).length} 个
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="🔍 搜索词汇、含义或例句..."
            style={{
              flex: 1,
              minWidth: 250,
              padding: '12px 18px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)'
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'alpha', label: '字母' },
              { key: 'srs', label: '掌握度' },
            ].map(sortOption => (
              <button
                key={sortOption.key}
                className={`btn btn-sm ${sortBy === sortOption.key ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSortBy(sortOption.key)}
              >
                {sortOption.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            className={`btn btn-sm ${!selectedTag ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedTag(null)}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`btn btn-sm ${selectedTag === tag ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              {tagCategories[tag]?.icon} {tagCategories[tag]?.label || tag}
            </button>
          ))}
        </div>

        <div className="dashboard-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-glow)' }}>📖</div>
            <div className="stat-content">
              <div className="stat-value">{allKeywords.length}</div>
              <div className="stat-label">总词汇量</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>✅</div>
            <div className="stat-content">
              <div className="stat-value">{Object.values(srsData).filter(item => item.repetitions >= 3).length}</div>
              <div className="stat-label">已掌握</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>📝</div>
            <div className="stat-content">
              <div className="stat-value">{Object.values(srsData).filter(item => item.repetitions > 0 && item.repetitions < 3).length}</div>
              <div className="stat-label">学习中</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>📋 词汇列表</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              显示 {filteredKeywords.length} 个结果
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredKeywords.map((keyword, index) => {
              const status = getSRSStatus(keyword.word);
              return (
                <div
                  key={index}
                  className="keyword-item"
                  style={{
                    margin: 0,
                    padding: '16px 18px',
                    display: 'grid',
                    gridTemplateColumns: '160px 1fr auto',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div className="keyword-word" style={{ fontSize: '1rem' }}>{keyword.word}</div>
                    <div className="keyword-pos" style={{ marginTop: 4, display: 'inline-block' }}>
                      {keyword.partOfSpeech}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{keyword.meaning}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                      {keyword.example}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: status.color,
                    background: status.bg,
                    border: `1px solid ${status.color}20`
                  }}>
                    {status.label}
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
