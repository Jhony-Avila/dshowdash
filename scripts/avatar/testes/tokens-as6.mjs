// testes/tokens-as6.mjs — lote 761–770 (AS6 L0 §576–§586 + §561,
// decisão #78): camada semântica de tokens.
//   A) DOUTRINA DE COR: os 11 hex consolidados NUNCA mais aparecem
//      soltos no estudio.css (só como valor do token no tokens.css) e
//      cada token --as6-* tem valor hex válido — pixel a pixel igual
//      por construção (token = mesmo hex que estava inline);
//   B) REGISTRY DE MOVIMENTO §561: paridade nos DOIS sentidos entre as
//      @keyframes do estudio.css e o REGISTRO_ANIMACOES (keyframe sem
//      registro OU registro órfão = vermelho);
//   C) EASINGS nomeados existem e o cubic-bezier padrão não volta solto.
// Node puro — as regras são de FONTE (o pixel é guardado pela suíte de
// screenshots existente, que roda com os tokens aplicados).
// @version 1.0.0  @created 2026-08-08
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const estudio = readFileSync(join(PAINEL, 'src/styles/estudio.css'), 'utf8');
const tokens = readFileSync(join(PAINEL, 'src/styles/tokens.css'), 'utf8');

// ── A) doutrina de cor ──────────────────────────────────────────────
const CONSOLIDADOS = {
  '--as6-superficie-0': '#0a0d15', '--as6-superficie-1': '#0d1017',
  '--as6-superficie-2': '#12151d', '--as6-superficie-3': '#161b26',
  '--as6-superficie-4': '#232a38', '--as6-texto-forte': '#e6eaf2',
  '--as6-texto-suave': '#8a93a6', '--as6-acento': '#7c5cff',
  '--as6-atencao': '#e8b64c', '--as6-perigo': '#ff5230',
  '--as6-sucesso': '#39d98a',
};
for (const [token, hex] of Object.entries(CONSOLIDADOS)) {
  const re = new RegExp(`${token}:\\s*${hex}\\b`, 'i');
  ok(re.test(tokens), `token ${token} deveria valer ${hex} no tokens.css`);
  const solto = new RegExp(`${hex}\\b`, 'ig');
  const usos = estudio.match(solto) ?? [];
  ok(usos.length === 0, `hex ${hex} voltou SOLTO no estudio.css (${usos.length}×) — use var(${token})`);
}
ok((estudio.match(/var\(--as6-/g) ?? []).length >= 250,
  'consolidação suspeita: menos de 250 usos de var(--as6-*) no estudio.css');

// ── B) registry de movimento §561 (paridade dupla) ──────────────────
const noCss = new Set([...estudio.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g)].map((m) => m[1]));
const tmp = mkdtempSync(join(tmpdir(), 'avst-tok-'));
writeFileSync(join(tmp, 'prova.ts'), `
import { REGISTRO_ANIMACOES } from '${PAINEL}/src/shell/movimento';
console.log(JSON.stringify(Object.keys(REGISTRO_ANIMACOES)));
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
let registradas = [];
try {
  execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=neutral ` +
    `--outfile="${join(tmp, 'prova.mjs')}"`, { stdio: 'pipe' });
  registradas = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }).trim());
} catch (e) {
  falhas.push(`bundle do movimento.ts falhou: ${e.message}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
const noRegistro = new Set(registradas);
for (const nome of noCss) {
  ok(noRegistro.has(nome), `@keyframes ${nome} SEM entrada no REGISTRO_ANIMACOES (§561)`);
}
for (const nome of noRegistro) {
  ok(noCss.has(nome), `registro órfão: ${nome} não existe mais no estudio.css`);
}
ok(noCss.size >= 25, `inventário de keyframes suspeito (${noCss.size})`);

// ── C) easings nomeados ─────────────────────────────────────────────
for (const t of ['--t-ease-suave', '--t-ease-elastico', '--t-ease-saida']) {
  ok(new RegExp(`${t}:\\s*cubic-bezier\\(`).test(tokens), `easing ${t} ausente no tokens.css`);
}
ok(!estudio.includes('cubic-bezier(0.22, 0.9, 0.26, 1)'),
  'o easing padrão voltou SOLTO no estudio.css — use var(--t-ease-suave)');

if (falhas.length) { console.error('FALHAS tokens-as6:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('tokens-as6 OK');
