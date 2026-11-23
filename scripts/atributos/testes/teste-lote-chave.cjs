// DSHOW-096 · tela: aceitar a coluna do Preencher em LOTE com chave por intenção. Rede simulada (route) sobre o harness real; a prova de
// banco (queda depois do 6º, retomada, zero duplicação) é o lote-chave-mysql.php. Nada é gravado (POST e conferir interceptados).
// Cenários: (A) 1º POST perdido → "Não conseguimos confirmar" + Conferir → interrompida (6 aceitas / N-6 pendentes) → Retomar com a MESMA
// chave e o MESMO corpo → resumo por item (aceitas/rejeitadas/ignoradas/pendentes). (B) resposta antiga não mexe no diálogo novo nem na grade.
// Uso: PORTA=8112 flock … nice -n 10 node teste-lote-chave.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const CAP = 'capturas-lote'; require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
  await pg.goto(`${B}/#/panel-atributos/preencher`); await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('select[aria-label="Kit"]', { timeout: 40000 });
  // um kit cuja grade tenha uma coluna com "aceitar N sugestões" (N ≥ 7)
  const opcoes = await pg.$$eval('select[aria-label="Kit"] option', (os) => os.map((o) => o.value).filter(Boolean));
  let N = 0, textoLink = null;
  for (const v of opcoes) {
    await pg.selectOption('select[aria-label="Kit"]', v); await pg.waitForSelector('.pv2-grade, table.at-tabela--grade', { timeout: 40000 }).catch(() => {}); await pg.waitForTimeout(800);
    for (const t of await pg.$$eval('button.at-link', (bs) => bs.map((x) => x.textContent).filter((x) => /aceitar \d+/.test(x)))) { const n = Number(t.match(/\d+/)[0]); if (n >= 7) { N = n; textoLink = t; break; } }
    if (textoLink) break;
  }
  afirma(`existe uma coluna com "aceitar N sugestões" (N ≥ 7) num kit do harness (N = ${N})`, !!textoLink); if (!textoLink) { await b.close(); process.exit(1); }
  const link = pg.locator('button.at-link', { hasText: textoLink }).first();
  const posts = [], gets = []; let modo = 'A1'; let ultimoCorpo = null;
  await pg.route('**/api/atributos/index.php?r=sugestoes_lote*', async (route) => {
    const req = route.request(); const h = req.headers(); const corpo = req.postData(); posts.push({ chave: h['x-chave-operacao'] || null, corpo, modo });
    const ids = JSON.parse(corpo).ids; ultimoCorpo = ids;
    if (modo === 'A1') return route.abort('connectionreset');                  // resposta perdida
    if (modo === 'A2') {                                                         // retomada: 1 rejeitada e 1 ignorada no fim
      const acc = ids.slice(0, -2); const recibo = { operacao: 'sugestoes_lote', chave: h['x-chave-operacao'], desfecho: 'aplicada', confirmado_em: '2026-11-19 08:00:00', aceitas: acc.length, aceitas_ids: acc, pedidas: ids.length };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { aceitas: acc.length, aceitas_ids: acc, ignoradas: [{ id: ids.at(-1), motivo: 'ja_decidida', estado: 'recusada' }], falhas: [{ id: ids.at(-2), codigo: 'VALUE_EXISTS', erro: 'Este campo já tem valor neste produto.' }], pedidas: ids.length, desfecho: 'aplicada', recibo } }) });
    }
    await new Promise((r) => setTimeout(r, 3000));                               // modo B: resposta atrasada
    const recibo = { operacao: 'sugestoes_lote', chave: h['x-chave-operacao'], desfecho: 'aplicada', confirmado_em: 'x' };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { aceitas: ids.length, aceitas_ids: ids, ignoradas: [], falhas: [], pedidas: ids.length, desfecho: 'aplicada', recibo } }) }).catch(() => {});
  });
  await pg.route('**/api/atributos/index.php?r=conferir_gravacao*', async (route) => {
    const u = new URL(route.request().url()); gets.push(u.searchParams.get('chave'));
    const itens = ultimoCorpo.map((id, i) => ({ item: String(id), desfecho: i < 6 ? 'aceita' : 'pendente', detalhe: null }));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { chave: u.searchParams.get('chave'), resultado: 'interrompida', operacao: 'sugestoes_lote', recibo: null, erro: null, itens, itens_resumo: { aceita: 6, pendente: ultimoCorpo.length - 6 } } }) });
  });
  const dlg = '.at-portal-modal [role="dialog"]';
  await link.click(); await pg.waitForSelector(dlg);
  afirma('abrir o diálogo NÃO gera chave (a intenção nasce ao confirmar)', (await pg.$eval(`${dlg} [data-at-lote]`, (e) => e.dataset.atChave)) === '');
  // (A1) confirmar → resposta perdida
  await pg.click(`${dlg} button:has-text("Aceitar ${N}")`); await pg.waitForSelector(`${dlg} [data-at-lote="desconhecido"]`, { timeout: 15000 });
  const K = posts[0]?.chave; const corpo0 = posts[0]?.corpo;
  afirma(`1º POST com chave (${K}) e corpo congelado {ids: ${N}, confirmar: true}`, !!K && /^[A-Za-z0-9_-]{8,64}$/.test(K) && JSON.parse(corpo0).ids.length === N && JSON.parse(corpo0).confirmar === true);
  afirma('resposta perdida → "Não conseguimos confirmar se foi salvo." + Conferir gravação (nada reenviado sozinho)', (await pg.textContent(dlg)).includes('Não conseguimos confirmar se foi salvo.') && !!(await pg.$(`${dlg} button:has-text("Conferir gravação")`)) && posts.length === 1);
  await pg.screenshot({ path: `${CAP}/1-desconhecido.png` });
  // conferir → interrompida 6 / N-6
  await pg.click(`${dlg} button:has-text("Conferir gravação")`); await pg.waitForSelector(`${dlg} [data-at-lote="interrompida"]`, { timeout: 15000 });
  const n = async (k) => Number(await pg.$eval(`${dlg} [data-n="${k}"]`, (e) => e.textContent));
  afirma(`Conferir (só GET, mesma chave): parou no meio · 6 aceitas · ${N - 6} pendentes · 0 rejeitadas · 0 ignoradas`, gets.length === 1 && gets[0] === K && posts.length === 1 && (await n('aceitas')) === 6 && (await n('pendentes')) === N - 6 && (await n('rejeitadas')) === 0 && (await n('ignoradas')) === 0);
  await pg.screenshot({ path: `${CAP}/2-interrompida.png` });
  // (A2) retomar com a MESMA chave e o MESMO corpo
  modo = 'A2'; await pg.click(`${dlg} button:has-text("Retomar os pendentes")`); await pg.waitForSelector(`${dlg} [data-at-lote="concluido"]`, { timeout: 15000 });
  afirma('retomar: 2º POST com a MESMA chave e o MESMO corpo (byte a byte)', posts.length === 2 && posts[1].chave === K && posts[1].corpo === corpo0, JSON.stringify(posts.map((p) => p.chave)));
  const txt = await pg.textContent(dlg);
  afirma(`resumo por item da retomada: ${N - 2} aceitas · 1 rejeitada · 1 ignorada · 0 pendentes, com motivos`, (await n('aceitas')) === N - 2 && (await n('rejeitadas')) === 1 && (await n('ignoradas')) === 1 && (await n('pendentes')) === 0
    && txt.includes('Este campo já tem valor neste produto.') && txt.includes('já decidida (recusada)'));
  await pg.screenshot({ path: `${CAP}/3-concluido.png` });
  await pg.click(`${dlg} button:has-text("Fechar")`); await pg.waitForTimeout(400);
  // (B) resposta antiga não atualiza um diálogo novo nem a grade
  modo = 'B'; let fichas = 0; pg.on('request', (r) => { if (/r=ficha_produto|r=fichas/.test(r.url())) fichas++; });
  await link.click(); await pg.waitForSelector(dlg); await pg.click(`${dlg} button:has-text("Aceitar ${N}")`); await pg.waitForTimeout(300);
  const K2 = posts.at(-1).chave;
  afirma('nova abertura = NOVA intenção (chave diferente)', !!K2 && K2 !== K);
  await pg.click(`${dlg} button:has-text("Fechar")`); await pg.waitForTimeout(200);
  await link.click(); await pg.waitForSelector(dlg); fichas = 0;
  await pg.waitForTimeout(3600);   // a resposta antiga (3 s) chega com o diálogo novo aberto
  const fase = await pg.$eval(`${dlg} [data-at-lote]`, (e) => e.dataset.atLote);
  const avisos = await pg.$$eval('.at-aviso', (as) => as.map((a) => a.textContent));
  afirma('resposta antiga chegou: o diálogo novo continua em "confirmar", sem aviso de aceitas e sem recarregar a grade', fase === 'confirmar' && !avisos.some((t) => /aceita/.test(t)) && fichas === 0, `fase=${fase} avisos=${JSON.stringify(avisos)} fichas=${fichas}`);
  await pg.click(`${dlg} button:has-text("Cancelar")`);
  afirma('total de POSTs = 3 (perdido, retomada, cenário B) e 1 conferir; nenhum reenvio automático', posts.length === 3 && gets.length === 1);
  console.log(`LOTE COM CHAVE (tela): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
