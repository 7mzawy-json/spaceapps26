// Checks api/chat.js without a real key or network: a fake fetch stands in for Gemini.
// Run: node scripts/check_chat_api.js   (exit code 1 if a check fails)
// Written with an AI coding assistant (Claude Code); see docs/ai-usage-log.md.
'use strict';
const handler = require('../api/chat.js');
let fails = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails++; };
function call(method, body, headers) {
  return new Promise((resolve) => {
    const res = { code: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; },
      json(o) { resolve({ code: this.code, body: o }); return this; } };
    handler({ method, body, headers: headers || {} }, res);
  });
}
(async () => {
  delete process.env.GEMINI_API_KEY;
  check((await call('POST', { question: 'hi' })).code === 503, 'no key: 503, so the page falls back');
  process.env.GEMINI_API_KEY = 'test-key';
  let sent = null;
  global.fetch = async (url, init) => { sent = { url, init }; return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'FLEX ran near this point [PSI-69].' }] } }] }) }; };
  check((await call('GET')).code === 405, 'GET: 405');
  check((await call('POST', {})).code === 400, 'empty question: 400');
  check((await call('POST', { question: 'x'.repeat(600) })).code === 413, 'oversized question: 413');
  const ok = await call('POST', JSON.stringify({ question: 'Is 30% oxygen at 10.2 psi on the Moon safe for fabric?' }), { 'x-forwarded-for': '1.1.1.1' });
  check(ok.code === 200 && /PSI-69/.test(ok.body.answer), 'good question: 200 with {"answer"}');
  const prompt = JSON.parse(sent.init.body).contents[0].parts[0].text;
  check(sent.init.headers['x-goog-api-key'] === 'test-key' && !sent.url.includes('test-key'), 'key goes in a header, not the URL');
  check(/PSI-69/.test(prompt) && /line \d+/.test(prompt) && /partial-gravity/.test(prompt), 'prompt carries nearest NASA tests with source lines and the facts');
  global.fetch = async () => ({ ok: false, status: 429, text: async () => 'quota' });
  check((await call('POST', { question: '30% oxygen at 10 psi' }, { 'x-forwarded-for': '2.2.2.2' })).code === 502, 'Gemini error: 502, so the page falls back');
  global.fetch = async () => ({ ok: true, json: async () => ({ answer: 1 }) });
  let last; for (let i = 0; i < 21; i++) last = await call('POST', { question: '30% oxygen at 10 psi' }, { 'x-forwarded-for': '3.3.3.3' });
  check(last.code === 429, 'more than 20 questions in 10 minutes from one visitor: 429');
  console.log('\n--- prompt sent to Gemini ---\n' + prompt.slice(0, 900));
  console.log(fails ? `\n${fails} FAILED` : '\nAll chat API checks passed.');
  process.exit(fails ? 1 : 0);
})();
