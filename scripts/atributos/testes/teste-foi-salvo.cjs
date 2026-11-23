// "FOI SALVO OU NÃO" — parte de tela. Falhas simuladas no navegador de teste (route intercept) sobre o servidor REAL da ESQUERDA (701b4899)
// com a 011 no ATRWEB_VAL_EQ. Produtos 550 e 158, Comprimento (27). Prova a TELA, o valor PERSISTIDO e a AUDITORIA (eq_auditoria) / o RECIBO
// (eq_operacao). Valores originais restaurados no fim. Uso: flock /srv/dshow-modularizacao/locks/navegador.lock nice -n 10 node teste-foi-salvo.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const { execFileSync } = require('child_process');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const CRED = '/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini';
const sql = (q) => execFileSync('mysql', [`--defaults-extra-file=${CRED}`, '-N', '-B', 'ATRWEB_VAL_EQ', '-e', q]).toString().trim();
let ok = 0, falhas = 0;
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const A = 27; const P1 = 550, P2 = 158;
const audit = (p) => Number(sql(`SELECT COUNT(*) FROM eq_auditoria WHERE entidade='valor' AND (entidade_id='${p}:${A}' OR entidade_id LIKE '${p}:${A}:%')`));
const recibo = (chave) => sql(`SELECT estado FROM eq_operacao WHERE chave='${chave.replace(/[^A-Za-z0-9_-]/g, '')}'`);
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } }); const pg = await ctx.newPage();
  const api = (metodo, rota, corpo, params = {}, cab = {}) => pg.evaluate(async ([metodo, rota, corpo, params, cab]) => {
    const t = (await (await fetch('/api/auth/check.php', { credentials: 'same-origin' })).json())?.data?.session?.csrf_token ?? '';
    const r = await fetch('/api/atributos/index.php?' + new URLSearchParams({ r: rota, ...params }), { method: metodo, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t, ...cab }, body: metodo === 'POST' ? JSON.stringify(corpo) : undefined });
    let j = null; try { j = await r.json(); } catch {} return { status: r.status, j }; }, [metodo, rota, corpo, params, cab]);
  const item = async (p) => (await api('GET', 'ficha_produto', null, { product_id: p })).j.data.itens.find((i) => i.atributo_id === A);
  const num = async (p) => { const i = await item(p); return i?.valor ? Number(i.valor.numero) : null; };
  const ir = async (rota, sel) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/${rota}`); await pg.reload({ waitUntil: 'networkidle' }); if (sel) await pg.waitForSelector(sel, { timeout: 40000 }); await pg.waitForTimeout(700); };
  const CAMPO = (p) => `#campo-${p}-${A}`; const ST = `.at-attr__valor[data-atributo="${A}"] .at-salvo`;
  const textoStatus = async () => ((await pg.$(ST)) ? (await pg.textContent(ST)).trim() : '');
  const esperarStatus = async (re, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (re.test(await textoStatus())) return true; await pg.waitForTimeout(150); } return false; };
  const ehPost = (r, p) => r.method() === 'POST' && /r=valor(&|$)/.test(r.url()) && JSON.parse(r.postData() || '{}').product_id === p;
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const orig = { [P1]: await item(P1), [P2]: await item(P2) };
  afirma('preparo: Comprimento (27) está nas fichas do 550 e do 158', !!orig[P1] && !!orig[P2]);
  const un = orig[P1].unidade_efetiva?.simbolo ?? '';
  let n = 11.1; const prox = () => String((n = Math.round((n + 1.3) * 10) / 10)).replace('.', ',');

  // A) 200 com corpo ILEGÍVEL (o servidor gravou): "Não conseguimos confirmar se foi salvo." + Conferir gravação → Salvo, 1 gravação
  await ir(`#/panel-atributos/produto/${P1}`, CAMPO(P1));
  let chave = null;
  await pg.route('**/api/atributos/index.php?r=valor', async (r) => { if (!ehPost(r.request(), P1)) return r.continue(); chave = r.request().headers()['x-chave-operacao']; await r.fetch(); await r.fulfill({ status: 200, contentType: 'text/html', body: '<html>proxy</html>' }); }, { times: 1 });
  let a0 = audit(P1); let v = prox(); await pg.fill(CAMPO(P1), v); await pg.press(CAMPO(P1), 'Tab');
  afirma('A) 200 + corpo ilegível: "Não conseguimos confirmar se foi salvo." (nunca "Salvo")', await esperarStatus(/Não conseguimos confirmar se foi salvo/), await textoStatus());
  afirma('A) chave de operação enviada no cabeçalho e o servidor gravou UMA vez (recibo aplicada, +1 auditoria)', !!chave && recibo(chave) === 'aplicada' && audit(P1) === a0 + 1, `chave=${chave} recibo=${chave && recibo(chave)} aud=${audit(P1) - a0}`);
  await pg.click(`${ST} button:has-text("Conferir gravação")`);
  afirma('A) "Conferir gravação" (GET) → "Salvo"; nenhuma gravação a mais', await esperarStatus(/^Salvo$/) && audit(P1) === a0 + 1, await textoStatus());
  afirma('A) anúncio educado: "Produto 550, Comprimento salvo" na região role="status"; sem role="alert" no sucesso', (await pg.textContent('[data-at-anuncio]')).includes(`Produto ${P1}, Comprimento salvo`) && !(await pg.$(`${ST}[role="alert"]`)));

  // B) 200 SEM RECIBO → desconhecido; o REENVIO com a MESMA chave devolve o recibo original (efeito único)
  let corpoB = null; chave = null;
  await pg.route('**/api/atributos/index.php?r=valor', async (r) => { if (!ehPost(r.request(), P1)) return r.continue(); chave = r.request().headers()['x-chave-operacao']; corpoB = JSON.parse(r.request().postData()); await r.fetch(); await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"data":{"ok":1},"error":null}' }); }, { times: 1 });
  await pg.waitForTimeout(2700); a0 = audit(P1); v = prox(); await pg.fill(CAMPO(P1), v); await pg.press(CAMPO(P1), 'Tab');
  afirma('B) 200 sem recibo: "Não conseguimos confirmar se foi salvo."', await esperarStatus(/Não conseguimos confirmar se foi salvo/), await textoStatus());
  const re = await api('POST', 'valor', corpoB, {}, { 'X-Chave-Operacao': chave });
  afirma('B) reenvio com a MESMA chave e o mesmo pedido → 200 repetido + recibo original, sem gravação nova', re.status === 200 && re.j?.data?.repetido === true && !!re.j?.data?.recibo && audit(P1) === a0 + 1, `${re.status} ${JSON.stringify(re.j?.data ?? re.j).slice(0, 160)} aud=${audit(P1) - a0}`);
  await pg.click(`${ST} button:has-text("Conferir gravação")`); afirma('B) Conferir → "Salvo"', await esperarStatus(/^Salvo$/));

  // C) resposta PERDIDA (o servidor gravou), sair e voltar: o valor gravado aparece e há UMA gravação (aceite decisivo)
  await pg.route('**/api/atributos/index.php?r=valor', async (r) => { if (!ehPost(r.request(), P1)) return r.continue(); await r.fetch(); await r.abort('failed'); }, { times: 1 });
  await pg.waitForTimeout(2700); a0 = audit(P1); v = prox(); await pg.fill(CAMPO(P1), v); await pg.press(CAMPO(P1), 'Tab');
  afirma('C) resposta perdida: "Não conseguimos confirmar se foi salvo." + "Conferir gravação"', await esperarStatus(/Não conseguimos confirmar se foi salvo/) && !!(await pg.$(`${ST} button:has-text("Conferir gravação")`)));
  await pg.click('button:has-text("← Produtos")'); await pg.waitForSelector('input[type="search"]'); await pg.fill('input[type="search"]', String(P1)); await pg.waitForTimeout(600);
  await pg.locator('.at-cartao__abrir, .at-link-produto').first().click(); await pg.waitForSelector(CAMPO(P1)); await pg.waitForTimeout(800);
  afirma(`C) sair e voltar: a ficha mostra o valor gravado (${v} ${un}) e o histórico tem UMA gravação`, (await pg.inputValue(CAMPO(P1))) === v && audit(P1) === a0 + 1, `campo=${await pg.inputValue(CAMPO(P1))} aud=${audit(P1) - a0}`);

  // D) gravou, mas a RELEITURA falhou: a Ficha continua; "Salvo. Não foi possível atualizar o valor na tela." + Atualizar valor (só leitura)
  let posts = 0; const contar = (r) => { if (ehPost(r, P1)) posts++; }; pg.on('request', contar);
  await pg.route('**/api/atributos/index.php?r=ficha_produto*', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"X","data":null}' }), { times: 1 });
  a0 = audit(P1); v = prox(); await pg.fill(CAMPO(P1), v); await pg.press(CAMPO(P1), 'Tab');
  afirma('D) releitura com erro: "Salvo. Não foi possível atualizar o valor na tela." e a Ficha continua aberta (sem tela de erro)', await esperarStatus(/Salvo\. Não foi possível atualizar o valor na tela/) && !!(await pg.$('.at-tabela-ficha')), await textoStatus());
  await pg.click(`${ST} button:has-text("Atualizar valor")`); await pg.waitForTimeout(1200);
  afirma(`D) "Atualizar valor" relê: valor ${v} na tela, 1 escrita só (POST=${posts}, auditoria +${audit(P1) - a0})`, (await pg.inputValue(CAMPO(P1))) === v && posts === 1 && audit(P1) === a0 + 1 && (await textoStatus()) === '');
  pg.off('request', contar);

  // E) RECUSA comprovada: "Não foi salvo." + motivo junto ao campo; rascunho fica; nada gravado
  await pg.route('**/api/atributos/index.php?r=valor', (r) => ehPost(r.request(), P1) ? r.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'VALIDATION_ERROR', data: null, meta: { message: 'Unidade inválida.', desfecho: 'recusada', motivos: { unidade_id: 'Escolha uma unidade permitida para Comprimento.' }, campos: ['unidade_id'] } }) }) : r.continue(), { times: 1 });
  await pg.waitForTimeout(2700); const antesE = await num(P1); a0 = audit(P1); v = prox(); await pg.fill(CAMPO(P1), v); await pg.press(CAMPO(P1), 'Tab');
  afirma('E) recusa: "Não foi salvo. Escolha uma unidade permitida para Comprimento." (role=alert)', await esperarStatus(/Não foi salvo\. Escolha uma unidade permitida para Comprimento/) && !!(await pg.$(`${ST}[role="alert"]`)), await textoStatus());
  afirma('E) o rascunho fica no campo e nada foi gravado', (await pg.inputValue(CAMPO(P1))) === v && (await num(P1)) === antesE && audit(P1) === a0);
  await pg.unrouteAll({ behavior: 'ignoreErrors' });

  // F) CONFLITO real: outra gravação depois de abrir → valor ao abrir, rascunho e atual (com unidades); "Revisar meu valor" mantém o rascunho
  await ir(`#/panel-atributos/produto/${P1}`, CAMPO(P1));
  const aoAbrir = await pg.inputValue(CAMPO(P1)); const i0 = await item(P1);
  await api('POST', 'valor', { product_id: P1, atributo_id: A, valor: '77', estado: 'informado', versao: i0.valor?.versao, versao_conjunto: i0.versao_conjunto, unidade_id: i0.valor?.unidade_id ?? i0.unidade_efetiva?.id });
  v = prox(); await pg.fill(CAMPO(P1), v); await pg.press(CAMPO(P1), 'Tab');
  const tc = (await esperarStatus(/O valor mudou desde que você começou/)) ? await textoStatus() : await textoStatus();
  afirma(`F) conflito: "O valor mudou desde que você começou." com Valor ao abrir (${aoAbrir} ${un}), Seu rascunho (${v} ${un}) e Valor atual (77 ${un})`, tc.includes('O valor mudou desde que você começou') && tc.includes(`Valor ao abrir: ${aoAbrir} ${un}`) && tc.includes(`Seu rascunho: ${v} ${un}`) && tc.includes(`Valor atual: 77 ${un}`), tc);
  await pg.click(`${ST} button:has-text("Revisar meu valor")`); await pg.waitForTimeout(1200);
  afirma('F) "Revisar meu valor": o rascunho continua no campo (nada gravado ainda)', (await pg.inputValue(CAMPO(P1))) === v && (await num(P1)) === 77);
  await pg.focus(CAMPO(P1)); await pg.press(CAMPO(P1), 'Tab');
  afirma('F) confirmar de novo grava sobre a versão ATUAL → "Salvo"', (await esperarStatus(/^Salvo$/)) && (await num(P1)) === Number(v.replace(',', '.')));

  // G) Preencher com 550 e 158: a falha do 158 não pinta o 550; Enter só avança depois da confirmação
  await ir('#/panel-atributos', 'input[type="search"]');
  for (const p of [P1, P2]) { await pg.fill('input[type="search"]', String(p)); await pg.waitForTimeout(500); await pg.locator('label.at-cartao__sel, label.at-cartao__marcar').first().click(); await pg.waitForTimeout(200); }
  await pg.click('button.at-nav__item:has-text("Preencher")'); await pg.waitForSelector(`.pv2-grade ${CAMPO(P2)}`, { timeout: 40000 }); await pg.waitForTimeout(600);
  const cel = (p) => `[data-l]:has(${CAMPO(p)}) .at-salvo`;
  const txtCel = async (p) => ((await pg.$(cel(p))) ? (await pg.textContent(cel(p))).trim() : '');
  // ordem das linhas na grade: o teste de "Enter avança" precisa de uma linha ABAIXO
  const ordem = await pg.$$eval(`[data-l] input[id$="-${A}"]`, (xs) => xs.map((x) => Number(x.id.split('-')[1])));
  const [PA, PB] = ordem.filter((p) => p === P1 || p === P2);
  afirma(`G) grade com os dois produtos (ordem ${PA}, ${PB})`, !!PA && !!PB);
  await pg.route('**/api/atributos/index.php?r=valor', async (r) => { if (!ehPost(r.request(), PA)) return r.continue(); await r.fetch(); await r.fulfill({ status: 200, body: 'xx' }); }, { times: 1 });
  const va = prox(); await pg.fill(CAMPO(PA), va); await pg.press(CAMPO(PA), 'Enter'); await pg.waitForTimeout(1500);
  const focoA = await pg.evaluate(() => document.activeElement?.id);
  afirma(`G) ${PA} com resposta ilegível: a célula diz "Não conseguimos confirmar" e o Enter NÃO avança`, /Não conseguimos confirmar/.test(await txtCel(PA)) && focoA === `campo-${PA}-${A}`, `${await txtCel(PA)} foco=${focoA}`);
  const aA = audit(PA);
  await pg.press(CAMPO(PA), 'Tab'); await pg.waitForTimeout(1200);
  afirma(`G) sair do campo com o resultado incerto NÃO dispara outra gravação (auditoria do ${PA} igual; pendência continua)`, audit(PA) === aA && /Não conseguimos confirmar/.test(await txtCel(PA)), `aud +${audit(PA) - aA} · ${await txtCel(PA)}`);
  const vb = prox(); await pg.fill(CAMPO(PB), vb); await pg.press(CAMPO(PB), 'Tab'); await pg.waitForTimeout(1500);
  afirma(`G) ${PB} normal: "Salvo", sem ser pintado pela falha do ${PA}; a pendência do ${PA} continua visível`, !/Não conseguimos|Não foi salvo/.test(await txtCel(PB)) && /Não conseguimos confirmar/.test(await txtCel(PA)), `${PB}: ${await txtCel(PB)} · ${PA}: ${await txtCel(PA)}`);
  await pg.click(`${cel(PA)} button:has-text("Conferir gravação")`); await pg.waitForTimeout(1500);
  afirma(`G) "Conferir gravação" no ${PA} resolve para "Salvo"`, /^Salvo$|^$/.test(await txtCel(PA)) && !/Não conseguimos/.test(await txtCel(PA)), await txtCel(PA));
  const vc = prox(); await pg.fill(CAMPO(PA), vc); await pg.press(CAMPO(PA), 'Enter'); await pg.waitForTimeout(1800);
  const focoC = await pg.evaluate(() => document.activeElement?.id);
  afirma(`G) gravação confirmada no ${PA}: o Enter avança para a linha de baixo`, focoC === `campo-${PB}-${A}`, `foco=${focoC}`);

  // H) beforeunload só com rascunho/pendência
  const pagina = async (comRascunho) => { const p2 = await ctx.newPage(); let dialogo = false; p2.on('dialog', async (d) => { if (d.type() === 'beforeunload') dialogo = true; await d.dismiss().catch(() => {}); });
    await p2.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }).catch(() => {}); await p2.goto(`${B}/#/panel-atributos/produto/${P1}`); await p2.reload({ waitUntil: 'networkidle' }); await p2.waitForSelector(CAMPO(P1), { timeout: 40000 }); await p2.waitForTimeout(600);
    await p2.click(CAMPO(P1)); if (comRascunho) await p2.keyboard.type('9');
    await p2.close({ runBeforeUnload: true }); await pg.waitForTimeout(1200); return dialogo; };
  afirma('H) com rascunho não enviado: fechar a aba pede confirmação (beforeunload)', await pagina(true));
  afirma('H) sem rascunho nem pendência: fechar a aba NÃO pede confirmação', !(await pagina(false)));

  // restauração
  for (const p of [P1, P2]) { const o = orig[p]; const i = await item(p);
    if (o.valor) await api('POST', 'valor', { product_id: p, atributo_id: A, valor: o.valor.numero, estado: o.valor.estado, versao: i.valor?.versao, versao_conjunto: i.versao_conjunto, unidade_id: o.valor.unidade_id });
    else if (i.valor) await api('POST', 'valor_limpar', { product_id: p, atributo_id: A, versao: i.valor.versao, versao_conjunto: i.versao_conjunto }); }
  const r1 = await item(P1), r2 = await item(P2);
  afirma('restauração: 550 e 158 voltaram ao valor original', JSON.stringify([r1.valor?.numero ?? null, r2.valor?.numero ?? null]) === JSON.stringify([orig[P1].valor?.numero ?? null, orig[P2].valor?.numero ?? null]));
  console.log(`FOI SALVO (tela): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
