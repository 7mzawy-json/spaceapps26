// POST /api/chat: the Flashpoint SI assistant, powered by the Gemini API (the main system).
// Contract used by site/assets/app.js: request {"question": "..."}, reply 200 {"answer": "..."}.
// Any other status, or no reply within 8 seconds, makes the page use the rule-based fallback instead.
//
// Grounding: before calling Gemini, the question goes through the same rule-based engine the fallback uses
// (public/offline/offline-answer.js) to find the nearest NASA tests and the NASA facts that apply. Only those
// records go to the model, with the rule "answer only from these, cite accessions, say when they do not cover it".
//
// Environment (Vercel project settings, never in git): GEMINI_API_KEY (required), GEMINI_MODEL (optional).
// Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 7000;      // the page gives up at 8 s, so stop first and let it fall back
const MAX_QUESTION_CHARS = 500;
const MAX_ANSWER_TOKENS = 400;
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 20 };   // per visitor IP, per running instance (best effort)

// Load the NASA rows and the offline engine once per instance.
const ROOT = path.join(__dirname, '..');
const ROWS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'tests.web.json'), 'utf8'));
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'public', 'offline', 'offline-answer.js'), 'utf8') + '\nthis.F = FlashpointOffline;', sandbox);
const OFF = sandbox.F;

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > RATE_LIMIT.max;
}

const SYSTEM = [
  'You are the Flashpoint SI assistant for NASA Space Apps 2026 (challenge: Flame in Freefall).',
  'Flashpoint compares cabin atmospheres (oxygen percent and total pressure) with NASA microgravity fire tests from the',
  'Physical Science Informatics (PSI) database.',
  'Rules:',
  '- Answer ONLY from the records and facts given in the message. Never invent tests, numbers or sources.',
  '- Cite investigations by accession in square brackets, like [PSI-69].',
  '- If the records do not cover the question, say so plainly and say what is missing.',
  '- Every test in the data ran in microgravity. There is no Moon, Mars or Earth gravity data in PSI.',
  '- Many tests record no outcome; never treat "not recorded" as burned or went out.',
  '- This is research context, not safety certification. Keep it under 150 words, plain English, no markdown headings.',
  '- If the question is not about fire, flames, atmospheres or this data, politely say you only answer about NASA fire-safety data.',
].join('\n');

function context(question) {
  const off = OFF.answerOffline(question, ROWS);
  const lines = [];
  if (off.probe) lines.push(`Point read from the question: ${off.probe.o2_pct}% oxygen at ${off.probe.pressure_psi} psi.`);
  if (off.assumptions.length) lines.push(`Assumed: ${off.assumptions.join('; ')}.`);
  if (off.evidence) {
    lines.push(`Evidence rating: ${off.evidence.rating} (${off.evidence.nearCount} tests within ${OFF.O2_SCALE} points of oxygen or ${OFF.P_SCALE} psi).`);
    lines.push('Nearest NASA tests (JSON):');
    lines.push(JSON.stringify(off.evidence.nearest.map((n) => {
      const r = n.row;
      return { accession: r.accession, investigation: r.investigation, test: r.test_id, fuel: r.fuel, fuel_phase: r.fuel_phase,
        o2_pct: r.o2_pct, pressure_psi: r.pressure_psi, outcome: r.ignited === false ? 'did not ignite' : r.outcome,
        source: `${r.source}, line ${r.source_line}` };
    })));
  }
  lines.push('Rule-based summary and NASA facts that apply (each fact names its source):');
  off.paragraphs.slice(1, -1).forEach((p) => lines.push(`- ${p}`));
  return `Question: ${question}\n\nRecords:\n${lines.join('\n')}`;
}

async function askGemini(question) {
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: context(question) }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: MAX_ANSWER_TOKENS },
  };
  // Gemini 2.5 Flash thinks before answering by default; turn that off so the reply fits the 8-second window.
  if (/2\.5-flash/.test(MODEL)) body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Gemini replied ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    if (!text) throw new Error('Gemini returned no text');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return res.status(405).json({ error: 'POST only' }); }
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not set' });
  let payload = req.body;
  if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch (e) { payload = null; } }
  const question = payload && typeof payload.question === 'string' ? payload.question.trim() : '';
  if (!question) return res.status(400).json({ error: 'Send {"question": "..."}' });
  if (question.length > MAX_QUESTION_CHARS) return res.status(413).json({ error: `Question longer than ${MAX_QUESTION_CHARS} characters` });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many questions, try again in a few minutes' });
  try {
    return res.status(200).json({ answer: await askGemini(question) });
  } catch (err) {
    console.error('chat failed:', err.message);   // visible in Vercel's function logs; the page falls back
    return res.status(502).json({ error: 'The SI assistant could not answer' });
  }
};

// For scripts/check_chat_api.js only.
module.exports._context = context;
