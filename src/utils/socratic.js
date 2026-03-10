// 苏格拉底式英语学习引导系统
// 核心原则：始终围绕“句意 → 关键词 → 句式 → 迁移应用”推进，避免偏离英语主线。

const questionTemplates = {
  comprehension: [
    {
      stage: 'surface',
      questions: [
        'Paraphrase what {character} means in one or two simpler English sentences. Stay with the line itself.',
        'Without giving your opinion, explain this line in plain English.',
        'What is the speaker trying to say here? Restate it in simpler English.',
      ],
      questionsCn: [
        '先别谈你是否同意。请用 1-2 句更简单的英文复述 {character} 这句话的意思。',
        '不要发表观点，先把这句台词本身的意思用简单英文说出来。',
        '说话人到底想表达什么？请用更简单的英文改写这句台词。',
      ],
    },
    {
      stage: 'deeper',
      questions: [
        'Which word or phrase in "{sentence}" carries the strongest tone? Quote it and explain its effect.',
        'Point to one expression in the line that makes it sound strong, cold, or emotional. Why?',
        'What clue inside the sentence helps you understand the speaker’s attitude best?',
      ],
      questionsCn: [
        '请只聚焦英语表达本身：原句里哪个词或短语最能体现语气？请引用它，并解释它的作用。',
        '指出这句里一个让它听起来更强硬、更冷、更有情绪的表达，并说明为什么。',
        '这句台词里，哪一个语言线索最能帮助你判断说话人的态度？',
      ],
    },
    {
      stage: 'critical',
      questions: [
        'In what work or negotiation situation could you use a similar English line? Give one short example.',
        'Move from understanding to usage: when could a real person say something like this in English?',
        'Give one brief English sentence for a similar business or daily situation.',
      ],
      questionsCn: [
        '把注意力放回语言迁移：在什么职场或谈判场景下，你可以用类似英文表达？请给一个简短英文例句。',
        '从理解走到使用：现实里什么情境下可以说类似的话？尽量用英文举例。',
        '请给一个相似场景的简短英文句子，重点是“这个表达什么时候能用”。',
      ],
    },
  ],
  vocabulary: [
    {
      stage: 'explore',
      questions: [
        'Focus on "{word}". What does it mean in this line? Try an English explanation first, then add Chinese if needed.',
        'Look at "{word}" in context. What meaning does it carry here, not just in the dictionary?',
        'What is the closest simple-English explanation of "{word}" in this sentence?',
      ],
      questionsCn: [
        '聚焦关键词 "{word}"：它在这句里更接近什么意思？先用英文解释，再用中文补充。',
        '只看这个语境，"{word}" 在这里承担了什么含义，而不只是词典定义？',
        '如果用更简单的英文解释 "{word}"，你会怎么说？',
      ],
    },
    {
      stage: 'connect',
      questions: [
        'How does "{word}" connect to the rest of the sentence? What changes if you replace it with a simpler word?',
        'Which part of the line depends most on "{word}"? Explain the nuance.',
        'If you swap "{word}" for a more common word, what tone or precision would you lose?',
      ],
      questionsCn: [
        '不要脱离句子本身。"{word}" 和原句中的哪部分最紧密相关？如果换成更普通的词，语气会怎么变？',
        '这句台词里最依赖 "{word}" 的是哪一部分？它带来了什么细微差别？',
        '如果把 "{word}" 换成更常见的词，你会失去什么语气或精确度？',
      ],
    },
    {
      stage: 'apply',
      questions: [
        'Use "{word}" in a new English sentence about work, negotiation, pressure, or decision-making.',
        'Create one short, natural English sentence with "{word}" that you could really say out loud.',
        'Write a new sentence using "{word}" in a practical context, not a dictionary example.',
      ],
      questionsCn: [
        '请用 "{word}" 造一个新的英文句子，场景尽量贴近工作、谈判、压力或决策。',
        '写一个你真的可能说出口的自然英文句子，用上 "{word}"。',
        '请给一个实用场景，而不是词典式例句，用 "{word}" 重新造句。',
      ],
    },
  ],
  grammar: [
    {
      stage: 'observe',
      questions: [
        'Looking only at the sentence form, what pattern is worth learning in "{sentence}"?',
        'What sentence structure makes this line sound strong or memorable?',
        'Ignore the opinion for a moment. What is the grammar or phrasing pattern here?',
      ],
      questionsCn: [
        '只看句型："{sentence}" 里最值得学的结构是什么？请指出 pattern，而不是评价观点。',
        '这句台词为什么好记？从句式上看，最核心的结构是什么？',
        '先忽略内容立场，只回答这里用了什么语法或表达模式。',
      ],
    },
    {
      stage: 'hypothesize',
      questions: [
        'If we change "{original}" to "{modified}", what happens to the tone or emphasis?',
        'How would the line feel different if it were said in a simpler way?',
        'What does the original wording do better than the modified version?',
      ],
      questionsCn: [
        '把 "{original}" 改成 "{modified}" 后，语气或重点会发生什么变化？',
        '如果用更简单的方式来说，这句会失去什么感觉？',
        '原版说法比改写版本更强的地方在哪里？',
      ],
    },
    {
      stage: 'test',
      questions: [
        'Now reuse the pattern to write one short English sentence of your own.',
        'Apply the same structure to a new situation and make it sound natural.',
        'Write one simple English line using the same pattern, but with your own meaning.',
      ],
      questionsCn: [
        '现在沿用这个句型，写一句你自己的简短英文表达。',
        '把这个结构迁移到一个新场景里，写得自然一点。',
        '请用同样的 pattern 写一句意思属于你自己的英文句子。',
      ],
    },
  ],
};

