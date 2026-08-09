// testes/classico-aaa.mjs — lote 671–680 (briefing complementar, decisão
// #68, flag as5.classico_aaa): LAYOUT AAA DO MODO CLÁSSICO.
//   A) AAA ON: trilho horizontal de assets (carrossel real), cards
//      grandes (thumb ~70%), cores JUNTO do canvas, lateral fora na aba
//      itens, palco dominante (> cap antigo de 470px), prévias em linha,
//      toolbar compacta — e FUNCIONALIDADE INTACTA (equipar pelo trilho
//      e trocar cor ao lado do palco continuam funcionando);
//   B) abas ≠ itens: painel lateral segue vivo (palco maior);
//   C) rollback §651: flag off = layout ANTERIOR (grade na lateral,
//      cores no fim, palco 470, sem trilho).
// @version 1.0.0  @created 2026-08-07
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const initClassico = (extras = {}) => () => {
  localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
    'as5.novo_shell': false, 'as5.palco3d': false, ...window.__extras,
  }));
};

// ── PARTE A: AAA ligado (desktop 1680×960) ─────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1680, height: 960 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1500);
    const m = await p.evaluate(() => {
      const grade = document.querySelector('.avst-trilho .avst-grade');
      const card = document.querySelector('.avst-trilho .avst-card');
      const thumb = card?.querySelector('.avst-card-thumb');
      const palco = document.querySelector('.avst-palco-principal')?.getBoundingClientRect();
      const cine = document.querySelector('.avst-cine')?.getBoundingClientRect();
      const cores = document.querySelector('[data-teste="aaa-cores"]')?.getBoundingClientRect();
      const subtitulo = document.querySelector('.avst-topo-titulo p');
      return {
        temTrilho: !!grade,
        scrollHorizontal: grade ? grade.scrollWidth > grade.clientWidth + 40 : false,
        cardW: card ? Math.round(card.getBoundingClientRect().width) : 0,
        cardH: card ? Math.round(card.getBoundingClientRect().height) : 0,
        thumbFracao: card && thumb
          ? thumb.getBoundingClientRect().height / card.getBoundingClientRect().height : 0,
        palcoW: palco ? Math.round(palco.width) : 0,
        coresAoLado: !!(cores && cine) && cores.left > cine.right - 8,
        lateralFora: !document.querySelector('.avst-lateral'),
        previas: document.querySelectorAll('.avst-previas figure').length,
        subtituloOculto: !subtitulo || getComputedStyle(subtitulo).display === 'none',
      };
    });
    ok(m.temTrilho, 'trilho de assets ausente (carrossel AAA)');
    ok(m.scrollHorizontal, 'trilho sem rolagem HORIZONTAL (carrossel de verdade)');
    ok(m.cardW >= 200 && m.cardH >= 240, `cards pequenos no trilho (${m.cardW}×${m.cardH} — meta ~220×250)`);
    ok(m.thumbFracao > 0.55 && m.thumbFracao < 0.85, `thumb fora da faixa ~70% do card (${Math.round(m.thumbFracao * 100)}%)`);
    ok(m.palcoW > 470, `palco não dominante (${m.palcoW}px ≤ cap antigo de 470px)`);
    ok(m.coresAoLado, 'cores não estão AO LADO do canvas');
    ok(m.lateralFora, 'lateral ainda presente na aba itens (assets deviam estar no trilho)');
    ok(m.previas >= 4, `prévias em linha incompletas (${m.previas} < 4)`);
    ok(m.subtituloOculto, 'toolbar não compactou (subtítulo visível)');

    // FUNCIONALIDADE INTACTA: equipar pelo trilho
    const antesAtivo = await p.evaluate(() => document.querySelectorAll('.avst-trilho .avst-card-ativo').length);
    await p.evaluate(() => {
      const cards = [...document.querySelectorAll('.avst-trilho .avst-card:not(.avst-card-ativo):not([data-indisponivel])')];
      cards[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await p.waitForTimeout(600);
    const equipou = await p.evaluate(() => document.querySelectorAll('.avst-trilho .avst-card-ativo').length);
    ok(antesAtivo >= 1 && equipou >= 1, 'seleção sumiu do trilho');
    // trocar cor no painel AO LADO do canvas
    const corMudou = await p.evaluate(() => {
      const grupo = document.querySelector('[data-teste="aaa-cores"] [aria-label="Cor de Cabelo"]');
      const alvo = [...(grupo?.querySelectorAll('.avst-swatch') ?? [])].find((s) => s.getAttribute('aria-checked') === 'false');
      alvo?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return new Promise((r) => setTimeout(() => r(alvo?.getAttribute('aria-checked') === 'true'), 400));
    });
    ok(corMudou === true, 'trocar cor ao lado do canvas não funcionou');

    // PARTE B: aba ≠ itens mantém painel (palco maior)
    await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.includes('Presets'))?.click(); });
    await p.waitForTimeout(800);
    const b2 = await p.evaluate(() => ({
      lateral: !!document.querySelector('.avst-lateral'),
      inferior: !!document.querySelector('[data-teste="aaa-inferior"]'),
      trilho: !!document.querySelector('.avst-trilho'),
      palcoW: Math.round(document.querySelector('.avst-palco-principal')?.getBoundingClientRect().width ?? 0),
    }));
    // lote 841-850 (as6.paineis_dock, padrão ON): o conteúdo das abas de
    // painel vive na ÁREA INFERIOR — a lateral só volta com a flag off
    // (coberto pelo paineis-dock.mjs); trilho segue exclusivo da aba itens
    ok((b2.inferior || b2.lateral) && !b2.trilho,
      'aba Presets sem conteúdo (nem inferior nem lateral) ou com trilho indevido');
    ok(b2.palcoW > 470, `palco das abas especiais não cresceu (${b2.palcoW}px)`);
    await p.screenshot({ path: `${SAIDA}/classico-aaa.png` });
    ok(erros.length === 0, `erros de página (AAA): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no AAA: ${e.message}`); }
  await b.close();
}

// ── PARTE C: rollback §651 (flag OFF = layout anterior) ────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1680, height: 960 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false, 'as5.classico_aaa': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1500);
    const m = await p.evaluate(() => ({
      gradeNaLateral: !!document.querySelector('.avst-lateral .avst-grade'),
      coresNaLateral: !!document.querySelector('.avst-lateral .avst-cores'),
      trilho: !!document.querySelector('.avst-trilho'),
      palcoW: Math.round(document.querySelector('.avst-palco-principal')?.getBoundingClientRect().width ?? 0),
      subtituloVisivel: !!document.querySelector('.avst-topo-titulo p')
        && getComputedStyle(document.querySelector('.avst-topo-titulo p')).display !== 'none',
    }));
    ok(m.gradeNaLateral, 'flag off: grade deveria voltar à lateral (§651)');
    ok(m.coresNaLateral, 'flag off: cores deveriam voltar à lateral (§651)');
    ok(!m.trilho, 'flag off: trilho deveria sumir (§651)');
    ok(m.palcoW === 470, `flag off: palco deveria voltar ao cap 470 (${m.palcoW})`);
    ok(m.subtituloVisivel, 'flag off: subtítulo da toolbar deveria voltar');
    ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS classico-aaa:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('classico-aaa OK');
