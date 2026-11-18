// Revisão UX-1 (ChatGPT, P1): "Adicionar atributo avulso" — nenhuma ação confirma algo que não está visível. Só leitura (nada é gravado).
// Produto 550, selecionar "Diâmetro Externo" (31), buscar "zzzz-sem-resultado" → seleção some e Adicionar fica desabilitado.
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = 'http://127.0.0.1:8112'; let ok = 0, falhas = 0;
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  let posts = 0; pg.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('r=produto_atributo')) posts++; });
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const P = 550, A = 31;
  const fi = await pg.evaluate(async (P) => (await (await fetch(`/api/atributos/index.php?r=ficha_produto&product_id=${P}`, { credentials: 'same-origin' })).json()).data, P);
  afirma(`preparo: Diâmetro Externo (${A}) ainda não está na ficha do ${P}`, !fi.itens.some((i) => i.atributo_id === A));
  await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/#/panel-atributos/produto/${P}`); await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('button:has-text("Adicionar atributo a este produto")', { timeout: 40000 });
  await pg.click('button:has-text("Adicionar atributo a este produto")'); await pg.click('.at-portal-modal button:has-text("Adicionar atributo avulso")');
  const dlg = '.at-portal-modal [role="dialog"][aria-label="Adicionar atributo avulso a este produto"]';
  await pg.waitForSelector(`${dlg} input[type="radio"]`, { timeout: 20000 });
  await pg.fill(`${dlg} input[aria-label="Buscar atributo"]`, 'Diâmetro Externo'); await pg.waitForTimeout(200);
  await pg.click(`${dlg} label:has-text("Diâmetro Externo") input[type="radio"]`);
  const bot = `${dlg} .at-modal__rodape button.bl-botao--primario, ${dlg} .at-modal__rodape button:nth-child(2)`;
  const t1 = await pg.textContent(bot); const d1 = await pg.isDisabled(bot);
  afirma('selecionado e visível: o botão diz o nome ("Adicionar Diâmetro Externo") e está habilitado', t1.trim() === 'Adicionar Diâmetro Externo' && !d1, `${t1} desab=${d1}`);
  await pg.fill(`${dlg} input[aria-label="Buscar atributo"]`, 'zzzz-sem-resultado'); await pg.waitForTimeout(250);
  const t2 = await pg.textContent(bot); const d2 = await pg.isDisabled(bot);
  afirma('busca sem resultado: a seleção some e "Adicionar" fica DESABILITADO', d2 && t2.trim() === 'Adicionar', `${t2} desab=${d2}`);
  await pg.click(bot, { force: true }).catch(() => {}); await pg.waitForTimeout(300);
  afirma('clicar mesmo assim não envia nada (0 POST produto_atributo)', posts === 0, `posts=${posts}`);
  await pg.fill(`${dlg} input[aria-label="Buscar atributo"]`, 'Diâmetro Externo'); await pg.waitForTimeout(200);
  afirma('item volta à lista, mas NÃO volta selecionado (seleção limpa de verdade)', !(await pg.isChecked(`${dlg} label:has-text("Diâmetro Externo") input[type="radio"]`)) && (await pg.isDisabled(bot)));
  await pg.selectOption(`${dlg} select[aria-label="Tipo"]`, 'booleano').catch(() => {}); await pg.waitForTimeout(150);
  await pg.click(`${dlg} label:has-text("Diâmetro Externo") input[type="radio"]`).catch(() => {});
  afirma('filtro de tipo que esconde o item: nada fica selecionado nem confirmável', await pg.isDisabled(bot));
  console.log(`AVULSO (P1): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
