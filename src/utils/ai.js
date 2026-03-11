const AI_BRIDGE_STORAGE_KEY = 'AI_BRIDGE_SETTINGS';

const DEFAULT_BRIDGE_SETTINGS = {
  bridgeUrl: 'http://127.0.0.1:8787',
};

export function getBridgeSettings() {
  try {
    const raw = localStorage.getItem(AI_BRIDGE_STORAGE_KEY);
    if (!raw) return DEFAULT_BRIDGE_SETTINGS;
    return { ...DEFAULT_BRIDGE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRIDGE_SETTINGS;
  }
}

export function saveBridgeSettings(settings) {
  const next = { ...getBridgeSettings(), ...settings };
  localStorage.setItem(AI_BRIDGE_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function checkBridgeHealth(settings = getBridgeSettings()) {
  const response = await fetch(`${settings.bridgeUrl.replace(/\/$/, '')}/health`);
  if (!response.ok) {
    throw new Error('BRIDGE_HEALTHCHECK_FAILED');
  }
  return response.json();
}

export async function chatWithAI(messages, systemInstruction, settings = getBridgeSettings()) {
  const response = await fetch(`${settings.bridgeUrl.replace(/\/$/, '')}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      systemInstruction,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'AI_BRIDGE_RESPONSE_ERROR');
  }

  return data.text;
}

export function getSocraticSystemPrompt(scene, currentPhase, session, options = {}) {
  const {
    mode = 'follow_up',
    nextPhase = null,
    quality = 0,
    turnCount = 0,
    maxTurns = currentPhase?.maxTurns || 3,
  } = options;

  const guardrails = session?.guardrails?.map((rule, index) => `${index + 1}. ${rule}`).join('\n') || '';
  return `
You are a Socratic English tutor for a premium Billions-based learning app.

CURRENT LINE
- Character: ${scene.character}
- Dialogue: "${scene.dialogue}"
- Translation: ${scene.translation}
- Keywords: ${scene.keywords.map((keyword) => keyword.word).join(', ')}
- Grammar focus: ${scene.grammar?.point || 'N/A'}

CURRENT PHASE
- ${currentPhase.title} (${currentPhase.type})
- Phase goal: ${currentPhase.goal || 'Stay focused on meaning, wording, structure, and reuse.'}
- Learner turn count in this phase: ${turnCount}/${maxTurns}
- Local quality score: ${quality}/5

NEXT PHASE
- ${nextPhase ? `${nextPhase.title} (${nextPhase.type})` : 'None'}

MODE
- ${mode}

MANDATORY GUARDRAILS
${guardrails}

GLOBAL RESPONSE RULES
1. Always stay on the English-learning track: meaning, wording, tone, structure, and practical reuse.
2. Do not drift into politics, morality debates, or broad philosophy.
3. Encourage English output. Chinese can be used only to keep the learner oriented.
4. Keep the answer under 120 words and make it feel like a sharp tutor, not a generic chatbot.
5. If the learner drifts, pull them back to the line, its keywords, or its sentence pattern.
6. Never keep expanding one phase endlessly. Once the key point is covered, wrap it and move on.

MODE RULES
- open: ask the first question for the current phase only.
- follow_up: briefly validate the learner, then ask exactly one tighter follow-up question inside the current phase.
- transition: briefly confirm the learner has covered enough, explicitly close the current phase, smoothly introduce the next phase, and ask exactly one opening question for the next phase.
- complete: briefly confirm the line is complete, summarize 2 learning gains, and tell the learner to move to the next line or quiz. Do not ask another question.

PHASE GOALS
- comprehension: paraphrase the meaning, identify tone clues, and move toward practical use.
- vocabulary: explain the keyword in context, compare nuance, and make the learner build a new sentence.
- grammar: identify the pattern, explain what it changes, and ask the learner to reuse it.

OUTPUT REQUIREMENTS
- open / follow_up: 1 short feedback sentence + 1 question only
- transition: 1 short closing sentence + 1 short transition sentence + 1 question only
- complete: 2-3 short sentences, no question
`.trim();
}
