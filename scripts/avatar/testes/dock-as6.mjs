// testes/dock-as6.mjs — lote 791–800 (AS6 §644/§111, flag as6.dock):
// estados de card v2 no catálogo.
//   A) flag ON: card EQUIPADO tem selo textual próprio (≠ só anel/check);
//      grade carrega o escopo [data-dock6]; selo respeita i18n (EN);
//   B) rollback §651: flag OFF = sem selo e sem escopo — cards
//      anteriores byte a byte.
// @version 1.0.0  @created 2026-08-08
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) flag ON (padrão) ─────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst-grade[data-dock6]').count() >= 1, 'grade sem o escopo [data-dock6] com a flag ON');
    // a base vem equipada por padrão → ao abrir a categoria base há card ativo
    const selos = await p.locator('[data-teste="dock6-equipado"]').count();
    const ativos = await p.locator('.avst-grade .avst-card-ativo').count();
    ok(ativos >= 1, 'nenhum card ativo na grade (fixture mudou?)');
    ok(selos === ativos, `selo EQUIPADO deveria acompanhar cada card ativo (ativos=${ativos}, selos=${selos})`);
    const texto = (await p.locator('[data-teste="dock6-equipado"]').first().textContent())?.trim();
    ok(texto === 'Equipado', `selo com texto errado ("${texto}")`);
    await p.screenshot({ path: `${SAIDA}/dock-as6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as6.dock': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst-grade[data-dock6]').count() === 0, 'flag OFF mas o escopo [data-dock6] apareceu (§651)');
    ok(await p.locator('[data-teste="dock6-equipado"]').count() === 0, 'flag OFF mas o selo EQUIPADO apareceu (§651)');
    ok(await p.locator('.avst-grade .avst-card-ativo').count() >= 1, 'card ativo sumiu com a flag OFF');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS dock-as6:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('dock-as6 OK');
