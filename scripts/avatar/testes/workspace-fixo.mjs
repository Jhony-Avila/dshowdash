// testes/workspace-fixo.mjs — lote 881–890 (decisão #89, flag
// as6.workspace_fixo): workspace TRAVADO na viewport + chips compactos.
//   A) flag ON (padrão do clássico AAA): shell com [data-fixo]; a PÁGINA
//      não rola (scrollHeight ≈ viewport); o palco fica INTEIRO visível
//      nas abas de painel (Histórico/Vitrine/Presets — era o bug
//      "scroll tira o preview da tela"); chips de filtro do Efeito viram
//      rail vertical compacto na dock (não mais colunas esmagadas);
//   B) rollback §651: as6.workspace_fixo OFF = sem [data-fixo] e sem
//      trava de altura (fluxo anterior).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const irPara = async (p, nome) => {
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
    ok(await p.locator('.avst-shell[data-fixo]').count() === 1, 'shell sem [data-fixo] com a flag ON');
    // zero scroll de página + palco inteiro na viewport, em TODAS as
    // disposições (itens com dock, painéis com inferior)
    for (const aba of ['Histórico', 'Vitrine', 'Presets', 'Roupa']) {
      await irPara(p, aba);
      const m = await p.evaluate(() => {
        const se = document.scrollingElement ?? document.documentElement;
        const palco = document.querySelector('.avst-palco')?.getBoundingClientRect() ?? null;
        return {
          rolagem: se.scrollHeight - window.innerHeight,
          palco: palco ? { top: palco.top, bottom: palco.bottom } : null,
        };
      });
      ok(m.rolagem <= 4, `página ROLA na aba ${aba} (${m.rolagem}px além da viewport) — preview sai da tela`);
      ok(m.palco && m.palco.top >= -2 && m.palco.bottom <= 902,
        `palco fora da viewport na aba ${aba} (top=${m.palco?.top} bottom=${m.palco?.bottom})`);
    }
    // chips de filtro do Efeito: rail VERTICAL compacto dentro da dock
    await irPara(p, 'Efeito');
    const chips = await p.evaluate(() => {
      const rail = document.querySelector('.avst-trilho [data-teste="fx-funcional"]');
      if (!rail) return null;
      const cs = [...rail.querySelectorAll('.avst-ft-chip')].map((c) => c.getBoundingClientRect());
      return { total: cs.length, alturaMax: Math.max(...cs.map((c) => c.height)), empilhados: cs.length >= 2 && cs[1].top >= cs[0].bottom - 1 };
    });
    ok(chips !== null, 'rail de filtros do Efeito ausente na dock');
    ok(chips && chips.total >= 4, `poucos chips no rail (${chips?.total})`);
    ok(chips && chips.alturaMax < 42, `chips esmagados/gigantes no rail (altura ${chips?.alturaMax}px)`);
    ok(chips && chips.empilhados, 'chips deveriam empilhar em COLUNA no rail (não espremidos na horizontal)');
    await p.screenshot({ path: `${SAIDA}/workspace-fixo.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.classico_aaa': true, 'as6.workspace_fixo': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst-shell[data-fixo]').count() === 0, 'flag OFF mas [data-fixo] apareceu (§651)');
    const overflow = await p.evaluate(() => getComputedStyle(document.querySelector('.avst-shell')).overflow);
    ok(overflow !== 'hidden', `flag OFF mas o shell ficou travado (overflow=${overflow})`);
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS workspace-fixo:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('workspace-fixo OK');
