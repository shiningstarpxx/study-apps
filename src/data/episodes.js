// Billions (亿万) - 台词学习数据库
// 每条台词包含: 原文、中文翻译、场景描述、关键词汇、难度等级、语法点

export const episodes = [
  {
    id: 'S01E01',
    season: 1,
    episode: 1,
    title: 'Pilot',
    titleCn: '试播集',
    scenes: [
      {
        id: 'S01E01-001',
        character: 'Bobby Axelrod',
        characterCn: '鲍比·阿克斯罗德',
        context: 'Bobby addresses his team at Axe Capital about their trading strategy.',
        contextCn: '鲍比在Axe Capital向团队讲述交易策略。',
        dialogue: "What's the point of having 'fuck you' money if you never say 'fuck you'?",
        translation: "如果你从不说'去你的'，那拥有'去你的钱'有什么意义？",
        audioStart: 0,
        audioEnd: 4.5,
        difficulty: 3,
        keywords: [
          { word: 'fuck you money', meaning: '足够让你不在乎任何人的钱', partOfSpeech: 'noun phrase', example: "He saved enough to have 'fuck you money' and quit his job." },
          { word: 'point', meaning: '意义，要点', partOfSpeech: 'noun', example: "What's the point of working so hard?" }
        ],
        grammar: {
          point: "What's the point of + doing something - 用于质问做某事的意义",
          example: "What's the point of saving money if you never spend it?"
        },
        tags: ['finance', 'power', 'motivation']
      },
      {
        id: 'S01E01-002',
        character: 'Chuck Rhoades',
        characterCn: '查克·罗兹',
        context: 'Chuck speaks to his team at the U.S. Attorney\'s office about pursuing financial criminals.',
        contextCn: '查克在美国联邦检察官办公室对团队讲述追捕金融罪犯。',
        dialogue: "I don't just want toeli­minate the bugs. I want to napalm the entire jungle.",
        translation: '我不只是想消灭虫子。我要用凝固汽油弹烧掉整个丛林。',
        difficulty: 4,
        keywords: [
          { word: 'eliminate', meaning: '消除，消灭', partOfSpeech: 'verb', example: 'We need to eliminate all errors from the report.' },
          { word: 'napalm', meaning: '凝固汽油弹（此处用作动词：彻底摧毁）', partOfSpeech: 'verb/noun', example: 'The general ordered to napalm the enemy base.' },
          { word: 'jungle', meaning: '丛林（此处比喻复杂的金融世界）', partOfSpeech: 'noun', example: 'Wall Street is a concrete jungle.' }
        ],
        grammar: {
          point: "I don't just want to... I want to... - 递进表达，不仅...而且...",
          example: "I don't just want to pass the exam. I want to ace it."
        },
        tags: ['law', 'metaphor', 'power']
      },
      {
        id: 'S01E01-003',
        character: 'Wendy Rhoades',
        characterCn: '温迪·罗兹',
        context: 'Wendy counseling a trader who lost confidence after a bad trade.',
        contextCn: '温迪在为一位因糟糕交易而失去信心的交易员做心理辅导。',
        dialogue: "You're not afraid of losing money. You're afraid of being revealed as someone who doesn't deserve it.",
        translation: '你不是害怕亏钱。你害怕的是被揭露为一个不配拥有这些钱的人。',
        difficulty: 3,
        keywords: [
          { word: 'afraid of', meaning: '害怕...', partOfSpeech: 'adjective', example: "She's afraid of heights." },
          { word: 'revealed', meaning: '被揭露，被暴露', partOfSpeech: 'verb (past participle)', example: 'The truth was finally revealed.' },
          { word: 'deserve', meaning: '值得，配得上', partOfSpeech: 'verb', example: 'You deserve a promotion for your hard work.' }
        ],
        grammar: {
          point: "You're not... You're... - 否定+肯定的对比句式，揭示真实想法",
          example: "You're not tired. You're bored."
        },
        tags: ['psychology', 'self-awareness', 'finance']
      },
      {
        id: 'S01E01-004',
        character: 'Bobby Axelrod',
        characterCn: '鲍比·阿克斯罗德',
        context: 'Bobby talks to Wags about the nature of competition in finance.',
        contextCn: '鲍比和沃格斯讨论金融界竞争的本质。',
        dialogue: "In this game, you gotta be willing to die to win. Because the other side, they're willing to die to beat you.",
        translation: '在这个游戏里，你得愿意为胜利而死。因为对方，他们愿意为击败你而死。',
        difficulty: 3,
        keywords: [
          { word: 'gotta', meaning: '必须（got to 的口语形式）', partOfSpeech: 'modal verb', example: "You gotta try harder if you wanna succeed." },
          { word: 'willing to', meaning: '愿意...', partOfSpeech: 'adjective', example: "She's willing to take the risk." },
          { word: 'beat', meaning: '击败，打败', partOfSpeech: 'verb', example: 'Our team beat them in the finals.' }
        ],
        grammar: {
          point: "gotta be willing to... because... - 口语化的必要性表达 + 原因说明",
          example: "You gotta be willing to fail because that's how you learn."
        },
        tags: ['competition', 'motivation', 'finance']
      },
      {
        id: 'S01E01-005',
        character: 'Chuck Rhoades',
        characterCn: '查克·罗兹',
        context: 'Chuck explaining his approach to a colleague.',
        contextCn: '查克向同事解释他的做事方式。',
        dialogue: "I don't take meetings that I can't control. And I don't go to war without knowing I'm going to win.",
        translation: '我不参加我无法掌控的会议。我不打没把握赢的仗。',
        difficulty: 4,
        keywords: [
          { word: 'take meetings', meaning: '参加会议', partOfSpeech: 'verb phrase', example: 'I only take meetings that are productive.' },
          { word: 'control', meaning: '控制，掌控', partOfSpeech: 'verb', example: 'She likes to control every detail.' },
          { word: 'go to war', meaning: '开战（此处比喻采取法律行动）', partOfSpeech: 'idiom', example: "If they breach the contract, we'll go to war." }
        ],
        grammar: {
          point: "I don't... that I can't... - 双重否定的限定句式，表达严格标准",
          example: "I don't accept offers that I can't verify."
        },
        tags: ['strategy', 'law', 'power']
      },
      {
        id: 'S01E01-006',
        character: 'Wags',
        characterCn: '沃格斯',
        context: 'Wags rallying the traders before market open.',
        contextCn: '沃格斯在开盘前激励交易员们。',
        dialogue: "Let me be clear: we are not here to participate. We are here to dominate.",
        translation: '让我说清楚：我们不是来参与的。我们是来统治的。',
        difficulty: 2,
        keywords: [
          { word: 'participate', meaning: '参与', partOfSpeech: 'verb', example: 'Everyone is encouraged to participate in the discussion.' },
          { word: 'dominate', meaning: '统治，主导', partOfSpeech: 'verb', example: 'The company dominates the market.' },
          { word: 'let me be clear', meaning: '让我说清楚（强调语气）', partOfSpeech: 'phrase', example: 'Let me be clear: this behavior is unacceptable.' }
        ],
        grammar: {
          point: "We are not here to... We are here to... - 对比句式，强调真正目的",
          example: "We are not here to complain. We are here to find solutions."
        },
        tags: ['motivation', 'finance', 'leadership']
      }
    ]
  },
  {
    id: 'S01E02',
    season: 1,
    episode: 2,
    title: 'Naming Rights',
    titleCn: '命名权',
    scenes: [
      {
        id: 'S01E02-001',
        character: 'Bobby Axelrod',
        characterCn: '鲍比·阿克斯罗德',
        context: 'Bobby discussing loyalty with a fund manager.',
        contextCn: '鲍比与一位基金经理讨论忠诚。',
        dialogue: "Loyalty is not a concept. It's a practice. You either practice it every single day, or it's meaningless.",
        translation: '忠诚不是一个概念。它是一种实践。你要么每一天都在实践它，要么它就毫无意义。',
        difficulty: 3,
        keywords: [
          { word: 'loyalty', meaning: '忠诚', partOfSpeech: 'noun', example: 'His loyalty to the company is unquestionable.' },
          { word: 'concept', meaning: '概念', partOfSpeech: 'noun', example: "It's a difficult concept to grasp." },
          { word: 'practice', meaning: '实践；练习', partOfSpeech: 'noun/verb', example: 'Practice makes perfect.' },
          { word: 'meaningless', meaning: '毫无意义的', partOfSpeech: 'adjective', example: 'Without action, promises are meaningless.' }
        ],
        grammar: {
          point: "...is not... It's... You either... or... - 重新定义 + 二选一的强调句式",
          example: "Friendship is not a label. It's a commitment. You either honor it or it means nothing."
        },
        tags: ['values', 'leadership', 'philosophy']
      },
      {
        id: 'S01E02-002',
        character: 'Chuck Rhoades',
        characterCn: '查克·罗兹',
        context: 'Chuck in a heated exchange with a defense attorney.',
        contextCn: '查克与辩护律师激烈交锋。',
        dialogue: "You think this is a negotiation? This is a notification. You have 48 hours to accept, or I bury your client.",
        translation: '你以为这是谈判？这是通知。你有48小时接受，否则我将你的当事人打入深渊。',
        difficulty: 4,
        keywords: [
          { word: 'negotiation', meaning: '谈判', partOfSpeech: 'noun', example: 'The negotiation lasted for three days.' },
          { word: 'notification', meaning: '通知', partOfSpeech: 'noun', example: 'You will receive a notification by email.' },
          { word: 'bury', meaning: '埋葬（此处比喻彻底击败）', partOfSpeech: 'verb', example: "If we go to trial, I'll bury him with evidence." },
          { word: 'client', meaning: '当事人，客户', partOfSpeech: 'noun', example: 'The lawyer met with her client.' }
        ],
        grammar: {
          point: "You think this is...? This is... - 反问+纠正的强势句式",
          example: "You think this is a game? This is your career on the line."
        },
        tags: ['law', 'confrontation', 'power']
      },
      {
        id: 'S01E02-003',
        character: 'Wendy Rhoades',
        characterCn: '温迪·罗兹',
        context: 'Wendy giving advice to a young analyst about performance anxiety.',
        contextCn: '温迪给一位年轻分析师关于表现焦虑的建议。',
        dialogue: "Stop trying to be right. Start trying to be effective. Those are very different things.",
        translation: '别再试图证明自己是对的。开始试着变得有效。这是两件截然不同的事。',
        difficulty: 2,
        keywords: [
          { word: 'effective', meaning: '有效的', partOfSpeech: 'adjective', example: 'The new strategy proved highly effective.' },
          { word: 'trying to', meaning: '试图', partOfSpeech: 'verb phrase', example: "I'm trying to understand your perspective." }
        ],
        grammar: {
          point: "Stop + doing... Start + doing... - 停止...开始... 对比转变",
          example: "Stop worrying about perfection. Start focusing on progress."
        },
        tags: ['psychology', 'advice', 'mindset']
      },
      {
        id: 'S01E02-004',
        character: 'Bobby Axelrod',
        characterCn: '鲍比·阿克斯罗德',
        context: 'Bobby reflecting on his rise from humble beginnings.',
        contextCn: '鲍比回忆自己从卑微出身崛起的历程。',
        dialogue: "I grew up with nothing. And the one thing I learned is that nobody gives you anything. You have to take it.",
        translation: '我一无所有地长大。我学到的一件事是：没人会给你任何东西。你必须自己去争取。',
        difficulty: 2,
        keywords: [
          { word: 'grew up', meaning: '长大', partOfSpeech: 'verb phrase', example: 'She grew up in a small town.' },
          { word: 'nothing', meaning: '什么都没有', partOfSpeech: 'pronoun', example: 'He started with nothing and built an empire.' },
          { word: 'take it', meaning: '争取，夺取', partOfSpeech: 'verb phrase', example: "If you want success, you have to take it." }
        ],
        grammar: {
          point: "The one thing I learned is that... - 强调唯一的经验教训",
          example: "The one thing I learned is that consistency beats talent."
        },
        tags: ['personal', 'motivation', 'values']
      },
      {
        id: 'S01E02-005',
        character: 'Taylor Mason',
        characterCn: '泰勒·梅森',
        context: 'Taylor analyzing a potential investment opportunity.',
        contextCn: '泰勒分析一个潜在的投资机会。',
        dialogue: "The numbers don't lie, but they don't tell the whole story either. You have to read between the lines.",
        translation: '数字不会说谎，但它们也不能说明全部。你得读懂弦外之音。',
        difficulty: 3,
        keywords: [
          { word: "don't lie", meaning: '不会说谎', partOfSpeech: 'verb phrase', example: 'Statistics don\'t lie.' },
          { word: 'whole story', meaning: '全部事实', partOfSpeech: 'noun phrase', example: "That's not the whole story." },
          { word: 'read between the lines', meaning: '读懂弦外之音，看出言外之意', partOfSpeech: 'idiom', example: 'You need to read between the lines of this contract.' }
        ],
        grammar: {
          point: "...don't..., but they don't... either. You have to... - 双重否定 + 建议",
          example: "Words don't capture everything, but silence doesn't help either. You have to find the right balance."
        },
        tags: ['analysis', 'finance', 'critical thinking']
      },
      {
        id: 'S01E02-006',
        character: 'Chuck Rhoades',
        characterCn: '查克·罗兹',
        context: 'Chuck motivating his prosecutorial team.',
        contextCn: '查克激励他的检察团队。',
        dialogue: "We are the thin line between order and chaos. Every case we win, we push back the darkness just a little bit more.",
        translation: '我们是秩序与混乱之间的那道细线。我们每赢一个案子，就多击退一点黑暗。',
        difficulty: 3,
        keywords: [
          { word: 'thin line', meaning: '细线，微妙的界限', partOfSpeech: 'noun phrase', example: "There's a thin line between love and hate." },
          { word: 'order', meaning: '秩序', partOfSpeech: 'noun', example: 'The police maintained order during the protest.' },
          { word: 'chaos', meaning: '混乱', partOfSpeech: 'noun', example: 'The city was in total chaos after the storm.' },
          { word: 'push back', meaning: '击退，反击', partOfSpeech: 'phrasal verb', example: 'We need to push back against these regulations.' }
        ],
        grammar: {
          point: "We are the... between... and... Every... we... - 定义身份 + 强调每次行动的意义",
          example: "We are the bridge between theory and practice. Every experiment we run brings us closer to the truth."
        },
        tags: ['law', 'motivation', 'duty']
      }
    ]
  },
  {
    id: 'S01E03',
    season: 1,
    episode: 3,
    title: 'YumTime',
    titleCn: '美味时光',
    scenes: [
      {
        id: 'S01E03-001',
        character: 'Bobby Axelrod',
        characterCn: '鲍比·阿克斯罗德',
        context: 'Bobby advising a portfolio manager on risk-taking.',
        contextCn: '鲍比在风险管理上给投资组合经理建议。',
        dialogue: "The only way to make real money is to be willing to lose it. If you can't stomach the risk, you're in the wrong business.",
        translation: '赚大钱的唯一方法是愿意承担亏损。如果你承受不了风险，你入错行了。',
        difficulty: 3,
        keywords: [
          { word: 'real money', meaning: '真正的大钱', partOfSpeech: 'noun phrase', example: 'The real money is in tech stocks right now.' },
          { word: 'willing to', meaning: '愿意', partOfSpeech: 'adjective', example: 'Are you willing to take this chance?' },
          { word: 'stomach', meaning: '承受，忍受（动词用法）', partOfSpeech: 'verb', example: "I can't stomach another failed project." },
          { word: 'wrong business', meaning: '入错行', partOfSpeech: 'noun phrase', example: "If you can't handle pressure, you're in the wrong business." }
        ],
        grammar: {
          point: "The only way to... is to... If you can't..., you're... - 唯一途径 + 条件判断",
          example: "The only way to master a language is to use it daily. If you can't commit, you're wasting your time."
        },
        tags: ['finance', 'risk', 'advice']
      },
      {
        id: 'S01E03-002',
        character: 'Wendy Rhoades',
        characterCn: '温迪·罗兹',
        context: 'Wendy in a therapy session with a stressed trader.',
        contextCn: '温迪为一位压力巨大的交易员做心理辅导。',
        dialogue: "Your ego is not your ally here. The market doesn't care who you are or what you've done. It only cares about what you do next.",
        translation: '你的自尊心在这里不是你的盟友。市场不在乎你是谁或你做过什么。它只在乎你接下来做什么。',
        difficulty: 4,
        keywords: [
          { word: 'ego', meaning: '自我，自尊心', partOfSpeech: 'noun', example: 'His ego got in the way of his decision-making.' },
          { word: 'ally', meaning: '盟友', partOfSpeech: 'noun', example: 'She proved to be a valuable ally.' },
          { word: 'care about', meaning: '在乎', partOfSpeech: 'verb phrase', example: 'I care about your well-being.' }
        ],
        grammar: {
          point: "...doesn't care who you are... It only cares about... - 否定无关因素 + 强调唯一重要的事",
          example: "The audience doesn't care about your excuses. They only care about the performance."
        },
        tags: ['psychology', 'ego', 'market']
      },
      {
        id: 'S01E03-003',
        character: 'Chuck Rhoades',
        characterCn: '查克·罗兹',
        context: 'Chuck warning a potential witness about cooperation.',
        contextCn: '查克警告一位潜在证人关于合作的事。',
        dialogue: "There are only two kinds of people in a federal investigation: witnesses and targets. Choose wisely which one you want to be.",
        translation: '在联邦调查中只有两种人：证人和目标。明智地选择你想成为哪一种。',
        difficulty: 4,
        keywords: [
          { word: 'federal investigation', meaning: '联邦调查', partOfSpeech: 'noun phrase', example: 'The company is under federal investigation.' },
          { word: 'witness', meaning: '证人', partOfSpeech: 'noun', example: 'The witness testified in court.' },
          { word: 'target', meaning: '目标（此处指调查对象）', partOfSpeech: 'noun', example: 'He became the target of the investigation.' },
          { word: 'choose wisely', meaning: '明智地选择', partOfSpeech: 'verb phrase', example: 'Choose wisely; this decision affects your future.' }
        ],
        grammar: {
          point: "There are only two kinds of... Choose wisely which... - 二元选择的威胁/建议句式",
          example: "There are only two kinds of employees: those who grow and those who stagnate. Choose wisely."
        },
        tags: ['law', 'threat', 'choice']
      },
      {
        id: 'S01E03-004',
        character: 'Bobby Axelrod',
        characterCn: '鲍比·阿克斯罗德',
        context: 'Bobby talking to his wife Lara about maintaining their lifestyle.',
        contextCn: '鲍比和妻子拉拉讨论维持他们的生活方式。',
        dialogue: "Everything we have, everything our kids will have, I built with these two hands. And I'll be damned if I let anyone take it away.",
        translation: '我们拥有的一切，我们孩子将拥有的一切，都是我用这双手打造的。我绝不会让任何人把它夺走。',
        difficulty: 3,
        keywords: [
          { word: 'built', meaning: '建造，打造', partOfSpeech: 'verb (past tense)', example: 'She built her business from scratch.' },
          { word: "I'll be damned", meaning: '我绝不会（强烈的决心表达）', partOfSpeech: 'expression', example: "I'll be damned if I give up now." },
          { word: 'take away', meaning: '夺走', partOfSpeech: 'phrasal verb', example: 'No one can take away your education.' }
        ],
        grammar: {
          point: "Everything... I built with... And I'll be damned if... - 强调成就 + 誓死保卫",
          example: "Everything I know, I learned through hard work. And I'll be damned if I let them dismiss it."
        },
        tags: ['family', 'determination', 'personal']
      }
    ]
  }
];

