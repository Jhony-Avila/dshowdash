#!/usr/bin/env node
// scripts/avatar/gerar-harness.mjs — gera os HARNESSES locais de validação.
// @version 1.0.0  @created 2026-07-30
//
// Motivo: os harnesses referenciam bundles COM HASH (o CSS também muda de
// hash!) e eram recriados à mão a cada build — fonte recorrente de tela
// sem estilo/JS velho. Este script lê o manifest do Vite de cada painel e
// escreve o harness correto. Os arquivos gerados ficam em public/ e NUNCA
// entram no git (o .gitignore ignora /public/* por construção).
//
// Uso (da raiz do repo, após `npx vite build` no painel):
//   node scripts/avatar/gerar-harness.mjs            # gera os dois
//   node scripts/avatar/gerar-harness.mjs avatar     # só o do Avatar Studio
//   node scripts/avatar/gerar-harness.mjs dashboard  # só o da Home/Geral
//
// Depois: python3 -m http.server 8901 (de public/) e aponte os testes para
// http://127.0.0.1:8901/<arquivo>. Os mocks de fetch cobrem os endpoints
// que cada painel consome; testes específicos podem editar o arquivo gerado
// localmente (ele é descartável).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..', '..');

function manifestDe(painel) {
  const caminho = resolve(RAIZ, 'public', 'components', 'panels', painel, 'dist', '.vite', 'manifest.json');
  return JSON.parse(readFileSync(caminho, 'utf8'));
}

function entradaDe(manifesto) {
  const chave = Object.keys(manifesto).find((k) => manifesto[k]?.isEntry);
  const reg = manifesto[chave];
  if (!reg) throw new Error('entry não encontrada no manifest');
  // o CSS pode pertencer a um CHUNK (ex.: avatar-studio pendura o css no
  // _entry lazy) — coleta a união de todos os registros do manifest
  const css = new Set();
  for (const r of Object.values(manifesto)) {
    for (const c of r?.css ?? []) css.add(c);
    if (r?.file?.endsWith('.css')) css.add(r.file);
  }
  return { js: reg.file, css: [...css] };
}

function html({ titulo, base, js, css, mocks, monta }) {
  return `<!doctype html>
<!-- harness LOCAL de validação (GERADO por scripts/avatar/gerar-harness.mjs — não vai para o git) -->
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titulo}</title>
${css.map((c) => `<link rel="stylesheet" href="${base}${c}">`).join('\n')}
<style>html,body{margin:0;height:100%;background:#0d1017}#host{min-height:100vh}</style>
</head>
<body>
<div id="host"></div>
<script>
  const RESPOSTAS = [
${mocks.map(([re, corpo]) => `    [${re}, (u, opts) => (${corpo})],`).join('\n')}
    [/\\/api\\//, (u, opts) => ({ ok: true, data: {} })],
  ];
  const fetchReal = window.fetch.bind(window);
  window.fetch = (url, opts) => {
    const u = String(url instanceof Request ? url.url : url);
    for (const [re, gerar] of RESPOSTAS) {
      if (re.test(u)) {
        return Promise.resolve(new Response(JSON.stringify(gerar(u, opts)), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
    }
    return fetchReal(url, opts);
  };
</script>
<script type="module">
  import { mountReact } from '${base}${js}';
  await mountReact(document.getElementById('host'), ${monta});
  window.__pronto = true;
</script>
</body>
</html>
`;
}

