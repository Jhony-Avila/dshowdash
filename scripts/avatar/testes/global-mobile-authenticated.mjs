// global-mobile-authenticated.mjs — Track D onda 2 (itens 6/7/12): runner da
// validação AUTENTICADA do shell mobile. NÃO roda no sandbox (exige sessão
// autenticada + backend real); ENTREGUE para a sessão do Jhony.
//
// USO (na máquina do Jhony, com o candidato Track D servido):
//   BASE_URL=https://dshowdash.com.br \
//   STORAGE_STATE=/caminho/seguro/auth.json \   (fora do Git; NÃO versionar)
//   PW_CHROME=/caminho/chromium \
//   node scripts/avatar/testes/global-mobile-authenticated.mjs [--boards]
//
// Ativa as6.mobile_shell SÓ no contexto do teste via override de navegador
// (localStorage dshow.shell.flags.v1); o default do servidor permanece OFF.
// Segredos (cookies/storage-state) NUNCA vão ao log nem ao pacote — só via env.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const BASE = process.env.BASE_URL; // preview do candidato em 127.0.0.1 (NÃO produção)
const STORAGE = process.env.STORAGE_STATE; // json de sessão autenticada (fora do Git)
const CHROME = process.env.PW_CHROME;
const OUT = process.env.OUTBOARDS || '/tmp/trackd-w2-boards';
const FAZER_BOARDS = process.argv.includes('--boards');
// Track D onda 3.1 (item 3): IDENTIDADE DO CÓDIGO SERVIDO. Sem provar que o BASE
// serve o candidato (e não main@bf655221), o teste seria contra produção antiga.
// Fail-closed: exige que um arquivo SÓ-do-candidato bata o sha256 esperado.
const MARKER_PATH = process.env.MARKER_PATH || '/components/app-shell/styles/global-mobile.css';
const EXPECTED_MARKER = process.env.EXPECTED_MARKER_SHA256; // passado pelo server-gate (do worktree candidato)
const EXPECTED_TREE = process.env.EXPECTED_CANDIDATE_TREE || '937b3874';
const SKIP_IDENTITY = process.env.SKIP_IDENTITY === '1';
if (!BASE || !CHROME) { console.error('defina BASE_URL (preview 127.0.0.1) e PW_CHROME'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

async function provarIdentidadeServida() {
  if (SKIP_IDENTITY) { console.log('SERVED_CODE_IDENTITY=SKIPPED (SKIP_IDENTITY=1)'); return 'SKIPPED'; }
  if (!EXPECTED_MARKER) { console.error('SERVED_CODE_IDENTITY=FAILED — defina EXPECTED_MARKER_SHA256 (sha256 do', MARKER_PATH, 'no worktree candidato) ou SKIP_IDENTITY=1'); process.exit(3); }
  let corpo;
  try {
    const r = await fetch(BASE.replace(/\/$/, '') + MARKER_PATH + '?identity_probe');
    if (!r.ok) { console.error(`SERVED_CODE_IDENTITY=FAILED — ${MARKER_PATH} devolveu ${r.status} (o preview NÃO serve o candidato Track D — 404 = provável produção antiga)`); process.exit(3); }
    corpo = Buffer.from(await r.arrayBuffer());
  } catch (e) { console.error('SERVED_CODE_IDENTITY=FAILED — não consegui buscar o marcador:', String(e).slice(0, 100)); process.exit(3); }
  const got = createHash('sha256').update(corpo).digest('hex');
  if (got !== EXPECTED_MARKER) { console.error(`SERVED_CODE_IDENTITY=FAILED — sha256 do marcador difere (servido ${got.slice(0, 12)} × esperado ${EXPECTED_MARKER.slice(0, 12)})`); process.exit(3); }
  console.log(`SERVED_CODE_IDENTITY=CONFIRMED (tree ${EXPECTED_TREE}; marcador ${MARKER_PATH} bate o sha256 do candidato)`);
  return 'CONFIRMED';
}

// rotas derivadas do registro real (ver nav-registry-contract). Ajuste conforme as permissões da conta.
const ROTAS = [
  ['home', '#/home'], ['dashboard', '#/dashboard'], ['geral', '#/geral'], ['compras', '#/compras'],
  ['financeiro', '#/financeiro'], ['comercial', '#/comercial'], ['clientes', '#/clientes'],
  ['analytics', '#/analytics'], ['pipedrive', '#/pipedrive'], ['bling', '#/bling'],
  ['docs', '#/docs'], ['api', '#/api'], ['google-ads', '#/google-ads'], ['avatar-studio', '#/avatar-studio'],
];
const VIEWPORTS = [
  [320,568],[360,640],[375,667],[390,844],[393,873],[412,915],[430,932],
  [667,375],[844,390],[768,1024],[1024,768],[1280,720],[1440,900],[1600,1000],
];

const resumo = { rotasValidadas: 0, rotasBloqueadas: 0, servicoIndisponivel: 0, erroNav: 0, erroApi: 0, viewportsOk: 0, boards: 0, casos: [] };
// item 3: prova de identidade ANTES de qualquer coisa (fail-closed)
resumo.servedCodeIdentity = await provarIdentidadeServida();
const nav = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, ...(STORAGE && existsSync(STORAGE) ? { storageState: STORAGE } : {}) });
  const pg = await ctx.newPage();
  const erros = []; pg.on('pageerror', (e) => erros.push(String(e)));

  await pg.goto(BASE, { waitUntil: 'domcontentloaded' });
  // ativa a flag SÓ neste navegador (default do servidor segue OFF)
  await pg.evaluate(() => { try { localStorage.setItem('dshow.shell.flags.v1', JSON.stringify({ 'as6.mobile_shell': true })); } catch {} });
  await pg.reload({ waitUntil: 'networkidle' });

  // ── item 6: matriz de rotas autenticada ──
  for (const [id, hash] of ROTAS) {
    const antes = erros.length;
    try {
      await pg.evaluate((h) => { location.hash = h; }, hash);
      await pg.waitForTimeout(700);
      const r = await pg.evaluate(() => ({
        ativo: !!document.querySelector('.nav-rail__item--active,[aria-current="page"]'),
        painel: !!document.querySelector('.dsd-shell__region--main *'),
        overlaysOrfaos: document.querySelectorAll('.avst6-mais-sheet:not([hidden]),.dsd-sidebar-overlay--visible').length,
        scrollLock: document.body.classList.contains('sidebar-mobile-open'),
        overflowH: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }));
      const jsNovo = erros.length - antes;
      let classe = 'validada';
      if (!r.painel) classe = 'erro-nav';
      if (jsNovo > 0) classe = 'erro-nav';
      if (classe === 'validada') { resumo.rotasValidadas++; if (FAZER_BOARDS) { await pg.screenshot({ path: `${OUT}/rota_${id}.png` }); resumo.boards++; } }
      else resumo.erroNav++;
      resumo.casos.push({ id, hash, classe, ...r, jsNovo });
      // higiene: nenhum overlay/scroll-lock órfão deve sobreviver à navegação
      if (r.overlaysOrfaos > 0 || r.scrollLock) resumo.casos.push({ id, alerta: 'orfão detectado (overlay/scroll-lock)' });
    } catch (e) {
      const msg = String(e);
      if (/429|HEAD/i.test(msg)) { resumo.servicoIndisponivel++; resumo.casos.push({ id, classe: 'servico-indisponivel', msg: msg.slice(0, 80) }); }
      else { resumo.erroNav++; resumo.casos.push({ id, classe: 'erro-nav', msg: msg.slice(0, 80) }); }
    }
  }

  // ── item 7: matriz de viewports (na home) ──
  await pg.evaluate(() => { location.hash = '#/home'; });
  for (const [w, h] of VIEWPORTS) {
    await pg.setViewportSize({ width: w, height: h });
    await pg.waitForTimeout(200);
    const r = await pg.evaluate(() => {
      const de = document.documentElement;
      const alvos = [...document.querySelectorAll('.nav-rail__item,.avst6-tk,.dsd-footer__control-btn,.avst6-mais-btn')];
      return {
        overflowH: de.scrollWidth > de.clientWidth + 1,
        alvosMenores: alvos.filter((a) => { const b = a.getBoundingClientRect(); return (b.width && b.width < 44) || (b.height && b.height < 44); }).length,
        órfãos: document.querySelectorAll('.dsd-sidebar-overlay--visible').length,
      };
    });
    const okv = !r.overflowH && r.alvosMenores === 0 && r.órfãos === 0;
    if (okv) resumo.viewportsOk++;
    resumo.casos.push({ viewport: `${w}x${h}`, ok: okv, ...r });
    if (FAZER_BOARDS) { await pg.screenshot({ path: `${OUT}/vp_${w}x${h}.png` }); resumo.boards++; }
  }

  writeFileSync(`${OUT}/resultado.json`, JSON.stringify({ ...resumo, jsErros: erros.length }, null, 2));
  console.log(JSON.stringify({ rotasValidadas: resumo.rotasValidadas, rotasBloqueadas: resumo.rotasBloqueadas, servicoIndisponivel: resumo.servicoIndisponivel, erroNav: resumo.erroNav, viewportsOk: `${resumo.viewportsOk}/${VIEWPORTS.length}`, boards: resumo.boards, jsErros: erros.length }, null, 2));
} finally { await nav.close(); }
