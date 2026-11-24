// GERAL V2 · LANÇAMENTO (CIMA, 23/11/2026) — tela contra o CONTRATO SIMULADO (PARA-STATUS compartilhado, "GERAL V2 — PROPOSTA DE CONTRATO").
// Nada vai a serviço real: /api/geral/v2/* respondido por rota. Capturas em W×H e, com VIDEO=1, vídeos curtos dos estados.
// Uso: W=2200 H=1470 VIDEO=1 PORTA=8112 flock …/navegador.lock nice -n 10 node teste-geral-v2.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const fs = require('fs');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`;
const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470);
const CAP = process.env.CAP || `capturas-geral-v2-${W}`; fs.mkdirSync(CAP, { recursive: true });
const VID = process.env.VIDEO === '1' ? `${CAP}/videos` : null; if (VID) fs.mkdirSync(VID, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
const env = (data) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data, error: null }) });
const falha = (status = 500) => ({ status, contentType: 'application/json', body: JSON.stringify({ ok: false, data: null, error: 'X', meta: { message: 'Falha simulada.' } }) });
const agoraIso = () => new Date().toISOString();
const diaBr = (k) => new Date(Date.now() - 3 * 3600e3 - k * 864e5).toISOString().slice(0, 10);   // k dias atrás (Brasília)

