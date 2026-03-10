import { spawn } from 'node:child_process';
import http from 'node:http';
import process from 'node:process';

const PORT = Number(process.env.AI_BRIDGE_PORT || 8787);
const HOST = process.env.AI_BRIDGE_HOST || '127.0.0.1';
const CLI_COMMAND = process.env.LLM_CLI_COMMAND || 'gemini-internal';
const CLI_ARGS = process.env.LLM_CLI_ARGS || '-o text';
const CLI_MODE = process.env.LLM_CLI_MODE || 'arg';
const CLI_TEMPLATE = process.env.LLM_CLI_TEMPLATE || '';
const CLI_PROMPT_FLAG = process.env.LLM_CLI_PROMPT_FLAG || '-p';
const CLI_TIMEOUT_MS = Number(process.env.LLM_CLI_TIMEOUT_MS || 120000);

function json(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function safePreview(command) {
  if (!command) return '';
  return command.trim().split(/\s+/)[0] || '';
}

function buildPrompt(messages = [], systemInstruction = '') {
  const lines = [];

  if (systemInstruction) {
    lines.push('=== SYSTEM INSTRUCTION ===');
    lines.push(systemInstruction.trim());
    lines.push('');
  }

  lines.push('=== CONVERSATION ===');
  messages.forEach((message) => {
    const role = message.role === 'model' ? 'assistant' : message.role;
    const text = Array.isArray(message.parts)
      ? message.parts.map((part) => part.text || '').join('\n')
      : message.content || '';
    lines.push(`${role.toUpperCase()}: ${text}`);
  });
  lines.push('ASSISTANT:');

  return lines.join('\n');
}

function runCli({ prompt, messages, systemInstruction }) {
  return new Promise((resolve, reject) => {
    if (!CLI_COMMAND && !CLI_TEMPLATE) {
      reject(new Error('BRIDGE_NOT_CONFIGURED'));
      return;
    }

    const template = CLI_TEMPLATE
      .replaceAll('{{PROMPT_SHELL}}', shellQuote(prompt))
      .replaceAll('{{SYSTEM_SHELL}}', shellQuote(systemInstruction || ''))
      .replaceAll('{{MESSAGES_JSON_SHELL}}', shellQuote(JSON.stringify(messages || [])));

    let commandToRun = '';
    if (CLI_TEMPLATE) {
      commandToRun = template;
    } else if (CLI_MODE === 'arg') {
      const args = [CLI_ARGS, CLI_PROMPT_FLAG, shellQuote(prompt)].filter(Boolean).join(' ');
      commandToRun = `${CLI_COMMAND} ${args}`.trim();
    } else {
      commandToRun = `${CLI_COMMAND} ${CLI_ARGS}`.trim();
    }

    const child = spawn(commandToRun, {
      shell: true,
      env: {
        ...process.env,
        LLM_PROMPT: prompt,
        LLM_MESSAGES_JSON: JSON.stringify(messages || []),
        LLM_SYSTEM_PROMPT: systemInstruction || '',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`CLI_TIMEOUT_${CLI_TIMEOUT_MS}`));
    }, CLI_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(stderr.trim() || `CLI_EXIT_${code}`));
        return;
      }

      const result = stdout.trim();
      if (!result) {
        reject(new Error('CLI_EMPTY_RESPONSE'));
        return;
      }

      resolve(result);
    });

    if (!CLI_TEMPLATE && CLI_MODE !== 'arg') {
      child.stdin.write(prompt);
    }
    child.stdin.end();
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, {
      ok: true,
      configured: Boolean(CLI_COMMAND || CLI_TEMPLATE),
      mode: CLI_TEMPLATE ? 'template' : CLI_MODE,
      commandPreview: safePreview(CLI_TEMPLATE || CLI_COMMAND),
      timeoutMs: CLI_TIMEOUT_MS,
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    try {
      const body = await parseBody(req);
      const messages = body.messages || [];
      const systemInstruction = body.systemInstruction || '';
      const prompt = buildPrompt(messages, systemInstruction);
      const text = await runCli({ prompt, messages, systemInstruction });
      json(res, 200, { text });
    } catch (error) {
      json(res, 500, {
        error: error.message || 'AI_BRIDGE_ERROR',
      });
    }
    return;
  }

  json(res, 404, { error: 'NOT_FOUND' });
});

server.listen(PORT, HOST, () => {
  console.log(`AI Bridge ready at http://${HOST}:${PORT}`);
  console.log(`Configured: ${Boolean(CLI_COMMAND || CLI_TEMPLATE)}`);
  if (CLI_COMMAND || CLI_TEMPLATE) {
    console.log(`Command: ${safePreview(CLI_TEMPLATE || CLI_COMMAND)}`);
  } else {
    console.log('Set LLM_CLI_COMMAND or LLM_CLI_TEMPLATE before chatting.');
  }
});
