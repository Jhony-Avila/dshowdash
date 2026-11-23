// UX-1c (a)–(d) · teste LEVE (2200×1470, flags de shell da produção). Só leitura: nada é gravado.
// (a) ?atributo fica no endereço da ficha; Voltar/Avançar reabrem nele. (b) "Buscar em todo o catálogo" só com restrição a tirar; sem ela,
// "Nenhum produto ativo ou inativo encontrado" + "Limpar busca". (c) voltar da Ficha mantém busca, filtros, modo Tabela, página e posição
// (pelo "← Produtos" e pelo Voltar do navegador), nos modos Tabela e Cartões (PACOTE A). (d) ajuda de teclado no Preencher.
// Uso: PORTA=8112 flock … nice -n 10 node teste-ux1c-v2.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const CAP = 'capturas-ux1c' + (process.env.W ? '-' + process.env.W : ''); require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: Number(process.env.W || 2200), height: Number(process.env.H || 1470) }, deviceScaleFactor: 1 })).newPage();
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const ir = async (rota, sel) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/${rota}`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector(sel, { timeout: 40000 }); await pg.waitForTimeout(1000); };
  const pos = () => pg.evaluate(() => Math.round((document.scrollingElement?.scrollTop ?? 0) + (document.querySelector('main#main')?.scrollTop ?? 0)));
  // ── (a)
  const fi = await (async () => { await ir('#/panel-atributos', '.at-filtros__total'); return pg.evaluate(async () => (await (await fetch('/api/atributos/index.php?r=ficha_produto&product_id=27')).json()).data); })();
  const alvo = fi.itens[Math.floor(fi.itens.length * 0.7)];
  await ir(`#/panel-atributos/produto/27?atributo=${alvo.atributo_id}`, '.at-tabela-ficha'); await pg.waitForTimeout(800);
  const focoEm = () => pg.evaluate(() => document.activeElement?.closest('[data-atributo]')?.getAttribute('data-atributo'));
  afirma(`(a) abrir pelo endereço com ?atributo=${alvo.atributo_id}: o endereço CONTINUA com ?atributo e o foco vai ao atributo`, pg.url().includes(`produto/27?atributo=${alvo.atributo_id}`) && Number(await focoEm()) === alvo.atributo_id, pg.url());
  await pg.click('.at-ficha__faixa button:has-text("← Produtos")'); await pg.waitForSelector('.at-filtros__total'); await pg.waitForTimeout(500);
  afirma('(a) "← Produtos" → lista (endereço sem ficha)', /#\/panel-atributos$/.test(pg.url()), pg.url());
  await pg.goBack(); await pg.waitForSelector('.at-tabela-ficha', { timeout: 20000 }); await pg.waitForTimeout(1200);
  afirma('(a) Voltar do navegador → ficha 27 de novo NO atributo (endereço e foco)', pg.url().includes(`?atributo=${alvo.atributo_id}`) && Number(await focoEm()) === alvo.atributo_id, `${pg.url()} foco=${await focoEm()}`);
  await pg.goForward(); await pg.waitForSelector('.at-filtros__total', { timeout: 20000 }); await pg.waitForTimeout(500);
  afirma('(a) Avançar → lista de novo', /#\/panel-atributos$/.test(pg.url()), pg.url());
  // ── (b)
  await ir('#/panel-atributos', '.at-filtros__total');
  await pg.fill('.at-fixo input[type="search"]', 'zzqx inexistente'); await pg.waitForTimeout(500);
  afirma('(b) só "ativos" (restrição) + termo sem resultado → "Buscar ‘…’ em todo o catálogo"', !!(await pg.$('button:has-text("em todo o catálogo")')));
  await pg.selectOption('select[aria-label="Situação"]', 'todos'); await pg.waitForTimeout(500);
  const txtB = await pg.textContent('.at-conteudo');
  afirma('(b) Situação "todos" e nenhum filtro: SEM o botão inútil; "Nenhum produto ativo ou inativo encontrado" + "Limpar busca"', !(await pg.$('button:has-text("em todo o catálogo")')) && txtB.includes('Nenhum produto ativo ou inativo encontrado') && !!(await pg.$('.at-conteudo button:has-text("Limpar busca")')));
  await pg.screenshot({ path: `${CAP}/b-sem-resultado.png` });
  await pg.click('.at-conteudo button:has-text("Limpar busca")'); await pg.waitForTimeout(500);
  afirma('(b) "Limpar busca" esvazia a busca e a lista volta', (await pg.inputValue('.at-fixo input[type="search"]')) === '' && Number((await pg.textContent('.at-filtros__total')).match(/\d+/)[0]) > 0);
  // ── (c)
  await ir('#/panel-atributos', '.at-filtros__total');
  await pg.fill('.at-fixo input[type="search"]', 'a'); await pg.waitForTimeout(400);
  await pg.click('button[aria-pressed]:has-text("Tabela")'); await pg.waitForSelector('.at-produtos table');
  const temP2 = await pg.$('nav.at-paginas button:has-text("Próxima"):not([disabled])'); if (temP2) { await temP2.click(); await pg.waitForTimeout(400); }
  const pagAntes = await pg.textContent('nav.at-paginas').catch(() => '');
  await pg.mouse.move(1200, 1300); for (let k = 0; k < 4; k++) { await pg.mouse.wheel(0, 150); await pg.waitForTimeout(60); } await pg.waitForTimeout(500);
  // a linha clicada já À VISTA (o click do Playwright rolaria até ela e mudaria a posição); y0 = posição que a tela vê no clique
  // clicar como uma pessoa: numa linha VISÍVEL, no meio da área livre abaixo do bloco travado, pelas coordenadas (o click do Playwright
  // rolaria a página se a linha estivesse sob o cabeçalho travado, e a posição medida deixaria de ser a que a pessoa vê)
  const alvoXY = await pg.evaluate(() => { const fixo = document.querySelector('.at-fixo')?.getBoundingClientRect().bottom ?? 0; const thead = document.querySelector('.at-produtos table thead')?.getBoundingClientRect().bottom ?? 0; const livre = Math.max(fixo, thead);
    const meio = (livre + innerHeight) / 2; const bs = [...document.querySelectorAll('.at-produtos table tbody tr .at-link-produto')];
    const b = bs.map((x) => ({ x, r: x.getBoundingClientRect() })).filter(({ r }) => r.top > livre + 4 && r.bottom < innerHeight - 4).sort((p, q) => Math.abs(p.r.top - meio) - Math.abs(q.r.top - meio))[0];
    return b && { x: Math.round(b.r.left + Math.min(40, b.r.width / 2)), y: Math.round(b.r.top + b.r.height / 2), oculto: document.elementFromPoint(b.r.left + 10, b.r.top + b.r.height / 2)?.closest('.at-link-produto') !== b.x }; });
  const y0 = await pos();
  afirma(`(c) pré-condição: a linha clicada está à vista, fora do bloco travado (página em ${y0}px)`, !!alvoXY && !alvoXY.oculto && y0 > 100, JSON.stringify(alvoXY));
  await pg.screenshot({ path: `${CAP}/c-antes-de-abrir.png` });
  await pg.mouse.click(alvoXY.x, alvoXY.y); await pg.waitForSelector('.at-tabela-ficha', { timeout: 20000 }); await pg.waitForTimeout(800);
  const estado = async () => ({ busca: await pg.inputValue('.at-fixo input[type="search"]'), tabela: (await pg.getAttribute('button[aria-pressed]:has-text("Tabela")', 'aria-pressed')) === 'true', pag: await pg.textContent('nav.at-paginas').catch(() => ''), y: await pos() });
  await pg.click('.at-ficha__faixa button:has-text("← Produtos")'); await pg.waitForSelector('.at-produtos table', { timeout: 20000 }); await pg.waitForTimeout(900);
  const e1 = await estado();
  await pg.screenshot({ path: `${CAP}/c-depois-de-voltar.png` });
  afirma(`(c) "← Produtos": busca "a", modo Tabela, mesma página e posição (${y0}px → ${e1.y}px)`, e1.busca === 'a' && e1.tabela && e1.pag === pagAntes && Math.abs(e1.y - y0) <= 40, JSON.stringify({ ...e1, y0, pagAntes }));
  await pg.mouse.click(alvoXY.x, alvoXY.y); await pg.waitForSelector('.at-tabela-ficha', { timeout: 20000 }); await pg.waitForTimeout(800);   // mesma linha, à vista na posição restaurada
  await pg.goBack(); await pg.waitForSelector('.at-produtos table', { timeout: 20000 }); await pg.waitForTimeout(900);
  const e2 = await estado();
  afirma(`(c) Voltar do navegador: idem (${e2.y}px)`, e2.busca === 'a' && e2.tabela && e2.pag === pagAntes && Math.abs(e2.y - y0) <= 40, JSON.stringify(e2));
  // ── (c) no modo CARTÕES (PACOTE A, A.5): trocar Tabela → Cartões mantém busca e página; abrir a ficha e voltar restaura modo, página e posição
  await pg.click('button[aria-pressed]:has-text("Cartões")'); await pg.waitForSelector('.at-pl-cartoes .at-pl-cartao', { timeout: 20000 }); await pg.waitForTimeout(600);
  const pagC = await pg.textContent('nav.at-paginas').catch(() => '');
  afirma('(c/Cartões) trocar Tabela → Cartões mantém busca e página', (await pg.inputValue('.at-fixo input[type="search"]')) === 'a' && pagC === pagAntes, JSON.stringify({ pagC, pagAntes }));
  await pg.mouse.move(1200, 1300); for (let k = 0; k < 3; k++) { await pg.mouse.wheel(0, 150); await pg.waitForTimeout(60); } await pg.waitForTimeout(500);
  const alvoC = await pg.evaluate(() => { const livre = document.querySelector('.at-fixo')?.getBoundingClientRect().bottom ?? 0; const meio = (livre + innerHeight) / 2;
    const b = [...document.querySelectorAll('.at-pl-cartao .at-pl-cartao__nome')].map((x) => ({ x, r: x.getBoundingClientRect() })).filter(({ r }) => r.top > livre + 4 && r.bottom < innerHeight - 60).sort((p, q) => Math.abs(p.r.top - meio) - Math.abs(q.r.top - meio))[0];
    return b && { x: Math.round(b.r.left + Math.min(30, b.r.width / 2)), y: Math.round(b.r.top + 8) }; });
  const yC = await pos();
  await pg.mouse.click(alvoC.x, alvoC.y); await pg.waitForSelector('.at-tabela-ficha', { timeout: 20000 }); await pg.waitForTimeout(800);
  const estadoC = async () => ({ busca: await pg.inputValue('.at-fixo input[type="search"]'), cartoes: (await pg.getAttribute('button[aria-pressed]:has-text("Cartões")', 'aria-pressed')) === 'true', pag: await pg.textContent('nav.at-paginas').catch(() => ''), y: await pos() });
  await pg.click('.at-ficha__faixa button:has-text("← Produtos")'); await pg.waitForSelector('.at-pl-cartoes .at-pl-cartao', { timeout: 20000 }); await pg.waitForTimeout(900);
  const c1 = await estadoC();
  afirma(`(c/Cartões) "← Produtos": busca "a", modo Cartões, mesma página e posição (${yC}px → ${c1.y}px)`, c1.busca === 'a' && c1.cartoes && c1.pag === pagAntes && Math.abs(c1.y - yC) <= 40, JSON.stringify({ ...c1, yC }));
  await pg.mouse.click(alvoC.x, alvoC.y); await pg.waitForSelector('.at-tabela-ficha', { timeout: 20000 }); await pg.waitForTimeout(800);
  await pg.goBack(); await pg.waitForSelector('.at-pl-cartoes .at-pl-cartao', { timeout: 20000 }); await pg.waitForTimeout(900);
  const c2 = await estadoC();
  afirma(`(c/Cartões) Voltar do navegador: idem (${c2.y}px)`, c2.busca === 'a' && c2.cartoes && c2.pag === pagAntes && Math.abs(c2.y - yC) <= 40, JSON.stringify(c2));
  await pg.click('.at-nav button:has-text("Kits")'); await pg.waitForTimeout(600); await pg.click('.at-nav button:has-text("Produtos")'); await pg.waitForSelector('.at-filtros__total'); await pg.waitForTimeout(500);
  afirma('(c) clicar numa aba e voltar a Produtos começa a lista de novo (a memória é só da volta da ficha)', (await pg.inputValue('.at-fixo input[type="search"]')) === '');
  // ── (d)
  await ir('#/panel-atributos/preencher', 'select[aria-label="Kit"]');
  const v = await pg.$eval('select[aria-label="Kit"] option:nth-child(2)', (o) => o.value); await pg.selectOption('select[aria-label="Kit"]', v);
  await pg.waitForSelector('table.at-tabela--grade, .pv2-grade', { timeout: 60000 }); await pg.waitForTimeout(800);   // grade antiga ou a do Preencher V2 (T4)
  const ajuda = await pg.textContent('[data-at-ajuda-teclado]').catch(() => '');
  afirma('(d) Preencher mostra a ajuda de teclado (Tab, ↑/↓, Enter, Esc)', ['Tab', '↑/↓', 'Enter', 'Esc'].every((t) => ajuda.includes(t)), ajuda);
  await pg.screenshot({ path: `${CAP}/d-preencher-teclado.png` });
  console.log(`UX-1c (a–d): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
