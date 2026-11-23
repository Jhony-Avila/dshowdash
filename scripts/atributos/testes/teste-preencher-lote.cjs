// DSHOW-099 · CIMA · PREENCHER: aceitar a coluna em LOTE com chave — o MESMO roteiro da Conferência (teste-conferencia-lote.cjs da DIREITA),
// agora pela tela do PREENCHER, no servidor REAL, no SHA final do FOI-SALVO: lote de 10 → queda depois do 6º (a 7ª sugestão travada por
// outra conexão; o servidor responde 503 OPERATION_INTERRUPTED depois de 6 COMMITs) → resposta PERDIDA → "Conferir gravação" (só GET) =
// interrompida 6/4 → "Retomar os pendentes" com a MESMA chave e o MESMO corpo → 10 aceitas → ZERO duplicação; reenvio extra = recibo idêntico.
// Caminho na tela: Produtos (selecionar os 10) → Preencher "Usar os 10 selecionados" → coluna do atributo "aceitar 10 sugestões".
// Base ATRWEB_VAL_EQ (validação). Dados sintéticos no atributo 5 (Descrição Importação); limpeza em soft delete, como no teste da DIREITA.
// Uso: PORTA=8115 flock /srv/dshow-modularizacao/locks/navegador.lock nice -n 10 node teste-preencher-lote.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const { execFileSync, spawn } = require('child_process');
const B = `http://127.0.0.1:${process.env.PORTA || 8115}`; const CRED = '/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini';
const sql = (q) => execFileSync('mysql', [`--defaults-extra-file=${CRED}`, '-N', '-B', 'ATRWEB_VAL_EQ', '-e', q]).toString().trim();
let ok = 0, falhas = 0;
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const A = 6, ROT = 'Descrição Complementar';   // CIMA usa o atributo 6 (a DIREITA usa o 5 na mesma base: sem colisão)
const RUN = 'd099p-' + Date.now().toString(36);
(async () => {
  const P = sql(`SELECT id FROM product_catalog WHERE active=1 AND deleted=0 AND id NOT IN (SELECT product_id FROM eq_valor WHERE atributo_id=${A}) ORDER BY id LIMIT 10`).split('\n').map(Number);
  afirma('preparo: 10 produtos ativos sem valor no atributo 5 e 0 sugestões pendentes nele', P.length === 10 && sql(`SELECT COUNT(*) FROM eq_sugestao WHERE atributo_id=${A} AND estado='pendente'`) === '0');
  for (const [k, pid] of P.entries()) sql(`INSERT INTO eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, confianca, evidencia) VALUES ('${RUN}|${pid}', ${pid}, ${A}, 'nome_produto', 'valor', 'Atrito ${k + 1}', 'media', 'teste DSHOW-099 CIMA Preencher ${RUN}')`);
  const ids = sql(`SELECT id FROM eq_sugestao WHERE chave LIKE '${RUN}|%' ORDER BY product_id, atributo_id, id`).split('\n').map(Number);
  afirma('preparo: 10 sugestões sintéticas pendentes', ids.length === 10);
  const L = ids.join(',');
  const aceitasBD = () => Number(sql(`SELECT COUNT(*) FROM eq_sugestao WHERE id IN (${L}) AND estado='aceita'`));
  const valoresBD = () => Number(sql(`SELECT COUNT(*) FROM eq_valor WHERE atributo_id=${A} AND product_id IN (${P.join(',')}) AND excluido_em IS NULL`));
  const valoresV1 = () => Number(sql(`SELECT COUNT(*) FROM eq_valor WHERE atributo_id=${A} AND product_id IN (${P.join(',')}) AND excluido_em IS NULL AND versao=1`));
  const audItem = (id) => Number(sql(`SELECT COUNT(*) FROM eq_auditoria WHERE entidade='sugestao' AND entidade_id LIKE '%:${id}' AND acao='aceitar_sugestao'`));
  const audTot = () => Number(sql('SELECT COUNT(*) FROM eq_auditoria'));

  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } }); const pg = await ctx.newPage();
  const api = (metodo, rota, corpo, cab = {}) => pg.evaluate(async ([metodo, rota, corpo, cab]) => {
    const t = (await (await fetch('/api/auth/check.php', { credentials: 'same-origin' })).json())?.data?.session?.csrf_token ?? '';
    const r = await fetch('/api/atributos/index.php?r=' + rota, { method: metodo, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t, ...cab }, body: JSON.stringify(corpo) });
    let j = null; try { j = await r.json(); } catch {} return { status: r.status, j }; }, [metodo, rota, corpo, cab]);
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
  // selecionar os 10 produtos na tela Produtos (busca pelo ID: o produto exato vem primeiro) e usá-los no Preencher
  await pg.goto(`${B}/#/panel-atributos`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-filtros__total', { timeout: 40000 });
  // lista de Produtos v2: busca/filtro novo desmarca o que fica invisível (A.5). Então: Tabela, sem busca, Situação "todos" e marcar os 10
  // percorrendo as PÁGINAS (trocar de página não desmarca); o contador fica em [data-pl-sel]
  await pg.click('.at-pl-alternador button:has-text("Tabela")').catch(() => {}); await pg.fill('.at-fixo input[type="search"]', ''); await pg.selectOption('select[aria-label="Situação"]', 'todos'); await pg.waitForTimeout(500);
  { const faltam = new Set(P);
    for (let pag = 0; pag < 30 && faltam.size; pag++) {
      const marcados = await pg.evaluate((ids) => { const out = []; for (const tr of document.querySelectorAll('.at-pl-tabela tbody tr')) { const id = Number(tr.querySelector('.at-pl-id')?.textContent); if (ids.includes(id)) { const c = tr.querySelector('input[type="checkbox"]'); if (c && !c.checked) c.click(); out.push(id); } } return out; }, [...faltam]);
      marcados.forEach((i) => faltam.delete(i)); if (!faltam.size) break;
      const prox = await pg.$('nav.at-paginas button:has-text("Próxima"):not([disabled])'); if (!prox) break; await prox.click(); await pg.waitForTimeout(350); } }
  afirma('10 produtos selecionados', /10 selecionad/.test(await pg.textContent('[data-pl-sel], .at-filtros__sel').catch(() => '')));
  await pg.click('.at-nav button:has-text("Preencher")'); await pg.waitForSelector('button:has-text("Usar os 10 selecionados")', { timeout: 30000 });
  await pg.click('button:has-text("Usar os 10 selecionados")'); await pg.waitForSelector('.pv2-grade, table.at-tabela--grade', { timeout: 90000 }); await pg.waitForTimeout(1200);
  const link = pg.locator(`.pv2-cab .pv2-th:has-text("${ROT}") button:has-text("aceitar"), table.at-tabela--grade thead th:has-text("${ROT}") button.at-link:has-text("aceitar")`).first();
  afirma(`coluna "${ROT}" com "aceitar 10 sugestões"`, /aceitar 10 sugest/.test(await link.textContent().catch(() => '')));
  await link.click(); await pg.waitForSelector('[data-at-lote]', { timeout: 10000 });
  const fase = () => pg.getAttribute('[data-at-lote]', 'data-at-lote');
  const esperaFase = async (f, ms = 90000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await fase()) === f) return true; await pg.waitForTimeout(250); } return false; };
  afirma('diálogo aberto em "confirmar" com "Aceitar 10"', (await fase()) === 'confirmar' && !!(await pg.$('.at-portal-modal [role="dialog"] button:has-text("Aceitar 10")')));

  // 1) QUEDA depois do 6º no servidor REAL, sem tocar no código: (a) a 7ª sugestão travada em OUTRA conexão → o UPDATE dela espera o lock
  //    wait (50 s) → CONFLICT (falha do item); (b) a linha do 7º item em eq_operacao_item também travada → registrar a falha também esgota
  //    a espera → a exceção sai do laço → 503 OPERATION_INTERRUPTED com 6 COMMITs e 4 pendentes (o 7º fica pendente: a transação dele voltou).
  const travas = [spawn('mysql', [`--defaults-extra-file=${CRED}`, 'ATRWEB_VAL_EQ', '-e', `START TRANSACTION; SELECT id FROM eq_sugestao WHERE id=${ids[6]} FOR UPDATE; DO SLEEP(90); ROLLBACK;`], { stdio: 'ignore' })];
  await pg.waitForTimeout(1500);
  const posts = []; pg.on('request', (r) => { if (r.method() === 'POST' && /r=sugestoes_lote/.test(r.url())) posts.push({ chave: r.headers()['x-chave-operacao'], corpo: r.postData() }); });
  let resp1 = null;
  await pg.route('**/api/atributos/index.php?r=sugestoes_lote', async (r) => {
    const ch = (r.request().headers()['x-chave-operacao'] || '').replace(/[^A-Za-z0-9_-]/g, '');
    travas.push(spawn('mysql', [`--defaults-extra-file=${CRED}`, 'ATRWEB_VAL_EQ', '-e', `DO SLEEP(6); START TRANSACTION; SELECT item FROM eq_operacao_item WHERE chave='${ch}' AND item='${ids[6]}' FOR UPDATE; DO SLEEP(150); ROLLBACK;`], { stdio: 'ignore' }));
    const x = await r.fetch({ timeout: 240000 }); resp1 = { status: x.status(), corpo: await x.text() }; await r.abort('failed'); }, { times: 1 });
  await pg.click('.at-portal-modal [role="dialog"] button:has-text("Aceitar 10")');
  afirma('1ª tentativa: resposta PERDIDA → "Não conseguimos confirmar se foi salvo." (fase desconhecido), nunca "salvo"', await esperaFase('desconhecido', 240000) && (await pg.textContent('[data-at-lote]')).includes('Não conseguimos confirmar se foi salvo'), await fase());
  for (const t of travas) t.kill('SIGTERM'); await pg.waitForTimeout(1500);
  afirma('servidor (o que o navegador perdeu): 503 OPERATION_INTERRUPTED', resp1?.status === 503 && /OPERATION_INTERRUPTED/.test(resp1?.corpo || ''), `${resp1?.status} ${(resp1?.corpo || '').slice(0, 120)}`);
  afirma('banco depois da queda: 6 sugestões aceitas, 6 valores, 4 pendentes', aceitasBD() === 6 && valoresBD() === 6, `aceitas=${aceitasBD()} valores=${valoresBD()}`);
  const chave = posts[0]?.chave;
  afirma('chave de operação enviada no cabeçalho; corpo = os 10 IDs na ordem + confirmar', !!chave && JSON.stringify(JSON.parse(posts[0].corpo)) === JSON.stringify({ ids, confirmar: true }), posts[0]?.corpo);

  // 2) Conferir gravação: só GET, desfecho por item
  const a0 = audTot(); const nPosts = posts.length;
  await pg.click('.at-portal-modal [role="dialog"] button:has-text("Conferir gravação")');
  afirma('Conferir → "O lote parou no meio." com 6 aceita(s) e 4 pendente(s)', await esperaFase('interrompida', 20000)
    && (await pg.textContent('[data-n="aceitas"]')) === '6' && (await pg.textContent('[data-n="pendentes"]')) === '4', `${await fase()}`);
  afirma('Conferir não gravou nada (auditoria igual) e não fez POST', audTot() === a0 && posts.length === nPosts);
  const st = sql(`SELECT estado FROM eq_operacao WHERE chave='${chave}'`);
  afirma('eq_operacao = interrompida', st === 'interrompida', st);

  // 3) Retomar os pendentes: MESMA chave e MESMO corpo
  let resp2 = null; pg.on('response', async (r) => { if (r.request().method() === 'POST' && /r=sugestoes_lote/.test(r.url())) { try { resp2 = await r.json(); } catch {} } });
  await pg.click('.at-portal-modal [role="dialog"] button:has-text("Retomar os pendentes")');
  afirma('retomada → "Pronto. Confirmado pelo servidor." com 10 aceita(s), 0 pendente(s)', await esperaFase('concluido', 30000)
    && (await pg.textContent('[data-n="aceitas"]')) === '10' && (await pg.textContent('[data-n="pendentes"]')) === '0', await fase());
  afirma('retomada com a MESMA chave e o MESMO corpo', posts.length === 2 && posts[1].chave === chave && posts[1].corpo === posts[0].corpo, JSON.stringify(posts[1] ?? {}).slice(0, 160));
  afirma('ZERO duplicação: 1 auditoria "aceitar_sugestao" por item', JSON.stringify(ids.map(audItem)) === JSON.stringify(Array(10).fill(1)), JSON.stringify(ids.map(audItem)));
  afirma('ZERO duplicação: 10 valores, todos na versão 1', valoresBD() === 10 && valoresV1() === 10, `v=${valoresBD()} v1=${valoresV1()}`);
  afirma('eq_operacao_item: 10 itens, todos aceita; operação aplicada', sql(`SELECT CONCAT(SUM(desfecho='aceita'),'/',COUNT(*)) FROM eq_operacao_item WHERE chave='${chave}'`) === '10/10' && sql(`SELECT estado FROM eq_operacao WHERE chave='${chave}'`) === 'aplicada');

  // 4) reenvio extra (a resposta da retomada também se perdeu) → repetido, recibo idêntico, nada novo
  const a1 = audTot(); const r3 = await api('POST', 'sugestoes_lote', JSON.parse(posts[0].corpo), { 'X-Chave-Operacao': chave });
  afirma('reenvio extra: 200 repetido, recibo IDÊNTICO ao da retomada, nenhuma auditoria nova', r3.status === 200 && r3.j?.data?.repetido === true && JSON.stringify(r3.j?.data?.recibo) === JSON.stringify(resp2?.data?.recibo) && audTot() === a1 && valoresBD() === 10, `${r3.status} rep=${r3.j?.data?.repetido}`);
  const r4 = await api('POST', 'sugestoes_lote', { ids: ids.slice(0, 9), confirmar: true }, { 'X-Chave-Operacao': chave });
  afirma('mesma chave com OUTRO corpo → 422 IDEMPOTENCY_KEY_REUSED', r4.status === 422 && r4.j?.error === 'IDEMPOTENCY_KEY_REUSED', `${r4.status} ${r4.j?.error}`);
  await pg.click('.at-portal-modal [role="dialog"] button:has-text("Fechar")'); await pg.waitForTimeout(300);
  afirma('fechar o diálogo: sem aviso de saída pendente (beforeunload solto)', !(await pg.$('[data-at-lote]')));
  await b.close();
  // limpeza (validação): valores do teste em soft delete; sugestões ficam "aceita" com a evidência do RUN
  sql(`UPDATE eq_valor SET excluido_em = CURRENT_TIMESTAMP(3) WHERE atributo_id=${A} AND product_id IN (${P.join(',')}) AND excluido_em IS NULL`);
  console.log(`RUN ${RUN} · chave ${chave} · sugestões ${L}`);
  console.log(`${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e); limpar(); process.exit(2); });
process.on('exit', () => { try { execFileSync('true'); } catch {} });
function limpar() {   // falha no meio: sugestões do RUN ainda pendentes → recusadas; valores do RUN → soft delete
  try { sql(`UPDATE eq_sugestao SET estado='recusada', motivo='limpeza do teste DSHOW-099', versao=versao+1 WHERE chave LIKE '${RUN}|%' AND estado='pendente'`);
    sql(`UPDATE eq_valor v JOIN eq_sugestao s ON s.product_id=v.product_id AND s.atributo_id=v.atributo_id SET v.excluido_em=CURRENT_TIMESTAMP(3) WHERE s.chave LIKE '${RUN}|%' AND v.excluido_em IS NULL`); } catch (e) { console.error('limpeza', e.message); }
}
