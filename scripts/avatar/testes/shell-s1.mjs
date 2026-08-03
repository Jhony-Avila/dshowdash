// testes/shell-s1.mjs — AS5 F2 S1: casca do novo shell (flag as5.novo_shell).
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// shell montado no lugar do App clássico
ok(await p.locator('.avst5-shell').count() === 1, 'shell novo não montou com a flag');
ok(await p.locator('.avst5-palco svg').count() >= 1, 'avatar não renderizou no palco');

// R12 (parcial): scroll do painel direito NÃO move o avatar
const topoAntes = await p.locator('.avst5-palco svg').evaluate((el) => el.getBoundingClientRect().top);
await p.locator('.avst5-painel').evaluate((el) => { el.scrollTop = 600; });
await p.waitForTimeout(300);
const topoDepois = await p.locator('.avst5-palco svg').evaluate((el) => el.getBoundingClientRect().top);
ok(Math.abs(topoAntes - topoDepois) < 1, `avatar saiu do foco no scroll (${topoAntes}→${topoDepois})`);

// equipar via catálogo → comando → undo habilita e reverte
await p.evaluate(() => {
  [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click();
});
await p.waitForTimeout(700);
const svgAntes = await p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML.length);
await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.avst5-painel .avst-card')].filter((c) => !c.className.includes('avst-card-ativo'));
  cards[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(700);
ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'barra deveria acusar alterações');
const undoBtn = p.locator('.avst5-header-acoes button[title^="Desfazer"]');
ok(!(await undoBtn.isDisabled()), 'undo deveria habilitar após equipar');
await undoBtn.click();
await p.waitForTimeout(500);
const svgDepoisUndo = await p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML.length);
ok(svgDepoisUndo === svgAntes, `undo não restaurou o visual (${svgAntes}→${svgDepoisUndo})`);

// "Modo clássico" volta ao App atual
await p.locator('.avst5-header-acoes button', { hasText: 'Modo clássico' }).click();
await p.waitForTimeout(800);
ok(await p.locator('.avst5-shell').count() === 0, 'sair do shell não voltou ao clássico');
ok(await p.locator('nav.avst-categorias').count() === 1, 'App clássico não remontou');

await p.screenshot({ path: `${SAIDA}/s1-shell.png` });
const ok_ = relatorio('shell-s1', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
