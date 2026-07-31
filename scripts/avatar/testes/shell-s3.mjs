// testes/shell-s3.mjs — AS5 F2 S3: painel direito como workspace.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

ok(await p.locator('.avst5-abas button').count() === 5, 'esperava 5 tabs');
await p.locator('.avst5-abas button', { hasText: 'Equipados' }).click();
await p.waitForTimeout(600);
const nEquipados = await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count();
ok(nEquipados === 1, `aba Equipados deveria mostrar 1 card (mostrou ${nEquipados})`);
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
await p.waitForTimeout(700);
ok((await p.locator('.avst5-painel-scroll').evaluate((el) => el.scrollTop)) < 50, 'voltar-ao-topo não rolou');

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
