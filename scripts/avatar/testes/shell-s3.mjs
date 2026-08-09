// testes/shell-s3.mjs — AS5 F2 S3: painel direito como workspace.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

ok(await p.locator('.avst5-abas button').count() === 6, 'esperava 6 tabs (F4 adicionou Presets)');
await p.locator('.avst5-abas button', { hasText: 'Equipados' }).click();
await p.waitForTimeout(600);
// F3 C1 (§70): a aba Equipados virou o painel slot→item (não mais a grade)
const nEquipados = await p.locator('.avst5-painel .avst5-eq-linha').count();
ok(nEquipados >= 1, `aba Equipados deveria listar linhas slot→item (mostrou ${nEquipados})`);
await p.locator('.avst5-abas button', { hasText: 'Todos' }).click();
await p.waitForTimeout(400);

await p.locator('.avst5-painel-btn[title="Cores e propriedades"]').click();
await p.waitForTimeout(400);
ok(await p.locator('.avst5-propriedades').count() === 1, 'seção de cores não abriu');
const svgAntes = await p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML);
await p.evaluate(() => {
  const sw = [...document.querySelectorAll('.avst5-propriedades button')].filter((x) => x.getAttribute('aria-checked') === 'false');
  sw[3]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(500);
const svgDepois = await p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML);
ok(svgAntes !== svgDepois, 'trocar cor não mudou o avatar');
await p.keyboard.press('Control+z');
await p.waitForTimeout(400);
ok((await p.locator('.avst5-palco svg').evaluate((el) => el.innerHTML)) === svgAntes, 'undo não reverteu a cor');

await p.locator('.avst5-painel-scroll').evaluate((el) => { el.scrollTop = 900; });
await p.waitForTimeout(400);
ok(await p.locator('.avst5-topo').count() === 1, 'voltar-ao-topo não apareceu');
await p.locator('.avst5-topo').click();
// o scroll é smooth e o tempo varia com a carga (vida do avatar §608
// ocupa frames) — espera ATÉ chegar ao topo em vez de tempo fixo
let topoScroll = 9999;
for (let i = 0; i < 10; i++) {
  await p.waitForTimeout(300);
  topoScroll = await p.locator('.avst5-painel-scroll').evaluate((el) => el.scrollTop);
  if (topoScroll < 50) break;
}
ok(topoScroll < 50, `voltar-ao-topo não rolou (parou em ${topoScroll})`);

await p.locator('.avst5-painel-btn[title="Recolher catálogo"]').click();
await p.waitForTimeout(400);
ok(await p.locator('.avst5-painel-fechado').count() === 1, 'painel não recolheu');
ok(await p.locator('.avst5-palco svg').isVisible(), 'avatar sumiu com painel fechado');
await p.locator('.avst5-painel-btn[title="Abrir catálogo"]').click();
await p.waitForTimeout(400);
ok(await p.locator('.avst5-abas').count() === 1, 'painel não reabriu');
await p.screenshot({ path: `${SAIDA}/s3-painel.png` });

const ok_ = relatorio('shell-s3', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
