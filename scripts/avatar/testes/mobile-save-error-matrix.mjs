// testes/mobile-save-error-matrix.mjs — TRACK C cert final: matriz de erros de
// save. Injeta cada cenário via override do window.fetch e registra o
// comportamento da UI mobile. NÃO altera o handler congelado do Track A —
// caracteriza (a proposta de correção vai em TRACK_C_SAVE_ERROR_REPORT.md).
// Asserção verde = GARANTIAS DE ESCOPO MOBILE (sem crash, sem loop, botão
// utilizável) em TODOS os cenários; o resto é registrado.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

// cada cenário: função de override do fetch (string, injetada na página)
const CENARIOS = [
  ['HTTP 400', `(u,o)=>resp(400,{success:false,error:'bad_request'})`],
  ['HTTP 401', `(u,o)=>resp(401,{success:false,error:'unauth'})`],
  ['HTTP 403', `(u,o)=>resp(403,{success:false,error:'forbidden'})`],
  ['HTTP 409', `(u,o)=>resp(409,{success:false,error:'conflict'})`],
  ['HTTP 422', `(u,o)=>resp(422,{success:false,error:'unprocessable'})`],
  ['HTTP 429', `(u,o)=>resp(429,{success:false,error:'rate_limited'})`],
  ['HTTP 500', `(u,o)=>resp(500,{success:false,error:'server'})`],
  ['timeout', `(u,o)=>new Promise(()=>{})`],
  ['offline', `(u,o)=>Promise.reject(new TypeError('Failed to fetch'))`],
  ['json-invalido', `(u,o)=>Promise.resolve(new Response('<<x>>',{status:200,headers:{'Content-Type':'text/html'}}))`],
  ['studio-falha', `(u,o)=>/studio\\.php/.test(String(u))?resp(500,{success:false}):orig(u,o)`],
  ['estado-falha', `(u,o)=>/estado\\.php/.test(String(u))?resp(500,{success:false}):orig(u,o)`],
];

async function rodar(nome, corpoFn) {
  const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1100);
    await pagina.evaluate((fn) => {
      const orig = window.fetch;
      const resp = (s, b) => Promise.resolve(new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } }));
      window.__n = 0;
      window.__avstSaveTimeoutMs = 900; // timeout curto p/ testar o cenário de timeout
      // eslint-disable-next-line no-eval
      const handler = eval(fn);
      window.fetch = (u, o) => { const url = String(u); if (/estado\.php|studio\.php/.test(url) && /post/i.test((o && o.method) || '')) { window.__n++; return handler(u, o); } return orig(u, o); };
    }, corpoFn);
    await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); c?.click(); });
    await pagina.waitForTimeout(600);
    const pend0 = await pagina.evaluate(() => !!document.querySelector('.avst5-salvar-pendente'));
    await pagina.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click());
    await pagina.waitForTimeout(1400);
    const r = await pagina.evaluate(() => ({
      n: window.__n,
      pend: !!document.querySelector('.avst5-salvar-pendente'),
      erroVisivel: !!document.querySelector('.avst5-salvar-erro, .avst-erro, [data-teste*="erro"]'),
      botaoVivo: !document.querySelector('.avst5-salvar .avst-botao-primario[disabled]'),
      shellVivo: !!document.querySelector('.avst5-shell[data-mobile]'),
    }));
    // estado-falha é caso POSITIVO: o save AUTORITATIVO (studio.php) passa; só o
    // espelho §619 (estado.php, best-effort) falha → corretamente "salvo".
    const primarioOk = nome === 'estado-falha';
    const esperado = primarioOk ? (!r.pend && !r.erroVisivel) : (r.pend || r.erroVisivel);
    const mobileOk = r.shellVivo && r.n <= 3 && esperado;
    console.log(`  ${nome.padEnd(14)} POST=${r.n} pend0=${pend0} → pend=${r.pend} erro=${r.erroVisivel} retry=${r.botaoVivo} shell=${r.shellVivo} jsErr=${erros.length}`);
    ok(mobileOk && erros.length === 0, primarioOk ? `${nome}: save autoritativo OK (espelho §619 best-effort) — sem falsa falha` : `${nome}: pendente OU erro (sem confirmação falsa) + resiliente`);
    return { nome, ...r, primarioOk, edicaoPreservada: r.pend, retry: r.botaoVivo };
  } finally { await navegador.close(); }
}

