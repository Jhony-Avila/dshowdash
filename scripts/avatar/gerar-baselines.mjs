// scripts/avatar/gerar-baselines.mjs — RELATÓRIO de baselines §605
// (lote 153). @version 1.0.0  @created 2026-08-04
//
// Determinístico (sem NOW): pesos reais do dist, tetos do gate, contagem
// da suíte e do catálogo → docs/AVATAR-STUDIO-5/baselines.md. O git diz
// QUANDO mudou; o diff diz O QUE mudou — regressão de peso/cobertura
// aparece no code review sem rodar nada.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..');
const DIST = join(RAIZ, 'public/components/panels/panel-avatar-studio/dist/chunks');
const kb = (b) => Math.round((b / 1024) * 10) / 10;

const pesos = JSON.parse(readFileSync(join(RAIZ, 'scripts/deploy/pesos-esperados.json'), 'utf8'))['panel-avatar-studio'];
const chunks = readdirSync(DIST).filter((f) => f.endsWith('.js'))
  .map((f) => ({ nome: f.replace(/\.[A-Za-z0-9_-]+\.js$/, ''), kbReal: kb(statSync(join(DIST, f)).size) }))
  .sort((a, b) => a.nome.localeCompare(b.nome));

const suite = readFileSync(join(RAIZ, 'scripts/avatar/testes/rodar-todos.mjs'), 'utf8');
const nTestes = (suite.match(/\.mjs'/g) ?? []).length;

// mega 306 (§605 v2): flags e chaves de storage CONHECIDAS também são
// baseline — flag/chave nova aparece no diff deste arquivo
const flagsSrc = readFileSync(join(RAIZ, 'public/components/panels/panel-avatar-studio/src/nucleo/flags.ts'), 'utf8');
const nFlags = (flagsSrc.match(/'as5\.[a-z0-9_]+'/g) ?? []).length;
function chavesStorage(dir) {
  const chaves = new Set();
  for (const f of readdirSync(dir, { recursive: true })) {
    if (!/\.(ts|tsx)$/.test(String(f))) continue;
    const txt = readFileSync(join(dir, String(f)), 'utf8');
    for (const m of txt.matchAll(/'(dshow\.[a-z0-9._-]+)'/gi)) chaves.add(m[1]);
  }
  return [...chaves].sort();
}
const chaves = chavesStorage(join(RAIZ, 'public/components/panels/panel-avatar-studio/src'));
const manifest = JSON.parse(readFileSync(join(RAIZ, 'docs/AVATAR-STUDIO-5/manifest-assets.json'), 'utf8'));

const linhas = chunks.map((c) => {
  const teto = pesos[`chunks/${c.nome}`];
  const pct = teto ? Math.round((c.kbReal / teto) * 100) : null;
  return `| ${c.nome} | ${c.kbReal}KB | ${teto ? `${teto}KB` : '—'} | ${pct !== null ? `${pct}%` : '—'} |`;
});

writeFileSync(join(RAIZ, 'docs/AVATAR-STUDIO-5/baselines.md'), `# Baselines §605 — Avatar Studio

Gerado por \`node scripts/avatar/gerar-baselines.mjs\` (determinístico —
regenerar após cada build; o diff no git É o relatório de regressão).

## Peso dos chunks × gate

| chunk | real | teto | uso |
|---|---|---|---|
${linhas.join('\n')}

## Cobertura

- Suíte de navegador/node: **${nTestes} arquivos** (rodar-todos) + nucleo.test.
- Catálogo 2D: **${manifest.resumo.itens2d} itens** em ${manifest.resumo.categorias} categorias · ${manifest.resumo.titulos} títulos · ${manifest.resumo.colecoes} coleções.
- Personagens 3D publicados: **${manifest.resumo.personagens3d}**.
- Feature flags \`as5.*\`: **${nFlags}** (§605 v2 — nova flag = diff aqui).
- Chaves de storage conhecidas: **${chaves.length}** (§629):
${chaves.map((k) => `  - \`${k}\``).join('\n')}
`);
console.log(`baselines → docs/AVATAR-STUDIO-5/baselines.md (${chunks.length} chunks · ${nTestes} testes)`);
