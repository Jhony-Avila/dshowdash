// scripts/bling-smoke-bundle.mjs — conferência do bundle do painel Bling
// @version 1.0.0  @created 2026-07-30
//
// Uso:  node scripts/bling-smoke-bundle.mjs
// Sai 0 se tudo passar, 1 se algo falhar.
//
// POR QUE ESTE SCRIPT EXISTE
// Em 2026-07-30 o build passou sem UM único aviso e gerou um bundle de 23 kB
// sem o App dentro: faltava `preserveEntrySignatures: 'strict'`, e o Rollup
// removeu tudo por dead-code (o entry é consumido como biblioteca pelo
// adaptador vanilla, não como app). O painel montaria em branco em produção.
//
// `vite build` verde NÃO prova que o painel existe. Este script prova.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = '/var/www/dshowdash/public/components/panels/panel-bling/dist';
let falhas = 0;

const ok = (nome, cond, detalhe = '') => {
  console.log(`  ${cond ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✘\x1b[0m'} ${nome}${detalhe ? `  (${detalhe})` : ''}`);
  if (!cond) falhas++;
};

console.log('\n\x1b[1mBundle do painel Bling\x1b[0m\n');

if (!existsSync(DIST)) {
  console.error('  dist/ não existe. Rode o build antes.');
  process.exit(1);
}

// ── manifest ────────────────────────────────────────────────
const caminhoManifest = join(DIST, '.vite/manifest.json');
ok('manifest gerado', existsSync(caminhoManifest));
if (!existsSync(caminhoManifest)) process.exit(1);

const manifest = JSON.parse(readFileSync(caminhoManifest, 'utf8'));
const chaveEntry = Object.keys(manifest).find(k => k.endsWith('src/entry.tsx'));
ok('manifest aponta para src/entry.tsx', Boolean(chaveEntry), chaveEntry ?? 'ausente');
if (!chaveEntry) process.exit(1);

const regEntry = manifest[chaveEntry];
const arqEntry = join(DIST, regEntry.file);
ok('arquivo do entry existe', existsSync(arqEntry), regEntry.file);
ok('entry declara CSS', Array.isArray(regEntry.css) && regEntry.css.length > 0);

// ── conteúdo do entry ───────────────────────────────────────
const entry = readFileSync(arqEntry, 'utf8');
const tamEntry = statSync(arqEntry).size;

// Este é O teste que teria pego o bug do dead-code.
ok('entry tem tamanho compatível com o App', tamEntry > 90_000,
   `${(tamEntry / 1024).toFixed(1)} kB — abaixo de 90 kB significa App removido por tree-shaking`);

ok('entry exporta mountReact', /export\s*\{[^}]*\bmountReact\b/.test(entry) || /\bmountReact\b/.test(entry));
ok('entry exporta unmountReact', /\bunmountReact\b/.test(entry));

// Marcadores que só existem se o código de verdade entrou no bundle.
const marcadores = [
  ['raiz do painel',       'data-bl-root'],
  ['tarja de simulado',    'Ambiente de demonstra'],
  ['cartão compartilhado', 'bl-cartao'],
  ['sub-sidebar',          'Seções do Bling'],
  ['grid server-side',     'Buscar nesta tela'],
  ['catálogo de telas',    'Necessidades de Compra'],
  ['tela customizada',     'Central Operacional'],
  ['cliente da API',       '/api/bling'],
];
for (const [nome, agulha] of marcadores) {
  ok(`entry contém ${nome}`, entry.includes(agulha), `"${agulha}"`);
}

// ── envelope: o módulo NÃO pode testar j.success ─────────────
const arquivos = [];
const varrer = d => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) varrer(p);
    else if (n.endsWith('.js')) arquivos.push(p);
  }
};
varrer(DIST);

let usaSuccess = 0;
for (const f of arquivos) {
  const s = readFileSync(f, 'utf8');
  // `.success` como leitura de envelope. É o bug §7.8 da Fase 0 — o widget
  // legado do header faz exatamente isso e está preso em "--" desde sempre.
  if (/\.success\b/.test(s) && /api\/bling/.test(s)) usaSuccess++;
}
ok('nenhum arquivo lê envelope por .success', usaSuccess === 0,
   usaSuccess > 0 ? `${usaSuccess} arquivo(s) — o envelope é {ok}` : 'envelope {ok}');

// ── chunks pesados separados ────────────────────────────────
const porNome = {};
for (const f of arquivos) {
  const base = f.split('/').pop();
  const nome = base.split('-')[0];
  porNome[nome] = (porNome[nome] ?? 0) + statSync(f).size;
}

ok('ECharts em chunk próprio', (porNome.echarts ?? 0) > 100_000,
   `${((porNome.echarts ?? 0) / 1024).toFixed(0)} kB`);
ok('D3 em chunk próprio (não vazio)', (porNome.d3 ?? 0) > 10_000,
   `${((porNome.d3 ?? 0) / 1024).toFixed(1)} kB — vazio significa que o D3 não entrou`);
ok('TanStack em chunk próprio', (porNome.tanstack ?? 0) > 5_000,
   `${((porNome.tanstack ?? 0) / 1024).toFixed(1)} kB`);
ok('React em chunk próprio', (porNome.react ?? 0) > 100_000,
   `${((porNome.react ?? 0) / 1024).toFixed(0)} kB`);
ok('ECharts NÃO está no entry', tamEntry < 400_000,
   `entry ${(tamEntry / 1024).toFixed(1)} kB`);

// ── CSS ─────────────────────────────────────────────────────
const css = regEntry.css?.map(c => readFileSync(join(DIST, c), 'utf8')).join('\n') ?? '';
ok('CSS escopado em [data-bl-root]', css.includes('[data-bl-root]'));
ok('CSS tem tema claro por sinal confiável',
   css.includes('data-theme="light"') || css.includes('body.theme-light'),
   'html[data-theme] / body.theme-* — nunca :root.theme-light');
ok('CSS NÃO usa :root.theme-light', !/:root\.theme-light/.test(css),
   'essa classe existe nos DOIS temas e prenderia o painel no claro');

// ── total ───────────────────────────────────────────────────
const total = arquivos.reduce((s, f) => s + statSync(f).size, 0);
console.log(`\n  peso total do bundle: ${(total / 1024).toFixed(0)} kB`);
console.log(`  primeiro paint (entry + react): ${((tamEntry + (porNome.react ?? 0)) / 1024).toFixed(0)} kB\n`);

console.log('─'.repeat(60));
console.log(falhas === 0
  ? '  \x1b[32mtodas as verificações passaram\x1b[0m\n'
  : `  \x1b[31m${falhas} verificação(ões) falharam\x1b[0m\n`);

process.exit(falhas === 0 ? 0 : 1);
