// PACOTE A · Produtos · Tabela e Cartões (CIMA, briefing 23/11) · teste LEVE da tela, só leitura (nada é gravado), flags de shell da produção.
// Faixa numa linha (2200: Categoria e Kit na faixa; 1440: dentro de Filtros) · larguras das colunas pela área real · linhas de 36 px · cabeçalho
// travado ao rolar · Filtros ancorado (não é modal; Esc fecha e devolve o foco; "Filtros · N"; etiquetas só com filtro ativo) · Cartões 5/3 colunas,
// 250 px · "Com obrigatórios vazios" · trocar modo mantém página e seleção · filtro novo desmarca o que ficaria invisível (com aviso) · vazio ·
// carregando (esqueleto, sem "0 produtos") · erro (mantém busca, oferece nova tentativa). Capturas sem o rodapé do shell (mostra o IP).
// Uso: PORTA=8112 W=2200 H=1470 flock … nice -n 10 node teste-produtos-lista-v2.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470), RES = `${W}x${H}`;
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const CAP = 'capturas-produtos-lista-' + W; require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const RODAPE_SHELL = 36;   // o rodapé do shell mostra o IP do servidor de validação: fica fora das capturas
const L1440 = [36, 340, 140, 132, 160, 104, 64, 120], L2200 = [36, 680, 230, 200, 220, 130, 90, 270], COLS = ['sel', 'produto', 'subcategoria', 'kit', 'essenciais', 'obrigatorios', 'fotos', 'precifica'];
const esperado = (area) => { const t = Math.max(0, Math.min(1, (area - 1096) / 760)); const w = L1440.map((a, i) => Math.round(a + t * (L2200[i] - a))); const s = w.reduce((x, y) => x + y, 0); if (area > s) w[1] += area - s; return Object.fromEntries(COLS.map((c, i) => [c, w[i]])); };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const nova = async () => { const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }); const pg = await ctx.newPage();
    await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 }); return pg; };
  const abrir = async (pg) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/#/panel-atributos`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-filtros__total', { timeout: 40000 }); await pg.waitForTimeout(800); };
  const foto = (pg, nome) => pg.screenshot({ path: `${CAP}/${nome}.png`, clip: { x: 0, y: 0, width: W, height: H - RODAPE_SHELL } });
  const rolar = (pg, y) => pg.evaluate((y) => { document.querySelector('main#main')?.scrollTo({ top: y }); document.scrollingElement?.scrollTo({ top: y }); }, y);
  const modo = async (pg, m) => { await pg.click(`.at-pl-alternador button:has-text("${m}")`); await pg.waitForTimeout(500); };
  const pg = await nova(); await abrir(pg);

  // ── Tabela
  await modo(pg, 'Tabela'); await pg.waitForSelector('.at-pl-tabela tbody tr', { timeout: 20000 }); await pg.waitForTimeout(500);
  const faixa = await pg.evaluate(() => { const f = document.querySelector('.at-pl-faixa'); const r = f.getBoundingClientRect(); const filhos = [...f.children].filter((x) => x.getBoundingClientRect().width > 0);
    return { altura: Math.round(r.height), tops: [...new Set(filhos.map((x) => Math.round(x.getBoundingClientRect().top + x.getBoundingClientRect().height / 2)))], cat: !!f.querySelector(':scope > select[aria-label="Categoria"]'), kit: !!f.querySelector(':scope > select[aria-label="Kit"]'),
      cortado: f.scrollWidth > f.clientWidth + 1 }; });
  afirma(`faixa de ferramentas numa linha só (altura ${faixa.altura}px, nada cortado)`, faixa.altura <= 46 && Math.max(...faixa.tops) - Math.min(...faixa.tops) <= 3 && !faixa.cortado, JSON.stringify(faixa));
  afirma(W >= 2000 ? '2200: Categoria e Kit na faixa' : '1440: Categoria e Kit NÃO ficam na faixa (vão para Filtros)', W >= 2000 ? faixa.cat && faixa.kit : !faixa.cat && !faixa.kit, JSON.stringify(faixa));
  afirma('sem filtro ativo: a linha de etiquetas não existe', !(await pg.$('.at-pl-etiquetas')));
  const larg = await pg.evaluate(() => ({ area: Math.round(document.querySelector('.at-pl').getBoundingClientRect().width), th: Object.fromEntries([...document.querySelectorAll('.at-pl-tabela thead th')].map((t) => [t.dataset.coluna, Math.round(t.getBoundingClientRect().width)])) }));
  const esp = esperado(larg.area); const difs = COLS.map((c) => Math.abs((larg.th[c] ?? 0) - esp[c]));
  afirma(`colunas pela área real (${larg.area}px): diferença máx ${Math.max(...difs)}px`, Math.max(...difs) <= 3, JSON.stringify({ th: larg.th, esp }));
  const linhas = await pg.$$eval('.at-pl-tabela tbody tr.at-td__linha', (xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
  afirma(`linhas uniformes de 36 px (${linhas.length} linhas)`, linhas.length > 0 && linhas.every((h) => Math.abs(h - 36) <= 1), JSON.stringify([...new Set(linhas)]));
  const tipo = await pg.evaluate(() => { const n = document.querySelector('.at-pl-tabela .at-pl-nome'); const s = getComputedStyle(n); return { peso: s.fontWeight, ws: s.whiteSpace, corte: s.textOverflow, cab: getComputedStyle(document.querySelector('.at-pl-tabela thead th')).fontWeight }; });
  afirma('nome em peso 400, numa linha com reticências; cabeçalho até 500', Number(tipo.peso) === 400 && tipo.ws === 'nowrap' && tipo.corte === 'ellipsis' && Number(tipo.cab) <= 500, JSON.stringify(tipo));
  const kits = await pg.$$eval('.at-pl-tabela tbody td[data-coluna="kit"], .at-pl-tabela tbody tr.at-td__linha', (xs) => xs.map((x) => x.querySelector('.at-pl-semkit')?.textContent ?? '').filter(Boolean));
  afirma('kit ausente = pílula neutra "Sem kit específico" (nunca "Sem kit")', kits.every((t) => t === 'Sem kit específico'), JSON.stringify([...new Set(kits)]));
  await foto(pg, `tabela-${RES}-topo`);
  const antes = await pg.evaluate(() => ({ fixo: document.querySelector('.at-fixo').getBoundingClientRect().bottom, thead: document.querySelector('.at-pl-tabela thead').getBoundingClientRect().top }));
  await rolar(pg, 700); await pg.waitForTimeout(500);
  const depois = await pg.evaluate(() => ({ fixo: document.querySelector('.at-fixo').getBoundingClientRect().bottom, thead: document.querySelector('.at-pl-tabela thead').getBoundingClientRect().top, rodape: document.querySelector('.at-pl-rodape').getBoundingClientRect().bottom }));
  afirma(`rolando, o topo fica parado e o cabeçalho das colunas gruda no bloco travado (thead ${Math.round(depois.thead)} ≈ bloco ${Math.round(depois.fixo)})`, Math.abs(depois.fixo - antes.fixo) <= 1 && Math.abs(depois.thead - depois.fixo) <= 2, JSON.stringify({ antes, depois }));
  afirma('rolando, o rodapé de páginas fica à vista', depois.rodape <= H + 1, JSON.stringify(depois));
  if (W >= 2000) await foto(pg, `tabela-${RES}-rolada`);
  await rolar(pg, 0); await pg.waitForTimeout(300);

  // ── Filtros (ancorado, não modal)
  await pg.click('.at-pl-btn-filtros'); await pg.waitForSelector('#at-pl-painel-filtros');
  const pn = await pg.evaluate(() => { const p = document.querySelector('#at-pl-painel-filtros'); return { dialog: !!document.querySelector('[role="dialog"]') || p.getAttribute('role') === 'dialog', rapidos: p.querySelectorAll('input[role="switch"]').length,
    cat: !!p.querySelector('select[aria-label="Categoria"]'), sub: !!p.querySelector('select[aria-label="Subcategoria"]'), kit: !!p.querySelector('select[aria-label="Kit"]'), expandido: document.querySelector('.at-pl-btn-filtros').getAttribute('aria-expanded') }; });
  afirma('Filtros abre na página (não é modal), com os 6 filtros rápidos e a Subcategoria', !pn.dialog && pn.rapidos === 6 && pn.sub && pn.expandido === 'true', JSON.stringify(pn));
  afirma(W >= 2000 ? '2200: Categoria e Kit fora do painel (estão na faixa)' : '1440: Categoria, Subcategoria e Kit dentro de Filtros (nenhum filtro some)', W >= 2000 ? !pn.cat && !pn.kit : pn.cat && pn.kit, JSON.stringify(pn));
  await pg.click('#at-pl-painel-filtros label:has-text("Com obrigatórios vazios")'); await pg.waitForTimeout(400);
  afirma('1 filtro ativo: botão "Filtros · 1" e UMA linha de etiquetas com "Limpar filtros"', (await pg.textContent('.at-pl-btn-filtros')).includes('Filtros · 1') && (await pg.$$('.at-pl-etiqueta')).length === 1 && !!(await pg.$('.at-pl-etiquetas button:has-text("Limpar filtros")')));
  if (W < 2000) await foto(pg, `filtros-${RES}-aberto-1-filtro`);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
  afirma('Esc fecha o painel e devolve o foco ao botão Filtros', !(await pg.$('#at-pl-painel-filtros')) && (await pg.evaluate(() => document.activeElement?.classList.contains('at-pl-btn-filtros'))));

  // ── Cartões com "Com obrigatórios vazios" (o filtro continua ativo: trocar de modo mantém)
  await modo(pg, 'Cartões'); await pg.waitForSelector('.at-pl-cartao', { timeout: 20000 }); await pg.waitForTimeout(600);
  const ob = await pg.$$eval('.at-pl-cartao [data-pl-obrigatorios]', (xs) => xs.map((x) => Number(x.dataset.plObrigatorios)));
  afirma(`Cartões com "Com obrigatórios vazios": todos com "N obrigatórios pendentes" > 0 (${ob.length} cartões); o filtro sobreviveu à troca de modo`, ob.length > 0 && ob.every((n) => n > 0) && (await pg.$$('.at-pl-etiqueta')).length === 1, JSON.stringify(ob.slice(0, 10)));
  if (W < 2000) await foto(pg, `cartoes-${RES}-obrigatorios-vazios`);
  await pg.click('.at-pl-etiquetas button:has-text("Limpar filtros")'); await pg.waitForTimeout(500);
  afirma('"Limpar filtros": a linha de etiquetas some', !(await pg.$('.at-pl-etiquetas')));
  const grade = await pg.$$eval('.at-pl-cartao', (xs) => ({ cols: new Set(xs.filter((x) => Math.round(x.getBoundingClientRect().top) === Math.round(xs[0].getBoundingClientRect().top)).map((x) => Math.round(x.getBoundingClientRect().left))).size, alturas: [...new Set(xs.map((x) => Math.round(x.getBoundingClientRect().height)))] }));
  afirma(`Cartões: ${W >= 2000 ? 5 : 3} colunas com o menu aberto; altura fixa de 250 px em todos`, grade.cols === (W >= 2000 ? 5 : 3) && grade.alturas.length === 1 && grade.alturas[0] === 250, JSON.stringify(grade));
  const mini = await pg.evaluate(() => { const i = document.querySelector('.at-pl-mini img'); return { contain: i ? getComputedStyle(i).objectFit : null, sem: document.querySelectorAll('[data-pl-mini="sem"]').length, card: !!document.querySelector('a.at-pl-cartao, .at-pl-cartao[role="link"]') }; });
  afirma('miniatura sem distorcer (contain); o cartão inteiro NÃO é um link', (mini.contain === null || mini.contain === 'contain') && !mini.card, JSON.stringify(mini));
  await foto(pg, `cartoes-${RES}`);

  // ── contexto (A.5): página 2, 2 selecionados; trocar o modo mantém; filtro novo desmarca o que ficaria invisível, com aviso
  const prox = await pg.$('nav.at-paginas button:has-text("Próxima"):not([disabled])');
  if (prox) { await prox.click(); await pg.waitForTimeout(400); }
  const pagX = await pg.textContent('nav.at-paginas');
  const cx = await pg.$$('.at-pl-cartao input[type="checkbox"]'); await cx[0].check(); await cx[1].check(); await pg.waitForTimeout(200);
  await modo(pg, 'Tabela'); await pg.waitForSelector('.at-pl-tabela tbody tr');
  afirma('trocar Cartões → Tabela mantém a página e os 2 selecionados', (await pg.textContent('nav.at-paginas')) === pagX && (await pg.textContent('.at-pl-sel')).startsWith('2 selecionados'), await pg.textContent('nav.at-paginas'));
  await pg.fill('.at-fixo input[type="search"]', 'zzqx'); await pg.waitForTimeout(500);
  afirma('busca nova: os selecionados que ficariam fora são desmarcados, com aviso', !(await pg.$('.at-pl-sel')) && /desmarcad/.test(await pg.textContent('.at-pl-aviso').catch(() => '')));

  // ── vazio no catálogo inteiro
  await pg.fill('.at-fixo input[type="search"]', 'zzqx inexistente'); await pg.selectOption('select[aria-label="Situação"]', 'todos'); await pg.waitForTimeout(500);
  const vz = await pg.textContent('.at-pl-vazio');
  afirma('vazio no catálogo inteiro: "Nenhum produto ativo ou inativo encontrado" + "Limpar busca", sem "Buscar em todo o catálogo"', vz.includes('Nenhum produto ativo ou inativo encontrado') && !!(await pg.$('.at-pl-vazio button:has-text("Limpar busca")')) && !(await pg.$('button:has-text("em todo o catálogo")')));
  if (W >= 2000) await foto(pg, `vazio-${RES}`);
  await pg.context().close();

  // ── carregando (vitrine atrasada) e erro (vitrine falha)
  { const p2 = await nova(); let liberar; const espera = new Promise((r) => { liberar = r; });
    await p2.route('**/api/atributos/index.php?r=vitrine*', async (route) => { await espera; await route.continue(); });
    await p2.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await p2.goto(`${B}/#/panel-atributos`); await p2.reload(); await p2.waitForSelector('.at-pl-faixa', { timeout: 40000 }); await p2.waitForTimeout(800);
    afirma('carregando: esqueleto do mesmo tamanho, sem "0 produtos" antes da resposta', !!(await p2.$('.at-pl-esq, .at-pl-esq-tabela')) && !(await p2.$('.at-filtros__total')));
    liberar(); await p2.waitForSelector('.at-filtros__total', { timeout: 30000 });
    await p2.context().close(); }
  { const p3 = await nova(); await p3.route('**/api/atributos/index.php?r=vitrine*', (route) => route.abort('connectionreset'));
    await p3.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await p3.goto(`${B}/#/panel-atributos`); await p3.reload(); await p3.waitForSelector('.at-erro-bloco', { timeout: 40000 });
    await p3.fill('.at-fixo input[type="search"]', 'cabo'); await p3.waitForTimeout(300);
    afirma('erro: a falha é explicada, a faixa continua (busca digitável) e há "Tentar de novo"; nunca "0 produtos"', !!(await p3.$('.at-erro-bloco button:has-text("Tentar de novo")')) && !(await p3.$('.at-filtros__total')));
    await p3.unroute('**/api/atributos/index.php?r=vitrine*'); await p3.click('.at-erro-bloco button:has-text("Tentar de novo")'); await p3.waitForSelector('.at-filtros__total', { timeout: 30000 }); await p3.waitForTimeout(400);
    afirma('"Tentar de novo" carrega a lista MANTENDO a busca digitada', (await p3.inputValue('.at-fixo input[type="search"]')) === 'cabo' && !(await p3.$('.at-erro-bloco')));
    await p3.context().close(); }
  console.log(`PRODUTOS LISTA V2 (${RES}): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