const feedbackTemplates = {
  encouraging: [
    'Good. Keep your answer tied to the wording of the line.',
    'Nice. Stay with the English evidence and go one step further.',
    'That works well. Can you make it even more language-focused?',
  ],
  encouragingCn: [
    '很好，继续围绕这句英文本身展开。你可以再引用一个关键词或句型。',
    '不错，方向很对。继续用原句里的语言证据往下说。',
    '回答已经贴近主线了，再把关注点放到英语表达本身。',
  ],
  probing: [
    'You are close. Now point to a specific word, phrase, or pattern as evidence.',
    'Good start. Can you support it with language from the line itself?',
    'Try to be more precise: what expression in the sentence makes you say that?',
  ],
  probingCn: [
    '方向对了，但再更贴近英语表达：指出具体词、短语或句型证据。',
    '这是个好开始。下一步请把依据放回原句里的语言材料。',
    '再精确一点：到底是句子里的哪个表达让你这样判断？',
  ],
  redirecting: [
    'Pull it back to the English. Start with meaning, key wording, or sentence pattern.',
    'Let’s refocus on the line itself: what does it mean, which word matters, and how is it built?',
    'Before giving a broad opinion, explain the expression, tone, or pattern in the sentence.',
  ],
  redirectingCn: [
    '先收回来，别展开价值判断。先回答这句英语是什么意思、哪个词关键、句型怎么用。',
    '把话题拉回语言本身：引用原句里的词组，再解释它的作用。',
    '先别发散到世界观或文化比较，先完成“意思 / 词汇 / 句式 / 用法”这条主线。',
  ],
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function replaceVariables(template, scene, useCn) {
  return template
    .replace(/{word}/g, scene.keywords?.[0]?.word || '')
    .replace(/{sentence}/g, scene.dialogue || '')
    .replace(/{character}/g, useCn ? scene.characterCn : scene.character)
    .replace(/{original}/g, scene.dialogue?.slice(0, 30) || '')
    .replace(/{modified}/g, modifySentence(scene.dialogue) || '');
}

export function generateSocraticDialogue(scene, type = 'comprehension', stage = 'surface', useCn = true) {
  const templates = questionTemplates[type];
  if (!templates) return null;

  const stageTemplate = templates.find(item => item.stage === stage);
  if (!stageTemplate) return null;

  const questionPool = useCn ? stageTemplate.questionsCn : stageTemplate.questions;
  return replaceVariables(randomItem(questionPool), scene, useCn);
}

export function evaluateSocraticResponse(text, scene, phaseType = 'comprehension') {
  const normalized = text.trim().toLowerCase();
  const englishWords = normalized.match(/[a-z]+/g) || [];
  const keywordHits = (scene?.keywords || []).filter(keyword => {
    const tokens = keyword.word.toLowerCase().split(/\s+/);
    return tokens.some(token => token.length > 2 && normalized.includes(token));
  }).length;
  const dialogueTokens = (scene?.dialogue || '').toLowerCase().split(/[^a-z']+/).filter(token => token.length > 3);
  const quotedLineEvidence = dialogueTokens.some(token => normalized.includes(token));
  const hasReasoningCue = /(because|means|tone|pattern|use|used|意思|语气|句型|因为|表示)/i.test(text);

  let quality = 1;
  if (text.length >= 12) quality += 1;
  if (text.length >= 28) quality += 1;
  if (englishWords.length >= 4) quality += 1;
  if (keywordHits > 0 || quotedLineEvidence) quality += 1;
  if (hasReasoningCue) quality += 1;
  if (phaseType === 'vocabulary' && keywordHits > 0) quality += 1;
  if (phaseType === 'grammar' && /(pattern|structure|if|when|not|句型|结构)/i.test(text)) quality += 1;

  return Math.min(5, quality);
}

export function generateFeedback(quality, character, useCn = true) {
  let type;
  if (quality >= 5) type = 'encouraging';
  else if (quality >= 3) type = 'probing';
  else type = 'redirecting';

  const key = useCn ? `${type}Cn` : type;
  return randomItem(feedbackTemplates[key]).replace(/{character}/g, character || '角色');
}

export function getNextStage(currentStage) {
  const stages = {
    vocabulary: ['explore', 'connect', 'apply'],
    grammar: ['observe', 'hypothesize', 'test'],
    comprehension: ['surface', 'deeper', 'critical'],
  };

  for (const [, stageList] of Object.entries(stages)) {
    const idx = stageList.indexOf(currentStage);
    if (idx !== -1 && idx < stageList.length - 1) {
      return stageList[idx + 1];
    }
  }
  return null;
}

function modifySentence(dialogue) {
  if (!dialogue) return '';
  return dialogue
    .replace("don't", 'do not')
    .replace("can't", 'cannot')
    .replace("won't", 'will not')
    .slice(0, 42);
}

export function createSocraticSession(scene) {
  return {
    sceneId: scene.id,
    character: scene.character,
    dialogue: scene.dialogue,
    guardrails: [
      '只围绕这句英文的意思、关键词、句型和可迁移用法来回答。',
      '优先用英文作答，必要时再补充中文说明。',
      '尽量引用原句中的词或短语，避免空泛讨论。',
      '先解释语言，再谈场景，不展开与学习无关的价值辩论。',
    ],
    phases: [
      {
        type: 'comprehension',
        stages: ['surface', 'deeper', 'critical'],
        title: '理解台词',
        titleEn: 'Meaning First',
        icon: '🎯',
      },
      {
        type: 'vocabulary',
        stages: ['explore', 'connect', 'apply'],
        title: '词汇迁移',
        titleEn: 'Word in Context',
        icon: '📚',
      },
      {
        type: 'grammar',
        stages: ['observe', 'hypothesize', 'test'],
        title: '句式应用',
        titleEn: 'Pattern in Use',
        icon: '🔧',
      },
    ],
  };
}