function gerarAvatar() {
  const { js, css } = entradaDe(manifestDe('panel-avatar-studio'));
  const base = '/components/panels/panel-avatar-studio/dist/';
  const doc = html({
    titulo: 'AVST Harness',
    base, js, css,
    mocks: [
      ['/\\/api\\/avatar\\/studio\\.php\\?historico=1/', '{ ok: true, data: { itens: [], retencao: 100 } }'],
      ['/\\/api\\/avatar\\/studio\\.php\\?fotos=1/', '{ ok: true, data: { fotos: [] } }'],
      // onda 1423: teste pode SEMEAR um avatar salvo via localStorage
      // 'avst.harness.config' (ex.: legado p/ o fluxo de upgrade #214)
      ['/\\/api\\/avatar\\/studio\\.php/', "(localStorage.getItem('avst.harness.config') ? { ok: true, data: { config: JSON.parse(localStorage.getItem('avst.harness.config')), version: 3, render_url: null, avatar_url: null, tipo_ativo: null, config_camadas_recente: null, config_3d_recente: null } } : { ok: true, data: { config: null, version: 0, render_url: null, avatar_url: null, tipo_ativo: null, config_camadas_recente: null, config_3d_recente: null } })"],
      ['/\\/api\\/avatar\\/vida\\.php/', "{ ok: true, data: { conquistas: [{ id: 'cq1', nome: 'Primeiro Look', descricao: 'Salvou o primeiro avatar', categoria: 'criacao', conquistada: true, em: '2026-07-20 10:00:00', recompensa: null, progresso: { atual: 1, alvo: 1 } },{ id: 'cq2', nome: 'Explorador', descricao: 'Explorou 10 itens', categoria: 'exploracao', conquistada: true, em: '2026-07-28 15:30:00', recompensa: null, progresso: { atual: 10, alvo: 10 } },{ id: 'cq3', nome: 'Colecionador', descricao: 'Complete uma coleção', categoria: 'colecao', conquistada: false, em: null, recompensa: 'mol_ouro', progresso: { atual: 2, alvo: 6 } }], eventos: [], desbloqueados: ['mol_glitch','ace_capa_heroica','efe_moedas','emb_fenix'], ia_disponivel: false } }"],
      ['/\\/api\\/avatar\\/personagens3d\\.php/', "{ success: true, data: { personagens: [], fonte: 'registry' } }"],
      ['/\\/api\\/avatar\\/vitrine\\.php/', '{ ok: true, data: { equipe: [], secoes: [], colecoes: [] } }'],
      ['/\\/api\\/avatar\\/estado\\.php/', "(window.__ch619 = window.__ch619 || [], window.__ch619.push({ m: (opts && opts.method) || 'GET', corpo: opts && opts.body ? JSON.parse(opts.body) : null }), ((opts && opts.method) === 'POST') ? (JSON.parse(opts.body).draft ? { success: true, data: { checksum: 'ck' + window.__ch619.length }, errors: [], meta: {} } : { success: true, data: { versao: 7 }, errors: [], meta: {} }) : { success: true, data: { perfil: { id: 1 }, estado: null, checksum: 'ck0', versoes: [] }, errors: [], meta: {} })"],
      ['/\\/api\\/auth\\/check\\.php/', "{ ok: true, data: { session: { csrf_token: 'x' } } }"],
    ],
    monta: '{}',
  });
  writeFileSync(resolve(RAIZ, 'public', 'avst-harness.html'), doc);
  console.log(`public/avst-harness.html → ${js} + ${css.join(', ') || 'SEM CSS'}`);
}

function gerarDashboard() {
  const { js, css } = entradaDe(manifestDe('panel-dashboard'));
  const base = '/components/panels/panel-dashboard/dist/';
  const doc = html({
    titulo: 'GER Harness',
    base, js, css,
    mocks: [
      ['/\\/api\\/traffic\\/summary\\.php/', "{ ok: true, data: { level: 'moderate', index: 44, updated_at: new Date().toISOString(), stale: false, message: 'Trânsito moderado' } }"],
      ['/\\/api\\/ads\\/status/', '{ ok: true, data: { accounts: 1, active_campaigns: 6, provider_real: false } }'],
      ['/\\/api\\/anuncios\\/stats\\.php/', '{ ok: true, data: { total_perguntas: 128, feedback_util: 0.82 } }'],
      ['/\\/api\\/home\\/weather\\.php/', "{ ok: true, data: { atual: { grupo: 'limpo', temperatura: 24, sensacao: 25, descricao: 'Céu limpo', umidade: 48, ventoKmh: 9, chuvaMm: 0, uv: 6, visibilidadeKm: 10, nascer: '06:40', por: '17:45' }, dias: [], horas: [] } }"],
      ['/\\/api\\/auth\\/check\\.php/', "{ ok: true, data: { session: { user_name: 'Jhony', csrf_token: 'x' } } }"],
    ],
    monta: '{}',
  });
  writeFileSync(resolve(RAIZ, 'public', 'ger-harness.html'), doc);
  console.log(`public/ger-harness.html → ${js} + ${css.join(', ') || 'SEM CSS'}`);
}

const alvo = process.argv[2] ?? 'todos';
if (!['avatar', 'dashboard', 'todos'].includes(alvo)) {
  console.error(`alvo desconhecido: ${alvo} (use avatar | dashboard | todos)`);
  process.exit(1);
}
if (alvo === 'avatar' || alvo === 'todos') gerarAvatar();
// Golden V3 (#219): em 'todos', se o build do panel-dashboard não existir, NÃO
// derruba a geração do avatar (que é o alvo do Avatar Studio) — apenas avisa.
// 'dashboard' explícito ainda falha (o operador pediu o dashboard).
if (alvo === 'dashboard') gerarDashboard();
if (alvo === 'todos') {
  try { gerarDashboard(); }
  catch (e) { console.warn(`aviso: harness do dashboard pulado (${e.message}). avst-harness.html já foi gerado.`); }
}
