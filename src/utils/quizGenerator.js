// 考试题目生成系统
// 支持多种题型：选择题、填空题、翻译题、听写题、情景应用题

import { getAllScenes, getAllKeywords } from '../data/episodes';

// 题型定义
export const QUIZ_TYPES = {
  VOCABULARY_CHOICE: 'vocabulary_choice',     // 词汇选择题
  FILL_IN_BLANK: 'fill_in_blank',            // 填空题
  TRANSLATION: 'translation',                 // 翻译题
  SCENE_CONTEXT: 'scene_context',            // 场景理解题
  WORD_MATCHING: 'word_matching',             // 词汇配对题
  SENTENCE_ORDER: 'sentence_order',           // 句子排序题
  GRAMMAR_CHOICE: 'grammar_choice',           // 语法选择题
};

// 生成词汇选择题
function generateVocabularyChoice(scenes) {
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  const keyword = scene.keywords[Math.floor(Math.random() * scene.keywords.length)];

  // 生成干扰项
  const allKeywords = getAllKeywords();
  const distractors = allKeywords
    .filter(k => k.word !== keyword.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(k => k.meaning);

  const options = [...distractors, keyword.meaning].sort(() => Math.random() - 0.5);

  return {
    type: QUIZ_TYPES.VOCABULARY_CHOICE,
    question: `In the context of Billions, what does "${keyword.word}" mean?`,
    questionCn: `在《亿万》的语境中，"${keyword.word}" 是什么意思？`,
    context: scene.dialogue,
    contextCn: scene.translation,
    options,
    correctAnswer: keyword.meaning,
    explanation: `"${keyword.word}" means "${keyword.meaning}". Example: ${keyword.example}`,
    explanationCn: `"${keyword.word}" 的意思是 "${keyword.meaning}"。例句：${keyword.example}`,
    difficulty: scene.difficulty,
    sceneId: scene.id,
    points: scene.difficulty * 5,
  };
}

// 生成填空题
function generateFillInBlank(scenes) {
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  const keyword = scene.keywords[Math.floor(Math.random() * scene.keywords.length)];
  const blankDialogue = scene.dialogue.replace(
    new RegExp(keyword.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
    '______'
  );

  return {
    type: QUIZ_TYPES.FILL_IN_BLANK,
    question: `Fill in the blank to complete the dialogue:`,
    questionCn: `填空完成对话：`,
    context: blankDialogue,
    character: scene.character,
    hint: keyword.meaning,
    correctAnswer: keyword.word,
    acceptableAnswers: [keyword.word.toLowerCase(), keyword.word],
    explanation: `The correct word is "${keyword.word}" (${keyword.meaning})`,
    explanationCn: `正确答案是 "${keyword.word}"（${keyword.meaning}）`,
    difficulty: scene.difficulty,
    sceneId: scene.id,
    points: scene.difficulty * 8,
  };
}

// 生成翻译题
function generateTranslation(scenes) {
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  const direction = Math.random() > 0.5 ? 'en2cn' : 'cn2en';

  return {
    type: QUIZ_TYPES.TRANSLATION,
    question: direction === 'en2cn'
      ? 'Translate this line into Chinese:'
      : 'Translate this line into English:',
    questionCn: direction === 'en2cn'
      ? '将这句台词翻译成中文：'
      : '将这句台词翻译成英文：',
    context: direction === 'en2cn' ? scene.dialogue : scene.translation,
    character: scene.character,
    direction,
    referenceAnswer: direction === 'en2cn' ? scene.translation : scene.dialogue,
    keywords: scene.keywords.map(k => direction === 'en2cn' ? k.meaning : k.word),
    difficulty: scene.difficulty,
    sceneId: scene.id,
    points: scene.difficulty * 10,
  };
}

// 生成场景理解题
function generateSceneContext(scenes) {
  const scene = scenes[Math.floor(Math.random() * scenes.length)];

  const questions = [
    {
      q: `What is ${scene.character} trying to convey in this scene?`,
      qCn: `${scene.characterCn}在这个场景中想表达什么？`,
    },
    {
      q: `Why does ${scene.character} use this particular way of expression?`,
      qCn: `${scene.characterCn}为什么用这种特殊的表达方式？`,
    },
    {
      q: `In what real-life situation could you use a similar expression?`,
      qCn: `在什么现实生活情境中你可以使用类似的表达？`,
    },
  ];

  const selected = questions[Math.floor(Math.random() * questions.length)];

  return {
    type: QUIZ_TYPES.SCENE_CONTEXT,
    question: selected.q,
    questionCn: selected.qCn,
    context: scene.dialogue,
    contextCn: scene.translation,
    character: scene.character,
    characterCn: scene.characterCn,
    sceneContext: scene.context,
    sceneContextCn: scene.contextCn,
    isOpenEnded: true,
    difficulty: scene.difficulty,
    sceneId: scene.id,
    points: scene.difficulty * 12,
    rubric: {
      excellent: '完整理解场景含义，能联系实际应用',
      good: '基本理解场景含义',
      fair: '部分理解，有遗漏',
      poor: '理解有误',
    }
  };
}

// 生成词汇配对题
function generateWordMatching(scenes) {
  const selectedScenes = scenes.sort(() => Math.random() - 0.5).slice(0, 4);
  const pairs = selectedScenes.flatMap(s =>
    s.keywords.slice(0, 1).map(k => ({ word: k.word, meaning: k.meaning }))
  ).slice(0, 4);

  return {
    type: QUIZ_TYPES.WORD_MATCHING,
    question: 'Match each word with its correct meaning:',
    questionCn: '将每个单词与其正确含义配对：',
    pairs,
    shuffledMeanings: pairs.map(p => p.meaning).sort(() => Math.random() - 0.5),
    difficulty: 2,
    points: pairs.length * 5,
  };
}

// 生成语法选择题
function generateGrammarChoice(scenes) {
  const scene = scenes[Math.floor(Math.random() * scenes.length)];

  if (!scene.grammar) {
    return generateVocabularyChoice(scenes);
  }

  const grammarPoint = scene.grammar.point;
  const correctExample = scene.grammar.example;

  // 生成错误选项
  const wrongOptions = [
    correctExample.replace(/to /g, 'for '),
    correctExample.replace(/the /g, 'a '),
    correctExample.replace(/is /g, 'are '),
  ].filter(o => o !== correctExample).slice(0, 2);

  const options = [correctExample, ...wrongOptions].sort(() => Math.random() - 0.5);

  return {
    type: QUIZ_TYPES.GRAMMAR_CHOICE,
    question: `Which sentence correctly uses the grammar pattern: "${grammarPoint.split('-')[0].trim()}"?`,
    questionCn: `哪个句子正确使用了语法模式："${grammarPoint.split('-')[0].trim()}"？`,
    context: scene.dialogue,
    grammarPoint,
    options,
    correctAnswer: correctExample,
    explanation: `Grammar pattern: ${grammarPoint}`,
    explanationCn: `语法模式：${grammarPoint}`,
    difficulty: scene.difficulty,
    sceneId: scene.id,
    points: scene.difficulty * 7,
  };
}

// 生成考试（混合题型）
export function generateQuiz(options = {}) {
  const {
    questionCount = 10,
    difficulty = null,
    types = null,
    episodeId = null,
  } = options;

  let scenes = getAllScenes();

  if (difficulty) {
    scenes = scenes.filter(s => s.difficulty <= difficulty);
  }

  if (episodeId) {
    scenes = scenes.filter(s => s.episodeId === episodeId);
  }

  if (scenes.length === 0) {
    scenes = getAllScenes();
  }

  const generators = {
    [QUIZ_TYPES.VOCABULARY_CHOICE]: generateVocabularyChoice,
    [QUIZ_TYPES.FILL_IN_BLANK]: generateFillInBlank,
    [QUIZ_TYPES.TRANSLATION]: generateTranslation,
    [QUIZ_TYPES.SCENE_CONTEXT]: generateSceneContext,
    [QUIZ_TYPES.WORD_MATCHING]: generateWordMatching,
    [QUIZ_TYPES.GRAMMAR_CHOICE]: generateGrammarChoice,
  };

  const activeTypes = types || Object.keys(generators);
  const questions = [];

  for (let i = 0; i < questionCount; i++) {
    const type = activeTypes[i % activeTypes.length];
    const generator = generators[type];
    if (generator) {
      questions.push({ ...generator(scenes), index: i + 1 });
    }
  }

  return {
    id: Date.now().toString(),
    questions: questions.sort(() => Math.random() - 0.5),
    totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
    createdAt: new Date().toISOString(),
    episodeId,
    difficulty,
  };
}

// 评分系统
export function gradeQuiz(quiz, answers) {
  let totalScore = 0;
  let maxScore = 0;
  const results = [];

  quiz.questions.forEach((question, index) => {
    const answer = answers[index];
    maxScore += question.points;

    let correct = false;
    let partialCredit = 0;

    switch (question.type) {
      case QUIZ_TYPES.VOCABULARY_CHOICE:
      case QUIZ_TYPES.GRAMMAR_CHOICE:
        correct = answer === question.correctAnswer;
        break;

      case QUIZ_TYPES.FILL_IN_BLANK:
        correct = question.acceptableAnswers?.some(
          a => a.toLowerCase() === answer?.toLowerCase()
        );
        break;

      case QUIZ_TYPES.TRANSLATION:
        // 翻译题按关键词匹配给分
        if (answer) {
          const matchedKeywords = question.keywords.filter(
            k => answer.toLowerCase().includes(k.toLowerCase())
          );
          partialCredit = matchedKeywords.length / question.keywords.length;
          correct = partialCredit >= 0.5;
        }
        break;

      case QUIZ_TYPES.WORD_MATCHING:
        // 配对题按正确配对数给分
        if (answer && Array.isArray(answer)) {
          const correctPairs = question.pairs.filter((pair, i) =>
            answer[i] === pair.meaning
          );
          partialCredit = correctPairs.length / question.pairs.length;
          correct = partialCredit === 1;
        }
        break;

      case QUIZ_TYPES.SCENE_CONTEXT:
        // 开放性题目，默认给满分（实际中可由AI评分）
        if (answer && answer.length > 10) {
          partialCredit = 0.8;
          correct = true;
        }
        break;

      default:
        correct = answer === question.correctAnswer;
    }

    const earned = correct ? question.points : Math.round(question.points * partialCredit);
    totalScore += earned;

    results.push({
      questionIndex: index,
      type: question.type,
      correct,
      partialCredit,
      earned,
      maxPoints: question.points,
      userAnswer: answer,
      correctAnswer: question.correctAnswer || question.referenceAnswer,
    });
  });

  return {
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    results,
    grade: getGrade(totalScore / maxScore),
    timestamp: new Date().toISOString(),
  };
}

function getGrade(ratio) {
  if (ratio >= 0.9) return { letter: 'A+', label: '卓越', emoji: '🏆' };
  if (ratio >= 0.8) return { letter: 'A', label: '优秀', emoji: '⭐' };
  if (ratio >= 0.7) return { letter: 'B', label: '良好', emoji: '👍' };
  if (ratio >= 0.6) return { letter: 'C', label: '及格', emoji: '📚' };
  return { letter: 'D', label: '继续努力', emoji: '💪' };
}
