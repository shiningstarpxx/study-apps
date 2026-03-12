import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { episodes } from '../../src/data/episodes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_JSON = path.join(__dirname, 'content-status.snapshot.json');
const OUTPUT_TXT = path.join(__dirname, 'content-status.snapshot.txt');
const MIN_SCENES_PER_EPISODE = 4;
const HIDDEN_CHAR_PATTERN = /[\u00AD\u200B\u200C\u200D\uFEFF]/u;

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function flattenScenes() {
  return episodes.flatMap((episode) =>
    episode.scenes.map((scene) => ({
      ...scene,
      episodeId: episode.id,
      season: episode.season,
      episode: episode.episode,
      episodeTitle: episode.title,
      episodeTitleCn: episode.titleCn,
      contentStatus: episode.contentStatus || 'detailed',
      learningFocus: episode.learningFocus || [],
      sourceType: scene.sourceType || 'original',
      hasAudio: typeof scene.audioStart === 'number' && typeof scene.audioEnd === 'number',
      hasGrammar: Boolean(scene.grammar?.point),
      hasTranslation: Boolean(scene.translation),
      keywordCount: Array.isArray(scene.keywords) ? scene.keywords.length : 0,
      tags: scene.tags || [],
    })),
  );
}

function buildEpisodeSnapshots(allScenes) {
  return episodes.map((episode) => {
    const episodeScenes = allScenes.filter((scene) => scene.episodeId === episode.id);
    const sourceBreakdown = countBy(episodeScenes, (scene) => scene.sourceType);
    const sceneCount = episodeScenes.length;
    const characterCount = new Set(episodeScenes.map((scene) => scene.character)).size;
    const keywordCount = episodeScenes.reduce((sum, scene) => sum + scene.keywordCount, 0);
    const hasLearningFocus = Array.isArray(episode.learningFocus) && episode.learningFocus.length > 0;

    return {
      id: episode.id,
      season: episode.season,
      episode: episode.episode,
      title: episode.title,
      titleCn: episode.titleCn,
      contentStatus: episode.contentStatus || 'detailed',
      sceneCount,
      characterCount,
      keywordCount,
      learningFocusCount: hasLearningFocus ? episode.learningFocus.length : 0,
      learningFocus: episode.learningFocus || [],
      sourceBreakdown,
      audioSceneCount: episodeScenes.filter((scene) => scene.hasAudio).length,
      grammarCoverage: episodeScenes.filter((scene) => scene.hasGrammar).length,
      translationCoverage: episodeScenes.filter((scene) => scene.hasTranslation).length,
      flags: [
        ...(sceneCount < MIN_SCENES_PER_EPISODE ? ['thin_episode'] : []),
        ...(!hasLearningFocus ? ['missing_learning_focus'] : []),
        ...((episode.contentStatus || 'detailed') !== 'detailed' ? ['non_detailed_content'] : []),
      ],
    };
  });
}

function buildCharacterSnapshots(allScenes) {
  const characterMap = new Map();

  allScenes.forEach((scene) => {
    const key = `${scene.character}__${scene.characterCn || ''}`;
    if (!characterMap.has(key)) {
      characterMap.set(key, {
        character: scene.character,
        characterCn: scene.characterCn || '',
        sceneCount: 0,
        episodeIds: new Set(),
      });
    }

    const entry = characterMap.get(key);
    entry.sceneCount += 1;
    entry.episodeIds.add(scene.episodeId);
  });

  return Array.from(characterMap.values())
    .map((entry) => ({
      character: entry.character,
      characterCn: entry.characterCn,
      sceneCount: entry.sceneCount,
      episodeCount: entry.episodeIds.size,
      episodeIds: Array.from(entry.episodeIds).sort(),
    }))
    .sort((a, b) => b.sceneCount - a.sceneCount);
}

function buildIssues(allScenes, episodeSnapshots) {
  const hiddenCharScenes = allScenes
    .filter((scene) => HIDDEN_CHAR_PATTERN.test(scene.dialogue) || HIDDEN_CHAR_PATTERN.test(scene.translation || ''))
    .map((scene) => ({
      sceneId: scene.id,
      episodeId: scene.episodeId,
      character: scene.character,
      dialogue: scene.dialogue,
    }));

  return {
    thinEpisodes: episodeSnapshots.filter((episode) => episode.sceneCount < MIN_SCENES_PER_EPISODE),
    curatedEpisodes: episodeSnapshots.filter((episode) => episode.contentStatus !== 'detailed'),
    missingLearningFocusEpisodes: episodeSnapshots.filter((episode) => episode.learningFocusCount === 0),
    hiddenCharacterScenes: hiddenCharScenes,
    scenesWithoutAudio: allScenes.filter((scene) => !scene.hasAudio).map((scene) => scene.id),
  };
}

