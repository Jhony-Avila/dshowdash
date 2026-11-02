// valida-telemetria-runtime.mjs — Qual código de telemetria está REALMENTE no ar?
// @version 1.0.0  @created 2026-07-28
//
// Contexto: a correção do #63 foi feita em transport/send.ts (+ send.js). Mas
// telemetry-core/index.js re-exporta de dist/telemetry-core.bundle.js, e o bundle é gerado
// a partir de _entry.ts → index.js → o PRÓPRIO bundle. Se o browser carrega o bundle, a
// correção não alcança o runtime por mais correta que esteja no .ts.
//
// Este script não pergunta ao código o que ele acha que faz — observa a requisição saindo.
import { chromium } from 'playwright';
import { CONFIG } from './config.mjs';

const ok = (b) => (b ? '\x1b[32mOK\x1b[0m' : '\x1b[31mFALHA\x1b[0m');

const browser = await chromium.launch({ args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

// Toda requisição ao endpoint de telemetria, com os cabeçalhos que ela de fato levou.
const envios = [];
page.on('request', (req) => {
  if (req.url().includes('/api/telemetry/')) {
    const h = req.headers();
    envios.push({
      req,
      metodo: req.method(),
      url: req.url().replace(/^https?:\/\/[^/]+/, ''),
      temCsrf: !!h['x-csrf-token'],
      // `X-Telemetry-Batch` só existe no sendBatch do telemetry-core — é a impressão digital
      // que separa "nosso transporte" de qualquer outro emissor que poste no mesmo endpoint.
      lote: h['x-telemetry-batch'] || null,
      tipoConteudo: h['content-type'] || null,
      status: null, // preenchido no evento de resposta — header enviado e veredito do servidor
    });
  }
});

// Correlaciona o veredito do servidor com o envio: "mandei o cabeçalho" e "o servidor
// aceitou" são afirmações diferentes, e confundir as duas foi o que me custou uma rodada.
page.on('response', async (res) => {
  if (!res.url().includes('/api/telemetry/')) return;
  // Pareado pelo PRÓPRIO objeto de request. Procurar "o primeiro sem status" casa a resposta
  // com o envio errado quando há mais de um em voo — e aí o relatório mente com confiança.
  const alvo = envios.find((e) => e.req === res.request());
  if (alvo) alvo.status = res.status();
});

try {
  await page.goto(CONFIG.BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const auth = await page.evaluate(async ([user, pass]) => {
    const r = await fetch('/api/auth/login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: user, password: pass }) });
    return r.status;
  }, [CONFIG.AUTH_USER, CONFIG.AUTH_PASS]);
  await page.goto(CONFIG.BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  // Qual versão do transport cada caminho de import entrega
  const versoes = await page.evaluate(async () => {
    const ler = async (caminho) => {
      try {
        const m = await import(caminho);
        const v = m.getTransportStats?.().version || m.VERSION || null;
        return v ?? 'sem versão exposta';
      } catch (e) { return 'erro: ' + e.message.slice(0, 60); }
    };
    return {
      moduloFonte: await ler('/assets/js/core/telemetry-core/transport/send.js'),
      bundlePublico: await ler('/assets/js/core/telemetry-core/index.js'),
    };
  });

  // Força um flush para ver o envio real do app sair
  await page.evaluate(async () => {
    try {
      const m = await import('/assets/js/core/telemetry-core/index.js');
      m.Telemetry?.track?.('validacao:runtime', { origem: 'valida-telemetria-runtime' });
      await m.Telemetry?.flush?.('manual');
    } catch { /* medido pelo que saiu na rede */ }
  });
  await page.waitForTimeout(3000);

  const comCsrf = envios.filter((e) => e.temCsrf).length;
  const semCsrf = envios.filter((e) => !e.temCsrf).length;

  console.log('\n─── #63 · o que está REALMENTE no ar ───');
  console.log(`login ................................... ${auth}`);
  console.log(`transport/send.js (fonte corrigida) ..... ${versoes.moduloFonte}`);
  console.log(`index.js (o que o app importa) .......... ${versoes.bundlePublico}`);
  console.log(`envios observados ....................... ${envios.length}  (com CSRF: ${comCsrf} · sem: ${semCsrf})`);
  for (const e of envios) console.log(`   csrf=${e.temCsrf ? 'sim' : 'NÃO'}  status=${e.status ?? '—'}  lote=${e.lote || '—'}`);
  const aceitos = envios.filter((e) => e.status === 200).length;
  const recusados = envios.filter((e) => e.status === 401 || e.status === 403).length;
  console.log(`veredito do servidor .................... ${aceitos} aceitos (200) · ${recusados} recusados (401/403)`);
  const doCore = envios.filter((e) => e.lote);
  const coreSemCsrf = doCore.filter((e) => !e.temCsrf).length;
  console.log(`envios DO telemetry-core (com lote) ..... ${doCore.length}  (sem CSRF: ${coreSemCsrf})`);
  console.log(`correção alcança o runtime .............. ${ok(doCore.length > 0 && coreSemCsrf === 0)}`);
  if (envios.length === 0) console.log('\n⚠️ nenhum envio observado na janela — inconclusivo, não confundir com "corrigido".');
  console.log();
} finally {
  await browser.close();
}
