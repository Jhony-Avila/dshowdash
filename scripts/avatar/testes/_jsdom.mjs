// _jsdom.mjs — Track D onda 3.1 (#D-m28): resolução PORTÁTIL do jsdom para os
// testes de comportamento. Tenta, em ordem: JSDOM_PATH (env) → 'jsdom' (node_modules
// padrão) → node_modules do repo → prefixo temporário conhecido. Se ausente, PULA
// de forma limpa (exit 0) com mensagem — o server-gate instala jsdom antes de rodar.
export async function getJSDOM() {
  const tentativas = [
    process.env.JSDOM_PATH,
    'jsdom',
    new URL('../../../node_modules/jsdom/lib/api.js', import.meta.url).href,
    new URL('../../../public/react/node_modules/jsdom/lib/api.js', import.meta.url).href,
    '/tmp/testdeps/node_modules/jsdom/lib/api.js',
    '/tmp/jsdmroot/node_modules/jsdom/lib/api.js',
  ].filter(Boolean);
  for (const t of tentativas) {
    try { const m = await import(t); if (m && m.JSDOM) return m.JSDOM; } catch { /* próxima */ }
  }
  console.log('  ⚠ SKIP: jsdom não encontrado (instale: npm i jsdom, ou defina JSDOM_PATH). Teste de comportamento pulado.');
  process.exit(0);
}
