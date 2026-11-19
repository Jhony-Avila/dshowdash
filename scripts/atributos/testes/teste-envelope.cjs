// DSHOW-078 e DSHOW-079 (EditorValor): a retentativa reenvia o ENVELOPE da 1ª tentativa; o número vai com a unidade que estava na tela.
// Prova PAYLOAD (interceptado), estado PERSISTIDO (GET da ficha) e AUDITORIA (eq_auditoria no banco de validação).
// Harness 8112. Uso: flock /srv/dshow-modularizacao/locks/navegador.lock nice -n 10 node teste-envelope.cjs
// Cria 1 atributo de várias opções de teste (desativado no fim); valores limpos; ajuste de unidade desfeito.
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const { execFileSync } = require('child_process');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`;
const CRED = '/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini';
const sql = (q) => execFileSync('mysql', [`--defaults-extra-file=${CRED}`, '-N', '-B', 'ATRWEB_VAL_EQ', '-e', q]).toString().trim();
let ok = 0, falhas = 0;
const afirma = (nome, cond, extra = '') => { if (cond) { ok++; console.log('ok    ' + nome); } else { falhas++; console.log('FALHA ' + nome + (extra ? ' · ' + extra : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const api = (metodo, rota, corpo, params = {}) => pg.evaluate(async ([metodo, rota, corpo, params]) => {
    const t = (await (await fetch('/api/auth/check.php', { credentials: 'same-origin' })).json())?.data?.session?.csrf_token ?? '';
    const r = await fetch('/api/atributos/index.php?' + new URLSearchParams({ r: rota, ...params }), { method: metodo, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t }, body: metodo === 'POST' ? JSON.stringify(corpo) : undefined });
    let j = null; try { j = await r.json(); } catch {} return { status: r.status, j }; }, [metodo, rota, corpo, params]);
  const ficha = async (pid) => (await api('GET', 'ficha_produto', null, { product_id: pid })).j.data;
  const item = async (pid, aid) => (await ficha(pid)).itens.find((i) => i.atributo_id === aid);
  const ir = async (rota, sel) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/${rota}`); await pg.reload({ waitUntil: 'networkidle' }); if (sel) await pg.waitForSelector(sel, { timeout: 40000 }); await pg.waitForTimeout(600); };
  // abre a ficha por navegação INTERNA (sem recarregar a página: pedidos pendentes continuam vivos)
  const abrirInterno = async (pid) => {
    await pg.click('button:has-text("← Produtos")'); await pg.waitForSelector('input[type="search"]', { timeout: 20000 });
    await pg.fill('input[type="search"]', String(pid)); await pg.waitForTimeout(700);
    await pg.locator('.at-cartao__abrir, .at-link-produto').first().click(); await pg.waitForSelector('.at-ficha', { timeout: 20000 }); await pg.waitForTimeout(800);
  };
  const audit = (pid, aid) => Number(sql(`SELECT COUNT(*) FROM eq_auditoria WHERE entidade='valor' AND (entidade_id='${pid}:${aid}' OR entidade_id LIKE '${pid}:${aid}:%')`));
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });

  // ---------- DSHOW-078 ----------
  const P = 147;
  const ra = await api('POST', 'atributo', { rotulo: `Saídas 078 ${Date.now() % 100000}`, tipo: 'multiopcao', aceita_nao_se_aplica: 1 });
  const M = ra.j?.data?.atributo; afirma('preparo: atributo de várias opções criado', !!M, JSON.stringify(ra.j?.error));
  await api('POST', 'opcao', { atributo_id: M.id, rotulo: 'A' }); const ops = (await api('POST', 'opcao', { atributo_id: M.id, rotulo: 'B' })).j.data.opcoes;
  const [oA, oB] = [ops.find((o) => o.rotulo === 'A').id, ops.find((o) => o.rotulo === 'B').id];
  const raj = await api('POST', 'produto_atributo', { product_id: P, atributo_id: M.id, modo: 'incluir', versao_vinculos: (await ficha(P)).versao_vinculos });
  afirma('preparo: atributo incluído na ficha do produto', raj.status === 200, JSON.stringify(raj.j?.error));
  const i0 = await item(P, M.id);
  await api('POST', 'valor', { product_id: P, atributo_id: M.id, valor: oA, estado: 'informado', versao_conjunto: i0.versao_conjunto });
  const R1 = (await item(P, M.id)).versao_conjunto;
  afirma('A gravada (R1)', JSON.stringify((await item(P, M.id)).valor?.opcao_ids) === JSON.stringify([oA]), `R1=${R1}`);

  // interceptação: B fica PENDENTE; "Não se aplica" falha no transporte; registramos todo payload
  const enviados = []; const chaves = []; let bPendente = null; let falharNA = 1;   // "foi salvo ou não": a chave de operação vai no cabeçalho
  await pg.route('**/api/atributos/index.php?r=valor', async (route) => {
    const corpo = JSON.parse(route.request().postData() || '{}'); if (corpo.atributo_id !== M.id) return route.continue();
    enviados.push(corpo); chaves.push(route.request().headers()['x-chave-operacao'] ?? null);
    if (corpo.valor === oB && !bPendente) { bPendente = route; return; }                 // segura B
    if (corpo.estado === 'nao_se_aplica' && falharNA > 0) { falharNA--; return route.abort('failed'); }   // falha de transporte: servidor NÃO recebeu
    return route.continue();
  });
  const CHK = (rot) => `[data-atributo="${M.id}"] label.at-check:has-text("${rot}") input`;
  const EST = `select[aria-label="Estado de ${M.rotulo}"]`;
  await ir(`#/panel-atributos/produto/${P}`, CHK('B'));
  await pg.click(CHK("B")); await pg.waitForTimeout(400);
  afirma('B enviado e PENDENTE (preso)', !!bPendente);
  await abrirInterno(P);                                                                   // sair e voltar
  await pg.waitForSelector(EST); await pg.selectOption(EST, 'nao_se_aplica');
  // "foi salvo ou não": falha de transporte = resultado DESCONHECIDO ("Não conseguimos confirmar" + Conferir gravação), nunca "não salvo"
  await pg.waitForSelector(`[data-atributo="${M.id}"] .at-salvo--erro button:has-text("Conferir gravação")`, { timeout: 15000 });
  afirma('falha de transporte: "Não conseguimos confirmar se foi salvo." + "Conferir gravação"', /Não conseguimos confirmar se foi salvo/.test(await pg.textContent(`[data-atributo="${M.id}"] .at-salvo--erro`)));
  const env1 = enviados.find((c) => c.estado === 'nao_se_aplica'); const chave1 = chaves[enviados.indexOf(env1)];
  afirma('1ª tentativa de "Não se aplica" leva a revisão R1', env1 && String(env1.versao_conjunto) === String(R1), JSON.stringify(env1));
  await bPendente.continue(); await pg.waitForTimeout(1500);                                // B confirma → R2
  const iB = await item(P, M.id); const R2 = iB.versao_conjunto;
  afirma('B confirmou: A+B persistidos (R2 ≠ R1)', JSON.stringify([...iB.valor.opcao_ids].sort()) === JSON.stringify([oA, oB].sort()) && String(R2) !== String(R1), `R2=${R2}`);
  // a TELA passa a ver R2 sem remontar o editor: grava outro campo da mesma ficha (a ficha relê); B aparece marcada
  const fT = await ficha(P); const T = fT.itens.find((i) => i.tipo === 'texto' && !i.valor && i.autoridade !== 'precifica' && i.atributo_id !== M.id);
  await pg.fill(`#campo-${P}-${T.atributo_id}`, 'x078'); await pg.press(`#campo-${P}-${T.atributo_id}`, 'Tab');
  for (let k = 0; k < 60 && !(await pg.isChecked(CHK('B'))); k++) await pg.waitForTimeout(250);   // espera a releitura (até 15 s)
  afirma('tela releu a ficha: B aparece marcada (o item na tela já é R2) e "Conferir gravação" continua', await pg.isChecked(CHK('B')) && !!(await pg.$(`[data-atributo="${M.id}"] button:has-text("Conferir gravação")`)),
    `T=${T.atributo_id}/${T.rotulo} salvo=${JSON.stringify((await item(P, T.atributo_id))?.valor?.texto)} Bmarcada=${await pg.isChecked(CHK('B'))} sit=${await pg.$eval(`[data-atributo="${M.id}"]`, (e) => e.querySelector('[role="alert"],.at-salvo')?.textContent ?? '-').catch(() => '?')}`);
  const audAntes = audit(P, M.id);
  // Conferir gravação (GET): a tentativa nunca chegou ao servidor → sem registro da chave → "Não foi salvo" + "Tentar de novo"
  await pg.click(`[data-atributo="${M.id}"] button:has-text("Conferir gravação")`);
  await pg.waitForSelector(`[data-atributo="${M.id}"] .at-salvo--erro button:has-text("Tentar de novo")`, { timeout: 15000 });
  afirma('Conferir gravação: o servidor não tem registro desta tentativa → "Não foi salvo." + "Tentar de novo"; a conferência não gravou nada', /Não foi salvo\./.test(await pg.textContent(`[data-atributo="${M.id}"] .at-salvo--erro`)) && audit(P, M.id) === audAntes);
  const resp = pg.waitForResponse((r) => r.url().includes('r=valor') && r.request().method() === 'POST' && JSON.parse(r.request().postData() || '{}').atributo_id === M.id);
  await pg.click(`[data-atributo="${M.id}"] button:has-text("Tentar de novo")`);
  const r409 = await resp; const env2 = enviados[enviados.length - 1];
  afirma('"Tentar de novo" reenvia EXATAMENTE o envelope da 1ª tentativa (R1, mesma versão, mesmo estado) e a MESMA chave de operação', JSON.stringify(env2) === JSON.stringify(env1) && !!chave1 && chaves[chaves.length - 1] === chave1, `${JSON.stringify(env2)} chave1=${chave1} chave2=${chaves[chaves.length - 1]}`);
  afirma('servidor responde 409', r409.status() === 409, String(r409.status()));
  const iD = await item(P, M.id);
  afirma('persistido: A+B intactos, estado informado', iD.valor.estado === 'informado' && JSON.stringify([...iD.valor.opcao_ids].sort()) === JSON.stringify([oA, oB].sort()), JSON.stringify(iD.valor));
  afirma('auditoria: nenhuma linha nova (sem auditoria de sucesso)', audit(P, M.id) === audAntes, `${audAntes} → ${audit(P, M.id)}`);
  afirma('tela: mostra o conflito (não "salvo")', !!(await pg.$(`[data-atributo="${M.id}"] .at-salvo--erro`)));

  // controle: falha de transporte SEM mudança concorrente → o mesmo envelope funciona
  await ir(`#/panel-atributos/produto/${P}`, EST); falharNA = 1; enviados.length = 0; chaves.length = 0;
  await pg.selectOption(EST, 'nao_se_aplica');
  await pg.waitForSelector(`[data-atributo="${M.id}"] .at-salvo--erro button:has-text("Conferir gravação")`, { timeout: 15000 });
  await pg.click(`[data-atributo="${M.id}"] button:has-text("Conferir gravação")`);
  await pg.waitForSelector(`[data-atributo="${M.id}"] .at-salvo--erro button:has-text("Tentar de novo")`, { timeout: 15000 });
  const c1 = enviados[0]; const audC = audit(P, M.id);
  const respC = pg.waitForResponse((r) => r.url().includes('r=valor') && r.request().method() === 'POST');
  await pg.click(`[data-atributo="${M.id}"] button:has-text("Tentar de novo")`); const rc = await respC;
  afirma('controle: reenvio do MESMO envelope (R2) com a MESMA chave → 200', rc.status() === 200 && JSON.stringify(enviados[1]) === JSON.stringify(c1) && String(c1.versao_conjunto) === String(R2) && !!chaves[0] && chaves[1] === chaves[0], `${rc.status()} ${JSON.stringify(enviados)} ${JSON.stringify(chaves)}`);
  afirma('controle: persistido "Não se aplica" e +1 linha de auditoria', (await item(P, M.id)).valor?.estado === 'nao_se_aplica' && audit(P, M.id) === audC + 1, `${audC} → ${audit(P, M.id)}`);
  await pg.unroute('**/api/atributos/index.php?r=valor');
  { const it = await item(P, T.atributo_id); if (it?.valor) await api('POST', 'valor_limpar', { product_id: P, atributo_id: T.atributo_id, versao: it.valor.versao, versao_conjunto: it.versao_conjunto }); }

  // ---------- DSHOW-079 ----------
  const P1 = 154, A1 = 394, C1 = `#campo-${P1}-${A1}`, U1 = 'select[aria-label="Unidade de Profundidade"]';
  const limpar = async () => { const i = await item(P1, A1); if (i?.valor) await api('POST', 'valor_limpar', { product_id: P1, atributo_id: A1, versao: i.valor.versao, versao_conjunto: i.versao_conjunto }); };
  await limpar();
  const unids = (await item(P1, A1)).unidades; const uid = (s) => unids.find((u) => u.simbolo === s)?.id;
  // (i) sem tocar na unidade: a da tela (efetiva) vai no payload, não null
  const efet = (await item(P1, A1)).unidade_efetiva;
  const env79 = []; let segura = null;
  await pg.route('**/api/atributos/index.php?r=valor', async (route) => {
    const c = JSON.parse(route.request().postData() || '{}'); if (c.atributo_id !== A1) return route.continue();
    env79.push(c); if (c.valor === '1' && !segura) { segura = route; return; } return route.continue(); });
  await ir(`#/panel-atributos/produto/${P1}`, C1);
  await pg.fill(C1, '7'); await pg.press(C1, 'Tab'); await pg.waitForTimeout(1500);
  afirma(`(i) sem escolher unidade: payload leva a da tela (${efet?.simbolo}), não null`, env79[0] && env79[0].unidade_id === efet?.id, JSON.stringify(env79[0]));
  await limpar();
  // (ii) 1 vendo m; o produto passa para cm ANTES de a gravação chegar
  await ir(`#/panel-atributos/produto/${P1}`, C1);
  await pg.selectOption(U1, { label: 'm' }); await pg.fill(C1, '1'); await pg.press(C1, 'Tab'); await pg.waitForTimeout(500);
  afirma('(ii) gravação de 1 m presa no transporte', !!segura);
  const rAj = await api('POST', 'produto_atributo', { product_id: P1, atributo_id: A1, modo: 'ajustar', unidade_id: uid('cm'), versao_vinculos: (await ficha(P1)).versao_vinculos });
  afirma('(ii) unidade do produto trocada para cm', rAj.status === 200 && (await item(P1, A1)).unidade_efetiva?.simbolo === 'cm', JSON.stringify(rAj.j?.error));
  const aud79 = audit(P1, A1);
  const resp79 = pg.waitForResponse((r) => r.url().includes('r=valor') && r.request().method() === 'POST'); await segura.continue(); const r79 = await resp79;
  const sent = env79.find((c) => c.valor === '1');
  afirma('(ii) payload leva m (a unidade da tela na confirmação), número sem conversão', sent.unidade_id === uid('m') && sent.valor === '1', JSON.stringify(sent));
  const v79 = (await item(P1, A1)).valor;
  afirma('(ii) persistido 1 m (ou 409 sem gravar)', r79.status() === 200 ? (v79 && Number(v79.numero) === 1 && v79.unidade_id === uid("m")) : (r79.status() === 409 && !v79), `${r79.status()} ${JSON.stringify(v79)}`);
  afirma('(ii) auditoria coerente (+1 se gravou, 0 se 409)', audit(P1, A1) === aud79 + (r79.status() === 200 ? 1 : 0));
  // (iii) 1ª gravação SEM escolher unidade (vale a exibida = efetiva) e o produto passa para cm ANTES de a gravação chegar
  await limpar(); await api('POST', 'produto_atributo', { product_id: P1, atributo_id: A1, modo: null, versao_vinculos: (await ficha(P1)).versao_vinculos });
  segura = null; env79.length = 0;
  await pg.unroute('**/api/atributos/index.php?r=valor');
  await pg.route('**/api/atributos/index.php?r=valor', async (route) => {
    const c = JSON.parse(route.request().postData() || '{}'); if (c.atributo_id !== A1) return route.continue();
    env79.push(c); if (c.valor === '2' && !segura) { segura = route; return; } return route.continue(); });
  await ir(`#/panel-atributos/produto/${P1}`, C1);
  const exib = await pg.$eval(U1, (e) => e.options[e.selectedIndex]?.textContent).catch(() => null);
  await pg.fill(C1, '2'); await pg.press(C1, 'Tab'); await pg.waitForTimeout(500);
  afirma(`(iii) campo vazio, unidade exibida "${exib}" sem escolher: gravação presa`, !!segura);
  await api('POST', 'produto_atributo', { product_id: P1, atributo_id: A1, modo: 'ajustar', unidade_id: uid('cm'), versao_vinculos: (await ficha(P1)).versao_vinculos });
  const aud3 = audit(P1, A1);
  const resp3 = pg.waitForResponse((r) => r.url().includes('r=valor') && r.request().method() === 'POST'); await segura.continue(); const r3 = await resp3;
  const s3 = env79.find((c) => c.valor === '2'); const v3 = (await item(P1, A1)).valor;
  afirma(`(iii) payload leva a unidade EXIBIDA (${exib}), não a nova do produto (cm)`, s3 && s3.unidade_id === uid(exib) && s3.unidade_id !== uid('cm'), JSON.stringify(s3));
  afirma(`(iii) persistido 2 ${exib} (não reinterpretado como cm) e +1 auditoria`, r3.status() === 200 && v3 && Number(v3.numero) === 2 && v3.unidade_id === uid(exib) && audit(P1, A1) === aud3 + 1, `${r3.status()} ${JSON.stringify(v3)}`);
  await pg.unroute('**/api/atributos/index.php?r=valor');

  // limpeza
  await limpar();
  await api('POST', 'produto_atributo', { product_id: P1, atributo_id: A1, modo: null, versao_vinculos: (await ficha(P1)).versao_vinculos });
  const iM = await item(P, M.id); if (iM?.valor) await api('POST', 'valor_limpar', { product_id: P, atributo_id: M.id, versao: iM.valor.versao, versao_conjunto: iM.versao_conjunto });
  await api('POST', 'produto_atributo', { product_id: P, atributo_id: M.id, modo: null, versao_vinculos: (await ficha(P)).versao_vinculos });
  const at = (await api('GET', 'dicionario')).j.data.atributos.find((a) => a.id === M.id);
  const rd = await api('POST', 'atributo_ativo', { id: M.id, ativo: 0, versao: at.versao });
  afirma('limpeza: valores limpos, ajustes desfeitos, atributo de teste desativado', rd.status === 200 && (await item(P1, A1)).unidade_efetiva?.simbolo === efet?.simbolo, JSON.stringify(rd.j?.error));
  console.log(`ENVELOPE (078/079): ${ok} ok, ${falhas} falhas`);
  await b.close();
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exitCode = 2; })
  .finally(() => {   // rede de segurança: desativa atributos de teste "Saídas 078 *" que tenham ficado ativos (não apaga nada)
    try { console.log('rede de segurança: ' + sql("UPDATE eq_atributo SET ativo = 0, versao = versao + 1 WHERE rotulo LIKE 'Saídas 078 %' AND ativo = 1; SELECT ROW_COUNT()") + ' atributo(s) de teste desativado(s)'); } catch (e) { console.log('rede de segurança falhou: ' + e.message); }
    process.exit(process.exitCode ?? (falhas ? 1 : 0));
  });
