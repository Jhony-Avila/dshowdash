// GERAL V2 · LEITURA ÚNICA (painel.php) × respostas CRUAS do serviço 9c0f45b3 da ACIMA_ESQUERDA (CIMA, 24/11 noite).
// Retorno do mockup P10 (2ª rodada): bloqueio 2 (verificação das prioridades) e bloqueio 3 (fontes com a parte afetada) — a tela só EXIBE
// o que o serviço decidiu. Cada caso responde ao /painel.php com os BYTES do arquivo; nenhuma rota separada pode ser chamada.
// Uso: W=2200 H=1470 PORTA=8112 node teste-geral-v2-painel.cjs   (cwd = pasta de saída)
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const fs = require('fs'); const path = require('path');
const R = process.env.RESP || '/srv/dshow-modularizacao/app/20261124-geral-v2-indicador/respostas-674fa53e';   // 25/11: serviço vigente 674fa53e (RESP= para outra pasta)
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470);
const CAP = `capturas-painel-${W}`; fs.mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + String(x).slice(0, 300) : '')); } };
const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();

(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const abrir = async (arquivo) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H } }); const chamadas = [];
    await ctx.route('**/api/geral/v2/**', (r) => { const u = new URL(r.request().url()); const rota = u.pathname.replace('/api/geral/v2/', ''); chamadas.push(rota);
      if (rota === 'painel.php') return r.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: fs.readFileSync(path.join(R, arquivo)) });
      return r.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false,"data":null,"error":"NOT_FOUND"}' }); });
    await ctx.addInitScript(() => { try { localStorage.removeItem('dshow.geral.v2.periodo'); } catch {} });
    const pg = await ctx.newPage(); await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
    await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
    await pg.goto(`${B}/#/panel-dashboard`); await pg.reload({ waitUntil: 'domcontentloaded' });
    await pg.waitForSelector('[data-geral-v2="1"] .gv2[data-gv2-vista="geral"]', { timeout: 60000 });
    await pg.waitForFunction(() => !document.querySelector('.gv2 [data-gv2-estado="carregando"]'), null, { timeout: 30000 }).catch(() => {}); await pg.waitForTimeout(600);
    return { ctx, pg, chamadas };
  };
  const txt = (pg, sel) => pg.textContent(sel).then(norm).catch(() => '');
  const casos = [
    ['1-completa-sem-pendencias-painel-7d.json', async (pg) => {
      const p = await txt(pg, '[data-gv2-bloco="prioridades"]');
      afirma('1 · completa + sem_pendencias: "Prioridades de hoje · Sem pendências"', /Sem pendências/.test(p) && !!(await pg.$('[data-gv2-verificacao="completa"]')), p.slice(0, 160)); }],
    ['2-parcial-agenda-atrasada-painel-7d.json', async (pg) => {
      const p = await txt(pg, '[data-gv2-bloco="prioridades"]'); const f = await txt(pg, '[data-gv2-bloco="fontes"]');
      afirma('2 · parcial (agenda atrasada): "Verificação parcial · Google Calendar" no bloco, nunca "Sem pendências"', /Verificação parcial · Google Calendar/.test(p) && !/Sem pendências/.test(p), p.slice(0, 220));
      afirma('2 · fontes: "Google Calendar Dados parciais (agenda de hoje, prioridades)" — o rótulo e as partes do serviço (674fa53e: as 3 prioridades = uma parte)', /Google Calendar\s*Dados parciais \(agenda de hoje, prioridades\)/.test(f), f.slice(0, 260)); }],
    ['3a-pipedrive-fora-painel-7d.json', async (pg) => {
      const p = await txt(pg, '[data-gv2-bloco="prioridades"]'); const f = await txt(pg, '[data-gv2-bloco="fontes"]');
      afirma('3a · Pipedrive fora (agenda lida): "Verificação parcial · Pipedrive" no cabeçalho, nunca "Sem pendências"', /Verificação parcial · Pipedrive/.test(p) && !/Sem pendências/.test(p), p.slice(0, 220));
      afirma('3a · fontes: "Pipedrive Com problema (ganhos, funil, prioridades)" ("prioridades" uma vez); nunca "Pipedrive Atualizado"', /Pipedrive\s*Com problema \(ganhos, funil, prioridades\)/.test(f) && !/Pipedrive\s*Atualizado/.test(f), f.slice(0, 260)); }],
    ['3b-pipedrive-e-agenda-fora-painel-7d.json', async (pg) => {
      const p = await txt(pg, '[data-gv2-bloco="prioridades"]'); const f = await txt(pg, '[data-gv2-bloco="fontes"]');
      afirma('3b · nada lido: "Prioridades não verificadas · Pipedrive com problema, Google Calendar com problema"', /Prioridades não verificadas · Pipedrive com problema, Google Calendar com problema/.test(p) && !/Sem pendências/.test(p), p.slice(0, 240));
      afirma('3b · fontes: Pipedrive e Google Calendar "Com problema" com as partes; Bling segue "Atualizado"', /Pipedrive\s*Com problema \(/.test(f) && /Google Calendar\s*Com problema \(agenda de hoje, prioridades\)/.test(f) && /Bling\s*Atualizado/.test(f), f.slice(0, 300)); }],
    ['4-funil-com-problema-painel-7d.json', async (pg) => {
      const f = await txt(pg, '[data-gv2-bloco="fontes"]'); const p = await txt(pg, '[data-gv2-bloco="prioridades"]');
      const c = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => Object.fromEntries(xs.map((x) => [x.dataset.gv2Cartao, x.dataset.gv2Estado])));
      afirma('4 · BLOQUEIO 3: "Pipedrive Com problema (funil)" — só a parte afetada; ganhos seguem ok no cartão', /Pipedrive\s*Com problema \(funil\)/.test(f) && c.funil === 'erro' && c.ganhos !== 'erro', JSON.stringify({ c, f: f.slice(0, 200) }));
      afirma('4 · verificação completa com itens: sem selo de verificação parcial', !/Verificação parcial|não verificadas/.test(p), p.slice(0, 200)); }],
  ];
  try {
    for (const [arq, conferir] of casos) {
      const { ctx, pg, chamadas } = await abrir(`cenario-6-casos-cima/${arq}`);
      await conferir(pg);
      afirma(`${arq.split('-painel')[0]} · leitura única: só /painel.php (nenhuma rota separada)`, chamadas.length > 0 && chamadas.every((c) => c === 'painel.php'), JSON.stringify(chamadas));
      await pg.screenshot({ path: `${CAP}/geral-painel-${W}-${arq.split('-painel')[0]}.png` }); await ctx.close();
    }
  } catch (e) { falhas++; console.log('ERRO ' + (e.message || e).split('\n')[0]); }
  await b.close(); console.log(`GERAL V2 × PAINEL ${path.basename(R)} (${W}x${H}): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
})();