// 学习等级定义
export const difficultyLevels = {
  1: { label: 'Beginner', labelCn: '初级', color: '#4CAF50', description: '简单日常对话' },
  2: { label: 'Elementary', labelCn: '初中级', color: '#8BC34A', description: '较简单的表达' },
  3: { label: 'Intermediate', labelCn: '中级', color: '#FFC107', description: '含习语和商务用语' },
  4: { label: 'Upper Intermediate', labelCn: '中高级', color: '#FF9800', description: '复杂句式和专业词汇' },
  5: { label: 'Advanced', labelCn: '高级', color: '#F44336', description: '高级商务和法律用语' }
};

// 标签分类
export const tagCategories = {
  finance: { label: '金融', icon: '💰' },
  law: { label: '法律', icon: '⚖️' },
  psychology: { label: '心理学', icon: '🧠' },
  power: { label: '权力', icon: '👑' },
  motivation: { label: '励志', icon: '🔥' },
  strategy: { label: '策略', icon: '♟️' },
  metaphor: { label: '比喻', icon: '🎭' },
  personal: { label: '个人', icon: '👤' },
  values: { label: '价值观', icon: '💎' },
  competition: { label: '竞争', icon: '⚔️' },
  leadership: { label: '领导力', icon: '🏆' },
  confrontation: { label: '对抗', icon: '🤝' },
  philosophy: { label: '哲学', icon: '📖' },
  advice: { label: '建议', icon: '💡' },
  mindset: { label: '思维', icon: '🎯' },
  analysis: { label: '分析', icon: '📊' },
  'critical thinking': { label: '批判性思维', icon: '🔍' },
  ego: { label: '自我', icon: '🪞' },
  market: { label: '市场', icon: '📈' },
  risk: { label: '风险', icon: '⚡' },
  threat: { label: '威胁', icon: '⚠️' },
  choice: { label: '选择', icon: '🔀' },
  duty: { label: '职责', icon: '🛡️' },
  family: { label: '家庭', icon: '👨‍👩‍👧‍👦' },
  determination: { label: '决心', icon: '💪' },
  'self-awareness': { label: '自我认知', icon: '🔮' }
};

// 获取所有台词（扁平化）
export function getAllScenes() {
  return episodes.flatMap(ep =>
    ep.scenes.map(scene => ({
      ...scene,
      episodeId: ep.id,
      episodeTitle: ep.title,
      episodeTitleCn: ep.titleCn,
      season: ep.season,
      episode: ep.episode
    }))
  );
}

// 根据难度获取台词
export function getScenesByDifficulty(level) {
  return getAllScenes().filter(s => s.difficulty === level);
}

// 根据标签获取台词
export function getScenesByTag(tag) {
  return getAllScenes().filter(s => s.tags.includes(tag));
}

// 获取所有关键词（去重）
export function getAllKeywords() {
  const keywords = new Map();
  getAllScenes().forEach(scene => {
    scene.keywords.forEach(kw => {
      if (!keywords.has(kw.word)) {
        keywords.set(kw.word, { ...kw, scenes: [scene.id] });
      } else {
        keywords.get(kw.word).scenes.push(scene.id);
      }
    });
  });
  return Array.from(keywords.values());
}
