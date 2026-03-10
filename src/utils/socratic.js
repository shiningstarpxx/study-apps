// 苏格拉底式教学引导系统
// 核心原则：通过提问引导学生自主思考，而非直接给出答案

// 苏格拉底问题模板
const questionTemplates = {
  vocabulary: [
    {
      stage: 'explore',
      questions: [
        'Look at the word "{word}". Have you seen it before in any other context? What did it mean there?',
        'If you break down "{word}" into parts, can you guess what it might mean?',
        'In the sentence "{sentence}", what role does "{word}" play? Is it describing, acting, or naming something?',
      ],
      questionsCn: [
        '看看单词 "{word}"。你在其他场景见过它吗？在那里是什么意思？',
        '如果你把 "{word}" 拆分成几部分，你能猜到它的意思吗？',
        '在句子 "{sentence}" 中，"{word}" 扮演什么角色？它是在描述、动作还是命名？',
      ]
    },
    {
      stage: 'connect',
      questions: [
        'Can you think of a synonym for "{word}"? How is it different from the original?',
        'In what other situations might you use "{word}"? Try to imagine a real-life scenario.',
        'How would you explain "{word}" to a friend without using its dictionary definition?',
      ],
      questionsCn: [
        '你能想到 "{word}" 的同义词吗？它和原词有什么区别？',
        '在什么其他情况下你会用到 "{word}"？试着想象一个现实生活场景。',
        '你怎么向朋友解释 "{word}" 而不用词典定义？',
      ]
    },
    {
      stage: 'apply',
      questions: [
        'Now try to create your own sentence using "{word}". Make it personal!',
        'If Bobby Axelrod used "{word}" in a negotiation, what might he say?',
        'How would you use "{word}" in a formal email vs. a casual conversation?',
      ],
      questionsCn: [
        '现在试试用 "{word}" 造一个你自己的句子。让它更个人化！',
        '如果鲍比·阿克斯罗德在谈判中用 "{word}"，他会怎么说？',
        '你在正式邮件和日常对话中会怎么不同地使用 "{word}"？',
      ]
    }
  ],
  grammar: [
    {
      stage: 'observe',
      questions: [
        'Look at this sentence: "{sentence}". What pattern do you notice in how it\'s structured?',
        'Compare these two ways of saying it. Which feels more natural, and why?',
        'Why do you think {character} chose to say it THIS way instead of a simpler way?',
      ],
      questionsCn: [
        '看看这个句子："{sentence}"。你注意到它的结构有什么规律吗？',
        '比较这两种说法。哪种感觉更自然？为什么？',
        '你觉得{character}为什么选择这种说法而不是更简单的方式？',
      ]
    },
    {
      stage: 'hypothesize',
      questions: [
        'If we changed "{original}" to "{modified}", how would the meaning change?',
        'What rule do you think governs this pattern? Can you form a hypothesis?',
        'Can you find a similar pattern in a sentence you already know?',
      ],
      questionsCn: [
        '如果我们把 "{original}" 改成 "{modified}"，意思会怎么变？',
        '你觉得什么规则支配了这个模式？你能形成一个假设吗？',
        '你能在你已知的句子中找到类似的模式吗？',
      ]
    },
    {
      stage: 'test',
      questions: [
        'Now apply this pattern to create a completely new sentence. Does it work?',
        'Try breaking the pattern on purpose. What happens? Does it sound wrong?',
        'Can you think of an exception to this rule? When might it NOT apply?',
      ],
      questionsCn: [
        '现在用这个模式创造一个全新的句子。它成立吗？',
        '试着故意打破这个模式。会怎样？听起来不对吗？',
        '你能想到这个规则的例外吗？什么时候它可能不适用？',
      ]
    }
  ],
  comprehension: [
    {
      stage: 'surface',
      questions: [
        'In your own words, what is {character} saying here?',
        'What emotion do you sense behind these words? Why might {character} feel that way?',
        'Who is {character} speaking to, and why does that matter for understanding the meaning?',
      ],
      questionsCn: [
        '用你自己的话，{character}在这里说了什么？',
        '你感受到这些话背后的什么情感？{character}为什么可能有这种感觉？',
        '{character}在对谁说话，为什么这对理解意思很重要？',
      ]
    },
    {
      stage: 'deeper',
      questions: [
        'Why does {character} use the metaphor of "{metaphor}"? What does it reveal about their worldview?',
        'If you heard this in real life, in what kind of situation would it be?',
        'What cultural knowledge do you need to fully understand this line?',
      ],
      questionsCn: [
        '{character}为什么使用 "{metaphor}" 这个比喻？它揭示了什么世界观？',
        '如果你在现实生活中听到这句话，会在什么情况下？',
        '要完全理解这句台词，你需要什么文化知识？',
      ]
    },
    {
      stage: 'critical',
      questions: [
        'Do you agree with what {character} is saying? Why or why not?',
        'How would this statement be received in Chinese culture vs. American culture?',
        'If you were in {character}\'s position, would you say the same thing? What would you say differently?',
      ],
      questionsCn: [
        '你同意{character}说的话吗？为什么同意或不同意？',
        '这句话在中国文化和美国文化中会被如何接受？',
        '如果你处于{character}的位置，你会说同样的话吗？你会怎么说？',
      ]
    }
  ]
};

