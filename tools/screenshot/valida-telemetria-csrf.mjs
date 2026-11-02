// valida-telemetria-csrf.mjs — Prova do backlog #63: POST /api/telemetry/collect.php nunca persiste.
// @version 1.0.0  @created 2026-07-28
//
// O que este script prova, com sessão REAL (não forjada), na origem (bypass Cloudflare):
//   1. O envio COMO ESTÁ HOJE (sem header X-CSRF-Token) responde 403 — determinístico, não intermitente.
//   2. O MESMO envio COM o header X-CSRF-Token responde 200 e persiste (inserted > 0).
//   3. navigator.sendBeacon() — usado no unload/pagehide — NÃO pode levar header nenhum,
//      então é 403 por construção: nenhuma correção de header salva o beacon.
//
// ⚠️ Por que a prova é feita DENTRO da página e não por curl: o que está sob teste é o
// caminho do browser (cookie de sessão + cookie csrf_token + mesma origem). Um curl com
// cookie colado provaria o endpoint, não o transporte que de fato roda no app.
import { chromium } from 'playwright';
import { CONFIG } from './config.mjs';

const ENDPOINT = '/api/telemetry/collect.php';
const ok = (b) => (b ? '\x1b[32mOK\x1b[0m' : '\x1b[31mFALHA\x1b[0m');

const browser = await chromium.launch({
  // Resolve o domínio para a origem: a borda Cloudflare responde antes do nginx e
  // contamina o resultado (lição `playwright-bypass-cf-origin`).
  args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'],
});
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

try {
  await page.goto(CONFIG.BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Login DENTRO da página: os Set-Cookie (sessão + csrf_token) chegam à origem certa sem
  // depender de seletores do formulário. Um login server-side entregaria só o cookie de
  // sessão — e este teste precisa do csrf_token exatamente como o app o enxerga.
  const auth = await page.evaluate(async ([user, pass]) => {
    const r = await fetch('/api/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: user, password: pass }),
    });
    const corpo = await r.text();
    const check = await fetch('/api/auth/check.php', { headers: { Accept: 'application/json' } });
    let autenticado = false;
    try { autenticado = !!(JSON.parse(await check.text())?.data?.session); } catch { /* abaixo */ }
    return { status: r.status, autenticado, corpo: corpo.slice(0, 200) };
  }, [CONFIG.AUTH_USER, CONFIG.AUTH_PASS]);

  if (!auth.autenticado) {
    console.error(`\n\x1b[31m✘ sessão NÃO estabelecida (login ${auth.status}) — abortando.\x1b[0m`);
    console.error('Sem sessão o endpoint responde 401 e o teste mediria a coisa errada.');
    console.error(`resposta: ${auth.corpo}\n`);
    process.exitCode = 1;
    throw new Error('pre-condicao-falhou');
  }

  const r = await page.evaluate(async (endpoint) => {
    const lerCookie = (nome) => {
      const c = document.cookie.split('; ').find((x) => x.startsWith(nome + '='));
      return c ? decodeURIComponent(c.split('=')[1]) : '';
    };
    const corpo = (marca) => JSON.stringify({
      batchId: 'validacao-' + marca,
      timestamp: Date.now(),
      count: 1,
      events: [{ type: 'action', name: 'validacao:csrf:' + marca, component: 'valida-telemetria-csrf' }],
    });

    // (1) exatamente o que transport/send.ts envia hoje
    const semCsrf = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Telemetry-Batch': 'sem-csrf' },
      body: corpo('sem-csrf'),
      keepalive: true,
    });
    const corpoSem = await semCsrf.text();

    // (2) o mesmo envio, acrescido do header que falta.
    // O token vem do cookie quando ele é legível; senão, de check.php — a MESMA ordem que
    // panel-pipedrive/outlook/anuncios já usam. `.php` é obrigatório: sem ele a rota cai no
    // fallback da SPA e devolve HTML (lição `koala-docs-validacao-premissas`).
    let csrf = lerCookie('csrf_token');
    let origemToken = 'cookie';
    if (!csrf) {
      const chk = await fetch('/api/auth/check.php', { headers: { Accept: 'application/json' } });
      try { csrf = (await chk.json())?.data?.session?.csrf_token ?? ''; } catch { csrf = ''; }
      origemToken = 'check.php';
    }
    const comCsrf = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Telemetry-Batch': 'com-csrf', 'X-CSRF-Token': csrf },
      body: corpo('com-csrf'),
      keepalive: true,
    });
    const corpoCom = await comCsrf.text();

    // (3) beacon: a API não aceita headers — o 403 aqui é estrutural
    const enviouBeacon = navigator.sendBeacon(
      endpoint,
      new Blob([corpo('beacon')], { type: 'application/json' }),
    );

    return {
      temCsrf: !!csrf,
      origemToken,
      semCsrf: { status: semCsrf.status, corpo: corpoSem.slice(0, 200) },
      comCsrf: { status: comCsrf.status, corpo: corpoCom.slice(0, 200) },
      beaconAceitoPeloBrowser: enviouBeacon,
    };
  }, ENDPOINT);

  await page.waitForTimeout(1500); // deixa o beacon sair antes de fechar

  let inseriu = 0;
  try {
    inseriu = JSON.parse(r.comCsrf.corpo)?.data?.inserted ?? 0;
  } catch { /* corpo não-JSON entra como falha abaixo */ }

  console.log('\n─── #63 · Telemetria: causa e correção ───');
  console.log(`token CSRF obtido ....................... ${ok(r.temCsrf)}  [via ${r.origemToken}]`);
  console.log(`SEM X-CSRF-Token → 403 (bug de hoje) .... ${ok(r.semCsrf.status === 403)}  [status ${r.semCsrf.status}]`);
  console.log(`COM X-CSRF-Token → 200 (correção) ....... ${ok(r.comCsrf.status === 200)}  [status ${r.comCsrf.status}]`);
  console.log(`COM X-CSRF-Token → persistiu ............ ${ok(inseriu > 0)}  [inserted ${inseriu}]`);
  console.log(`beacon aceito pelo browser (vira 403) ... ${r.beaconAceitoPeloBrowser ? 'sim' : 'não'}`);
  console.log('\nO 403 do beacon é estrutural: navigator.sendBeacon não envia headers.');
  console.log('Confira no access.log com a rota ancorada:');
  console.log(`  grep '"POST ${ENDPOINT}' /var/log/nginx/access.log | tail -5\n`);

  const passou = r.temCsrf && r.semCsrf.status === 403 && r.comCsrf.status === 200 && inseriu > 0;
  console.log(passou ? '\x1b[32m✔ causa confirmada e correção validada\x1b[0m\n' : '\x1b[31m✘ hipótese NÃO confirmada — não corrigir às cegas\x1b[0m\n');
  process.exitCode = passou ? 0 : 1;
} finally {
  await browser.close();
}
