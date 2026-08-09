// testes/creator-v6.mjs — lote 931–940 (decisão #95, flag
// as6.creator_v6): vestuário MULTI-PEÇA (AS6 §3393).
//   A) flag ON: categoria Sobrepeça no trilho; equipar sob_* adiciona o
//      WRAPPER (clip do peito + transform inverso busto←corpo) por cima
//      da roupa SEM removê-la; incompatibilidade com a peça de origem
//      (§35 — 1º uso real de incompativelCom); schema v2 no rascunho.
//   B) rollback §651: flag OFF = categoria oculta; grade byte a byte.
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const MARCA = 'translate(-18.588 35.412)'; // transform do wrapper busto

const irCategoria = async (p, nome) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes(n))?.click(); }, nome);
  await p.waitForTimeout(450);
};
const equiparCard = async (p, nome) => {
  await p.evaluate((n) => {
    const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
      .find((x) => x.textContent.includes(n));
    c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, nome);
  await p.waitForTimeout(450);
};
const svgPalco = (p) => p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML ?? '');

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    // categoria §3393 no trilho
    const temCat = await p.evaluate(() => [...document.querySelectorAll('.avst5-cat')].some((x) => x.textContent.includes('Sobrepeça')));
    ok(temCat, 'categoria Sobrepeça ausente do trilho com a flag ON');
    await irCategoria(p, 'Sobrepeça');
    const nCards = await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count();
    ok(nCards >= 4, `esperava ≥4 sobrepeças curadas (veio ${nCards})`);
    // equipar sobre a roupa padrão → wrapper entra SEM tirar a roupa
    const antes = await svgPalco(p);
    ok(!antes.includes(MARCA), 'palco já tinha wrapper de sobrepeça antes de equipar');
    await equiparCard(p, 'Colete de Missão');
    const depois = await svgPalco(p);
    ok(depois.includes(MARCA), 'equipar a sobrepeça não pôs o wrapper no SVG (§3393)');
    ok(depois.includes('sobre"'), 'clip do peito ausente no wrapper');
    // roupa de baixo intacta (multi-peça de verdade, não troca)
    ok((await p.locator('.avst5-cat', { hasText: 'Roupa' }).count()) > 0, 'sanidade: trilho tem Roupa');
    // rascunho carrega o schema v2 + a camada nova (autosave §139 = 800ms)
    await p.waitForTimeout(1300);
    const rascunho = await p.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.includes('rascunho'));
      try { return JSON.parse(localStorage.getItem(k) ?? 'null'); } catch { return null; }
    });
    const cfgR = rascunho?.config ?? rascunho ?? {};
    ok(cfgR?.camadas?.roupa_sobre === 'sob_colete', 'rascunho sem camadas.roupa_sobre');
    ok(cfgR?.versao === 2, `rascunho deveria estar no schema v2 (veio ${cfgR?.versao})`);
    // §35: incompatível com a peça de ORIGEM — equipar rou_colete primeiro
    await irCategoria(p, 'Roupa');
    await equiparCard(p, 'Colete Tático');
    await irCategoria(p, 'Sobrepeça');
    await equiparCard(p, 'Colete de Missão');
    const conflito = await svgPalco(p);
    ok(!conflito.includes(MARCA),
      'sob_colete deveria ser rejeitado com rou_colete equipado (incompativelCom §35)');
    // com outra roupa, volta a poder
    await irCategoria(p, 'Roupa');
    await equiparCard(p, 'Jersey Pro Player');
    await irCategoria(p, 'Sobrepeça');
    await equiparCard(p, 'Colete de Missão');
    ok((await svgPalco(p)).includes(MARCA), 'sobrepeça deveria equipar sobre outra roupa');
    await p.screenshot({ path: `${SAIDA}/creator-v6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.creator_v6': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    const temCat = await p.evaluate(() => [...document.querySelectorAll('.avst5-cat')].some((x) => x.textContent.includes('Sobrepeça')));
    ok(!temCat, 'flag OFF ainda mostra a categoria Sobrepeça (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[creator-v6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[creator-v6] FALHAS: nenhuma');
console.log('[creator-v6] ERROS JS: nenhum');
