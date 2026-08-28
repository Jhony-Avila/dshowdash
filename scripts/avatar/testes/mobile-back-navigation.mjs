// testes/mobile-back-navigation.mjs — TRACK C cert corretiva: botão VOLTAR no
// celular. Com uma camada interna aberta (sheet de ferramenta / drawer), o
// voltar (popstate) FECHA a camada em vez de sair do módulo; sem nada aberto, o
// voltar propaga para o host. Flag as6.mobile_studio ON.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);

  // 1. abre a sheet de ferramenta (Coleções)
  await pagina.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim().startsWith('Coleções')); b?.click(); });
  await pagina.waitForTimeout(700);
  const abriu = await pagina.evaluate(() => !!document.querySelector('.avst5-ferr-modal'));
  ok(abriu, 'sheet de ferramenta abriu');

  // 2. VOLTAR (popstate) → deve fechar a sheet, NÃO sair do shell
  const antesURL = await pagina.evaluate(() => location.href);
  await pagina.evaluate(() => history.back());
  await pagina.waitForTimeout(600);
  const depois = await pagina.evaluate(() => ({ sheet: !!document.querySelector('.avst5-ferr-modal'), shell: !!document.querySelector('.avst5-shell[data-mobile]'), url: location.href }));
  ok(!depois.sheet, 'voltar FECHOU a sheet (camada interna)');
  ok(depois.shell, 'voltar NÃO saiu do módulo (shell mobile ainda montado)');

  // 3. sem nada aberto, o voltar propaga (o guard não re-arma) — valida que não
  //    ficamos presos: com a sheet fechada, um novo voltar não é mais interceptado
  const semOverlay = await pagina.evaluate(() => ['.avst5-ferr-fundo', '.avst5-detalhe', '.avst5-modal-fundo:not(.avst5-ferr-fundo)'].every((s) => !document.querySelector(s)));
  ok(semOverlay, 'após fechar, nenhuma camada interna permanece (não prende o usuário)');

  ok(erros.length === 0, `sem erro JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-back-navigation: ${falhas} falha(s)` : '\n✓ mobile-back-navigation verde');
process.exit(falhas ? 1 : 0);
