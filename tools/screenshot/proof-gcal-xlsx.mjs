// Prova ao vivo do XLSX: baixa pela rota real, com sessao autenticada.
// @module google-calendar.xlsx.proof
// @created 2026-07-30
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright node tools/screenshot/proof-gcal-xlsx.mjs
//
// A suite PHP prova o GERADOR. Esta prova o CAMINHO: nginx, php-fpm, sessao,
// cabecalhos de download e — o mais facil de quebrar — o binario chegar
// INTEIRO, sem buffer de saida truncando ou injetando bytes na frente.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { loginViaPage, isLoginPage } from './auth.mjs';

const BASE = 'https://dshowdash.com.br';
let ok = 0; const falhas = [];
const check = (n, c, o = '') => {
  if (c) { ok++; console.log(`  ok      ${n} ${o}`); }
  else { falhas.push(n); console.log(`  FALHA   ${n} ${o}`); }
};

const browser = await chromium.launch({
  args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'],
});
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();

try {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2000);

  console.log('\nXLSX PELA ROTA REAL\n' + '─'.repeat(58));

  const hoje = new Date().toISOString().slice(0, 10);
  const antes = new Date(Date.now() - 27 * 864e5).toISOString().slice(0, 10);

  const r = await page.evaluate(async ([de, ate]) => {
    const url = `/api/google-calendar/reports/carga-dia?de=${de}&ate=${ate}`
              + `&tz=America/Sao_Paulo&formato=xlsx`;
    const res = await fetch(url, { credentials: 'same-origin' });
    const buf = await res.arrayBuffer();
    return {
      status: res.status,
      tipo: res.headers.get('content-type'),
      disp: res.headers.get('content-disposition'),
      tam: buf.byteLength,
      // Só os bytes: base64 no browser evita o binário se corromper no caminho.
      b64: btoa(String.fromCharCode(...new Uint8Array(buf))),
    };
  }, [antes, hoje]);

  check('rota responde 200', r.status === 200, `(${r.status})`);
  check('content-type é o de planilha',
    (r.tipo ?? '').includes('spreadsheetml.sheet'), r.tipo ?? '');
  check('vem como anexo .xlsx',
    (r.disp ?? '').includes('attachment') && (r.disp ?? '').includes('.xlsx'), r.disp ?? '');
  check('corpo tem tamanho plausível', r.tam > 1200, `${r.tam} bytes`);

  const bytes = Buffer.from(r.b64, 'base64');
  // Um BOM ou espaço antes do PK é o sintoma clássico de buffer de saída
  // aberto — o Excel diz só "arquivo corrompido".
  check('primeiros bytes são a assinatura ZIP',
    bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04,
    `[${[...bytes.slice(0, 4)].map((b) => b.toString(16)).join(' ')}]`);

  writeFileSync('/tmp/claude-0/gcal-rota.xlsx', bytes);
  check('arquivo salvo para conferência independente', true, '/tmp/claude-0/gcal-rota.xlsx');

  // Relatório que é grafo, não tabela: tem de recusar com 422, não estourar.
  const viz = await page.evaluate(async () => {
    const res = await fetch('/api/google-calendar/reports/fluxo?formato=xlsx',
      { credentials: 'same-origin' });
    return { status: res.status, tipo: res.headers.get('content-type') };
  });
  check('visualização (fluxo) recusa XLSX com 422', viz.status === 422, `(${viz.status})`);
  check('  e responde JSON, não binário quebrado',
    (viz.tipo ?? '').includes('json'), viz.tipo ?? '');

  // Sem sessão não pode baixar relatório de ninguém.
  const anonCtx = await browser.newContext({ ignoreHTTPSErrors: true });
  const anon = await anonCtx.newPage();
  const semSessao = await anon.evaluate(async () => {
    const res = await fetch('https://dshowdash.com.br/api/google-calendar/reports/carga-dia?formato=xlsx');
    return res.status;
  }).catch(() => 0);
  await anon.goto(BASE + '/robots.txt').catch(() => {});
  const st = await anon.evaluate(async () => {
    const res = await fetch('/api/google-calendar/reports/carga-dia?formato=xlsx');
    return res.status;
  });
  check('sem sessão o XLSX é negado', st === 401, `(${st})`);
  await anonCtx.close();
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