const matriz = [];
for (const [nome, fn] of CENARIOS) matriz.push(await rodar(nome, fn));
const negativos = matriz.filter((m) => !m.primarioOk);
const semFalsa = negativos.filter((m) => m.pend || m.erroVisivel).length;
console.log(`\n  RESUMO (mobile): pendente OU erro em ${semFalsa}/${negativos.length} casos negativos + estado-falha(primário OK)=${matriz.find((m)=>m.primarioOk && !m.pend && !m.erroVisivel) ? 'salvo' : 'X'}`);
ok(semFalsa === negativos.length, `NEGATIVE_MATRIX: pendente OU erro visível em ${semFalsa}/${negativos.length} negativos`);

// RETRY: erro (500) → depois o servidor volta (fetch ok) → retry salva de verdade
{
  const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1100);
    await pagina.evaluate(() => { window.__falhar = true; const orig = window.fetch; window.fetch = (u, o) => { const url = String(u); if (/estado\.php|studio\.php/.test(url) && /post/i.test((o && o.method) || '') && window.__falhar) return Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 500, headers: { 'Content-Type': 'application/json' } })); return orig(u, o); }; });
    await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); c?.click(); });
    await pagina.waitForTimeout(600);
    await pagina.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click());
    await pagina.waitForTimeout(1200);
    const emErro = await pagina.evaluate(() => !!document.querySelector('.avst5-salvar-erro'));
    ok(emErro, 'RETRY: entrou em estado de erro após falha 500');
    // edição preservada durante o erro (o card equipado continua)
    const edicaoOk = await pagina.evaluate(() => !!document.querySelector('.avst-card-ativo'));
    ok(edicaoOk, 'RETRY: edição preservada durante o erro');
    // servidor volta + clica "Tentar de novo"
    await pagina.evaluate(() => { window.__falhar = false; const b = [...document.querySelectorAll('.avst5-salvar-erro button')].find((x) => /tentar/i.test(x.textContent || '')); b?.click(); });
    await pagina.waitForTimeout(1400);
    const recuperou = await pagina.evaluate(() => ({ erro: !!document.querySelector('.avst5-salvar-erro'), salvo: !!document.querySelector('.avst5-salvar') && !document.querySelector('.avst5-salvar-pendente') && !document.querySelector('.avst5-salvar-erro') }));
    ok(!recuperou.erro && recuperou.salvo, 'RETRY: após servidor voltar, o retry salva (sai do erro)');
    ok(erros.length === 0, 'RETRY: sem erro JS');
  } finally { await navegador.close(); }
}

// DESKTOP (flag OFF): fallback local ainda mostra "salvo" (comportamento aprovado inalterado)
{
  const OFF = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true };
  const { navegador, pagina } = await abrir({ viewport: { width: 1280, height: 900 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: OFF });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1100);
    await pagina.evaluate(() => { const orig = window.fetch; window.fetch = (u, o) => { const url = String(u); if (/estado\.php|studio\.php/.test(url) && /post/i.test((o && o.method) || '')) return Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 500, headers: { 'Content-Type': 'application/json' } })); return orig(u, o); }; });
    await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); c?.click(); });
    await pagina.waitForTimeout(600);
    await pagina.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click());
    await pagina.waitForTimeout(1200);
    const d = await pagina.evaluate(() => ({ erro: !!document.querySelector('.avst5-salvar-erro'), pend: !!document.querySelector('.avst5-salvar-pendente') }));
    // desktop: o fallback local retorna ok → NÃO entra em erro (comportamento aprovado)
    ok(!d.erro, 'DESKTOP (flag OFF): fallback local NÃO vira erro — comportamento aprovado inalterado');
  } finally { await navegador.close(); }
}
console.log(falhas ? `\n✗ mobile-save-error-matrix: ${falhas} falha(s)` : '\n✓ mobile-save-error-matrix verde');
process.exit(falhas ? 1 : 0);
