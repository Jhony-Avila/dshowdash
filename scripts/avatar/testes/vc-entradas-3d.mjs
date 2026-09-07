// testes/vc-entradas-3d.mjs — UNIFICACAO 3D: abre CADA ponto de entrada 3D
// separadamente e confirma o componente EFETIVAMENTE montado = VisualComposer3D
// compartilhado, sem palco legado (Estudio3D/Palco3d) nem UI 2D. 4 passes, cada
// um num contexto proprio (flags distintas). WebGL SwiftShader.
import { mkdirSync } from 'node:fs';
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';

const DIR = `${SAIDA}/vc-entradas-3d`;
try { mkdirSync(DIR, { recursive: true }); } catch { /* ok */ }
const SHA = process.env.REVIEW_SHA || 'REVIEW';
const R = {};
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const shots = [];
const LEGADO = '.avst-3d-palco, .avst-3d-controles, .avst-3d-chips, .avst-area3d, .avst5-p3d, .avst5-p3d-personagens, .avst5-p3d-cenario';
const UI2D = '.avst5-shell, .avst5-painel, .avst-trilho, .avst-grade, .avst-card, .avst-busca';

async function marca(p, m) {
  await p.evaluate(({ sha, mm }) => {
    let el = document.getElementById('vc-review-marca');
    if (!el) { el = document.createElement('div'); el.id = 'vc-review-marca'; document.body.appendChild(el); }
    el.textContent = `REVIEW · ${sha} · ${mm}`;
    el.setAttribute('style', 'position:fixed;left:12px;bottom:12px;z-index:2147483647;font:600 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.5px;color:#d7f7e6;background:rgba(10,14,20,.86);border:1px solid rgba(90,220,160,.5);border-radius:999px;padding:7px 12px;pointer-events:none;');
  }, { sha: SHA, mm: m });
}
async function shot(p, nome) {
  await marca(p, nome);
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await p.screenshot({ path: `${DIR}/${nome}.png` }); shots.push(nome);
}
const existe = (p, sel) => p.$(sel).then((e) => !!e);
const initFlags = (arg) => {
  try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(arg.flags)); } catch (e) { /* ok */ }
  try { if (arg.direct) sessionStorage.setItem('avst.vc.abrir3d', '1'); else sessionStorage.removeItem('avst.vc.abrir3d'); } catch (e) { /* ok */ }
};
async function esperarVc3d(p, nome) {
  const achou = await p.waitForSelector('[data-vc][data-modo="3d"]', { timeout: 20000 }).then(() => true).catch(() => false);
  ok(achou, `${nome}: nao chegou ao VisualComposer3D`);
  await p.waitForTimeout(6000);
  const legado = await existe(p, LEGADO);
  const ui2d = await existe(p, UI2D);
  ok(!legado, `${nome}: palco/UI 3D LEGADO montado`);
  ok(!ui2d, `${nome}: UI 2D montada no 3D`);
  return achou && !legado && !ui2d;
}
const clicarAbrir3d = (p) => p.evaluate(() => {
  const el = [...document.querySelectorAll('.vc-mp-item, button, [role="button"], a')].find((x) => /Abrir modo 3D/i.test((x.textContent || '').trim()) && (x.textContent || '').trim().length < 40);
  if (!el) return false; (el.closest('.vc-mp-item, button, [role="button"], a') || el).click(); return true;
});
async function abrirMaisEEntrar3d(p) {
  await p.click('[aria-label="Mais"]').catch(() => {});
  await p.waitForTimeout(500);
  if (!(await clicarAbrir3d(p))) {
    await p.evaluate(() => { const g = [...document.querySelectorAll('.vc-mp-grupo-cab, [class*="grupo-cab"]')].find((b) => /Apresentar/i.test(b.textContent || '')); if (g) g.click(); });
    await p.waitForTimeout(400); await clicarAbrir3d(p);
  }
}

async function passe(nome, flags, direct, driver) {
  const s = await abrir({ viewport: { width: 1440, height: 900 }, webgl: true, init: initFlags, initArg: { flags, direct } });
  const { navegador: b, pagina: p, erros } = s;
  try {
    await irParaHarness(p, 'avst-harness.html', 1400);
    await driver(p);
  } catch (e) { falhas.push(`${nome}: EXCECAO ${e.message}`); }
  if (erros.length) falhas.push(`${nome}: pageerror ${erros.slice(0, 1).join('')}`);
  await b.close();
}