// ── dados simulados, internamente reconciliados (soma dos dias = cartão; lista = contagem da prioridade) ──
const VAL7 = [24000, 38000, 51000, 18500, 97000, 12900, 43500], QTD7 = [2, 3, 3, 1, 4, 1, 3];   // 17 pedidos, R$ 284.900
function resumo(periodo, m) {
  const dias = periodo === 'ontem' ? 1 : periodo === '7d' ? 7 : 22;
  const por_dia = Array.from({ length: dias }, (_, i) => { const k = dias - i; const j = (i + 7 - dias % 7) % 7;
    return { dia: diaBr(k), quantidade: periodo === 'ontem' ? 0 : QTD7[j], valor: periodo === 'ontem' ? 0 : VAL7[j] }; });
  const q = por_dia.reduce((s, d) => s + d.quantidade, 0), v = por_dia.reduce((s, d) => s + d.valor, 0);
  const base = { ultimo_sucesso: agoraIso(), motivo: null };
  const r = {
    periodo: { id: periodo, de: por_dia[0].dia, ate: por_dia[por_dia.length - 1].dia, rotulo: periodo === 'ontem' ? `${por_dia[0].dia.split('-').reverse().slice(0, 2).join('/')} · ontem, dia completo` : `${dias} dias completos · até ontem` },
    pedidos_bling: { ...base, estado: q === 0 ? 'zero' : 'ok', quantidade: q, valor: v, por_dia, inclui_canceladas: true },
    negocios_ganhos: { ...base, estado: periodo === 'ontem' ? 'zero' : 'ok', quantidade: periodo === 'ontem' ? 0 : 9, valor: periodo === 'ontem' ? 0 : 351000, sem_valor: periodo === 'ontem' ? 0 : 1 },
    funil_aberto: { ...base, estado: 'ok', quantidade: 86, valor: 4830000, sem_valor: 5 },
  };
  if (m.estados) {   // prancha 02_GERAL_ESTADOS: zero real · desatualizado · aguardando
    r.pedidos_bling = { ...r.pedidos_bling, estado: 'zero', quantidade: 0, valor: 0, por_dia: por_dia.map((d) => ({ ...d, quantidade: 0, valor: 0 })) };
    r.negocios_ganhos = { ...r.negocios_ganhos, estado: 'desatualizado', ultimo_sucesso: new Date(Date.now() - 26 * 3600e3).toISOString() };
    r.funil_aberto = { estado: 'aguardando', quantidade: null, valor: null, sem_valor: null, ultimo_sucesso: null, motivo: null };
  }
  return r;
}
const NOMES = ['Proposta de painel LED', 'Projeto de videowall', 'Instalação de LED', 'Painel indoor', 'Locação de painel', 'Controladora e acessórios'];
const RESP = [{ id: 11, nome: 'Eduardo' }, { id: 12, nome: 'Bruno' }, { id: 13, nome: 'Diogo' }];
function listaItens(id, total) {
  return Array.from({ length: total }, (_, i) => ({ deal_id: 40631 + i * 7, titulo: NOMES[i % 6] + (i >= 6 ? ` ${i + 1}` : ''), organizacao: `Cliente Exemplo ${String.fromCharCode(65 + (i % 26))}`,
    responsavel: RESP[[0, 1, 0, 2, 1, 0][i % 6]].nome, etapa: ['Proposta enviada', 'Aguardando retorno', 'Proposta enviada', 'Negociação', 'Aguardando retorno', 'Proposta enviada'][i % 6],
    prazo: diaBr(4 - (i % 5) + (id === 'sem_proxima_atividade' ? -6 : 0)), valor: i === 3 && id === 'sem_proxima_atividade' ? null : [96000, 42500, 78000, 28500, 54000, 23900][i % 6] + i, url_pipedrive: `https://exemplo.pipedrive.invalid/deal/${40631 + i * 7}` }));
}
function fontes(m) {
  const f = [
    { fonte: 'pipedrive', estado: m.pipeVelho ? 'desatualizada' : 'conectada', ultimo_sucesso: m.pipeVelho ? new Date(Date.now() - 30 * 3600e3).toISOString() : agoraIso(), motivo: m.pipeVelho ? 'Última sincronização há mais de um dia.' : null },
    { fonte: 'bling', estado: m.estados ? 'desatualizada' : 'conectada', ultimo_sucesso: m.estados ? new Date(Date.now() - 26 * 3600e3).toISOString() : agoraIso(), motivo: m.estados ? 'Última sincronização há mais de um dia.' : null },
    { fonte: 'calendar', estado: 'conectada', ultimo_sucesso: agoraIso(), motivo: null },
    { fonte: 'asaas', estado: 'aguardando', ultimo_sucesso: null, motivo: 'Asaas em auditoria; faltam as chaves.' },
    { fonte: 'mercadolivre', estado: 'aguardando', ultimo_sucesso: null, motivo: 'Aplicativo em criação.' },
    { fonte: 'lojaintegrada', estado: 'aguardando', ultimo_sucesso: null, motivo: 'Falta definir o dono da conta.' },
  ];
  return f;
}
function simulador() {
  const m = { atraso: 0, falhaResumo: false, falhaPrio: false, estados: false, semPendencias: false, prioNula: false, pipeVelho: false, calls: {}, ultimaLista: null };
  m.rotear = async (ctx) => {
    await ctx.route('**/api/geral/v2/**', async (r) => {
      const u = new URL(r.request().url()); const rota = u.pathname.replace('/api/geral/v2', '').replace(/\.php$/, ''); m.calls[rota] = (m.calls[rota] || 0) + 1;
      if (m.atraso) await dorme(m.atraso);
      if (rota === '/resumo') { if (m.falhaResumo) return r.fulfill(falha(502)); const x = resumo(u.searchParams.get('periodo'), m); const t = (v) => (v === null ? null : Number(v).toFixed(2));
        x.pedidos_bling = { ...x.pedidos_bling, valor: t(x.pedidos_bling.valor), por_dia: x.pedidos_bling.por_dia.map((d) => ({ ...d, valor: t(d.valor) })) };
        x.negocios_ganhos.valor = t(x.negocios_ganhos.valor); x.funil_aberto.valor = t(x.funil_aberto.valor); return r.fulfill(env(x)); }
      if (rota === '/prioridades') {
        if (m.falhaPrio) return r.fulfill(falha(502));
        const z = m.semPendencias;
        return r.fulfill(env({ gerado_em: agoraIso(), itens: [
          { id: 'sem_proxima_atividade', estado: z ? 'zero' : 'ok', quantidade: z ? 0 : 120, gravidade: 2, desde: diaBr(9), responsaveis: 3, detalhe: null, ultimo_sucesso: agoraIso(), motivo: null },
          { id: 'conflito_agenda', estado: z ? 'zero' : 'ok', quantidade: z ? 0 : 1, gravidade: 3, desde: new Date(Date.now() + 2 * 3600e3).toISOString(), responsaveis: null, detalhe: null, ultimo_sucesso: agoraIso(), motivo: null },
          { id: 'atividade_vencida', estado: z ? 'zero' : 'ok', quantidade: m.prioNula ? null : z ? 0 : 6, gravidade: 1, desde: diaBr(4), responsaveis: 3, detalhe: null, ultimo_sucesso: agoraIso(), motivo: null },
        ] }));
      }
      if (rota === '/prioridades/lista') {
        const id = u.searchParams.get('id'); const pag = Number(u.searchParams.get('pagina')); const pp = Number(u.searchParams.get('por_pagina')); const resp = u.searchParams.get('responsavel');
        m.ultimaLista = Object.fromEntries(u.searchParams);
        let todos = listaItens(id, id === 'atividade_vencida' ? 6 : 120);
        if (resp) todos = todos.filter((i) => i.responsavel === RESP.find((x) => String(x.id) === resp)?.nome);
        const ordem = u.searchParams.get('ordem'), dir = u.searchParams.get('dir') === 'desc' ? -1 : 1;
        todos.sort((a, b) => (ordem === 'valor' ? ((a.valor ?? -1) - (b.valor ?? -1)) : String(a[ordem] ?? '').localeCompare(String(b[ordem] ?? ''))) * dir || a.deal_id - b.deal_id);
        return r.fulfill(env({ id, total: todos.length, pagina: pag, por_pagina: pp, responsaveis: RESP,
          criterios: { texto: id === 'atividade_vencida' ? `atividade vencida até ${diaBr(0).split('-').reverse().join('/')} · negócio aberto` : 'sem atividade futura · fechamento até hoje + 7 dias (inclui vencidos) · aberto' },
          itens: todos.slice((pag - 1) * pp, pag * pp).map((i) => ({ ...i, valor: i.valor === null ? null : i.valor.toFixed(2) })) }));
      }
      if (rota === '/agenda') return r.fulfill(env({ estado: 'ok', ultimo_sucesso: agoraIso(), url_agenda: '#/panel-google-calendar', itens: [
        { inicio: new Date(Date.now() + 2 * 3600e3).toISOString(), fim: null, titulo: 'Revisão de proposta com Eduardo Martins', duracao_min: 45, url_evento: 'https://calendar.exemplo.invalid/e1', conflito: true },
        { inicio: new Date(Date.now() + 2.25 * 3600e3).toISOString(), fim: null, titulo: 'Alinhamento comercial', duracao_min: 30, url_evento: 'https://calendar.exemplo.invalid/e2', conflito: true },
        { inicio: new Date(Date.now() + 4 * 3600e3).toISOString(), fim: null, titulo: 'Briefing semanal de mercado LED', duracao_min: 30, url_evento: null, conflito: false }] }));
      if (rota === '/fontes') return r.fulfill(env(fontes(m)));
      return r.fulfill(falha(404));
    });
  };
  return m;
}

