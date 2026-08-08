// testes/paineis-dock.mjs — lote 841–850 (flag as6.paineis_dock; pedido
// visual do Jhony 2026-08-08): abas de PAINEL abaixo do preview.
//   A) flag ON (clássico AAA): Título/Presets/Coleções/Foto abrem na
//      ÁREA INFERIOR ([data-teste="aaa-inferior"]) — sem lateral no DOM;
//      prova geométrica: inferior abaixo do palco, largura total,
//      preview dominante; alternar de aba mantém a disposição estável;
//   B) rollback §651: flag OFF = lateral direita como antes.
// @version 1.0.0  @created 2026-08-08
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const irParaAba = async (p, nome) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === n)?.click(); }, nome);
  await p.waitForTimeout(700);
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.classico_aaa': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    for (const aba of ['Título', 'Presets', 'Coleções', 'Foto']) {
      await irParaAba(p, aba);
      ok(await p.locator('[data-teste="aaa-inferior"]').count() === 1, `${aba}: área inferior ausente`);
      ok(await p.locator('.avst-lateral').count() === 0, `${aba}: a lateral voltou ao DOM`);
      const geo = await p.evaluate(() => {
        const caixa = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { y: r.y, w: r.width, h: r.height, bottom: r.bottom }; };
        return { palco: caixa('.avst-palco'), inf: caixa('[data-teste="aaa-inferior"]') };
      });
      ok(geo.inf && geo.palco && geo.inf.y >= geo.palco.bottom - 2,
        `${aba}: conteúdo deveria estar ABAIXO do preview (palco.bottom=${geo.palco?.bottom} · inferior.y=${geo.inf?.y})`);
      ok(geo.inf && Math.abs(geo.inf.w - geo.palco.w) < 4, `${aba}: inferior deveria ter a largura do preview`);
      ok(geo.palco && geo.palco.h > geo.inf.h, `${aba}: o preview deveria dominar a vertical`);
    }
    // conteúdo real dentro do inferior (ex.: títulos listados)
    await irParaAba(p, 'Título');
    ok(await p.locator('[data-teste="aaa-inferior"] button, [data-teste="aaa-inferior"] [role="option"]').count() >= 3,
      'aba Título sem opções visíveis na área inferior');
    await p.screenshot({ path: `${SAIDA}/paineis-dock.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.classico_aaa': true, 'as6.paineis_dock': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irParaAba(p, 'Título');
    ok(await p.locator('.avst-lateral').count() === 1, 'flag OFF mas a lateral não voltou (§651)');
    ok(await p.locator('[data-teste="aaa-inferior"]').count() === 0, 'flag OFF mas a área inferior apareceu (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS paineis-dock:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('paineis-dock OK');
