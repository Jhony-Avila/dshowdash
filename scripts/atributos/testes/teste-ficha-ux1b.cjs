// UX-1b · Ficha: cabeçalho fixo até as colunas, bloco do produto que encolhe/reabre, TabelaDados (ordenação dentro do grupo e na lista
// inteira), editor na célula, sub-abas com ícones, carrossel + ampliar, completude acionável, cadeado, diálogo acima do shell.
// Harness 8112. Grava 1 valor de texto e o LIMPA no fim. Uso: flock /srv/dshow-modularizacao/locks/navegador.lock nice -n 10 node teste-ficha-ux1b.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const CAP = 'capturas-ux1b';
let ok = 0, falhas = 0;
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const pg = await ctx.newPage();
  const api = (metodo, rota, corpo, params = {}) => pg.evaluate(async ([metodo, rota, corpo, params]) => {
    const t = (await (await fetch('/api/auth/check.php', { credentials: 'same-origin' })).json())?.data?.session?.csrf_token ?? '';
    const r = await fetch('/api/atributos/index.php?' + new URLSearchParams({ r: rota, ...params }), { method: metodo, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t }, body: metodo === 'POST' ? JSON.stringify(corpo) : undefined });
    let j = null; try { j = await r.json(); } catch {} return { status: r.status, j }; }, [metodo, rota, corpo, params]);
  const ficha = async (pid) => (await api('GET', 'ficha_produto', null, { product_id: pid })).j.data;
  const ir = async (rota, sel) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/${rota}`); await pg.reload({ waitUntil: 'networkidle' }); if (sel) await pg.waitForSelector(sel, { timeout: 40000 }); await pg.waitForTimeout(800); };
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const P = 154; const f0 = await ficha(P);
  await ir(`#/panel-atributos/produto/${P}`, '.at-tabela-ficha');

  // título e sub-abas
  const cab = await pg.evaluate(() => ({ h1: document.querySelector('.at-cabecalho h1')?.textContent, p: !!document.querySelector('.at-cabecalho p'), icones: document.querySelectorAll('.at-abas--icones button svg.at-icone').length }));
  afirma('ficha: título do módulo "Produtos", SEM descrição; 5 sub-abas com ícone', cab.h1 === 'Produtos' && !cab.p && cab.icones === 5, JSON.stringify(cab));
  const fixos = await pg.evaluate(() => { const f = document.querySelector('.at-fixo'); return { faixa: !!f.querySelector('.at-ficha__faixa'), abas: !!f.querySelector('.at-abas--icones'), filtros: !!f.querySelector('.at-ficha__filtros'), heroiFora: !f.querySelector('.at-heroi') && !!document.querySelector('.at-heroi') }; });
  afirma('bloco fixo contém: faixa do produto (← Produtos), sub-abas e filtros; o bloco grande do produto fica FORA (rola com a página)', fixos.faixa && fixos.abas && fixos.filtros && fixos.heroiFora, JSON.stringify(fixos));
  await pg.screenshot({ path: `${CAP}/depois-ficha-topo-claro.png` });

  // rolar a PÁGINA (roda do mouse): a faixa do produto + sub-abas + filtros ficam parados no topo; o bloco grande sai de vista;
  // o cabeçalho das colunas gruda logo abaixo do bloco fixo
  const rolador = () => pg.evaluate(() => { const r = document.querySelector('.at-raiz'); for (let e = r.parentElement; e; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2) return e.id || e.className.toString().slice(0, 30); } return 'documento'; });
  await pg.mouse.move(720, 800); for (let k = 0; k < 6; k++) { await pg.mouse.wheel(0, 300); await pg.waitForTimeout(80); } await pg.waitForTimeout(500);
  const rol = await pg.evaluate(() => { const f = document.querySelector('.at-fixo').getBoundingClientRect(); const th = document.querySelector('.at-tabela-ficha thead th')?.getBoundingClientRect(); const h = document.querySelector('.at-heroi-fixo')?.getBoundingClientRect();
    const main = document.querySelector('main#main'); const mt = main ? main.getBoundingClientRect().top : 0;
    return { faixa: !!document.querySelector('.at-fixo .at-ficha__faixa'), abas: !!document.querySelector('.at-fixo .at-abas--icones'), filtros: !!document.querySelector('.at-fixo .at-ficha__filtros'), fixoTopo: Math.round(f.top), mainTopo: Math.round(mt), fixoBase: Math.round(f.bottom), thTopo: th && Math.round(th.top), heroiBase: h && Math.round(h.bottom), scroll: main ? main.scrollTop : -1 }; });
  afirma(`rolando a página (${await rolador()}): faixa do produto, sub-abas e filtros parados no topo (fixo ${rol.fixoTopo} ≈ ${rol.mainTopo})`, rol.scroll > 200 && rol.faixa && rol.abas && rol.filtros && Math.abs(rol.fixoTopo - rol.mainTopo) <= 2, JSON.stringify(rol));
  afirma(`cabeçalho das colunas grudado logo abaixo do bloco fixo (th ${rol.thTopo} ≈ base ${rol.fixoBase})`, rol.thTopo !== undefined && Math.abs(rol.thTopo - rol.fixoBase) <= 3, JSON.stringify(rol));
  afirma('o bloco grande do produto saiu de vista (rolou com a página); a faixa fina tem ← Produtos, miniatura, nome, ID, 2 barras e Detalhes', rol.heroiBase !== undefined && rol.heroiBase <= rol.fixoBase
    && await pg.evaluate(() => { const c = document.querySelector('.at-ficha__faixa'); return !!c && /← Produtos/.test(c.textContent) && !!c.querySelector('.at-heroi-compacto__foto') && !!c.querySelector('.at-heroi-compacto__nome') && /ID/.test(c.textContent) && c.querySelectorAll('.at-heroi-compacto__barras > *').length === 2 && /Detalhes/.test(c.textContent); }), JSON.stringify(rol));
  await pg.screenshot({ path: `${CAP}/depois-ficha-rolada-claro.png` });
  await pg.evaluate(() => { const m = document.querySelector('main#main'); if (m) m.scrollTo({ top: 0, behavior: 'instant' }); });
  for (let k = 0; k < 30 && (await pg.evaluate(() => document.querySelector('main#main')?.scrollTop ?? 0)) > 0; k++) await pg.waitForTimeout(100);
  afirma('de volta ao topo: o bloco grande do produto aparece de novo', await pg.evaluate(() => { const h = document.querySelector('.at-heroi-fixo').getBoundingClientRect(); const f = document.querySelector('.at-fixo').getBoundingClientRect(); return h.top >= f.bottom - 1; }));

  // ordenação: dentro de cada grupo (grupos na mesma ordem); "Todos juntos" = lista inteira
  const grupos = () => pg.$$eval('.at-tabela-ficha tbody tr', (trs) => { const out = []; for (const tr of trs) { const g = tr.querySelector('th[colspan], td[colspan]'); if (g) out.push({ g: g.textContent.trim(), xs: [] }); else if (out.length) out[out.length - 1].xs.push(tr.querySelector('.at-attr__rotulo')?.textContent.replace(/[*★]/g, '').trim()); else out.push({ g: '', xs: [tr.querySelector('.at-attr__rotulo')?.textContent.replace(/[*★]/g, '').trim()] }); } return out; });
  const g0 = await grupos();
  await pg.click('.at-tabela-ficha thead button:has-text("Atributo e origem do vínculo")'); await pg.waitForTimeout(300);
  const g1 = await grupos(); const col = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
  afirma(`Por kit + ordenar por Atributo: os ${g1.length} grupos mantêm a ordem e cada grupo fica em ordem alfabética`, JSON.stringify(g1.map((x) => x.g)) === JSON.stringify(g0.map((x) => x.g)) && g1.every((x) => x.xs.every((v, k) => k === 0 || col.compare(x.xs[k - 1], v) <= 0)), JSON.stringify(g1.map((x) => x.g)));
  await pg.click('.at-tabela-ficha thead button:has-text("Atributo e origem do vínculo")'); await pg.waitForTimeout(300);
  const g2 = await grupos(); afirma('2º clique: decrescente dentro de cada grupo', g2.every((x) => x.xs.every((v, k) => k === 0 || col.compare(x.xs[k - 1], v) >= 0)));
  await pg.click('button[aria-pressed]:has-text("Todos juntos")'); await pg.waitForTimeout(300);
  await pg.click('.at-tabela-ficha thead button:has-text("Atributo e origem do vínculo")'); await pg.waitForTimeout(200);
  const lista = await pg.$$eval('.at-tabela-ficha tbody tr .at-attr__rotulo', (xs) => xs.map((x) => x.textContent.replace(/[*★]/g, '').trim()));
  const ordenada = [...lista].sort(col.compare); const desc = [...ordenada].reverse();
  afirma(`"Todos juntos": a ordenação vale para a lista inteira (${lista.length} linhas, sem linhas de grupo)`, (JSON.stringify(lista) === JSON.stringify(ordenada) || JSON.stringify(lista) === JSON.stringify(desc)) && lista.length === f0.itens.length && !(await pg.$('.at-tabela-ficha tbody [colspan]')));
  await pg.click('.at-tabela-ficha thead button:has-text("Estado e sugestão")'); await pg.waitForTimeout(200);
  afirma('ordenar por "Estado e sugestão" funciona (aria-sort)', (await pg.$eval('.at-tabela-ficha thead th[data-coluna="estado"]', (e) => e.getAttribute('aria-sort'))) !== 'none');
  await pg.click('button[aria-pressed]:has-text("Por kit")'); await pg.waitForTimeout(200);

  // editor na célula: grava ao sair do campo, e a ordem não pula enquanto edita
  const T = f0.itens.find((i) => i.tipo === 'texto' && !i.valor && i.autoridade !== 'precifica');
  if (T) {
    const campo = `#campo-${P}-${T.atributo_id}`;
    await pg.fill(campo, 'ux1b-celula'); await pg.press(campo, 'Tab'); await pg.waitForTimeout(1500);
    const v = (await ficha(P)).itens.find((i) => i.atributo_id === T.atributo_id)?.valor;
    afirma(`editor na célula: "${T.rotulo}" gravado ao sair do campo (Tab)`, v && v.texto === 'ux1b-celula', JSON.stringify(v));
    const it = (await ficha(P)).itens.find((i) => i.atributo_id === T.atributo_id);
    await api('POST', 'valor_limpar', { product_id: P, atributo_id: T.atributo_id, versao: it.valor.versao, versao_conjunto: it.versao_conjunto });
  } else afirma('editor na célula: há um texto vazio para testar', false);

  // completude acionável e cadeado
  await ir(`#/panel-atributos/produto/${P}`, '.at-completude');
  const comp = await pg.textContent('.at-completude'); const e = f0.completude.essencial; const nP = f0.completude.obrigatorios_vazios.length;
  afirma(`completude: "${e.total ? `${e.feitos} de ${e.total} essenciais preenchidos` : 'Sem essenciais definidos'}"${nP ? ` · Ver ${nP} pendente(s)` : ''}`, comp.includes(e.total ? `${e.feitos} de ${e.total} essenciais preenchidos` : 'Sem essenciais definidos') && (nP === 0 || comp.includes(`Ver ${nP} pendente`)), comp);
  if (nP) { await pg.click('.at-completude button:has-text("Ver")'); await pg.waitForTimeout(300); afirma('"Ver N pendentes" aplica o filtro "Obrigatórios pendentes"', (await pg.getAttribute('button:has-text("Obrigatórios pendentes")', 'aria-pressed')) === 'true'); }
  const cad = await pg.getAttribute('.at-origem--kit', 'title').catch(() => null);
  afirma('cadeado do vínculo por kit: "Vínculo pelo kit <nome>. Você pode preencher o valor DSHOW."', !!cad && /^Vínculo pelo kit .+\. Você pode preencher o valor DSHOW\.$/.test(cad), cad);

  // carrossel + ampliar (154 tem foto?) e produto sem fotos
  const comFoto = f0.fotos.length > 0 ? P : null;
  if (comFoto) {
    afirma(`carrossel: ${f0.fotos.length} miniatura(s) no bloco da direita, com setas`, (await pg.$$('.at-carrossel__item')).length === f0.fotos.length && (await pg.$$('.at-carrossel__seta')).length === 2);
    await pg.click('.at-carrossel__item'); await pg.waitForSelector('.at-portal-modal [role="dialog"]');
    const dlg = await pg.evaluate(() => { const d = document.querySelector('.at-portal-modal [role="dialog"]'); const r = d.querySelector('.at-modal__cabeca').getBoundingClientRect(); const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { titulo: d.getAttribute('aria-label'), topo: Math.round(r.top), porCima: d.contains(topo), noBody: d.closest('.at-portal-modal')?.parentElement === document.body, foto: !!d.querySelector('img, .at-foto') }; });
    afirma(`clique amplia: "${dlg.titulo}", foto grande`, /^Foto 1 de \d+$/.test(dlg.titulo) && dlg.foto, JSON.stringify(dlg));
    afirma('diálogo acima da barra do shell (portal no body; o cabeçalho do diálogo é o que está por cima no ponto)', dlg.noBody && dlg.porCima && dlg.topo >= 0, JSON.stringify(dlg));
    await pg.screenshot({ path: `${CAP}/depois-ficha-foto-ampliada.png` });
    await pg.keyboard.press('Escape');
  }
  const semFoto = (await api('GET', 'vitrine')).j.data.produtos.find((x) => x.ativo && x.fotos === 0);
  if (semFoto) { await ir(`#/panel-atributos/produto/${semFoto.id}`, '.at-heroi'); afirma(`produto sem fotos (${semFoto.id}): o carrossel não aparece`, !(await pg.$('.at-carrossel'))); }
  // diálogo "Detalhes" também por cima do shell
  await ir(`#/panel-atributos/produto/${P}`, '.at-ficha__faixa'); await pg.click('.at-ficha__faixa button:has-text("Detalhes")'); await pg.waitForSelector('.at-portal-modal [role="dialog"]');
  const det = await pg.evaluate(() => { const d = document.querySelector('.at-portal-modal [role="dialog"]'); const r = d.querySelector('.at-modal__cabeca').getBoundingClientRect(); return d.contains(document.elementFromPoint(r.left + 20, r.top + r.height / 2)) && r.top >= 0; });
  afirma('diálogo "Detalhes" inteiro visível, por cima da barra do shell', det); await pg.keyboard.press('Escape');

  // escuro (lua do topo) + 700 px (tudo rola: sem encolher)
  if ((await pg.evaluate(() => document.documentElement.getAttribute('data-theme'))) !== 'dark') await pg.click('button.dsd-theme-toggle');
  await pg.waitForTimeout(500); await pg.screenshot({ path: `${CAP}/depois-ficha-topo-escuro.png` });
  await pg.mouse.move(720, 800); for (let k = 0; k < 5; k++) { await pg.mouse.wheel(0, 300); await pg.waitForTimeout(80); } await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${CAP}/depois-ficha-rolada-escuro.png` });
  await pg.click('button.dsd-theme-toggle'); await pg.waitForTimeout(300);
  await pg.setViewportSize({ width: 1440, height: 700 }); await ir(`#/panel-atributos/produto/${P}`, '.at-tabela-ficha'); await pg.waitForTimeout(600);
  const baixa = await pg.evaluate(() => { const r = document.querySelector('.at-raiz'); return { altura: r.style.height || null, pos: getComputedStyle(document.querySelector('.at-fixo')).position, fixo: document.querySelector('.at-fixo').offsetHeight }; });
  afirma(`700px: sem altura fixada; bloco do topo sticky (${baixa.fixo}px)`, !baixa.altura && baixa.pos === 'sticky', JSON.stringify(baixa));
  console.log(`FICHA (UX-1b): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
