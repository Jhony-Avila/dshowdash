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
    // garantias mobile (hard): shell vivo, sem loop (≤3 POST), botão utilizável
    const mobileOk = r.shellVivo && r.n <= 3 && r.botaoVivo;
    console.log(`  ${nome.padEnd(14)} POST=${r.n} pend0=${pend0} → pend=${r.pend} erro=${r.erroVisivel} retry=${r.botaoVivo} shell=${r.shellVivo} jsErr=${erros.length}`);
    ok(mobileOk && erros.length === 0, `${nome}: UI mobile resiliente (sem crash/loop, botão vivo)`);
    return { nome, ...r, edicaoPreservada: r.pend, retry: r.botaoVivo };
  } finally { await navegador.close(); }
}

const matriz = [];
for (const [nome, fn] of CENARIOS) matriz.push(await rodar(nome, fn));
// resumo do handler (herdado Track A): quantos preservam pendente / mostram erro
const preserva = matriz.filter((m) => m.pend).length;
const comErro = matriz.filter((m) => m.erroVisivel).length;
console.log(`\n  RESUMO handler (Track A): preserva pendente em ${preserva}/${matriz.length} · mostra erro visível em ${comErro}/${matriz.length}`);
console.log('  (proposta de correção separada em TRACK_C_SAVE_ERROR_REPORT.md — não aplicada nesta rodada)');
console.log(falhas ? `\n✗ mobile-save-error-matrix: ${falhas} falha(s)` : '\n✓ mobile-save-error-matrix verde');
process.exit(falhas ? 1 : 0);