// 苏格拉底式反馈模板
const feedbackTemplates = {
  encouraging: [
    "That's an interesting perspective! Let me ask you to go deeper...",
    "Good thinking! Now, what if we look at it from another angle?",
    "You're on the right track. Can you expand on that idea?",
    "Excellent observation! But here's a follow-up question...",
  ],
  encouragingCn: [
    '这是一个有趣的角度！让我请你更深入地思考...',
    '想得好！那如果我们换个角度看呢？',
    '你方向对了。你能展开这个想法吗？',
    '很棒的观察！但这里有个后续问题...',
  ],
  probing: [
    "Hmm, that's close. But what makes you think so? What evidence do you see?",
    "Interesting. But could there be another interpretation?",
    "You've found one layer. Can you dig deeper?",
    "That's a good start. Now challenge your own answer — what could be wrong about it?",
  ],
  probingCn: [
    '嗯，接近了。但是什么让你这么想？你看到了什么证据？',
    '有意思。但是否还有其他解读？',
    '你发现了一层。你能挖得更深吗？',
    '这是个好开始。现在挑战你自己的答案——它可能有什么问题？',
  ],
  redirecting: [
    "Let's take a step back. What do we know for certain about this?",
    "That's not quite it, but don't worry. Let me rephrase the question...",
    "Think about it this way: if you didn't know the translation, what clues would help you?",
    "Close, but try approaching it from {character}'s perspective. What are they really trying to say?",
  ],
  redirectingCn: [
    '让我们退一步。关于这个，我们确定知道什么？',
    '不太对，但别担心。让我换个方式提问...',
    '这样想：如果你不知道翻译，什么线索能帮助你？',
    '接近了，但试着从{character}的角度来看。他们真正想说什么？',
  ]
};

// 生成苏格拉底式对话
export function generateSocraticDialogue(scene, type = 'comprehension', stage = 'surface', useCn = true) {
  const templates = questionTemplates[type];
  if (!templates) return null;

  const stageTemplate = templates.find(t => t.stage === stage);
  if (!stageTemplate) return null;

  const questions = useCn ? stageTemplate.questionsCn : stageTemplate.questions;
  const question = questions[Math.floor(Math.random() * questions.length)];

  // 替换模板变量
  return question
    .replace(/{word}/g, scene.keywords?.[0]?.word || '')
    .replace(/{sentence}/g, scene.dialogue || '')
    .replace(/{character}/g, useCn ? scene.characterCn : scene.character)
    .replace(/{metaphor}/g, extractMetaphor(scene.dialogue))
    .replace(/{original}/g, scene.dialogue?.slice(0, 30) || '')
    .replace(/{modified}/g, modifySentence(scene.dialogue) || '');
}

// 生成苏格拉底式反馈
export function generateFeedback(quality, character, useCn = true) {
  let type;
  if (quality >= 4) type = 'encouraging';
  else if (quality >= 2) type = 'probing';
  else type = 'redirecting';

  const key = useCn ? type + 'Cn' : type;
  const templates = feedbackTemplates[key];
  const feedback = templates[Math.floor(Math.random() * templates.length)];

  return feedback.replace(/{character}/g, character || '角色');
}

// 获取对话流程的下一阶段
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

// 辅助函数：提取比喻
function extractMetaphor(dialogue) {
  if (!dialogue) return '';
  const metaphorWords = ['like', 'jungle', 'war', 'game', 'line', 'darkness', 'fire', 'napalm', 'bury'];
  for (const word of metaphorWords) {
    if (dialogue.toLowerCase().includes(word)) {
      const idx = dialogue.toLowerCase().indexOf(word);
      return dialogue.slice(Math.max(0, idx - 10), Math.min(dialogue.length, idx + 20));
    }
  }
  return dialogue.slice(0, 20);
}

// 辅助函数：修改句子（用于语法对比）
function modifySentence(dialogue) {
  if (!dialogue) return '';
  return dialogue
    .replace("don't", 'do')
    .replace("can't", 'can')
    .replace("won't", 'will')
    .slice(0, 40);
}

// 生成完整的苏格拉底教学会话
export function createSocraticSession(scene) {
  return {
    sceneId: scene.id,
    character: scene.character,
    dialogue: scene.dialogue,
    phases: [
      {
        type: 'comprehension',
        stages: ['surface', 'deeper', 'critical'],
        title: '理解台词',
        titleEn: 'Understanding the Line',
        icon: '🎯'
      },
      {
        type: 'vocabulary',
        stages: ['explore', 'connect', 'apply'],
        title: '词汇探索',
        titleEn: 'Vocabulary Exploration',
        icon: '📚'
      },
      {
        type: 'grammar',
        stages: ['observe', 'hypothesize', 'test'],
        title: '语法发现',
        titleEn: 'Grammar Discovery',
        icon: '🔧'
      }
    ]
  };
}
