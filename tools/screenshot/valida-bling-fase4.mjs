// tools/screenshot/valida-bling-fase4.mjs — prova do /status medido (Fase 4)
// @version 1.0.0  @created 2026-07-30
//
//     PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright node tools/screenshot/valida-bling-fase4.mjs
//
// POR QUE PRECISA DE NAVEGADOR
// `/status` exige sessão. As outras suítes provam a mecânica (PHP) e o
// roteamento anônimo (curl); esta prova o que o DONO vê quando abre a tela —
// que é onde o checklist hardcoded passou despercebido: ele dizia "banco não
// provisionado" com 38 tabelas no ar, e ninguém compara um checklist com a
// realidade se ele nunca foi medido.
// Mesmo import da suíte da Fase 3: playwright vive em tools/screenshot/node_modules.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const ALVO = 'https://dshowdash.com.br';

let passou = 0, falhou = 0;
const erros = [];

function ok(nome, cond, det = '') {
  if (cond) { passou++; console.log(`  \x1b[32m✔\x1b[0m ${nome}${det ? `  (${det})` : ''}`); }
  else { falhou++; erros.push(`${nome}${det ? ` — ${det}` : ''}`);
         console.log(`  \x1b[31m✘\x1b[0m ${nome}${det ? `  (${det})` : ''}`); }
}
const secao = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

const navegador = await chromium.launch({
  // Bate na ORIGEM: pela borda do Cloudflare a resposta poderia vir de cache.
  args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
         '--ignore-certificate-errors'],
});
const contexto = await navegador.newContext({
  viewport: { width: 1600, height: 950 }, ignoreHTTPSErrors: true,
});
try { await contexto.addCookies(await getSessionCookies()); }
catch (e) { console.log('[aviso]', e.message); }
const pagina = await contexto.newPage();

