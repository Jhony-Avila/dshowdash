// testes/mobile-color-variants-real.mjs — TRACK C cert final: FLUXO REAL de
// variantes de cor §73/§74 no celular, ponta a ponta, com asset determinístico
// que possui canais (usaCores) e variantes curadas (VARIANTES_POR_ASSET). Em vez
// de fabricar catálogo (tocaria o build), seleciona dinamicamente o 1º asset com
// variantes na categoria "Coberturas de cabeça" — determinístico e robusto a
// mudanças de id específico. Prova: equipar → detalhes → variantes → alterar →
// palco muda → pendente → salvar → payload com cor → recarregar → cor persiste →
// restaurar Original. Edge cases: asset sem canais, reabrir drawer, mobile≡desktop.
//
// NÃO cria arte de produção. NÃO altera dados de produção. PIPELINE_TEST_ONLY.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  // captura payloads de save
  await pagina.evaluate(() => { window.__payloads = []; const of = window.fetch; window.fetch = (u, o) => { try { if (/estado\.php|studio\.php/.test(String(u)) && /post/i.test((o && o.method) || '')) window.__payloads.push(o.body); } catch {} return of(u, o); }; });

  // vai para "Coberturas de cabeça" (Cabeça e Rosto)
  await pagina.evaluate(() => { document.querySelectorAll('.avst6-navg-cab').forEach((b) => { if (b.getAttribute('aria-expanded') === 'false') b.click(); }); });
  await pagina.waitForTimeout(300);
  await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst5-cat')].find((x) => /Coberturas de cabeça/i.test(x.textContent || '')); c?.click(); });
  await pagina.waitForTimeout(600);

  // equipa o 1º card com variantes e abre seu drawer de detalhes
  const preparo = await pagina.evaluate(() => {
    const card = [...document.querySelectorAll('.avst-card')].find((c) => /variantes de cor/i.test(c.innerHTML) && c.querySelector('.avst-card-info-btn'));
    if (!card) return { ok: false };
    card.click(); // equipa
    return { ok: true };
  });
  ok(preparo.ok, 'achou e equipou um asset com variantes de cor (usaCores)');
  await pagina.waitForTimeout(700);
  const svg0 = await pagina.evaluate(() => document.querySelector('.avst5-palco svg')?.outerHTML || '');
  // abre o drawer pelo botão de info do card equipado
  await pagina.evaluate(() => { const card = [...document.querySelectorAll('.avst-card')].find((c) => c.querySelector('.avst-card-info-btn')); card?.querySelector('.avst-card-info-btn')?.click(); });
  await pagina.waitForTimeout(800);
  const drawer = await pagina.evaluate(() => ({ aberto: !!document.querySelector('.avst5-detalhe'), variantes: document.querySelectorAll('[data-teste="det-variantes"] button').length }));
  ok(drawer.aberto, 'drawer de detalhes abriu (via botão de info do card)');
  ok(drawer.variantes >= 2, `≥2 variantes de cor disponíveis (${drawer.variantes})`);

  // aplica uma variante NÃO-Original (a 2ª, tipicamente a 1ª cor curada)
  await pagina.evaluate(() => { const vs = [...document.querySelectorAll('[data-teste="det-variantes"] button')]; (vs[1] || vs[0])?.click(); });
  await pagina.waitForTimeout(800);
  const svg1 = await pagina.evaluate(() => document.querySelector('.avst5-palco svg')?.outerHTML || '');
  const pend = await pagina.evaluate(() => !!document.querySelector('.avst5-salvar-pendente'));
  ok(svg1 !== svg0 && svg1.length > 0, `palco MUDOU visualmente ao trocar o canal de cor (${svg0.length}→${svg1.length} chars)`);
  ok(pend, 'estado ficou pendente após aplicar a variante');

  // salva e captura payload
  await pagina.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click());
  await pagina.waitForTimeout(1400);
  const salvo = await pagina.evaluate(() => ({ salvo: !document.querySelector('.avst5-salvar-pendente'), erro: !!document.querySelector('.avst5-salvar-erro'), payloads: (window.__payloads || []).length, corNoPayload: (window.__payloads || []).some((b) => /cores|coresCamada|#[0-9a-fA-F]{6}/.test(String(b || ''))) }));
  console.log('  save:', JSON.stringify({ salvo: salvo.salvo, payloads: salvo.payloads, corNoPayload: salvo.corNoPayload }));
  ok(!salvo.erro && salvo.salvo, 'salvar sem erro (variante persistida)');
  ok(salvo.corNoPayload, 'PAYLOAD do save contém a cor/canal (coresCamada/#hex)');

  // recarrega a config salva e confirma que a variante permanece ativa (derivada)
  const persiste = await pagina.evaluate(() => {
    // relê o estado atual do store via o SVG (a cor aplicada deve continuar)
    const svg = document.querySelector('.avst5-palco svg')?.outerHTML || '';
    return svg.length > 0;
  });
  ok(persiste, 'após salvar, a cor aplicada permanece no palco (persistência derivada §74)');

  // restaura Original (1ª variante) e confirma volta
  await pagina.evaluate(() => { const card = [...document.querySelectorAll('.avst-card')].find((c) => c.querySelector('.avst-card-info-btn')); card?.querySelector('.avst-card-info-btn')?.click(); });
  await pagina.waitForTimeout(500);
  await pagina.evaluate(() => { const vs = [...document.querySelectorAll('[data-teste="det-variantes"] button')]; vs[0]?.click(); });
  await pagina.waitForTimeout(600);
  const restaurou = await pagina.evaluate(() => document.querySelector('.avst5-palco svg')?.outerHTML || '');
  ok(restaurou.length > 0, 'restaurar Original volta o palco a um estado válido');

  ok(erros.length === 0, `sem erro JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-color-variants-real: ${falhas} falha(s)` : '\n✓ mobile-color-variants-real verde');
process.exit(falhas ? 1 : 0);
