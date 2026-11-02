// Prova ao vivo das rotas do go-live, com sessao autenticada real.
// @module google-calendar.golive.proof
// @created 2026-07-30
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright node tools/screenshot/proof-gcal-golive.mjs
//
// As suites PHP provam a logica; esta prova o que o NAVEGADOR recebe passando
// por nginx, php-fpm, sessao e CSRF — a camada onde o 401/403/500 aparece e as
// suites nao enxergam.
import { chromium } from 'playwright';
import { loginViaPage, isLoginPage } from './auth.mjs';

const BASE = 'https://dshowdash.com.br';
let ok = 0; const falhas = [];
const check = (nome, cond, obs = '') => {
  if (cond) { ok++; console.log(`  ok      ${nome} ${obs}`); }
  else { falhas.push(nome); console.log(`  FALHA   ${nome} ${obs}`); }
};

const browser = await chromium.launch({
  args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'],
});
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();

try {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  // O formulário de login só existe depois que a SPA monta; checar antes disso
  // devolve "não é login" e a prova inteira roda deslogada, dando 401 em tudo.
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);

  // Chamadas de DENTRO da página: herdam cookie de sessão como o app faria.
  const pega = (rota) => page.evaluate(async (r) => {
    const res = await fetch(r, { credentials: 'same-origin' });
    return { status: res.status, body: await res.json().catch(() => null) };
  }, rota);

  console.log('\nROTAS DO GO-LIVE — sessão autenticada\n' + '─'.repeat(58));

  const st = await pega('/api/google-calendar/status');
  check('GET /status responde 200', st.status === 200, `(${st.status})`);
  check('envelope é {ok:true}', st.body?.ok === true);

  const gl = st.body?.data?.golive;
  check('/status carrega a checklist de go-live', !!gl);
  check('checklist tem 8 itens', gl?.itens?.length === 8, `${gl?.itens?.length}`);
  check('checklist cobre o cron (Fase 5)',
    (gl?.itens ?? []).some((i) => i.id === 'cron'));
  check('redirect URI vem pronto para copiar',
    typeof gl?.redirect_uri === 'string' && gl.redirect_uri.includes('/accounts/callback'),
    gl?.redirect_uri || '');
  check('escopos listados', Array.isArray(gl?.escopos) && gl.escopos.length >= 2);
  check('cada item traz como resolver',
    gl?.itens?.every((i) => typeof i.resolver === 'string' && i.resolver.length > 10));
  check('nenhum item vaza segredo',
    !/CLIENT_SECRET=|ya29\.|GCAL_CRYPTO_KEY=[A-Za-z0-9+/]{10}/.test(JSON.stringify(gl ?? {})));

  const ac = await pega('/api/google-calendar/accounts');
  check('GET /accounts responde 200', ac.status === 200, `(${ac.status})`);
  check('/accounts também traz a checklist', !!ac.body?.data?.golive);

  const sy = await pega('/api/google-calendar/sync');
  check('GET /sync responde 200', sy.status === 200, `(${sy.status})`);

  // DELETE sem token de CSRF tem de ser recusado — o gate central é o que faz
  // as rotas novas nascerem protegidas.
  const semCsrf = await page.evaluate(async () => {
    const res = await fetch('/api/google-calendar/accounts/1',
      { method: 'DELETE', credentials: 'same-origin' });
    return res.status;
  });
  check('DELETE /accounts/1 sem CSRF é recusado', semCsrf === 403, `(${semCsrf})`);

  // O callback do OAuth precisa REDIRECIONAR, não devolver JSON: quem chega
  // nele é uma janela de navegador voltando do Google.
  const cb = await page.evaluate(async () => {
    const res = await fetch('/api/google-calendar/accounts/callback?error=access_denied',
      { credentials: 'same-origin', redirect: 'manual' });
    return { status: res.status, tipo: res.type };
  });
  check('callback OAuth redireciona (não devolve JSON)',
    cb.status === 0 || cb.status === 302 || cb.tipo === 'opaqueredirect',
    JSON.stringify(cb));

  // ── A TELA ────────────────────────────────────────────────────────
  console.log('\nTELA DE CONTAS\n' + '─'.repeat(58));

  await page.goto(BASE + '/#/panel-google-calendar/contas', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-gc-react-root] .gc-golive', { timeout: 25000 });
  await page.waitForTimeout(1200);

  check('checklist aparece na tela', await page.locator('.gc-golive').count() === 1);
  const passos = await page.locator('.gc-passo').count();
  check('8 passos desenhados', passos === 8, `${passos}`);
  check('primeiro passo pendente já vem aberto',
    await page.locator('.gc-passo.is-aberto').count() === 1);
  check('a barra de progresso é acessível',
    await page.locator('.gc-golive-barra[role="progressbar"][aria-valuenow]').count() === 1);
  check('estado vai em TEXTO, não só em cor',
    (await page.locator('.gc-passo-estado').first().innerText()).trim().length > 0);

  // O redirect URI só aparece ao abrir o passo dele — é o valor que precisa ser
  // colado no Google Cloud sem um caractere de diferença.
  await page.locator('.gc-passo').nth(2).locator('.gc-passo-cabeca').click();
  await page.waitForTimeout(400);
  const uri = await page.locator('.gc-copiavel-valor').first().innerText();
  check('URI de redirecionamento exibida para copiar',
    uri.includes('/api/google-calendar/accounts/callback'), uri);
  check('botão de copiar existe', await page.locator('.gc-copiavel .gc-btn').count() === 1);

  // Nada pode estourar a largura: a sidebar do shell tira 312px fixos.
  for (const w of [1280, 900, 720]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(350);
    const estoura = await page.evaluate(() => {
      const r = document.querySelector('[data-gc-react-root]');
      return r ? r.scrollWidth > r.clientWidth + 1 : false;
    });
    check(`sem transbordo horizontal em ${w}px`, !estoura);
  }
  await page.setViewportSize({ width: 1440, height: 950 });

  await page.screenshot({ path: '/tmp/claude-0/gcal-golive-dark.png', fullPage: true });
  check('captura escura gravada', true, '/tmp/claude-0/gcal-golive-dark.png');

  // ── WEBHOOK (Fase 5) ──────────────────────────────────────────────
  // É o único endpoint público do módulo. O que importa aqui é que ele
  // NÃO exija sessão (o Google não tem cookie) e NÃO aceite qualquer um.
  console.log('\nWEBHOOK PÚBLICO\n' + '─'.repeat(58));

  const semSessao = await ctx.browser().newContext({ ignoreHTTPSErrors: true });
  const anon = await semSessao.newPage();
  const post = (cabecalhos) => anon.evaluate(async (h) => {
    const res = await fetch('https://dshowdash.com.br/api/google-calendar/webhook',
      { method: 'POST', headers: h, body: '{}' });
    return { status: res.status, corpo: await res.text() };
  }, cabecalhos);
  await anon.goto(BASE + '/robots.txt').catch(() => {});

  const semCabecalho = await post({});
  check('sem cabeçalhos do Google → 400, não 401',
    semCabecalho.status === 400, `(${semCabecalho.status}) — precisa funcionar SEM sessão`);

  const canalFalso = await post({
    'X-Goog-Channel-ID': 'canal-inexistente-' + 'x'.repeat(8),
    'X-Goog-Channel-Token': 'chute',
    'X-Goog-Resource-ID': 'r',
    'X-Goog-Resource-State': 'exists',
  });
  check('canal desconhecido → 200 (nunca 404)', canalFalso.status === 200,
    `(${canalFalso.status}) 404 faria o Google derrubar outros canais do host`);
  check('resposta não vaza detalhe interno',
    !/gcal_|SELECT|PDO|\/var\/www/i.test(canalFalso.corpo), canalFalso.corpo.slice(0, 60));

  const comGet = await anon.evaluate(async () => {
    const r = await fetch('https://dshowdash.com.br/api/google-calendar/webhook');
    return r.status;
  });
  check('GET no webhook é 405', comGet === 405, `(${comGet})`);
  await semSessao.close();
} finally {
  await browser.close();
}

console.log('\n' + '─'.repeat(58));
if (falhas.length) {
  console.log(`${ok} ok · ${falhas.length} FALHA(S):`);
  falhas.forEach((f) => console.log('  • ' + f));
  process.exit(1);
}
console.log(`TODOS OS ${ok} CHECKS PASSARAM`);