try {
  // Só o cookie perde a corrida do boot — se cair no login, preenche o formulário.
  await pagina.goto(`${ALVO}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await pagina.waitForTimeout(1500);
  if (await isLoginPage(pagina)) await loginViaPage(pagina);
  await pagina.waitForTimeout(2500);

  const buscar = async (rota) => pagina.evaluate(async (r) => {
    const resp = await fetch(r, { credentials: 'same-origin' });
    return { status: resp.status, corpo: await resp.json().catch(() => null) };
  }, rota);

  // ── envelope ────────────────────────────────────────────────
  secao('1. Envelope');

  const s = await buscar('/api/bling/status');
  ok('/status responde 200', s.status === 200, `HTTP ${s.status}`);

  // ⚠️ 17 painéis deste projeto testam `j.success` e por isso nunca saem do
  // placeholder. O contrato é `{ok}`.
  ok('envelope usa {ok}, não {success}',
     s.corpo?.ok === true && s.corpo?.success === undefined,
     `ok=${s.corpo?.ok} success=${s.corpo?.success}`);

  const d = s.corpo?.data ?? {};

  // ── checklist MEDIDO ────────────────────────────────────────
  secao('2. Checklist reflete a realidade, não o que está escrito no código');

  const itens = Object.fromEntries((d.checklist ?? []).map((i) => [i.id, i]));
  const esperados = ['provider', 'banco', 'schema', 'usuario_banco', 'cifra',
                     'credencial', 'conta', 'webhook', 'cron'];
  ok('checklist tem os 9 itens da Fase 4',
     esperados.every((k) => k in itens), Object.keys(itens).join(','));

  // Estes quatro são VERDADEIROS agora — o schema está aplicado, o usuário é
  // restrito, a cifra funciona e o cron está instalado. Se o checklist ainda
  // dissesse "não", estaria hardcoded como antes.
  ok('banco: medido como acessível', itens.banco?.ok === true, itens.banco?.detalhe);
  ok('schema: medido como aplicado', itens.schema?.ok === true, itens.schema?.detalhe);
  ok('usuário do banco: medido como SEM DDL', itens.usuario_banco?.ok === true,
     itens.usuario_banco?.detalhe);
  ok('cifra: medida como operacional', itens.cifra?.ok === true, itens.cifra?.detalhe);
  ok('cron: medido como instalado', itens.cron?.ok === true, itens.cron?.detalhe);

  // E estes são FALSOS — dependem do dono. Um checklist que dissesse "ok" aqui
  // estaria mentindo na direção mais perigosa.
  ok('credencial: honestamente marcada como pendente', itens.credencial?.ok === false,
     itens.credencial?.detalhe);
  ok('conta: honestamente marcada como pendente', itens.conta?.ok === false,
     itens.conta?.detalhe);
  ok('webhook: honestamente marcado como desligado', itens.webhook?.ok === false,
     itens.webhook?.detalhe);

  ok('item pendente traz a AÇÃO para resolver',
     (d.checklist ?? []).filter((i) => !i.ok).every((i) => typeof i.acao === 'string' && i.acao.length > 10),
     'um pendente sem instrução vira pergunta para mim');

  ok('não está pronto para go-live', d.pronto_para_go_live === false,
     `${d.pendentes} pendente(s)`);
  ok('fase atual é a 4', String(d.fase_atual ?? '').includes('Fase 4'), d.fase_atual);

  // ── §4: token nunca chega ao navegador ──────────────────────
  secao('3. §4 — o navegador não vê segredo nenhum');

  const rotas = ['/api/bling/status', '/api/bling/settings', '/api/bling/accounts',
                 '/api/bling/integrations', '/api/bling/sync'];

  // ⚠️ Procurar o NOME da variável dá falso positivo: `BLING_WEBHOOK_SECRET`
  // aparece legitimamente na instrução "Definir BLING_WEBHOOK_SECRET e...".
  // O que não pode vazar é o VALOR — e é ele que este teste procura, lido do
  // .env real. (Este processo roda como root e enxerga o arquivo; o navegador
  // nunca deveria enxergar o conteúdo.)
  const { readFileSync } = await import('node:fs');
  const env = Object.fromEntries(
    readFileSync('/var/www/dshowdash/.env', 'utf8').split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
      .map((l) => { const i = l.indexOf('=');
                    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
  );
  const segredos = ['BLING_CRYPTO_KEY', 'BLING_CLIENT_SECRET', 'BLING_WEBHOOK_SECRET',
                    'DB_BLING_PASS']
    .map((k) => [k, env[k]])
    .filter(([, v]) => typeof v === 'string' && v.length >= 8);

  ok('há segredo configurado para procurar', segredos.length > 0,
     segredos.map(([k]) => k).join(','));

  for (const rota of rotas) {
    const r = await buscar(rota);
    const texto = JSON.stringify(r.corpo ?? {});
    // Também os campos que nunca devem existir na resposta, com valor.
    const achados = [
      ...segredos.filter(([, v]) => texto.includes(v)).map(([k]) => `valor de ${k}`),
      ...['"access_token":"', '"refresh_token":"', '"client_secret":"']
        .filter((p) => texto.includes(p)),
    ];
    ok(`${rota} não devolve segredo`, achados.length === 0,
       achados.length ? `VAZOU: ${achados.join(',')}` : 'limpo');
  }

  // ── a tela abre ─────────────────────────────────────────────
  secao('4. A tela de Integrações abre e mostra o checklist');

  const errosJs = [];
  pagina.on('pageerror', (e) => errosJs.push(e.message));
  // ⚠️ NÃO usar goto() com hash: o app-shell já está carregado e um goto
  // recarrega a página inteira — o painel não chega a montar e a captura sai
  // com o placeholder do shell. As outras suítes trocam location.hash pelo
  // mesmo motivo.
  await pagina.evaluate((h) => { location.hash = h; },
    '#/panel-bling/administracao/integracoes');

  // Espera o painel montar, não um tempo fixo: waitForTimeout deixa instável.
  const montou = await pagina.waitForSelector('[data-bl-root]', { timeout: 20000 })
    .then(() => true).catch(() => false);
  ok('o painel Bling monta', montou);
  // Espera o CHECKLIST, não um tamanho qualquer: `[data-bl-root]` sozinho já
  // tem 1000+ caracteres só com a barra de seções, e esperar por tamanho daria
  // verde antes de o conteúdo chegar.
  await pagina.waitForFunction(
    () => /checklist/i.test(
      document.querySelector('[data-bl-root] main')?.innerText ?? ''),
    { timeout: 20000 },
  ).catch(() => {});

  ok('sem erro de JavaScript', errosJs.length === 0, errosJs.slice(0, 2).join(' | '));

  // Lê do painel, não do body: o body traz sidebar, header e rodapé do shell,
  // e um acerto ali não prova que o painel renderizou coisa alguma.
  // Lê o MAIN do painel: `[data-bl-root]` inclui a barra de seções, e casar
  // texto ali não prova que o conteúdo da tela renderizou.
  const texto = await pagina.evaluate(
    () => document.querySelector('[data-bl-root] main')?.innerText ?? '');
  // innerText vem com text-transform aplicado — comparar sem caixa.
  const t = texto.toLowerCase();
  ok('a tela mostra o checklist de ativação', t.includes('checklist'),
     `${texto.length} caracteres`);

  // O que o dono precisa ver: o que já está pronto e o que falta ele fazer.
  ok('a tela mostra o que já está pronto',
     t.includes('38 tabelas') && t.includes('bling_app'), 'banco e schema medidos');
  ok('a tela mostra a AÇÃO do que falta',
     t.includes('bling_client_id') || t.includes('meus aplicativos'),
     'pendência sem instrução vira pergunta para mim');

  await pagina.screenshot({ path: '/tmp/bling-fase4-integracoes.png', fullPage: true });
  console.log('\n  captura: /tmp/bling-fase4-integracoes.png');

} catch (e) {
  falhou++;
  erros.push(`EXCEÇÃO: ${e.message}`);
  console.log(`\n  \x1b[31m✘ EXCEÇÃO\x1b[0m ${e.message}`);
} finally {
  await navegador.close();
}

console.log('\n' + '─'.repeat(64));
console.log(`  \x1b[1m${passou} passaram\x1b[0m · ` +
  (falhou === 0 ? '\x1b[32m0 falharam\x1b[0m' : `\x1b[31m${falhou} falharam\x1b[0m`));
if (falhou > 0) {
  console.log('\n  Falhas:');
  for (const e of erros) console.log(`   • ${e}`);
}
console.log('');
process.exit(falhou === 0 ? 0 : 1);