function buildAudit() {
  const allScenes = flattenScenes();
  const episodeSnapshots = buildEpisodeSnapshots(allScenes);
  const characterSnapshots = buildCharacterSnapshots(allScenes);
  const keywordWords = new Set(
    allScenes.flatMap((scene) => (scene.keywords || []).map((keyword) => keyword.word.toLowerCase())),
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    totalEpisodes: episodes.length,
    totalScenes: allScenes.length,
    totalCharacters: characterSnapshots.length,
    totalKeywords: allScenes.reduce((sum, scene) => sum + scene.keywordCount, 0),
    uniqueKeywords: keywordWords.size,
    contentStatusBreakdown: countBy(episodes, (episode) => episode.contentStatus || 'detailed'),
    sourceTypeBreakdown: countBy(allScenes, (scene) => scene.sourceType),
    scenesWithAudio: allScenes.filter((scene) => scene.hasAudio).length,
    scenesWithGrammar: allScenes.filter((scene) => scene.hasGrammar).length,
    scenesWithTranslation: allScenes.filter((scene) => scene.hasTranslation).length,
    averageScenesPerEpisode: Number((allScenes.length / episodes.length).toFixed(2)),
    threshold: {
      minScenesPerEpisode: MIN_SCENES_PER_EPISODE,
    },
  };

  const issues = buildIssues(allScenes, episodeSnapshots);

  return {
    summary,
    episodes: episodeSnapshots,
    characters: characterSnapshots,
    issues,
  };
}

function toTextReport(audit) {
  const lines = [
    'Billions English 内容基线审计',
    `生成时间: ${audit.summary.generatedAt}`,
    '',
    '## 摘要',
    `- Episode 数: ${audit.summary.totalEpisodes}`,
    `- Scene 数: ${audit.summary.totalScenes}`,
    `- 角色数: ${audit.summary.totalCharacters}`,
    `- 关键词总数: ${audit.summary.totalKeywords}`,
    `- 去重关键词数: ${audit.summary.uniqueKeywords}`,
    `- 平均每集场景数: ${audit.summary.averageScenesPerEpisode}`,
    `- 内容状态分布: ${JSON.stringify(audit.summary.contentStatusBreakdown)}`,
    `- 来源类型分布: ${JSON.stringify(audit.summary.sourceTypeBreakdown)}`,
    '',
    '## 需优先处理',
    `- 低于 ${audit.summary.threshold.minScenesPerEpisode} 个场景的集数: ${audit.issues.thinEpisodes.map((episode) => `${episode.id}(${episode.sceneCount})`).join(', ') || '无'}`,
    `- 非 detailed 内容集数: ${audit.issues.curatedEpisodes.map((episode) => episode.id).join(', ') || '无'}`,
    `- 缺少 learningFocus 的集数: ${audit.issues.missingLearningFocusEpisodes.map((episode) => episode.id).join(', ') || '无'}`,
    `- 缺少音频的场景数: ${audit.issues.scenesWithoutAudio.length}`,
    `- 含隐藏字符的场景: ${audit.issues.hiddenCharacterScenes.map((scene) => scene.sceneId).join(', ') || '无'}`,
    '',
    '## 每集概览',
    ...audit.episodes.map((episode) => `- ${episode.id} ${episode.titleCn} | scenes=${episode.sceneCount} | status=${episode.contentStatus} | source=${JSON.stringify(episode.sourceBreakdown)} | flags=${episode.flags.join(',') || 'none'}`),
  ];

  return `${lines.join('\n')}\n`;
}

function writeAudit(audit) {
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(audit, null, 2));
  fs.writeFileSync(OUTPUT_TXT, toTextReport(audit));
}

const audit = buildAudit();
writeAudit(audit);
console.log(JSON.stringify(audit.summary, null, 2));
console.log(`Saved JSON report to ${OUTPUT_JSON}`);
console.log(`Saved text report to ${OUTPUT_TXT}`);
