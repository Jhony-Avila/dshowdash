// PREENCHER V2 (briefing do Jhony, 19/11) · teste LEVE da tela, 2200×1470 e 1440×900, flags de shell da produção. NADA é gravado: a única
// escrita (o rascunho que sai do campo) é INTERCEPTADA e recusada (422), e o rascunho é desfeito com Esc no fim. Os testes de GRAVAÇÃO do Preencher continuam nos de sempre (grade, foi-salvo G, lote-chave, preencher-lote).
// Uso: PORTA=8112 flock … nice -n 10 node teste-preencher-v2.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const CAP = 'capturas-pv2'; require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  for (const [W, H] of [[2200, 1470], [1440, 900]]) {
    const pg = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage(); const erros = []; pg.on('pageerror', (e) => erros.push(e.message));
    const pre = `${W}×${H}`;
    await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 }); await pg.evaluate(() => sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'));
    await pg.goto(`${B}/#/panel-atributos/preencher`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('select[aria-label="Kit"]', { timeout: 40000 });
    afirma(`${pre}: Shell Layout v2 ativo`, await pg.evaluate(() => document.documentElement.getAttribute('data-shell-layout-v2') === 'on'));
    const kitOpt = await pg.$$eval('select[aria-label="Kit"] option', (os) => os.find((o) => o.textContent.startsWith('Cabos')));
    const v = await pg.$$eval('select[aria-label="Kit"] option', (os) => os.find((o) => o.textContent.startsWith('Cabos'))?.value); await pg.selectOption('select[aria-label="Kit"]', v);
    await pg.waitForSelector('.pv2-grade', { timeout: 90000 }); await pg.waitForTimeout(1200);
    const api = (pid) => pg.evaluate(async (pid) => (await (await fetch(`/api/atributos/index.php?r=ficha_produto&product_id=${pid}`)).json()).data, pid);
    // faixa única
    const faixa = await pg.evaluate(() => { const f = document.querySelector('.at-fixo .pv2-filtros'); const r = (s) => f?.querySelector(s)?.getBoundingClientRect(); const k = r('select[aria-label="Kit"]'), s = r('select[aria-label="Subcategoria"]'), q = r('.pv2-busca'), c = r('.pv2-colunas button');
      return { noBloco: !!f, mesmaLinha: !!k && [s, q, c].every((x) => x && Math.abs(x.top + x.height / 2 - (k.top + k.height / 2)) <= 3), alturas: [k, s, q, c].map((x) => Math.round(x?.height ?? 0)), ou: /\bou\b/.test(f?.textContent || ''), busca: f?.querySelector('.pv2-busca input')?.getAttribute('placeholder'), larguraBusca: Math.round(q?.width ?? 0), texto: f?.querySelector('select[aria-label="Kit"]')?.selectedOptions[0]?.textContent }; });
    afirma(`${pre}: faixa única no bloco travado (kit · ou · subcategoria · busca · Colunas), ~32 px, busca 230–280 px; "${faixa.texto}" (nº real)`, faixa.noBloco && faixa.mesmaLinha && faixa.ou && faixa.busca === 'Buscar produto ou ID' && faixa.alturas.every((h) => h >= 30 && h <= 34) && faixa.larguraBusca >= 230 && faixa.larguraBusca <= 280 && /\(\d+ produtos\)/.test(faixa.texto), JSON.stringify(faixa));
    // linhas uniformes, zebra nos dois painéis, sem "Preencher", valor + unidade na mesma linha
    const g = await pg.evaluate(() => { const fx = [...document.querySelectorAll('.pv2-corpo__fixo > .pv2-linha--fixa')], rl = [...document.querySelectorAll('.pv2-corpo__rola > .pv2-linha')];
      const alt = [...fx, ...rl].map((e) => Math.round(e.getBoundingClientRect().height)); const bg = (e) => getComputedStyle(e).backgroundColor;
      const uni = [...document.querySelectorAll('.pv2-celula .at-editor__linha')].filter((l) => l.querySelector('.at-campo--unid')).slice(0, 5).map((l) => { const i = l.querySelector('input').getBoundingClientRect(), u = l.querySelector('.at-campo--unid').getBoundingClientRect(); return Math.abs(i.top - u.top) <= 2 && u.left > i.left; });
      return { n: fx.length, alinhadas: fx.length === rl.length && fx.every((e, k) => Math.abs(e.getBoundingClientRect().top - rl[k].getBoundingClientRect().top) <= 1), alturas: [...new Set(alt)], zebra: fx.length > 2 && bg(fx[0]) !== bg(fx[1]) && bg(fx[1]) === bg(rl[1]) && bg(fx[0]) === bg(rl[0]),
        preencher: [...document.querySelectorAll('.pv2-grade input[placeholder="Preencher"]')].length + [...document.querySelectorAll('.pv2-grade option')].filter((o) => o.textContent === 'Preencher').length, uni, editor: Math.round(document.querySelector('.pv2-celula .at-editor__linha')?.getBoundingClientRect().height ?? 0) }; });
    afirma(`${pre}: ${g.n} linhas, mesma altura (${g.alturas.join('/')} px) e alinhadas nos dois painéis; zebra contínua (fixo = rolável)`, g.alinhadas && g.alturas.length === 1 && g.alturas[0] >= 38 && g.alturas[0] <= 41 && g.zebra, JSON.stringify(g));
    afirma(`${pre}: sem "Preencher" repetido; editores de ~28 px; valor e unidade lado a lado na mesma linha`, g.preencher === 0 && g.editor >= 27 && g.editor <= 30 && g.uni.length > 0 && g.uni.every(Boolean), JSON.stringify({ p: g.preencher, e: g.editor, u: g.uni }));
    // valores existentes preservados (pela API): uma célula com valor numérico mostra o MESMO número e unidade
    const pids = await pg.$$eval('.pv2-corpo__fixo .pv2-td--id', (xs) => xs.map((x) => Number(x.textContent)));
    let conferido = null;
    for (const pid of pids.slice(0, 27)) { const f = await api(pid); const it = f.itens.find((i) => (i.tipo === 'numero' || i.tipo === 'inteiro') && i.valor && i.valor.estado === 'informado' && i.valor.numero !== null); if (!it) continue;
      const cel = await pg.evaluate(([pid, aid]) => { const k = [...document.querySelectorAll('.pv2-corpo__fixo .pv2-td--id')].findIndex((x) => Number(x.textContent) === pid); const c = document.querySelectorAll('.pv2-corpo__rola > .pv2-linha')[k]?.querySelector(`[data-c="${aid}"]`); return c ? { n: c.querySelector('input')?.value, u: c.querySelector('.at-campo--unid')?.selectedOptions[0]?.textContent ?? null } : null; }, [pid, it.atributo_id]);
      const un = it.unidades.find((u) => u.id === it.valor.unidade_id)?.simbolo ?? null; conferido = { pid, rotulo: it.rotulo, api: `${Number(it.valor.numero)} ${un}`, tela: `${cel?.n} ${cel?.u}` }; break; }
    afirma(`${pre}: valor existente preservado na grade (${conferido ? `${conferido.pid} · ${conferido.rotulo}: API ${conferido.api} = tela ${conferido.tela}` : 'nenhum número informado neste kit'})`, !conferido || conferido.api.replace('.', ',') === conferido.tela.replace('.', ',') || Number(conferido.tela.split(' ')[0].replace(',', '.')) === Number(conferido.api.split(' ')[0]), JSON.stringify(conferido));
    // rolagem horizontal: bloco fixo parado; cabeçalho acompanha; barra começa depois do bloco fixo
    const h0 = await pg.evaluate(() => ({ fixo: Math.round(document.querySelector('.pv2-corpo__fixo .pv2-td--nome').getBoundingClientRect().left), rolaEsq: Math.round(document.querySelector('.pv2-corpo__rola').getBoundingClientRect().left), fixoDir: Math.round(document.querySelector('.pv2-corpo__fixo').getBoundingClientRect().right), larga: document.querySelector('.pv2-corpo__rola').scrollWidth > document.querySelector('.pv2-corpo__rola').clientWidth }));
    await pg.evaluate(() => { document.querySelector('.pv2-corpo__rola').scrollLeft = 500; }); await pg.waitForTimeout(300);
    const h1 = await pg.evaluate(() => ({ fixo: Math.round(document.querySelector('.pv2-corpo__fixo .pv2-td--nome').getBoundingClientRect().left), sl: document.querySelector('.pv2-corpo__rola').scrollLeft, cab: document.querySelector('.pv2-cab__rola').scrollLeft }));
    afirma(`${pre}: rolagem horizontal própria (a área rolável começa em ${h0.rolaEsq} px, depois do bloco fixo que termina em ${h0.fixoDir} px); Foto/ID/Produto parados; cabeçalho acompanha (${h1.cab} = ${h1.sl})`, h0.larga && h0.rolaEsq >= h0.fixoDir - 1 && h1.fixo === h0.fixo && h1.sl > 0 && h1.cab === h1.sl, JSON.stringify({ h0, h1 }));
    await pg.screenshot({ path: `${CAP}/teste-${W}x${H}-horizontal.png` });
    // barra ESPELHO grudada embaixo da área visível, sincronizada nos dois sentidos
    await pg.evaluate(() => { document.querySelector('.pv2-corpo__rola').scrollLeft = 0; document.scrollingElement.scrollTo({ top: 0 }); }); await pg.waitForTimeout(300);
    const bar0 = await pg.evaluate(() => { const b = document.querySelector('[data-pv2-barra]'); const g = document.querySelector('.pv2-grade').getBoundingClientRect(); if (!b) return null; const r = b.getBoundingClientRect(); const rr = document.querySelector('.pv2-corpo__rola').getBoundingClientRect();
      return { bottom: Math.round(r.bottom), alvo: Math.round(Math.min(innerHeight, g.bottom)), esq: Math.round(r.left), rolaEsq: Math.round(rr.left), larg: Math.round(r.width), rolaLarg: Math.round(rr.width) }; });
    await pg.evaluate(() => { const b = document.querySelector('[data-pv2-barra]'); b.scrollLeft = 400; b.dispatchEvent(new Event('scroll')); }); await pg.waitForTimeout(300);
    const sync1 = await pg.evaluate(() => ({ corpo: document.querySelector('.pv2-corpo__rola').scrollLeft, cab: document.querySelector('.pv2-cab__rola').scrollLeft }));
    await pg.evaluate(() => { const c = document.querySelector('.pv2-corpo__rola'); c.scrollLeft = 150; c.dispatchEvent(new Event('scroll')); }); await pg.waitForTimeout(300);
    const sync2 = await pg.evaluate(() => ({ barra: document.querySelector('[data-pv2-barra]').scrollLeft, cab: document.querySelector('.pv2-cab__rola').scrollLeft }));
    afirma(`${pre}: barra horizontal ESPELHO à vista, grudada embaixo da área visível (${bar0?.bottom} ≈ ${bar0?.alvo}), alinhada à área dos atributos; barra → grade e cabeçalho (${sync1.corpo}/${sync1.cab}); grade → barra (${sync2.barra})`,
      !!bar0 && Math.abs(bar0.bottom - bar0.alvo) <= 2 && Math.abs(bar0.esq - bar0.rolaEsq) <= 1 && Math.abs(bar0.larg - bar0.rolaLarg) <= 1 && sync1.corpo === 400 && sync1.cab === 400 && sync2.barra === 150 && sync2.cab === 150, JSON.stringify({ bar0, sync1, sync2 }));
    await pg.screenshot({ path: `${CAP}/teste-${W}x${H}-barra.png` });
    await pg.evaluate(() => { document.querySelector('.pv2-corpo__rola').scrollLeft = 0; });
    // trava vertical: título, abas, faixa e cabeçalho das colunas parados; só as linhas rolam
    const tops = () => pg.evaluate(() => { const q = (s) => Math.round(document.querySelector(s).getBoundingClientRect().top); return { barra: q('.dsd-container__header'), titulo: q('.at-cabecalho h1'), abas: q('.at-nav'), faixa: q('.pv2-filtros'), cab: q('.pv2-cab'), base: Math.round(document.querySelector('.at-fixo').getBoundingClientRect().bottom), rol: Math.round(document.scrollingElement.scrollTop) }; });
    await pg.mouse.move(W / 2, H - 80); for (let k = 0; k < 4; k++) { await pg.mouse.wheel(0, 150); await pg.waitForTimeout(60); } await pg.waitForTimeout(400); const t1 = await tops();
    for (let k = 0; k < 4; k++) { await pg.mouse.wheel(0, 150); await pg.waitForTimeout(60); } await pg.waitForTimeout(400); const t2 = await tops();
    afirma(`${pre}: barra verde, título, abas e faixa PARADOS; cabeçalho das colunas colado abaixo do bloco (${t2.cab} ≈ ${t2.base}) e parado (rolou ${t2.rol} px)`, t2.rol >= t1.rol && t2.rol > 0 && t1.barra === t2.barra && t1.titulo === t2.titulo && t1.abas === t2.abas && t1.faixa === t2.faixa && t1.cab === t2.cab && Math.abs(t2.cab - t2.base) <= 2, JSON.stringify({ t1, t2 }));
    await pg.screenshot({ path: `${CAP}/teste-${W}x${H}-rolado.png` });
    await pg.evaluate(() => document.scrollingElement.scrollTo({ top: 0 })); await pg.waitForTimeout(300);
    // busca sobre o conjunto inteiro (nome e ID)
    const total = pids.length; await pg.fill('.pv2-busca input', 'Rede'); await pg.waitForTimeout(900);
    const nomesRede = await pg.$$eval('.pv2-corpo__fixo .pv2-td--nome', (xs) => xs.map((x) => x.textContent));
    afirma(`${pre}: busca "Rede" → só as linhas que casam (${nomesRede.length} de ${total})`, nomesRede.length > 0 && nomesRede.length < total && nomesRede.every((n) => /rede/i.test(n)), nomesRede.join(' | '));
    await pg.fill('.pv2-busca input', String(pids[3])); await pg.waitForTimeout(900);
    afirma(`${pre}: busca pelo ID ${pids[3]} → a linha dele primeiro`, Number(await pg.$eval('.pv2-corpo__fixo .pv2-td--id', (e) => e.textContent)) === pids[3]);
    await pg.fill('.pv2-busca input', ''); await pg.waitForTimeout(900);
    // Colunas: ocultar preserva o rascunho; ordenação
    const col = await pg.evaluate(() => { const c = [...document.querySelectorAll('.pv2-celula input.at-campo:not([readonly])')].find((i) => !i.closest('.pv2-oculta') && i.closest('.at-editor__linha')?.querySelector('.at-campo--unid') === null && !i.value); const cel = c?.closest('[data-c]'); return cel ? { c: cel.dataset.c, l: cel.dataset.l, rot: [...document.querySelectorAll('.pv2-linha-cab .pv2-th')][[...cel.parentElement.children].indexOf(cel)]?.querySelector('.pv2-th__rot')?.textContent } : null; });
    const sel = `.pv2-corpo__rola [data-l="${col.l}"][data-c="${col.c}"] input.at-campo`;
    // a gravação desta célula é RECUSADA de propósito (422): nada vai ao banco; a célula fica com "Não foi salvo" + o rascunho
    let posts = 0;
    await pg.route('**/api/atributos/index.php?r=valor', async (r) => { if (r.request().method() !== 'POST') return r.continue(); posts++;
      return r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'VALIDATION_ERROR', meta: { message: 'Teste: recusado de propósito.', desfecho: 'recusada', motivos: { valor: 'Teste: recusado de propósito.' } } }) }); });
    await pg.click(sel); await pg.keyboard.type('rascunho-v2'); await pg.keyboard.press('Tab'); await pg.waitForTimeout(800);
    const celSel = `.pv2-corpo__rola [data-l="${col.l}"][data-c="${col.c}"]`;
    const antes = await pg.evaluate((c) => document.querySelector(c)?.querySelector('.at-salvo')?.textContent || '', celSel);
    await pg.click('.pv2-colunas > button'); await pg.waitForSelector('.pv2-colunas__menu');
    await pg.locator('.pv2-colunas__item', { hasText: col.rot.replace(/\*$/, '') }).first().locator('input').uncheck(); await pg.waitForTimeout(300);
    const oculta = await pg.evaluate((c) => ({ vis: getComputedStyle(document.querySelector(c)).visibility, botao: document.querySelector('.pv2-colunas > button').textContent }), celSel);
    await pg.locator('.pv2-colunas__item', { hasText: col.rot.replace(/\*$/, '') }).first().locator('input').check(); await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
    const depois = { rasc: await pg.inputValue(sel), msg: await pg.evaluate((c) => document.querySelector(c)?.querySelector('.at-salvo')?.textContent || '', celSel) };
    afirma(`${pre}: Colunas — ocultar "${col.rot}" esconde a coluna e avisa ("${oculta.botao.trim()}"); ao mostrar de novo, o rascunho e a mensagem "Não foi salvo" CONTINUAM na célula`,
      /Não foi salvo/.test(antes) && oculta.vis === 'hidden' && /1 oculta/.test(oculta.botao) && depois.rasc === 'rascunho-v2' && /Não foi salvo/.test(depois.msg), JSON.stringify({ antes, oculta, depois }));
    await pg.focus(sel); await pg.keyboard.press('Escape'); await pg.waitForTimeout(200); await pg.keyboard.press('Tab'); await pg.waitForTimeout(500);
    afirma(`${pre}: Esc desfaz o rascunho; a única tentativa de gravação foi a interceptada (${posts}) — nada foi ao banco`, (await pg.inputValue(sel)) === '' && posts === 1, `posts=${posts}`);
    await pg.unroute('**/api/atributos/index.php?r=valor');
    await pg.click('.pv2-th--id .pv2-ordenar'); await pg.waitForTimeout(300); const asc = await pg.$$eval('.pv2-corpo__fixo .pv2-td--id', (xs) => xs.map((x) => Number(x.textContent)));
    await pg.click('.pv2-th--id .pv2-ordenar'); await pg.waitForTimeout(300); const desc = await pg.$$eval('.pv2-corpo__fixo .pv2-td--id', (xs) => xs.map((x) => Number(x.textContent)));
    afirma(`${pre}: ordenar por ID (numérico) ▲ e ▼ — aria-sort indica a direção (ícone da TabelaDados)`, JSON.stringify(asc) === JSON.stringify([...asc].sort((a, b) => a - b)) && JSON.stringify(desc) === JSON.stringify([...asc].sort((a, b) => b - a)) && (await pg.getAttribute('.pv2-th--id', 'aria-sort')) === 'descending');
    await pg.click('.pv2-th--id .pv2-ordenar'); await pg.waitForTimeout(200);
    const ajuda = await pg.$$eval('.pv2-linha-cab .pv2-th', (ths) => ths.filter((t) => t.title).length);
    afirma(`${pre}: classificações (Opcional/Importante/obrigatório) na ajuda contextual do cabeçalho (${ajuda} colunas com ajuda)`, ajuda > 0);
    afirma(`${pre}: nenhum erro de página`, erros.length === 0, erros.slice(0, 3).join(' | '));
    await pg.screenshot({ path: `${CAP}/teste-${W}x${H}-topo.png` });
    await pg.context().close();
  }
  console.log(`PREENCHER V2: ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
