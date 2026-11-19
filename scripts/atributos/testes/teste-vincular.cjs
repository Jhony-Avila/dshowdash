// DSHOW-056 na TELA (Vincular): retrato imutável da prévia. A prévia é real (só lê); a CONFIRMAÇÃO é interceptada no navegador (nada é
// gravado): conferimos o corpo enviado. 1 navegador, 1 aba. Uso: nice -n 10 node teste-vincular.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`;
let ok = 0, falhas = 0;
const afirma = (nome, cond, extra = '') => { if (cond) { ok++; console.log('ok    ' + nome); } else { falhas++; console.log('FALHA ' + nome + (extra ? ' · ' + extra : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.goto(`${B}/#/panel-atributos/vincular`); await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('.at-lista-produtos__item input[type=checkbox]', { timeout: 30000 });
  await pg.locator('.at-lista-produtos__item input[type=checkbox]').first().check();
  await pg.click('button:has-text("Continuar")'); await pg.waitForSelector('h3:has-text("2. O que aplicar")');
  const kit = (i) => pg.locator('h4:has-text("Aplicar kits") + ul.at-escolha input[type=checkbox]').nth(i);
  const passo3 = () => pg.$('h3:has-text("3. Prévia")');
  // (1) DETERMINÍSTICO: a resposta da prévia de X fica PRESA numa trava; o teste troca a intenção para Y e só então solta a resposta
  let soltar = null; const trava = new Promise((r) => { soltar = r; });
  let prender = true;
  await pg.route('**/api/atributos/**', async (route) => { if (prender && route.request().url().includes('massa_previa')) { prender = false; await trava; } await route.continue(); });
  await kit(0).check();
  const respX = pg.waitForResponse((r) => r.url().includes('massa_previa'));
  await pg.click('button:has-text("Ver prévia")');
  await pg.waitForTimeout(200);
  await kit(1).check();                       // intenção muda para Y enquanto a prévia de X está presa
  soltar();                                   // a resposta de X chega DEPOIS da mudança
  await respX; await pg.waitForTimeout(400);
  afirma('(1) prévia de X presa + troca para Y + resposta de X chega depois → IGNORADA (não abre o passo 3)', !(await passo3()));
  afirma('(1) e a tela continua no passo 2 com Y escolhido (2 kits marcados)', (await kit(0).isChecked()) && (await kit(1).isChecked()) && !!(await pg.$('h3:has-text("2. O que aplicar")')));
  // (2) prévia de Y; Voltar; troca a intenção → a prévia cai; o passo 3 fica bloqueado
  await pg.click('button:has-text("Ver prévia")'); await pg.waitForSelector('h3:has-text("3. Prévia")', { timeout: 20000 });
  afirma('(2) prévia de Y aberta', !!(await passo3()));
  await pg.locator('section:has(h3:has-text("3. Prévia")) button:has-text("Voltar")').click(); await pg.waitForSelector('h3:has-text("2. O que aplicar")');
  await kit(1).uncheck(); await pg.waitForTimeout(300);
  const step3 = pg.locator('.at-passos button, ol button').nth(2);
  afirma('(2) mudou a intenção depois da prévia → passo 3 BLOQUEADO (precisa gerar outra prévia)', (await step3.count()) === 0 || (await step3.isDisabled()));
  // (3) a confirmação envia o RETRATO da prévia vigente
  const enviados = [];
  let respostaAplicar = 'abortar';
  await pg.unroute('**/api/atributos/**');
  await pg.route('**/api/atributos/**', async (route) => {
    const u = route.request().url();
    if (!u.includes('massa_aplicar')) return route.continue();
    enviados.push(JSON.parse(route.request().postData() || '{}'));
    if (respostaAplicar === 'abortar') return route.abort('connectionreset');   // tentativa incerta (sem resposta)
    // "foi salvo ou não": sucesso SÓ com recibo (contrato §3, massa_aplicar). Sem recibo, a tela trata como resultado desconhecido.
    const corpo = JSON.parse(route.request().postData() || '{}'); const gravado = { kits_aplicados: 0, kits_removidos: 0, inclusoes: 0, exclusoes: 0 };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { gravado, repetido: true, desfecho: 'aplicada',
      recibo: { operacao: 'massa_aplicar', chave: corpo.chave ?? null, desfecho: 'aplicada', confirmado_em: new Date().toISOString(), gravado, resumo: {} } } }) });
  });
  const previaReq = pg.waitForRequest((r) => r.url().includes('massa_previa'));
  await pg.click('button:has-text("Ver prévia")'); const corpoPrevia = JSON.parse((await previaReq).postData() || '{}');
  await pg.waitForSelector('h3:has-text("3. Prévia")', { timeout: 20000 });
  await pg.click('button:has-text("Confirmar e gravar")'); await pg.waitForTimeout(1500);
  const e1 = enviados[0] || {};
  const semControle = ({ chave, versao_previa, ...resto }) => JSON.stringify(resto);
  afirma('(3) a confirmação envia EXATAMENTE o pedido da prévia (retrato) + chave + versão da prévia', !!e1.chave && /^[0-9a-f]{64}$/.test(e1.versao_previa || '') && semControle(e1) === JSON.stringify(corpoPrevia), `${semControle(e1)} × ${JSON.stringify(corpoPrevia)}`);
  // (4) tentativa incerta: a nova tentativa usa a MESMA chave; regenerar a prévia da mesma intenção também
  await pg.click('button:has-text("Confirmar e gravar")'); await pg.waitForTimeout(1500);
  afirma('(4) nova tentativa depois de "sem resposta" → MESMA chave', enviados.length >= 2 && enviados[1].chave === e1.chave, JSON.stringify(enviados.map((x) => x.chave)));
  await pg.locator('section:has(h3:has-text("3. Prévia")) button:has-text("Voltar")').click(); await pg.waitForSelector('h3:has-text("2. O que aplicar")');
  await pg.click('button:has-text("Ver prévia")'); await pg.waitForSelector('h3:has-text("3. Prévia")', { timeout: 20000 });
  respostaAplicar = 'ok';
  await pg.click('button:has-text("Confirmar e gravar")'); await pg.waitForTimeout(1500);
  const ult = enviados[enviados.length - 1] || {};
  afirma('(4) prévia regenerada para a MESMA intenção depois da tentativa incerta → MESMA chave (recupera sem duplicar)', ult.chave === e1.chave, `${ult.chave} × ${e1.chave}`);
  afirma('(4) depois do recibo, a tela volta ao passo 1', await pg.$('h3:has-text("1. Escolha os produtos")').then((x) => !!x));
  console.log(`VINCULAR (DSHOW-056, tela): ${ok} ok, ${falhas} falhas · nada gravado (confirmação interceptada)`);
  await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message); process.exit(2); });