(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const nova = async (m, extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, ...(VID && extra.video ? { recordVideo: { dir: VID, size: { width: Math.min(W, 1600), height: Math.round(Math.min(W, 1600) * H / W) } } } : {}), ...(extra.reduzir ? { reducedMotion: 'reduce' } : {}) });
    await m.rotear(ctx);
    await ctx.addInitScript(() => { try { localStorage.removeItem('dshow.geral.v2.periodo'); sessionStorage.clear(); } catch {} });
    const pg = await ctx.newPage(); await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 }); return { ctx, pg };
  };
  const abrir = async (pg, pronto = true) => {
    await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
    await pg.goto(`${B}/#/panel-dashboard`); await pg.reload({ waitUntil: 'domcontentloaded' });
    await pg.waitForSelector('[data-geral-v2="1"] .gv2[data-gv2-vista="geral"]', { timeout: 60000 });
    if (pronto) await pg.waitForFunction(() => !document.querySelector('.gv2 [data-gv2-estado="carregando"]'), null, { timeout: 30000 });
    await pg.waitForTimeout(400);
  };
  const cap = (pg, nome) => pg.screenshot({ path: `${CAP}/geral-v2-${W}-${nome}.png` });
  const fechar = async (ctx, pg, nome) => { const v = VID ? pg.video() : null; await ctx.close(); if (v && nome) fs.renameSync(await v.path(), `${VID}/geral-v2-${W}-${nome}.webm`); };
  const txt = (pg, sel) => pg.textContent(sel).catch(() => '');
  // texto visível < 12 px dentro da V2 (regra do Jhony)
  const pequenos = (pg) => pg.evaluate(() => { const out = []; const w = document.createTreeWalker(document.querySelector('.gv2'), NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.bl-so-leitor, title')) continue; const r = el.getBoundingClientRect(); if (!r.width) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) out.push(`${fs}px:${n.textContent.trim().slice(0, 24)}`); } return [...new Set(out)].slice(0, 8); });

  // ── (1) CARREGANDO → LANÇAMENTO (conectado) + troca de período ──
  { const m = simulador(); m.atraso = 2500; const { ctx, pg } = await nova(m, { video: true }); await abrir(pg, false);
    await pg.waitForSelector('.gv2 [data-gv2-estado="carregando"]', { timeout: 20000 }); await pg.waitForTimeout(400);
    const car = await pg.$$eval('.gv2 [data-gv2-estado="carregando"]', (xs) => xs.map((x) => ({ b: x.dataset.gv2Bloco || x.dataset.gv2Cartao, t: /Carregando…/.test(x.textContent), o: x.querySelectorAll('.ger-osso').length })));
    afirma('CARREGANDO: prioridades, 3 cartões, gráfico, agenda e fontes com "Carregando…" escrito; esqueleto na forma do conteúdo', car.length >= 6 && car.every((c) => c.t) && car.filter((c) => c.o > 0).length >= 5, JSON.stringify(car));
    await cap(pg, '0-carregando');
    await pg.waitForFunction(() => !document.querySelector('.gv2 [data-gv2-estado="carregando"]'), null, { timeout: 30000 }); await pg.waitForTimeout(500);
    const blocos = await pg.$$eval('.gv2 [data-gv2-bloco]', (xs) => xs.map((x) => x.dataset.gv2Bloco));
    afirma('quatro blocos na ordem: Prioridades · Resultado comercial · Pedidos no período + Próximos compromissos · Fontes', JSON.stringify(blocos) === '["prioridades","resultado","grafico","agenda","fontes"]', JSON.stringify(blocos));
    const pr = await pg.$$eval('.gv2 [data-gv2-prio]', (xs) => xs.map((x) => [x.dataset.gv2Prio, x.querySelector('strong').textContent]));
    afirma('prioridades por GRAVIDADE (vencida → sem próxima → conflito), no máximo 3, textos com negócios DISTINTOS', JSON.stringify(pr.map((p) => p[0])) === '["atividade_vencida","sem_proxima_atividade","conflito_agenda"]'
      && /6 negócios abertos com atividade vencida/.test(pr[0][1]) && /120 negociações sem próxima atividade/.test(pr[1][1]) && /1 compromisso com horários conflitantes/.test(pr[2][1]) && /3 ações/.test(await txt(pg, '[data-gv2-bloco="prioridades"]')), JSON.stringify(pr));
    const c = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => [x.dataset.gv2Cartao, x.querySelector('.gv2-num-valor')?.textContent, x.querySelector('.gv2-num-linha')?.textContent]));
    afirma('3 cartões SEPARADOS (nunca somados): Pedidos R$ 284.900 / 17 pedidos + nota de cancelados · Ganhos R$ 351.000 / 9 · Funil R$ 4.830.000 / 86',
      /284\.900/.test(c[0][1]) && /17 pedidos/.test(c[0][2]) && /canceladas/.test(c[0][2]) && /351\.000/.test(c[1][1]) && /9 negócios ganhos/.test(c[1][2]) && /4\.830\.000/.test(c[2][1]) && /86 negócios abertos/.test(c[2][2]), JSON.stringify(c));
    // SOMA PARCIAL (retorno do mockup, 24/11): tão explícita quanto os outros estados
    const sp = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => [x.dataset.gv2Cartao, x.dataset.gv2Estado, x.querySelector('.gv2-selo')?.textContent, x.querySelector('[data-gv2-soma-parcial]')?.textContent || '']));
    afirma('SOMA PARCIAL: Ganhos e Funil com "Dados parciais" escrito + "Soma dos valores informados · X negócios sem valor"; Pedidos sem esse aviso',
      sp[1][1] === 'parcial' && sp[1][2] === 'Dados parciais' && /Soma dos valores informados · 1 negócio sem valor/.test(sp[1][3])
      && sp[2][1] === 'parcial' && sp[2][2] === 'Dados parciais' && /Soma dos valores informados · 5 negócios sem valor/.test(sp[2][3]) && sp[0][3] === '', JSON.stringify(sp));
    // 1440 (retorno do mockup): nomes de fonte e de agenda COMPLETOS; só os secundários encurtados; cartões sem crescer
    const rod = await pg.$$eval('.gv2 [data-gv2-cartao] .gv2-num-rodape .gv2-fraco', (xs) => xs.map((x) => [x.textContent, x.scrollWidth <= x.clientWidth + 1]));
    afirma('rodapés curtos e INTEIROS: "Bling · não é recebimento" · "Pipedrive · data do ganho" · "Pipedrive · funil atual"',
      JSON.stringify(rod.map((r) => r[0])) === '["Bling · não é recebimento","Pipedrive · data do ganho","Pipedrive · funil atual"]' && rod.every((r) => r[1]), JSON.stringify(rod));
    const tit = await pg.$$eval('.gv2-evento-txt strong', (xs) => xs.map((x) => [x.textContent, x.scrollWidth <= x.clientWidth + 1]));
    afirma('agenda: títulos dos compromissos inteiros (com o nome do consultor), sem reticências', tit.length === 3 && tit.every((t) => t[1]) && /Eduardo Martins/.test(tit[0][0]), JSON.stringify(tit));
    const fon = await pg.$$eval('[data-gv2-fonte] strong', (xs) => xs.map((x) => x.textContent));
    afirma('linha de fontes com o nome completo "Google Calendar"', fon.includes('Google Calendar') && !fon.includes('Calendar'), JSON.stringify(fon));
    const alts = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
    afirma('os 3 cartões com a MESMA altura (o aviso de soma parcial não aumenta o cartão)', Math.max(...alts) - Math.min(...alts) <= 1, JSON.stringify(alts));
    const g = await txt(pg, '[data-gv2-bloco="grafico"]'); const barras = await pg.$$eval('.gv2-barra', (xs) => xs.length);
    afirma('gráfico: 7 barras (dias completos) e "soma igual ao cartão acima"', barras === 7 && /Valor total: R\$\s?284\.900 · soma igual ao cartão acima/.test(g), `${barras} · ${g.slice(-120)}`);
    const svg = await pg.$eval('.gv2-barras', (x) => ({ w: Math.round(x.getBoundingClientRect().width), a: Number(x.getAttribute('width')), fs: Math.round(x.querySelector('text').getBoundingClientRect().height) }));
    afirma('gráfico desenhado na largura real (sem escalar): rótulos com 12 px de verdade', Math.abs(svg.w - svg.a) <= 1 && svg.fs >= 12 && svg.fs <= 18, JSON.stringify(svg));
    const cortes = await pg.evaluate(() => [...document.querySelectorAll('.gv2 .gv2-link, .gv2 .gv2-btn, .gv2 .gv2-selo')].filter((e) => { const r = e.getBoundingClientRect(); const c = e.closest('.gv2-cartao')?.getBoundingClientRect(); return r.width && c && (r.right > c.right + 1 || r.left < c.left - 1); }).map((e) => e.textContent.trim()));
    afirma('nenhum link, botão ou selo saindo do cartão', cortes.length === 0, JSON.stringify(cortes));
    const setas = await pg.$$eval('.gv2 .gv2-link svg', (xs) => xs.filter((x) => x.getBoundingClientRect().width < 10).length);
    afirma('todas as setas dos links inteiras (nenhum ícone espremido)', setas === 0, String(setas));
    afirma('sem o texto "Comparação: período anterior"', !/Compara[çc][ãa]o/i.test(await txt(pg, '.gv2')));
    const peq = await pequenos(pg); afirma('nenhum texto abaixo de 12 px na Geral V2', peq.length === 0, JSON.stringify(peq));
    const ag = await pg.$$eval('.gv2-evento', (xs) => xs.map((x) => x.dataset.gv2Conflito));
    afirma('Próximos compromissos: 3 eventos de hoje, os 2 conflitantes marcados com "Conflito de horário" escrito', JSON.stringify(ag) === '["1","1","0"]' && (await pg.$$('.gv2-evento .gv2-selo--erro')).length === 2);
    const fo = await txt(pg, '[data-gv2-bloco="fontes"]');
    afirma('Fontes e atualização: Pipedrive/Bling/Calendar "Atualizado às HH:MM"; Asaas, Mercado Livre e Loja Integrada "Aguardando conexão"', (fo.match(/Atualizado às \d\d:\d\d/g) || []).length === 3 && (fo.match(/Aguardando conexão/g) || []).length === 3, fo);
    const nan = /NaN|undefined|null|Invalid/.test(await txt(pg, '.gv2')); afirma('nenhum "NaN/undefined/null" na tela', !nan);
    await cap(pg, '1-lancamento');
    const p0 = m.calls['/prioridades'];
    await pg.click('.gv2-periodo:has-text("Ontem")'); await pg.waitForFunction(() => /ontem, dia completo/.test(document.querySelector('[data-gv2-bloco="resultado"]')?.textContent || ''), null, { timeout: 15000 }); await pg.waitForTimeout(400);
    const ontem = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => [x.dataset.gv2Estado, x.querySelector('.gv2-num-valor')?.textContent]));
    afirma('período "Ontem": pedidos e ganhos ZERO REAL (escrito "Zero real", R$ 0 confirmado); funil igual (fotografia); prioridades NÃO recarregam',
      ontem[0][0] === 'zero' && /Zero real/.test(await txt(pg, '[data-gv2-cartao="pedidos"]')) && ontem[1][0] === 'zero' && /4\.830\.000/.test(ontem[2][1]) && m.calls['/prioridades'] === p0, JSON.stringify({ ontem, p: [p0, m.calls['/prioridades']] }));
    await cap(pg, '1b-periodo-ontem');
    await pg.click('.gv2-periodo:has-text("Mês até ontem")'); await pg.waitForFunction(() => document.querySelectorAll('[data-gv2-dia]').length > 7, null, { timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(400);
    const mes = { g: (await txt(pg, '[data-gv2-bloco="grafico"]')).slice(-140), n: await pg.$$eval('[data-gv2-dia]', (xs) => xs.length), esperado: Number(new Date(Date.now() - 3 * 3600e3).toISOString().slice(8, 10)) - 1 };
    afirma('"Mês até ontem": gráfico com os dias completos do mês (barras = dias) e soma igual ao cartão', /soma igual ao cartão acima/.test(mes.g) && mes.n === 22, JSON.stringify(mes));
    await fechar(ctx, pg, 'video-1-carregando-lancamento-periodo'); }

  // ── (2) LISTA: 6 → 6, linha 36 px, nova aba, filtros preservados; paginação de 50 com total real ──
  { const m = simulador(); const { ctx, pg } = await nova(m, { video: true }); await abrir(pg);
    await pg.click('[data-gv2-prio="atividade_vencida"] .gv2-link'); await pg.waitForSelector('[data-gv2-lista="atividade_vencida"] .at-td__tabela tbody tr', { timeout: 20000 }); await pg.waitForTimeout(400);
    const linhas = await pg.$$eval('.gv2-tabela-raiz tbody tr', (xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
    const tot = await txt(pg, '[data-gv2-total]'); const rod = await txt(pg, '[data-gv2-conferencia]');
    afirma('clicar "Ver 6 negócios" → lista com EXATAMENTE 6 negócios, "6 negócios encontrados" e "= número da prioridade na Geral"', linhas.length === 6 && /6 negócios encontrados/.test(tot) && /= número da prioridade na Geral/.test(rod), JSON.stringify({ n: linhas.length, tot, rod }));
    afirma('linhas de 36 px, numa linha só (TabelaDados da casa)', linhas.every((h) => h === 36 || h === 37), JSON.stringify(linhas));
    const umaLinha = await pg.$$eval('.gv2-tabela-raiz tbody td', (xs) => xs.every((td) => getComputedStyle(td).whiteSpace === 'nowrap'));
    afirma('células com reticências (uma linha, sem quebra)', umaLinha);
    const a = await pg.$eval('.gv2-tabela-raiz tbody tr:first-child a', (x) => ({ t: x.target, h: x.href, r: x.rel }));
    afirma('"Abrir negócio" abre o Pipedrive em NOVA aba (target _blank, noopener) — sem página de negócio no Dash', a.t === '_blank' && /pipedrive/.test(a.h) && /noopener/.test(a.r), JSON.stringify(a));
    const peq = await pequenos(pg); afirma('lista: nenhum texto abaixo de 12 px (cabeçalho da TabelaDados ajustado para 12 px)', peq.length === 0, JSON.stringify(peq));
    await cap(pg, '2-lista');
    await pg.selectOption('.gv2-filtros select', '11'); await pg.waitForTimeout(900);
    afirma('filtro de responsável vai ao serviço (responsavel=11) e o total é o real do filtro', m.ultimaLista?.responsavel === '11' && /3 negócios encontrados/.test(await txt(pg, '[data-gv2-total]')), JSON.stringify(m.ultimaLista));
    await pg.click('.gv2-trilha .gv2-link:has-text("Geral")'); await pg.waitForSelector('.gv2[data-gv2-vista="geral"]'); await pg.waitForTimeout(500);
    await pg.click('[data-gv2-prio="atividade_vencida"] .gv2-link'); await pg.waitForSelector('[data-gv2-lista="atividade_vencida"] tbody tr', { timeout: 15000 }); await pg.waitForTimeout(500);
    afirma('voltar à Geral e abrir de novo: o filtro de responsável foi PRESERVADO', (await pg.$eval('.gv2-filtros select', (x) => x.value)) === '11' && m.ultimaLista?.responsavel === '11');
    await pg.click('.gv2-trilha .gv2-link:has-text("Geral")'); await pg.waitForSelector('.gv2[data-gv2-vista="geral"]'); await pg.waitForTimeout(400);
    await pg.click('[data-gv2-prio="sem_proxima_atividade"] .gv2-link'); await pg.waitForSelector('[data-gv2-lista="sem_proxima_atividade"] tbody tr', { timeout: 15000 }); await pg.waitForTimeout(500);
    const p1 = await pg.$$eval('.gv2-tabela-raiz tbody tr', (xs) => xs.length);
    afirma('paginação: 120 negócios → página 1 com 50, total real "120 negócios encontrados"', p1 === 50 && /120 negócios encontrados/.test(await txt(pg, '[data-gv2-total]')) && /página 1 de 3/.test(await txt(pg, '[data-gv2-conferencia]')), String(p1));
    await pg.click('.gv2-paginas button:has-text("Próxima")'); await pg.waitForTimeout(800);
    afirma('"Próxima" pede a página 2 ao serviço e mostra "página 2 de 3"', m.ultimaLista?.pagina === '2' && /página 2 de 3/.test(await txt(pg, '[data-gv2-conferencia]')));
    afirma('negócio sem valor aparece como "Sem valor", nunca R$ 0', !/R\$\s?0(?![\d.,])/.test(await txt(pg, '.gv2-tabela-raiz')));
    await cap(pg, '2b-lista-paginada');
    await fechar(ctx, pg, 'video-2-prioridade-para-lista'); }

  // ── (3) ESTADOS: zero real · desatualizado · aguardando · sem pendências ──
  { const m = simulador(); m.estados = true; m.semPendencias = true; const { ctx, pg } = await nova(m); await abrir(pg);
    const e = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => [x.dataset.gv2Estado, x.querySelector('.gv2-selo')?.textContent, x.querySelector('.gv2-num-valor')?.textContent, x.querySelector('.gv2-num-linha')?.textContent]));
    afirma('COERÊNCIA: zero com o Bling DESATUALIZADO não é "Zero real" → "Desatualizado", "—" e "Zero não confirmado · Bling desatualizado"', e[0][0] === 'desatualizado' && e[0][1] === 'Desatualizado' && e[0][2] === '—' && /Zero não confirmado · Bling desatualizado/.test(e[0][3]), JSON.stringify(e[0]));
    afirma('DESATUALIZADO: último valor válido preservado com o horário', e[1][0] === 'desatualizado' && e[1][1] === 'Desatualizado' && /351\.000/.test(e[1][2]) && /Último valor válido preservado/.test(e[1][3]), JSON.stringify(e[1]));
    afirma('AGUARDANDO CONEXÃO: "—" e "nenhum número assumido" (nunca zero)', e[2][0] === 'aguardando' && e[2][1] === 'Aguardando conexão' && e[2][2] === '—' && /nenhum número assumido/.test(e[2][3]), JSON.stringify(e[2]));
    afirma('gráfico: zero NÃO confirmado escrito ("Nenhum zero assumido"), sem "Zero pedidos lançados" e sem barras', !!(await pg.$('[data-gv2-zero-nao-confirmado]')) && !(await pg.$('[data-gv2-zero]')) && (await pg.$$('.gv2-barras')).length === 0);
    const gr = await txt(pg, '[data-gv2-bloco="grafico"]');
    afirma('gráfico: sem o selo "0 pedidos" quando o zero não foi confirmado, e "Desatualizado" escrito uma vez só', !/0 pedidos/.test(gr) && (gr.match(/Desatualizado/g) || []).length === 1, gr.slice(0, 200));
    const ln = await pg.$eval('[data-gv2-cartao="pedidos"] .gv2-num-linha', (x) => Math.round(x.getBoundingClientRect().height / parseFloat(getComputedStyle(x).lineHeight || '18')));
    afirma('cartão do Bling: o aviso do zero não confirmado cabe numa linha', ln <= 1, String(ln));
    const sp = await txt(pg, '[data-gv2-bloco="prioridades"]'); const alt = await pg.$eval('[data-gv2-bloco="prioridades"]', (x) => x.getBoundingClientRect().height);
    afirma('SEM PENDÊNCIAS: bloco compacto de uma linha', /Sem pendências/.test(sp) && alt < 90, `${alt} · ${sp}`);
    const fl = await txt(pg, '[data-gv2-bloco="fontes"]');
    afirma('fonte desatualizada escrita na linha de fontes (Bling "Desatualizado")', /Bling\s*Desatualizado/.test(fl), fl);
    afirma('COERÊNCIA: com "Negócios ganhos" desatualizado, o Pipedrive NÃO diz "Atualizado" → "Desatualizado · Negócios ganhos"', /Pipedrive\s*Desatualizado · Negócios ganhos/.test(fl) && !/Pipedrive\s*Atualizado/.test(fl), fl);
    await cap(pg, '3-estados');
    await pg.click('[data-gv2-bloco="fontes"] .gv2-link'); await pg.waitForTimeout(300);
    afirma('"Detalhes" das fontes mostra o motivo de cada uma (ex.: Asaas em auditoria)', /Asaas em auditoria/.test(await txt(pg, '.gv2-fontes-det')));
    await ctx.close(); }

  // ── (3c) ZERO com o Pipedrive DESATUALIZADO: prioridades não viram "Sem pendências" ──
  { const m = simulador(); m.semPendencias = true; m.pipeVelho = true; const { ctx, pg } = await nova(m); await abrir(pg);
    const t = await txt(pg, '[data-gv2-bloco="prioridades"]');
    afirma('COERÊNCIA: prioridades "zero" com o Pipedrive desatualizado → "Não foi possível confirmar" + "Desatualizado", nunca "Sem pendências"', /Não foi possível confirmar: negócios com atividade vencida/.test(t) && /Desatualizado/.test(t) && !/Sem pendências/.test(t), t.slice(0, 260));
    const c = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => [x.dataset.gv2Cartao, x.dataset.gv2Estado, x.querySelector('.gv2-num-valor')?.textContent]));
    afirma('COERÊNCIA: ganhos e funil com o Pipedrive desatualizado → "Desatualizado" com o último valor válido (não "ok")', c[1][1] === 'desatualizado' && /351\.000/.test(c[1][2]) && c[2][1] === 'desatualizado', JSON.stringify(c));
    await cap(pg, '3c-pipedrive-desatualizado');
    await ctx.close(); }

  // ── (3b) CONTRAPROVA: quantidade desconhecida (null) com estado "ok" NUNCA some nem vira "Sem pendências" ──
  { const m = simulador(); m.semPendencias = true; m.prioNula = true; const { ctx, pg } = await nova(m); await abrir(pg);
    const t = await txt(pg, '[data-gv2-bloco="prioridades"]');
    afirma('contraprova: prioridade com contagem desconhecida aparece ("Não foi possível contar", selo "Dados parciais"), nunca "Sem pendências"', /Não foi possível contar: negócios com atividade vencida/.test(t) && /Dados parciais/.test(t) && !/Sem pendências/.test(t), t.slice(0, 200));
    await ctx.close(); }

  // ── (4) COM PROBLEMA → TENTAR DE NOVO (falha nunca vira zero) ──
  { const m = simulador(); m.falhaResumo = true; m.falhaPrio = true; const { ctx, pg } = await nova(m, { video: true }); await abrir(pg);
    const cards = await pg.$$eval('.gv2 [data-gv2-cartao]', (xs) => xs.map((x) => [x.dataset.gv2Estado, x.textContent]));
    afirma('resumo fora: os 3 cartões "Com problema" + Tentar de novo, sem número (nenhum R$ 0)', cards.every(([s, t]) => s === 'erro' && /Com problema/.test(t) && /Tentar de novo/.test(t) && !/R\$/.test(t)), JSON.stringify(cards.map((c) => c[0])));
    afirma('prioridades fora: "Não foi possível verificar as prioridades agora." (nunca "Sem pendências")', /Não foi possível verificar as prioridades agora/.test(await txt(pg, '[data-gv2-bloco="prioridades"]')) && !/Sem pendências/.test(await txt(pg, '[data-gv2-bloco="prioridades"]')));
    const altP = await pg.$eval('[data-gv2-bloco="grafico"] .gv2-problema', (x) => Math.round(x.getBoundingClientRect().height));
    afirma('o quadro "Com problema" do gráfico não estica (altura de conteúdo)', altP < 120, String(altP));
    afirma('gráfico fora: problema escrito, sem barras', (await pg.$$('.gv2-barra')).length === 0 && /Não foi possível ler os pedidos/.test(await txt(pg, '[data-gv2-bloco="grafico"]')));
    await cap(pg, '4-com-problema');
    m.falhaResumo = false; m.atraso = 1200;
    await pg.click('[data-gv2-cartao="pedidos"] button:has-text("Tentar de novo")'); await pg.waitForTimeout(400);
    afirma('"Tentar de novo" mostra "Tentando…" enquanto busca', /Tentando…/.test(await txt(pg, '[data-gv2-bloco="resultado"]')));
    await pg.waitForFunction(() => document.querySelector('[data-gv2-cartao="pedidos"]')?.dataset.gv2Estado === 'ok', null, { timeout: 15000 }); await pg.waitForTimeout(400);
    afirma('recuperado: cartões voltam com os números', /284\.900/.test(await txt(pg, '[data-gv2-cartao="pedidos"]')));
    m.falhaPrio = false; await pg.click('[data-gv2-bloco="prioridades"] button:has-text("Tentar de novo")');
    await pg.waitForSelector('[data-gv2-prio="atividade_vencida"]', { timeout: 15000 }); await pg.waitForTimeout(400);
    afirma('prioridades recuperadas pelo "Tentar de novo"', (await pg.$$('[data-gv2-prio]')).length === 3);
    await cap(pg, '4b-recuperado');
    // falha DEPOIS de sucesso: o último valor fica, com aviso
    m.falhaResumo = true; m.atraso = 0; await pg.click('.gv2-periodo:has-text("Mês até ontem")'); await pg.waitForTimeout(1200);
    afirma('falha depois de um sucesso: aviso "a atualização falhou" e os cartões mantêm a última leitura válida', /A atualização falhou/.test(await txt(pg, '[data-gv2-bloco="resultado"]')) && /284\.900/.test(await txt(pg, '[data-gv2-cartao="pedidos"]')));
    await fechar(ctx, pg, 'video-3-com-problema-tentar-de-novo'); }

  // ── (4b) PÁGINA INICIAL: a estrutura antiga "Principal" não publica — o início também é a Geral V2 ──
  { const m = simulador(); const { ctx, pg } = await nova(m); await pg.goto(`${B}/`, { waitUntil: 'networkidle', timeout: 60000 });
    const v2 = await pg.waitForSelector('[data-geral-v2="1"] .gv2', { timeout: 30000 }).then(() => true).catch(() => false);
    const antigo = await pg.evaluate(() => !!document.querySelector('.ger-hero, [data-ger-sec="clima"], .react-grid-layout'));
    afirma('página inicial = Geral V2 (sem "Principal": clima, saudação e grade de módulos)', v2 && !antigo, JSON.stringify({ v2, antigo }));
    await ctx.close(); }

  // ── (5) REDUZIR MOVIMENTO ──
  { const m = simulador(); m.atraso = 2500; const { ctx, pg } = await nova(m, { reduzir: true }); await abrir(pg, false);
    await pg.waitForSelector('.gv2 [data-gv2-estado="carregando"]', { timeout: 20000 });
    const anim = await pg.evaluate(() => [...document.querySelectorAll('.gv2 .ger-osso, .gv2 .ger-entra')].map((x) => getComputedStyle(x).animationName).filter((n) => n !== 'none'));
    afirma('"reduzir movimento": nada anima (esqueleto parado), estado continua escrito', anim.length === 0 && /Carregando…/.test(await txt(pg, '.gv2')), JSON.stringify(anim));
    await ctx.close(); }

  console.log(`GERAL V2 · LANÇAMENTO (${W}x${H}): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, (e.stack || '').split('\n')[1]); process.exit(2); });
