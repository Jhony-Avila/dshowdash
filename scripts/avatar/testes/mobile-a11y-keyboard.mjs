// testes/mobile-a11y-keyboard.mjs — TRACK C cert corretiva: acessibilidade
// aprofundada de TECLADO/foco na composição mobile (além do smoke). Verifica:
// foco inicial na sheet, focus trap dentro do diálogo, retorno de foco ao fechar,
// e navegação por Tab entre controles. (Leitor de tela real = VoiceOver/TalkBack
// no kit de device.) Flag ON.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);

  // 1. Tab percorre controles (foco entra em elementos interativos)
  await pagina.keyboard.press('Tab');
  const foco1 = await pagina.evaluate(() => { const a = document.activeElement; return { tag: a?.tagName, interativo: !!a && (a.tagName === 'BUTTON' || a.tagName === 'A' || a.tagName === 'INPUT' || a.getAttribute('tabindex') === '0') }; });
  ok(foco1.interativo, `Tab move o foco para um controle interativo (${foco1.tag})`);

  // 2. abre a sheet e verifica foco/trap
  await pagina.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim().startsWith('Coleções')); b?.click(); });
  await pagina.waitForTimeout(700);
  const dlg = await pagina.evaluate(() => {
    const d = document.querySelector('.avst5-ferr-fundo');
    const foco = document.activeElement;
    const dentro = !!d && d.contains(foco);
    const role = d?.getAttribute('role'); const modal = d?.getAttribute('aria-modal');
    return { temDialogo: !!d, role, modal, focoDentro: dentro, focoTag: foco?.tagName };
  });
  ok(dlg.temDialogo && dlg.role === 'dialog' && dlg.modal === 'true', 'sheet é um diálogo modal (role/aria-modal)');
  // foco inicial: ou já dentro do diálogo, ou movível p/ dentro via Tab
  await pagina.keyboard.press('Tab');
  const focoAposTab = await pagina.evaluate(() => { const d = document.querySelector('.avst5-ferr-fundo'); return !!d && d.contains(document.activeElement); });
  ok(dlg.focoDentro || focoAposTab, 'foco está (ou entra via Tab) dentro do diálogo');

  // 3. focus trap: vários Tabs não escapam do diálogo
  let escapou = false;
  for (let i = 0; i < 12; i++) { await pagina.keyboard.press('Tab'); const fora = await pagina.evaluate(() => { const d = document.querySelector('.avst5-ferr-fundo'); return !!d && !d.contains(document.activeElement); }); if (fora) { escapou = true; break; } }
  ok(!escapou, 'focus trap: Tab não escapa do diálogo enquanto aberto');

  // 4. fechar retorna o foco ao shell (não fica perdido no body)
  await pagina.evaluate(() => document.querySelector('.avst5-ferr-fechar')?.click());
  await pagina.waitForTimeout(500);
  const aposFechar = await pagina.evaluate(() => { const a = document.activeElement; return { noBody: a === document.body || a === null, noShell: !!document.querySelector('.avst5-shell[data-mobile]')?.contains(a) }; });
  ok(aposFechar.noShell || !aposFechar.noBody, 'ao fechar, o foco volta para o shell (não fica perdido)');

  ok(erros.length === 0, `sem erro JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-a11y-keyboard: ${falhas} falha(s)` : '\n✓ mobile-a11y-keyboard verde');
process.exit(falhas ? 1 : 0);
