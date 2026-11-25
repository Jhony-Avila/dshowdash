// GERAL — ESTADOS E MOVIMENTO (CIMA, 23/11/2026; pedido do Jhony): Carregando · Conectado · Aguardando conexão · Com problema.
// Fontes SIMULADAS por rota (nada vai a serviço real). Capturas em W×H (padrão 2200×1470) e, com VIDEO=1, vídeos curtos de cada estado.
// Uso: W=2200 H=1470 VIDEO=1 PORTA=8112 flock …/navegador.lock nice -n 10 node teste-geral-estados.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const fs = require('fs');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`;
const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470);
const CAP = process.env.CAP || `capturas-geral-${W}`; fs.mkdirSync(CAP, { recursive: true });
const VID = process.env.VIDEO === '1' ? `${CAP}/videos` : null; if (VID) fs.mkdirSync(VID, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const json = (data, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(status < 400 ? { ok: true, data, error: null } : { ok: false, data: null, error: 'X' }) });
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
const agoraIso = () => new Date().toISOString();

// ── fontes simuladas (estado mutável por cenário) ──
function fontes() {
  const f = { atraso: 0, transito: 'problema', pipedrive: 'ok', clima: 'ok', pdAtraso: 0, chamadas: {} };
  f.rotear = async (ctx) => {
    const conta = (k) => { f.chamadas[k] = (f.chamadas[k] || 0) + 1; };
    const esperar = async (extra = 0) => { if (f.atraso + extra) await dorme(f.atraso + extra); };
    await ctx.route('**/api/traffic/summary.php*', async (r) => { conta('summary'); await esperar();
      if (f.transito === 'ok') return r.fulfill(json({ trafficIndex: 42, level: 'moderate', estimatedCongestionKm: 87, activeIncidents: 31, closures: 4, updatedAt: agoraIso(), stale: false }));
      return r.fulfill(json({ trafficIndex: null, level: 'unavailable', estimatedCongestionKm: null, activeIncidents: null, closures: null, updatedAt: agoraIso(), stale: false })); });
    await ctx.route('**/api/traffic/health.php*', async (r) => { conta('health');
      return r.fulfill(json(f.transito === 'ok' ? { status: 'up', motivo: null } : { status: 'parcial', motivo: 'fluxo_vazio' })); });
    await ctx.route('**/api/home/weather.php*', async (r) => { conta('clima');
      if (f.clima === 'falha') return r.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' });
      const hoje = new Date(); const dia = (k) => new Date(hoje.getTime() + k * 864e5).toISOString().slice(0, 10);
      return r.fulfill(json({ cidade: 'São Paulo', atualizadoEm: agoraIso(), desatualizado: false,
        atual: { temp: 24, sensacao: 25, condicao: 'Parcialmente nublado', grupo: 'nublado', umidade: 68, vento: 11, chuvaAgora: 0, nuvens: 55, dia: true, tempMax: 27, tempMin: 18, chanceChuva: 20, uvMax: 6, nascerDoSol: '05:12', porDoSol: '18:41' },
        dias: Array.from({ length: 10 }, (_, k) => ({ data: dia(k), condicao: 'Parcialmente nublado', grupo: 'nublado', tempMax: 26 + (k % 3), tempMin: 17 + (k % 2), sensacaoMax: 27, sensacaoMin: 17, chanceChuva: 10 + k * 5, volumeChuva: 0, ventoMax: 14, uvMax: 6, nascerDoSol: '05:12', porDoSol: '18:41' })),
        horas: [] })); });
    await ctx.route('**/api/ads/status*', async (r) => { conta('ads'); await esperar(); return r.fulfill(json({ provider: 'mock', accounts: [] })); });
    await ctx.route('**/api/anuncios/stats.php*', async (r) => { conta('anuncios'); await esperar();
      return r.fulfill(json({ totais: { conversas: 128, perguntas: 342, positivas: 41, negativas: 6 }, atividade: Array.from({ length: 14 }, (_, i) => ({ dia: `d${i}`, n: 5 + ((i * 7) % 11) })) })); });
    await ctx.route('**/api/pipedrive/overview*', async (r) => { conta('pipedrive'); await esperar(f.pdAtraso);
      if (f.pipedrive === 'falha') return r.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false,"error":"UPSTREAM"}' });
      return r.fulfill(json({ overview: { deals: { abertos: 57, valor_aberto: 1834500, taxa_conversao: 23.4 }, atividades: { negocios_abertos_com_vencida: 3 } }, runs: [{ status: 'completed', finished_at: new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 19).replace('T', ' ') }] })); });
    await ctx.route('**/api/google-calendar/header/summary*', async (r) => { conta('agenda'); await esperar();
      return r.fulfill(json({ estado: 'connected', hoje: 4, proxima: { summary: 'Reunião comercial', start: new Date(Date.now() + 3600e3).toISOString() }, convites_pendentes: 1, conflitos: 0, livre_min: 150, mock: false })); });
  };
  return f;
}