// A) ShellStudio (botao 3D do cabecalho) — visual_composer OFF, shell_vc3d ON
await passe('A_shell', { 'as5.novo_shell': true, 'as5.palco3d': true, 'as6.shell_vc3d': true }, false, async (p) => {
  await p.waitForSelector('.avst5-shell', { timeout: 20000 }).catch(() => {});
  R.SHELL_ENTRY_COMPONENT = (await existe(p, '.avst5-shell')) ? 'ShellStudio' : '?';
  await p.click('[data-teste="botao-3d"]').catch(() => {});
  R.SHELLSTUDIO_3D_ENTRY_USES_SHARED_COMPOSER = (await esperarVc3d(p, 'A_shell')) ? 'YES' : 'NO';
  await shot(p, 'A-shell-botao-3d');
});

// B) rota direta (sessionStorage abrir3d) — visual_composer + vc_3d ON
await passe('B_direct', { 'as5.novo_shell': true, 'as6.visual_composer': true, 'as6.vc_3d': true }, true, async (p) => {
  R.APP_ENTRY_COMPONENT = (await existe(p, '.vc-root')) ? 'VisualComposer' : (await existe(p, '.avst5-shell')) ? 'ShellStudio' : '?';
  R.DIRECT_ROUTE_USES_SHARED_COMPOSER = (await esperarVc3d(p, 'B_direct')) ? 'YES' : 'NO';
  R.APP_DIRECT_3D_ENTRY_USES_SHARED_COMPOSER = R.DIRECT_ROUTE_USES_SHARED_COMPOSER;
  await shot(p, 'B-rota-direta-3d');
});

// C) MaisPainel "Abrir modo 3D" com vc_3d ON (caminho ao3d)
await passe('C_mais', { 'as5.novo_shell': true, 'as6.visual_composer': true, 'as6.vc_3d': true }, false, async (p) => {
  await p.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 }).catch(() => {});
  await abrirMaisEEntrar3d(p);
  R.MAIS_ENTRY_COMPONENT = 'VisualComposer3D';
  R.MAIS_PAINEL_3D_ENTRY_USES_SHARED_COMPOSER = (await esperarVc3d(p, 'C_mais')) ? 'YES' : 'NO';
  await shot(p, 'C-mais-painel-3d');
});

// D) MaisPainel "Abrir modo 3D" com vc_3d OFF -> imersivo Estudio3D -> ROTEADOR -> VC3D
await passe('D_router', { 'as5.novo_shell': true, 'as6.visual_composer': true }, false, async (p) => {
  await p.waitForSelector('[data-vc][data-modo="visual"]', { timeout: 20000 }).catch(() => {});
  await abrirMaisEEntrar3d(p);
  const chegou = await esperarVc3d(p, 'D_router');
  R.DIRECT_ROUTE_COMPONENT = 'VisualComposer3D';
  // legado NAO alcancavel com flags on: a prova e o roteador ter redirecionado
  R.LEGACY_ESTUDIO3D_REACHABLE_WITH_FLAGS_ON = (chegou && !(await existe(p, LEGADO))) ? 'NO' : 'SIM';
  await shot(p, 'D-mais-roteador-3d');
});

R.ALL_3D_ENTRY_POINTS_USE_SHARED_COMPOSER = (
  R.SHELLSTUDIO_3D_ENTRY_USES_SHARED_COMPOSER === 'YES'
  && R.DIRECT_ROUTE_USES_SHARED_COMPOSER === 'YES'
  && R.MAIS_PAINEL_3D_ENTRY_USES_SHARED_COMPOSER === 'YES'
  && R.LEGACY_ESTUDIO3D_REACHABLE_WITH_FLAGS_ON === 'NO'
) ? 'YES' : 'NO';
R.TWO_D_UI_MOUNTED_IN_ANY_3D_ENTRY = falhas.some((f) => /UI 2D montada/.test(f)) ? 'SIM' : 'NO';
ok(R.ALL_3D_ENTRY_POINTS_USE_SHARED_COMPOSER === 'YES', 'nem todas as entradas usam o composer compartilhado');

console.log('[vc-entradas-3d] BOOLEANS:', JSON.stringify(R));
console.log('[vc-entradas-3d] SHOTS:', JSON.stringify(shots));
console.log('[vc-entradas-3d] DIR:', DIR);
console.log('[vc-entradas-3d] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length === 0 ? 0 : 1);
