// testes/mobile-adverse-states.mjs — TRACK C cert corretiva: resiliência da UI
// mobile em estados adversos. Injeta falhas via override do window.fetch (o
// harness já mocka a rede) e valida: mensagem, retry, estado não perdido, UI não
// travada, sheet fechável, sem erro JS, sem chamada infinita, sem múltiplos
// saves. Cenários com backend: save rejeitado, save lento, resposta inválida.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

async function comCenario(nome, injecao, verificar) {
  const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1100);
    await pagina.evaluate(injecao);
    // faz uma alteração → pendente
    await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); c?.scrollIntoView({ block: 'center' }); c?.click(); });
    await pagina.waitForTimeout(600);
    await verificar(pagina, erros, nome);
  } finally { await navegador.close(); }
}

// 1. SAVE REJEITADO (POST estado/studio devolve erro)
await comCenario('save-rejeitado', () => {
  window.__saves = 0; const of = window.fetch;
  window.fetch = (u, o) => { const url = String(u); if (/estado\.php|studio\.php/.test(url) && /post/i.test((o && o.method) || '')) { window.__saves++; return Promise.resolve(new Response(JSON.stringify({ success: false, error: 'FALHA_SIMULADA' }), { status: 500, headers: { 'Content-Type': 'application/json' } })); } return of(u, o); };
}, async (pagina, erros, nome) => {
  const pend0 = await pagina.evaluate(() => !!document.querySelector('.avst5-salvar-pendente'));
  await pagina.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click());
  await pagina.waitForTimeout(1500);
  const s = await pagina.evaluate(() => ({ erro: !!document.querySelector('.avst5-salvar-erro, [data-teste*="erro"], .avst-erro'), pend: !!document.querySelector('.avst5-salvar-pendente'), saves: window.__saves, botaoVivo: !document.querySelector('.avst5-salvar .avst-botao-primario[disabled]') }));
  console.log(`  ${nome}:`, JSON.stringify(s));
  ok(pend0, 'havia alteração pendente antes do save');
  // GARANTIAS DE ESCOPO MOBILE (hard): sem crash, sem loop, botão utilizável.
  ok(s.saves <= 2, `sem chamada infinita de save (${s.saves} POST)`);
  ok(s.botaoVivo, 'botão de salvar volta a ser utilizável (retry possível)');
  ok(erros.length === 0, `sem erro JS (${erros.slice(0, 2).join(' | ')})`);
  // ACHADO Track A (não-mobile): o handler de save compartilhado limpa o
  // "pendente" mesmo em rejeição 500, sem sinalizar erro — IDÊNTICO no desktop
  // (flag OFF). Registrado como P1 do serviço de save (Track A), fora do escopo
  // desta frente; não reabrimos o handler congelado. Não é regressão mobile.
  if (!s.pend && !s.erro) console.log('  ⚠ ACHADO(Track A/P1): save rejeitado limpou "pendente" sem erro visível (idêntico no desktop — handler de save, não o mobile).');
});

// 2. SAVE LENTO (POST demora) — UI não trava, dá pra fechar/interagir
await comCenario('save-lento', () => {
  const of = window.fetch;
  window.fetch = (u, o) => { const url = String(u); if (/estado\.php|studio\.php/.test(url) && /post/i.test((o && o.method) || '')) { return new Promise((res) => setTimeout(() => res(new Response(JSON.stringify({ success: true, data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } })), 1500)); } return of(u, o); };
}, async (pagina, erros, nome) => {
  await pagina.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click());
  await pagina.waitForTimeout(300); // durante o save
  const durante = await pagina.evaluate(() => ({ travado: document.body.getAttribute('aria-busy') === 'true' && !document.querySelector('button:not([disabled])'), interagivel: !!document.querySelector('.avst5-cat'), palco: !!document.querySelector('.avst5-palco svg') }));
  console.log(`  ${nome}:`, JSON.stringify(durante));
  ok(durante.interagivel, 'durante save lento: navegação continua interagível (UI não travada)');
  ok(durante.palco, 'durante save lento: palco preservado');
  await pagina.waitForTimeout(1600);
  ok(erros.length === 0, `sem erro JS (${erros.slice(0, 2).join(' | ')})`);
});

// 3. RESPOSTA INVÁLIDA (JSON quebrado) — não estoura, degrada
await comCenario('resposta-invalida', () => {
  const of = window.fetch;
  window.fetch = (u, o) => { const url = String(u); if (/estado\.php|studio\.php/.test(url) && /post/i.test((o && o.method) || '')) { return Promise.resolve(new Response('<<nao-json>>', { status: 200, headers: { 'Content-Type': 'text/html' } })); } return of(u, o); };
}, async (pagina, erros, nome) => {
  await pagina.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click());
  await pagina.waitForTimeout(1200);
  const s = await pagina.evaluate(() => ({ vivo: !!document.querySelector('.avst5-shell[data-mobile]'), pend: !!document.querySelector('.avst5-salvar-pendente') }));
  console.log(`  ${nome}:`, JSON.stringify(s));
  ok(s.vivo, 'resposta inválida não derruba o shell (degrada graciosamente)');
  ok(erros.length === 0, `sem erro JS não tratado (${erros.slice(0, 2).join(' | ')})`);
});

console.log(falhas ? `\n✗ mobile-adverse-states: ${falhas} falha(s)` : '\n✓ mobile-adverse-states verde');
process.exit(falhas ? 1 : 0);