(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const nova = async (f, extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, ...(VID && extra.video ? { recordVideo: { dir: VID, size: { width: Math.min(W, 1600), height: Math.round(Math.min(W, 1600) * H / W) } } } : {}), ...(extra.reduzir ? { reducedMotion: 'reduce' } : {}) });
    await f.rotear(ctx);
    await ctx.addInitScript(() => { try { localStorage.removeItem('dshow.home.layout.v2'); localStorage.removeItem('dshow.geral.widgets.ocultos'); localStorage.removeItem('dshow.home.cenario'); } catch {} });
    const pg = await ctx.newPage();
    await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
    return { ctx, pg };
  };
  const abrirGeral = async (pg, esperarPronto = true) => {
    await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
    await pg.goto(`${B}/#/panel-dashboard`); await pg.reload({ waitUntil: 'domcontentloaded' });
    // a GERAL (não a página inicial imersiva, que usa o mesmo shell): data-imersivo="0"
    await pg.waitForSelector('[data-geral-react-root] [data-imersivo="0"] .ger-shell', { timeout: 60000 });
    if (esperarPronto) await pg.waitForFunction(() => !document.querySelector('[data-geral-react-root] [data-ger-estado="carregando"]'), null, { timeout: 30000 });
  };
  const estados = (pg) => pg.$$eval('[data-geral-react-root] .ger-rgl-item [data-ger-estado]', (xs) => xs.map((x) => [x.querySelector('.ger-wg-nome')?.textContent, x.dataset.gerEstado]));
  // rola até a seção deixando folga para o cabeçalho fixo do shell (≈ 150 px)
  const rolar = async (pg, sec) => { await pg.evaluate((s) => { const el = document.querySelector(`[data-ger-sec="${s}"]`); if (!el) return; el.scrollIntoView({ block: 'start' }); const sc = (function achar(n) { while (n && n !== document.body) { const o = getComputedStyle(n).overflowY; if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) return n; n = n.parentElement; } return document.scrollingElement; })(el.parentElement); sc.scrollTop -= 150; }, sec); await pg.waitForTimeout(250); };
  const cap = async (pg, nome) => pg.screenshot({ path: `${CAP}/geral-${W}-${nome}.png` });
  // fecha o contexto e dá ao vídeo (se houver) o nome do estado
  const fechar = async (ctx, pg, nome) => { const v = VID ? pg.video() : null; await ctx.close(); if (v && nome) fs.renameSync(await v.path(), `${VID}/geral-${W}-${nome}.webm`); };

  // ── (1) CARREGANDO → CONECTADO ────────────────────────────────────
  { const f = fontes(); f.atraso = 3500; const { ctx, pg } = await nova(f, { video: true });
    await abrirGeral(pg, false); await pg.waitForSelector('.ger-widget[data-ger-estado="carregando"]', { timeout: 20000 }); await pg.waitForTimeout(500);
    const car = await pg.$$eval('.ger-widget[data-ger-estado="carregando"]', (xs) => xs.map((x) => ({ txt: x.textContent, ossos: x.querySelectorAll('.ger-osso').length, anim: getComputedStyle(x.querySelector('.ger-osso')).animationName })));
    afirma('CARREGANDO: esqueleto na forma do cartão (nome + "Carregando…" escrito + 3 números + minigráfico + rodapé) com brilho passando',
      car.length >= 4 && car.every((c) => /Carregando…/.test(c.txt) && c.ossos === 8 && c.anim === 'ger-shimmer'), JSON.stringify(car.slice(0, 2)));
    const ag0 = await pg.$$eval('[data-ger-estado="aguardando"]', (xs) => xs.length);
    afirma('os 6 sem fonte já aparecem na faixa "Aguardando conexão" (sem caixa vazia na grade, sem esperar carga)', ag0 === 6, String(ag0));
    // revisão cruzada (ESQUERDA 23/11): a saudação nunca é caixa em branco e os 5 resumos do topo dizem "Carregando…"
    { const h = await pg.$eval('.ger-hero', (x) => ({ t: x.textContent.replace(/\s+/g, ' ').trim(), busy: x.getAttribute('aria-busy') })).catch(() => ({ t: '' }));
      afirma('CARREGANDO: a saudação já mostra o cumprimento + "Carregando o resumo do dia…" (sem caixa em branco)', /^(Bom dia|Boa tarde|Boa noite)/.test(h.t) && /Carregando o resumo do dia…/.test(h.t), JSON.stringify(h));
      const kpi = await pg.$$eval('.ger-saudes[data-ger-estado="carregando"] .ger-saude', (xs) => xs.map((x) => x.textContent));
      afirma('CARREGANDO: os 5 resumos do topo com "Carregando…" escrito', kpi.length === 5 && kpi.every((t) => /Carregando…/.test(t)), JSON.stringify(kpi)); }
    await cap(pg, '1-carregando');
    await pg.waitForFunction(() => !document.querySelector('[data-ger-estado="carregando"]'), null, { timeout: 30000 }); await pg.waitForTimeout(400);
    const est = await estados(pg);
    afirma('CONECTADO: Consultor Anuncios, Pipedrive e Google Calendar conectados; Trânsito com problema; Ads (modo de testes) saiu da grade',
      JSON.stringify(est.filter(([n]) => n !== 'Trânsito').map(([, e]) => e)) === '["conectado","conectado","conectado"]' && est.some(([n, e]) => n === 'Trânsito' && e === 'problema') && !est.some(([n]) => n === 'Ads Intelligence'), JSON.stringify(est));
    const pd = await pg.$eval('[data-ger-estado="conectado"]:has(.ger-wg-nome:text-is("Pipedrive"))', (x) => ({ t: x.textContent, ponto: getComputedStyle(x.querySelector('.ger-sync-ponto')).animationName }));
    afirma('CONECTADO: números reais + "Conectado · atualizado agora"; o ponto fica PARADO fora da sincronização', /57/.test(pd.t) && /Conectado · atualizado agora/.test(pd.t) && pd.ponto === 'none', JSON.stringify(pd));
    const nAg = await pg.$$eval('[data-ger-estado="aguardando"]', (xs) => xs.length);
    afirma('Ads em modo de testes vai para a faixa: 7 cartões "Aguardando conexão"', nAg === 7, String(nAg));
    // revisão cruzada P1: número de dinheiro NUNCA quebra no meio ("R$ 1.834.50" / "0"); P2: o nome do módulo continua visível com pílula longa
    { const quebra = await pg.$$eval('.ger-wg-metrica-valor', (xs) => xs.filter((x) => { const lh = parseFloat(getComputedStyle(x).lineHeight) || parseFloat(getComputedStyle(x).fontSize) * 1.3; return x.getBoundingClientRect().height > lh * 1.5; }).map((x) => x.textContent));
      afirma('P1: nenhum valor de métrica quebrado em duas linhas (ex.: valor do funil R$ 1.834.500 inteiro)', quebra.length === 0 && /R\$\s?1\.834\.500/.test(await pg.textContent('[data-ger-estado="conectado"]:has(.ger-wg-nome:text-is("Pipedrive"))')), JSON.stringify(quebra));
      const nomes = await pg.$$eval('.ger-rgl-item .ger-wg-nome', (xs) => xs.map((x) => [x.textContent, Math.round(x.getBoundingClientRect().width)]));
      afirma('P2: o nome de cada módulo continua visível (≥ 40 px) mesmo com a pílula longa do Pipedrive', nomes.every(([, w]) => w >= 40), JSON.stringify(nomes));
      const pilulas = await pg.$$eval('.ger-rgl-item .ger-wg-status', (xs) => xs.filter((x) => x.textContent.length <= 14 && x.scrollWidth > x.clientWidth + 1).map((x) => x.textContent));
      afirma('pílulas curtas (Operacional, Conectado, Com problema) aparecem inteiras, sem reticências', pilulas.length === 0, JSON.stringify(pilulas)); }
    await cap(pg, '2-conectado');
    // sincronizando: o ponto pulsa SÓ enquanto atualiza
    f.atraso = 2500; await pg.click('[data-geral-react-root] .ger-btn:has-text("Atualizar")'); await pg.waitForTimeout(500);
    const sinc = await pg.$eval('[data-ger-estado="conectado"]:has(.ger-wg-nome:text-is("Pipedrive")) .ger-sync', (x) => ({ t: x.textContent, a: getComputedStyle(x.querySelector('.ger-sync-ponto')).animationName }));
    afirma('ao atualizar: os números FICAM, "Sincronizando…" escrito e o ponto pulsa', /Sincronizando…/.test(sinc.t) && sinc.a === 'ger-pulso' && /57/.test(await pg.textContent('[data-ger-estado="conectado"]:has(.ger-wg-nome:text-is("Pipedrive"))')), JSON.stringify(sinc));
    await cap(pg, '2b-sincronizando');
    await pg.waitForTimeout(3200);
    const fim = await pg.$eval('[data-ger-estado="conectado"]:has(.ger-wg-nome:text-is("Pipedrive")) .ger-sync', (x) => getComputedStyle(x.querySelector('.ger-sync-ponto')).animationName);
    afirma('fim da sincronização: o ponto volta a ficar parado', fim === 'none', fim);
    // nada em laço infinito fora do esqueleto, do ponto de sincronização e do ícone "tentando"
    await pg.waitForFunction(() => !document.querySelector('[data-geral-react-root] .ger-skel, [data-geral-react-root] [aria-busy="true"]'), null, { timeout: 30000 }).catch(() => {});
    // na Geral pronta e parada: NENHUM laço (esqueleto, ponto e "tentando" só existem enquanto carregam/sincronizam)
    const lacos = await pg.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming().iterations === Infinity && a.effect?.target?.closest?.('[data-geral-react-root]')).map((a) => { const t = a.effect.target; const c = t.closest('[data-ger-sec]')?.dataset.gerSec || t.parentElement?.className || ''; return `${a.animationName}@${t.className}<${c}|${t.getBoundingClientRect().height}`; }));
    afirma('Geral pronta: nenhuma animação em laço (o shell em volta não é da Geral)', lacos.length === 0, JSON.stringify(lacos));
    const durs = await pg.evaluate(() => { const out = new Set(); for (const s of document.styleSheets) { try { for (const r of s.cssRules) { const t = r.cssText || ''; if (/ger-(entra|num|aguardando|problema|wg-abrir|sync)/.test(t)) { (t.match(/(\d+)ms/g) || []).forEach((m) => out.add(Number(m.replace('ms', '')))); } } } catch {} } return [...out]; });
    afirma('microanimações entre 150 e 300 ms (atraso de sequência ≤ 35 ms por cartão)', durs.filter((d) => d !== 35 && d !== 0).every((d) => d >= 150 && d <= 300), JSON.stringify(durs));
    await fechar(ctx, pg, 'video-1-carregando-para-conectado'); }

  // ── (2) AGUARDANDO CONEXÃO: textos confirmados, com quem, link ───
  { const f = fontes(); const { ctx, pg } = await nova(f, { video: true }); await abrirGeral(pg); await pg.waitForTimeout(600);
    const ag = await pg.$$eval('[data-ger-estado="aguardando"]', (xs) => xs.map((x) => ({ n: x.querySelector('strong')?.textContent, t: x.querySelector('.ger-aguardando-falta')?.textContent, link: x.querySelector('.ger-wg-abrir')?.textContent?.trim() || null, alt: x.getBoundingClientRect().height })));
    const por = Object.fromEntries(ag.map((a) => [a.n, a]));
    afirma('Mercado Livre: "Aplicativo em criação. Com Walter." + link', por['Mercado Livre']?.t === 'Aplicativo em criação. Com Walter.' && !!por['Mercado Livre'].link, JSON.stringify(ag));
    afirma('Meta Ads: "Falta o usuário de leitura. Com Diogo." + link', por['Meta Ads']?.t === 'Falta o usuário de leitura. Com Diogo.' && !!por['Meta Ads'].link, JSON.stringify(por['Meta Ads']));
    afirma('Ads Intelligence: Google Cloud (Walter) e leitura nas contas (Diogo)', por['Ads Intelligence']?.t === 'Falta o acesso no Google Cloud (Walter) e a leitura nas contas (Diogo).', JSON.stringify(por['Ads Intelligence']));
    afirma('Financeiro: "Asaas em auditoria; faltam as chaves."', por['Financeiro']?.t === 'Asaas em auditoria; faltam as chaves.', JSON.stringify(por['Financeiro']));
    afirma('E-commerce: "Loja Integrada: falta definir o dono da conta."', por['E-commerce']?.t === 'Loja Integrada: falta definir o dono da conta.', JSON.stringify(por['E-commerce']));
    afirma('Compras e DataTables com os textos aprovados (DataTables com link para o painel que já existe)', /ainda não existe; depende da integração Bling/.test(por['Compras']?.t || '') && /DataTables já existe/.test(por['DataTables']?.t || '') && !!por['DataTables'].link, JSON.stringify([por['Compras'], por['DataTables']]));
    afirma('cartões COMPACTOS (sem caixa vazia): altura ≤ 120 px (no máximo 3 linhas de texto), todos com "Aguardando conexão" escrito', ag.every((a) => a.alt <= 120) && (await pg.$$eval('[data-ger-estado="aguardando"] .ger-wg-status', (xs) => xs.every((x) => x.textContent === 'Aguardando conexão'))), JSON.stringify(ag.map((a) => a.alt)));
    const ordem = await pg.evaluate(() => { const g = document.querySelector('[data-ger-sec="widgets"]').getBoundingClientRect().top; const a = document.querySelector('[data-ger-sec="aguardando"]').getBoundingClientRect().top; return a > g; });
    afirma('a faixa "Aguardando conexão" fica ABAIXO dos conectados', ordem);
    const topo = await pg.$$eval('.ger-saude', (xs) => xs.map((x) => x.textContent));
    afirma('topo coerente: "2 de 10 fontes conectadas · 1 com problema" e "7 aguardando conexão · 1 com problema" (nada "saudável" que aguarda)',
      topo.some((t) => /2 de 10 fontes conectadas · 1 com problema/.test(t)) && topo.some((t) => /7 aguardando conexão · 1 com problema/.test(t)) && !topo.some((t) => /saudáveis/.test(t)), JSON.stringify(topo));
    await rolar(pg, 'aguardando'); await cap(pg, '3-aguardando');
    await pg.click('[data-ger-estado="aguardando"]:has(strong:text-is("DataTables")) .ger-wg-abrir'); await pg.waitForTimeout(300);
    afirma('o link leva à integração (DataTables → #/panel-datatables)', /#\/panel-datatables/.test(pg.url()), pg.url());
    await fechar(ctx, pg, 'video-2-aguardando-conexao'); }

  // ── (3) COM PROBLEMA → TENTAR DE NOVO ────────────────────────────
  { const f = fontes(); const { ctx, pg } = await nova(f, { video: true }); await abrirGeral(pg); await pg.waitForTimeout(500);
    const tr = await pg.$eval('[data-ger-estado="problema"]:has(.ger-wg-nome:text-is("Trânsito"))', (x) => x.textContent);
    afirma('Trânsito COM PROBLEMA (health parcial/fluxo_vazio): o que falhou em uma linha + "Sem leitura válida recente" + Tentar de novo; sem número e sem zero',
      /Com problema/.test(tr) && /não devolveu o fluxo das vias/.test(tr) && /Sem leitura válida recente/.test(tr) && /Tentar de novo/.test(tr) && !/\b0\b/.test(tr.replace(/\d+\/\d+/g, '')), tr);
    const integ = await pg.$eval('.ger-integ:has(strong:text-is("Trânsito SP"))', (x) => x.textContent);
    afirma('lista de integrações: Trânsito SP "Com problema" (antes: "Conectada")', /Com problema/.test(integ), integ);
    // Pipedrive: tinha valor válido → falha na atualização → valor FICA, marcado como desatualizado, com o último sucesso
    f.pipedrive = 'falha'; await pg.click('[data-geral-react-root] .ger-btn:has-text("Atualizar")'); await pg.waitForSelector('[data-ger-estado="problema"]:has(.ger-wg-nome:text-is("Pipedrive"))', { timeout: 20000 });
    const pd = await pg.$eval('[data-ger-estado="problema"]:has(.ger-wg-nome:text-is("Pipedrive"))', (x) => ({ t: x.textContent, tag: !!x.querySelector('.ger-tag-desatualizado') }));
    afirma('Pipedrive falhou depois de um sucesso: "A atualização de Pipedrive falhou." + "Último sucesso às HH:MM" + números FICAM marcados "Desatualizado" (falha nunca vira zero)',
      /A atualização de Pipedrive falhou\./.test(pd.t) && /Último sucesso às \d\d:\d\d/.test(pd.t) && pd.tag && /57/.test(pd.t), pd.t);
    // legibilidade: a linha do problema não espreme o texto (nenhuma linha com ≤ 1 palavra; o botão desce quando falta espaço)
    const esp = await pg.$$eval('[data-ger-problema] .ger-problema-motivo', (xs) => xs.map((x) => { const lh = parseFloat(getComputedStyle(x).lineHeight) || 16; return { linhas: Math.round(x.getBoundingClientRect().height / lh), palavras: x.textContent.split(/\s+/).length, w: Math.round(x.getBoundingClientRect().width) }; }));
    afirma('"Com problema" legível em cartão estreito: texto com largura ≥ 160 px e menos linhas que palavras', esp.every((e) => e.w >= 160 && e.linhas < e.palavras / 2), JSON.stringify(esp));
    const corte = await pg.$$eval('.ger-rgl-item [data-ger-estado]', (xs) => xs.map((x) => { const r = x.getBoundingClientRect(); const fora = [...x.querySelectorAll('.ger-wg-metrica-valor, .ger-wg-metrica-rotulo, .ger-problema')].filter((e) => { const q = e.getBoundingClientRect(); return q.right > r.right + 1 || q.left < r.left - 1 || (e.scrollWidth > e.clientWidth + 1 && !e.classList.contains('ger-wg-metrica-rotulo')); }).length; return [x.querySelector('.ger-wg-nome')?.textContent, Math.max(x.scrollHeight - x.clientHeight, x.scrollWidth - x.clientWidth, fora ? 99 : 0)]; }).filter(([, d]) => d > 2));
    afirma('nenhum cartão da grade com conteúdo cortado, na altura nem na largura (Com problema + números desatualizados cabem no cartão)', corte.length === 0, JSON.stringify(corte));
    // nota da revisão: captura do TOPO no estado "com problema" (Pipedrive E Trânsito com problema → o topo diz 2)
    await pg.evaluate(() => { const sc = document.querySelector('[data-geral-react-root]')?.closest('main') || document.scrollingElement; sc.scrollTop = 0; document.scrollingElement.scrollTop = 0; }); await pg.waitForTimeout(300);
    afirma('topo no estado "com problema": "2 com problema" no resumo (Pipedrive e Trânsito)', /2 com problema/.test(await pg.textContent('.ger-saudes').catch(() => '')), await pg.textContent('.ger-saudes').catch(() => ''));
    await cap(pg, '4-com-problema-topo');
    await rolar(pg, 'widgets'); await cap(pg, '4-com-problema');
    f.pipedrive = 'ok'; f.pdAtraso = 1500;
    await pg.click('[data-ger-estado="problema"]:has(.ger-wg-nome:text-is("Pipedrive")) button:has-text("Tentar de novo")'); await pg.waitForTimeout(400);
    const tent = await pg.$eval('.ger-rgl-item:has(.ger-wg-nome:text-is("Pipedrive"))', (x) => x.textContent);
    afirma('"Tentar de novo" mostra "Tentando…" (botão ocupado) sem apagar o último valor', /Tentando…/.test(tent) && /57/.test(tent), tent);
    await cap(pg, '4b-tentando');
    await pg.waitForSelector('[data-ger-estado="conectado"]:has(.ger-wg-nome:text-is("Pipedrive"))', { timeout: 15000 }); await pg.waitForTimeout(300);
    afirma('depois de tentar de novo: volta a "Conectado · atualizado agora"', /Conectado · atualizado agora/.test(await pg.textContent('[data-ger-estado="conectado"]:has(.ger-wg-nome:text-is("Pipedrive"))')));
    await cap(pg, '4c-recuperado');
    // trânsito volta: Tentar de novo no cartão do Trânsito
    f.transito = 'ok'; await pg.click('[data-ger-estado="problema"]:has(.ger-wg-nome:text-is("Trânsito")) button:has-text("Tentar de novo")');
    await pg.waitForSelector('[data-ger-estado="conectado"]:has(.ger-wg-nome:text-is("Trânsito"))', { timeout: 15000 });
    afirma('Trânsito: "Tentar de novo" com a fonte de volta → Conectado com o índice', /42\/100/.test(await pg.textContent('[data-ger-estado="conectado"]:has(.ger-wg-nome:text-is("Trânsito"))')));
    await fechar(ctx, pg, 'video-3-com-problema-tentar-de-novo'); }

  // ── (3b) CLIMA FORA: "Com problema" (antes: esqueleto para sempre) e nenhuma caixa vazia na previsão ──
  { const f = fontes(); f.clima = 'falha'; const { ctx, pg } = await nova(f); await abrirGeral(pg); await pg.waitForTimeout(1500);
    const cl = await pg.$eval('.ger-clima[data-ger-estado="problema"]', (x) => x.textContent).catch(() => '');
    const skel = await pg.$$eval('[data-geral-react-root] .ger-skel', (xs) => xs.length);
    afirma('clima fora: "Não foi possível ler o clima agora." + Tentar de novo; nenhum esqueleto eterno na página', /Não foi possível ler o clima agora\./.test(cl) && /Tentar de novo/.test(cl) && skel === 0, JSON.stringify({ cl, skel }));
    f.clima = 'ok'; await pg.click('.ger-clima[data-ger-estado="problema"] button:has-text("Tentar de novo")');
    await pg.waitForSelector('.ger-clima:not([data-ger-estado])', { timeout: 15000 }).catch(() => {});
    afirma('clima: "Tentar de novo" com a fonte de volta mostra o clima', /São Paulo/.test(await pg.textContent('.ger-clima').catch(() => '')));
    await ctx.close(); }

  // ── (4) REDUZIR MOVIMENTO ────────────────────────────────────────
  { const f = fontes(); f.atraso = 2500; const { ctx, pg } = await nova(f, { reduzir: true }); await abrirGeral(pg, false);
    await pg.waitForSelector('.ger-widget[data-ger-estado="carregando"]', { timeout: 20000 });
    const anim = await pg.evaluate(() => [...document.querySelectorAll('.ger-osso, .ger-entra')].map((x) => getComputedStyle(x).animationName).filter((n) => n !== 'none'));
    afirma('"reduzir movimento" do sistema: esqueleto parado e sem entrada animada (estado continua escrito)', anim.length === 0 && /Carregando…/.test(await pg.textContent('.ger-widget[data-ger-estado="carregando"]')), JSON.stringify(anim));
    await ctx.close(); }

  console.log(`GERAL · ESTADOS E MOVIMENTO (${W}x${H}): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, (e.stack || '').split('\n')[1]); process.exit(2); });
