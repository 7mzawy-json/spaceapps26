// AI-assisted by OpenAI Codex. Runs the existing TypeScript checks with Node 24, without installing tsx.
import { stripTypeScriptTypes } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, '.qa');
mkdirSync(out, { recursive: true });
for (const [input, output] of [['lib/evidence.ts','evidence.mjs'],['lib/offline-answer.ts','offline-answer.mjs'],['scripts/check_offline.ts','check-offline.mjs']]) {
  let code = stripTypeScriptTypes(readFileSync(join(root,input),'utf8'));
  code = code.replaceAll('"./evidence"','"./evidence.mjs"').replaceAll('"../lib/evidence"','"./evidence.mjs"').replaceAll('"../lib/offline-answer"','"./offline-answer.mjs"');
  if (input.startsWith('scripts/')) code = 'const __dirname = ' + JSON.stringify(join(root,'scripts')) + ';\n' + code;
  writeFileSync(join(out,output),code);
}
const result = spawnSync(process.execPath,[join(out,'check-offline.mjs')],{encoding:'utf8'});
process.stdout.write(result.stdout || '');process.stderr.write(result.stderr || '');
process.exit(result.status ?? 1);
