// GERAL V2 · parecer do mockup R3 (CIMA, 25/11). SÓ RESPOSTAS CRUAS do serviço 674fa53e (ACIMA_ESQUERDA): cada /painel.php e cada
// /prioridades/lista.php responde com os BYTES de um arquivo de respostas-674fa53e/. Variações (só em verificações SEM captura) são
// marcadas "VARIANTE" e partem dos bytes crus com UM campo trocado.
// Itens: (1) coerência topo × fontes em 3f/3g; (2) carregando com a resposta SEGURADA de propósito (inicial e troca de período);
// (3) rodapé "sem responsável" = só a contagem do serviço.
// Uso: W=2200 H=1470 TEMA=claro|escuro PORTA=8112 node capturas-geral-r4.cjs   (cwd = pasta de saída)
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const fs = require('fs'); const path = require('path');
const R = '/srv/dshow-modularizacao/app/20261124-geral-v2-indicador/respostas-674fa53e';   // serviço 674fa53e (ACIMA_ESQUERDA, 25/11 09:2x): cenario-7-r3 = casos do parecer R3
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470);
const TEMA = process.env.TEMA === 'escuro' ? 'dark' : 'light'; const NT = process.env.TEMA || 'claro';
const CAP = `capturas-${NT}-${W}`; fs.mkdirSync(CAP, { recursive: true });
const SEM_CAPTURA = process.env.SEM_CAPTURA === '1';
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + String(typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 320) : '')); } };
const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
const cru = (rel) => fs.readFileSync(path.join(R, rel));
const json = (rel) => JSON.parse(cru(rel));

// Coerência da MASSA (antes de qualquer tela): lista completa numa página ⇒ sem_responsavel = itens sem responsável.
// É o que teria barrado o "1 sem responsável" do simulador do R2 (6 negócios, todos com responsável).
function massaCoerente(lista) {
  const d = lista.data ?? lista; if (typeof d.sem_responsavel !== 'number' || !Array.isArray(d.itens)) return true;
  if (d.total === null || d.total > d.itens.length) return true;   // lista paginada: não dá para contar daqui
  return d.sem_responsavel === d.itens.filter((i) => !i.responsavel).length;
}
// Coerência topo × fontes: toda fonte que a VERIFICAÇÃO das prioridades dá como não-ok não pode aparecer "Atualizado" na linha de fontes.
function painelCoerente(p) {
  const d = p.data ?? p; const v = d.prioridades?.verificacao; if (!v || !Array.isArray(v.fontes)) return true;
  return v.fontes.filter((f) => f.estado !== 'ok').every((f) => { const linha = d.fontes.find((x) => x.fonte === f.fonte); return linha && linha.rotulo_estado !== 'Atualizado' && linha.estado !== 'conectada'; });
}

(async () => {
  // ── 0 · a MASSA usada nas capturas é coerente (e a montagem do R2 seria reprovada) ──
  const listasCruas = ['cenario-1-normal', 'cenario-7-r3'].flatMap((c) => fs.readdirSync(path.join(R, c)).filter((f) => /^lista-/.test(f)).map((f) => `${c}/${f}`));
  // lista em 2 páginas: soma os itens sem responsável das páginas
  const v1 = json('cenario-7-r3/lista-atividade_vencida-p1.json').data, v2 = json('cenario-7-r3/lista-atividade_vencida-p2.json').data;
  afirma('MASSA · cenário 7: sem_responsavel (1) = itens sem responsável nas 2 páginas da lista', v1.sem_responsavel === 1 && v2.sem_responsavel === 1 && [...v1.itens, ...v2.itens].filter((i) => !i.responsavel).length === 1 && v1.itens.length + v2.itens.length === v1.total, { p1: v1.sem_responsavel, p2: v2.sem_responsavel });
  afirma('MASSA · listas cruas dos cenários 1 e 7: sem_responsavel confere com os itens (quando a lista cabe numa página)', listasCruas.every((f) => massaCoerente(json(f))), listasCruas.filter((f) => !massaCoerente(json(f))));
  const r2Lista = { total: 6, sem_responsavel: 1, itens: ['Eduardo', 'Bruno', 'Eduardo', 'Diogo', 'Bruno', 'Eduardo'].map((responsavel) => ({ responsavel })) };
  afirma('MASSA · CONTRAPROVA: a lista montada no simulador do R2 ("1 sem responsável" com 6 de 6 com responsável) é REPROVADA', !massaCoerente(r2Lista));
  for (const f of ['cenario-7-r3/3f-verificacao-parcial-painel-7d.json', 'cenario-7-r3/3g-nao-verificada-painel-7d.json', 'cenario-6-casos-cima/3a-pipedrive-fora-painel-7d.json'])
    afirma(`MASSA · ${f.split('/')[1].split('-painel')[0]}: fonte não-ok na verificação nunca "Atualizado" na linha de fontes (resposta crua)`, painelCoerente(json(f)));
  const r2_3g = json('cenario-7-r3/3g-nao-verificada-painel-7d.json');
  r2_3g.data.fontes = r2_3g.data.fontes.map((x) => (x.fonte === 'pipedrive' || x.fonte === 'calendar' ? { ...x, estado: 'conectada', rotulo_estado: 'Atualizado', afetado: [], motivo: null } : x));
  afirma('MASSA · CONTRAPROVA: a combinação do R2 em 3g (topo "Pipedrive com problema" + fontes "Atualizado") é REPROVADA', !painelCoerente(r2_3g));

  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  // cada contexto: painel por período (arquivo cru), lista por id/página (arquivo cru), e um PORTÃO que segura o /painel.php de propósito
  const nova = async (cfg) => {
    const ctx = await b.newContext({ colorScheme: TEMA, viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const st = { chamadas: [], segurar: false, soltar: null, lista: cfg.lista || {} };
    await ctx.route('**/api/geral/v2/**', async (r) => {
      const u = new URL(r.request().url()); const rota = u.pathname.replace('/api/geral/v2/', ''); st.chamadas.push(rota + u.search);
      if (rota === 'painel.php') {
        if (st.segurar) await new Promise((res) => { st.soltar = res; });
        const arq = cfg.painel[u.searchParams.get('periodo')]; if (!arq) return r.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false,"data":null,"error":"SEM_ARQUIVO_CRU"}' });
        return r.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: Buffer.isBuffer(arq) ? arq : cru(arq) });
      }
      if (rota === 'prioridades/lista.php') {
        const k = `${u.searchParams.get('id')}-p${u.searchParams.get('pagina')}`; const arq = st.lista[k] ?? `cenario-1-normal/lista-${k}.json`;
        return r.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: Buffer.isBuffer(arq) ? arq : cru(arq) });
      }
      return r.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false,"data":null,"error":"NOT_FOUND"}' });
    });
    await ctx.addInitScript(() => { try { localStorage.removeItem('dshow.geral.v2.periodo'); sessionStorage.clear(); } catch {} });
    const pg = await ctx.newPage(); await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
    if ((await pg.evaluate(() => document.documentElement.getAttribute('data-theme'))) !== TEMA) { await pg.click('[data-dsd-theme-toggle]').catch(() => {}); await pg.waitForTimeout(600); }
    return { ctx, pg, st };
  };
  const abrir = async (pg, pronto = true) => {
    await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
    await pg.goto(`${B}/#/panel-dashboard`); await pg.reload({ waitUntil: 'domcontentloaded' });
    await pg.waitForSelector('[data-geral-v2="1"] .gv2[data-gv2-vista="geral"]', { timeout: 60000 });
    if ((await pg.evaluate(() => document.documentElement.getAttribute('data-theme'))) !== TEMA) { await pg.click('[data-dsd-theme-toggle]').catch(() => {}); await pg.waitForTimeout(600); }
    if (pronto) { await pg.waitForFunction(() => !document.querySelector('.gv2 [data-gv2-estado="carregando"]'), null, { timeout: 30000 }); await pg.waitForTimeout(500); }
  };
  const esperarSegurado = async (st) => { for (let i = 0; i < 200 && !st.soltar; i++) await new Promise((r) => setTimeout(r, 50)); return !!st.soltar; };
  const cap = async (pg, nome, sel) => {
    await pg.waitForFunction(() => document.getAnimations().filter((a) => a.playState === 'running' && !(a.effect?.target?.classList?.contains('ger-osso'))).length === 0, null, { timeout: 6000 }).catch(() => {}); await pg.waitForTimeout(300);
    if (sel) { const el = await pg.$(sel); if (el) await el.scrollIntoViewIfNeeded(); await pg.waitForTimeout(200); }
    const t = await pg.evaluate(() => document.documentElement.getAttribute('data-theme')); afirma(`captura ${nome} no tema pedido (${TEMA})`, t === TEMA, String(t));
    if (!SEM_CAPTURA) await pg.screenshot({ path: `${CAP}/geral-${W}-${NT}-${nome}.png` });
  };
  const txt = (pg, sel) => pg.textContent(sel).then(norm).catch(() => '');
  // valores apresentados como atuais: R$, número de cartão, barras, "Atualizado às"
  const valoresNaTela = (pg, sel = '.gv2') => pg.evaluate((s) => { const raiz = document.querySelector(s); if (!raiz) return null;
    return { rs: /R\$/.test(raiz.innerText), numCartao: [...raiz.querySelectorAll('.gv2-num-valor')].map((x) => x.textContent.trim()).filter((t) => /\d/.test(t)),
      barras: raiz.querySelectorAll('.gv2-barra').length, atualizado: /Atualizado/.test(raiz.innerText), prio: raiz.querySelectorAll('[data-gv2-prio]').length,
      carregando: raiz.querySelectorAll('[data-gv2-estado="carregando"]').length + (raiz.dataset.gv2Estado === 'carregando' ? 1 : 0), textoCarregando: /Carregando/.test(raiz.innerText) }; }, sel);

  try {
    // ── 2a · CARREGANDO (1ª leitura): o /painel.php fica SEGURADO até depois da captura ──
    { const { ctx, pg, st } = await nova({ painel: { '7d': 'cenario-1-normal/painel-7d.json', ontem: 'cenario-3-zero-real/painel-ontem.json' } }); st.segurar = true; await abrir(pg, false);
      afirma('2a · a resposta do /painel.php está SEGURADA durante a captura', await esperarSegurado(st));
      await pg.waitForSelector('.gv2 [data-gv2-estado="carregando"]', { timeout: 20000 }); await cap(pg, '0-carregando');
      const v = await valoresNaTela(pg);
      afirma('2a · carregando: indicador visível ("Carregando…" e blocos em carregamento) e NENHUM valor como atual (sem R$, sem número nos cartões, sem barras, sem prioridades, sem "Atualizado")',
        v && v.textoCarregando && v.carregando >= 5 && !v.rs && v.numCartao.length === 0 && v.barras === 0 && v.prio === 0 && !v.atualizado, v);
      st.soltar(); st.segurar = false; await pg.waitForFunction(() => !document.querySelector('.gv2 [data-gv2-estado="carregando"]'), null, { timeout: 30000 }); await pg.waitForTimeout(400);
      const d = await valoresNaTela(pg);
      afirma('2a · solta a resposta crua: a tela se preenche (R$ nos cartões, prioridades, "Atualizado" nas fontes)', d.rs && d.numCartao.length >= 1 && d.prio >= 1 && d.atualizado, d);

      // ── 2b · TROCA DE PERÍODO segurada: 7d → Ontem (cenário 3, cru). Os números do 7d NÃO podem ficar como se fossem de ontem ──
      st.segurar = true; st.soltar = null;
      await pg.click('.gv2-periodo:has-text("Ontem")'); afirma('2b · a resposta do período novo está SEGURADA', await esperarSegurado(st)); await pg.waitForTimeout(300);
      const r = await valoresNaTela(pg, '[data-gv2-bloco="resultado"]'); const g = await valoresNaTela(pg, '[data-gv2-bloco="grafico"]'); const cab = await txt(pg, '[data-gv2-bloco="resultado"] .gv2-sec-cab');
      afirma('2b · troca de período: resultado e gráfico em carregamento ("Carregando o período…"), sem nenhum valor do período anterior (sem R$, sem número, sem barras)',
        /Carregando o período…/.test(cab) && !r.rs && r.numCartao.length === 0 && g.barras === 0 && !g.rs && g.carregando >= 1, { cab, r, g });
      afirma('2b · prioridades (não dependem do período) seguem na tela, sem esqueleto', (await pg.$$('[data-gv2-prio]')).length >= 1);
      await cap(pg, '0b-troca-periodo-carregando', '[data-gv2-bloco="resultado"]');
      st.soltar(); st.segurar = false; await pg.waitForFunction(() => /ontem/i.test(document.querySelector('[data-gv2-bloco="resultado"] .gv2-sec-cab')?.textContent || '') && !document.querySelector('[data-gv2-bloco="resultado"] [data-gv2-estado="carregando"]'), null, { timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(400);
      const depois = await txt(pg, '[data-gv2-bloco="resultado"]');
      afirma('2b · solta: o resultado mostra o período "Ontem" da resposta crua (zero real)', /ontem/i.test(depois) && /Zero real/.test(depois), depois.slice(0, 200));
      await ctx.close(); }

    // ── 1 · COERÊNCIA topo × fontes, só com respostas cruas ──
    const verCoerencia = async (pg, rotulo) => {
      const p = await txt(pg, '[data-gv2-bloco="prioridades"]');
      const fontes = await pg.$$eval('[data-gv2-fonte]', (xs) => xs.map((x) => ({ id: x.dataset.gv2Fonte, est: x.dataset.gv2FonteEstado, t: x.textContent.replace(/\s+/g, ' ').trim() })));
      return { p, fontes };
    };
    for (const [nome, arq, conferir] of [
      ['3f-verificacao-parcial', '3f-verificacao-parcial-painel-7d.json', ({ p, fontes }) => {
        const cal = fontes.find((f) => f.id === 'calendar'), pip = fontes.find((f) => f.id === 'pipedrive');
        afirma('1 · 3f (cru 674fa53e): topo "Verificação parcial · Google Calendar"', /Verificação parcial · Google Calendar/.test(p) && !/Sem pendências/.test(p), p.slice(0, 200));
        afirma('1 · 3f: fonte Google Calendar = o texto do serviço "Dados parciais (agenda de hoje, prioridades)", nunca "Atualizado"', cal && /Dados parciais \(agenda de hoje, prioridades\)/.test(cal.t) && !/Atualizado/.test(cal.t), cal);
        afirma('1 · 3f: Pipedrive "Atualizado" (a verificação o dá como ok)', pip && /Atualizado/.test(pip.t) && !/\(/.test(pip.t), pip); }],
      ['3g-nao-verificada', '3g-nao-verificada-painel-7d.json', ({ p, fontes }) => {
        const pip = fontes.find((f) => f.id === 'pipedrive'), cal = fontes.find((f) => f.id === 'calendar');
        afirma('1 · 3g (cru 674fa53e): topo "Prioridades não verificadas · Pipedrive com problema, Google Calendar aguardando conexão"', /Prioridades não verificadas · Pipedrive com problema, Google Calendar aguardando conexão/.test(p), p.slice(0, 220));
        afirma('1 · 3g: na linha de fontes, Pipedrive "Com problema (ganhos, funil, prioridades)" ("prioridades" uma vez só)', pip && /Com problema \(ganhos, funil, prioridades\)/.test(pip.t) && (pip.t.match(/prioridades/g) || []).length === 1, pip);
        afirma('1 · 3g: Google Calendar "Aguardando conexão"; NENHUMA das duas fontes do topo diz "Atualizado"', cal && /Aguardando conexão/.test(cal.t) && !/Atualizado/.test(pip.t + cal.t), cal); }],
    ]) {
      const { ctx, pg, st } = await nova({ painel: { '7d': `cenario-7-r3/${arq}` } }); await abrir(pg);
      conferir(await verCoerencia(pg));
      if (nome.startsWith('3g')) { const sel = await pg.$$eval('[data-gv2-bloco="prioridades"] .gv2-selo', (xs) => xs.map((x) => x.textContent.trim()));
        afirma('1 · 3g: prioridades SEM contagem (null) → nenhum selo "0 ações" (ausência nunca vira zero)', !sel.some((t) => /\bações?\b/.test(t) && /^\d/.test(t)), sel); }
      afirma(`1 · ${nome}: leitura única, só /painel.php`, st.chamadas.length > 0 && st.chamadas.every((c) => c.startsWith('painel.php')), st.chamadas);
      await cap(pg, `${nome}-topo`); await cap(pg, `${nome}-fontes`, '[data-gv2-bloco="fontes"]');   // topo e fontes: em 1440 não cabem juntos
      await ctx.close();
    }

    // ── 3 · RODAPÉ DA LISTA: só a contagem do serviço (674fa53e, cenário 7), com o mesmo filtro da lista ──
    // A Geral para navegar é o painel cru do cenário 1 (o cenário 7 não traz painel com prioridades): 63 lá × 64 na lista → o aviso da tela.
    const L7 = { 'atividade_vencida-p1': 'cenario-7-r3/lista-atividade_vencida-p1.json', 'atividade_vencida-p2': 'cenario-7-r3/lista-atividade_vencida-p2.json', 'sem_proxima_atividade-p1': 'cenario-7-r3/lista-sem_proxima_atividade-p1.json' };
    { const { ctx, pg, st } = await nova({ painel: { '7d': 'cenario-1-normal/painel-7d.json' }, lista: { ...L7 } }); await abrir(pg);
      await pg.click('[data-gv2-prio="atividade_vencida"] .gv2-link'); await pg.waitForSelector('[data-gv2-lista="atividade_vencida"] tbody tr', { timeout: 20000 }); await pg.waitForTimeout(500);
      let rod = await txt(pg, '[data-gv2-conferencia]'); const n = await pg.$$eval('.gv2-tabela-raiz tbody tr', (xs) => xs.length);
      afirma('3 · lista crua com 1 negócio sem responsável (sem_responsavel: 1): o rodapé diz "1 sem responsável"', /· 1 sem responsável/.test(rod) && n === 50, { rod, n });
      const semResp = await pg.$$eval('.gv2-tabela-raiz tbody tr', (xs) => xs.filter((tr) => [...tr.children].some((td) => /^(—|Sem responsável)$/.test(td.textContent.trim()))).length);
      afirma('3 · e a linha sem responsável está na lista (página 1)', semResp === 1, String(semResp));
      await cap(pg, '2a-lista-1-sem-responsavel', '[data-gv2-conferencia]');
      await pg.click('.gv2-paginas button:has-text("Próxima")'); await pg.waitForTimeout(800); rod = await txt(pg, '[data-gv2-conferencia]');
      afirma('3 · página 2 (todos com responsável): a contagem é da LISTA inteira, continua "1 sem responsável"', /página 2 de 2/.test(rod) && /· 1 sem responsável/.test(rod), rod);
      await pg.click('.gv2-paginas button:has-text("Anterior")'); await pg.waitForTimeout(800);   // as variantes abaixo trocam a página 1
      await pg.click('.gv2-trilha .gv2-link:has-text("Geral")'); await pg.waitForSelector('.gv2[data-gv2-vista="geral"]'); await pg.waitForTimeout(300);
      await pg.click('[data-gv2-prio="sem_proxima_atividade"] .gv2-link'); await pg.waitForSelector('[data-gv2-lista="sem_proxima_atividade"] tbody tr', { timeout: 20000 }); await pg.waitForTimeout(500);
      rod = await txt(pg, '[data-gv2-conferencia]');
      afirma('3 · lista crua com todos com responsável (sem_responsavel: 0): o rodapé NÃO diz "sem responsável"', !/sem responsável/.test(rod) && /= número da prioridade na Geral/.test(rod), rod);
      await cap(pg, '2b-lista-todos-com-responsavel', '[data-gv2-conferencia]');
      // VARIANTES sem captura: os bytes crus com UM campo trocado
      const base = json('cenario-7-r3/lista-atividade_vencida-p1.json');
      const variante = (mudar) => { const j = JSON.parse(JSON.stringify(base)); mudar(j.data); return Buffer.from(JSON.stringify(j)); };
      const reabrir = async () => { await pg.click('.gv2-trilha .gv2-link:has-text("Geral")'); await pg.waitForSelector('.gv2[data-gv2-vista="geral"]'); await pg.waitForTimeout(300);
        await pg.click('[data-gv2-prio="atividade_vencida"] .gv2-link'); await pg.waitForSelector('[data-gv2-lista="atividade_vencida"] tbody tr', { timeout: 20000 }); await pg.waitForTimeout(500); return txt(pg, '[data-gv2-conferencia]'); };
      await pg.click('.gv2-trilha .gv2-link:has-text("Geral")'); await pg.waitForSelector('.gv2[data-gv2-vista="geral"]'); await pg.waitForTimeout(300);
      await pg.click('[data-gv2-prio="atividade_vencida"] .gv2-link'); await pg.waitForSelector('[data-gv2-lista="atividade_vencida"] tbody tr', { timeout: 20000 }); await pg.waitForTimeout(500);
      st.lista['atividade_vencida-p1'] = variante((d) => { d.sem_responsavel = 2; });
      afirma('3 · VARIANTE sem_responsavel: 2 → o rodapé diz exatamente "2 sem responsável" (o número do serviço, não contado na tela)', /· 2 sem responsável/.test(await reabrir()));
      st.lista['atividade_vencida-p1'] = variante((d) => { delete d.sem_responsavel; });
      afirma('3 · VARIANTE sem o campo: o rodapé não mostra nada sobre responsável', !/sem responsável/.test(await reabrir()));
      st.lista['atividade_vencida-p1'] = variante((d) => { d.sem_responsavel = null; });
      afirma('3 · VARIANTE sem_responsavel: null → nada', !/sem responsável/.test(await reabrir()));
      st.lista['atividade_vencida-p1'] = variante((d) => { d.sem_responsavel = 2; });
      await reabrir(); const op = await pg.$$eval('.gv2-filtros select option', (xs) => xs.map((x) => x.value).filter(Boolean));
      if (op.length) { await pg.selectOption('.gv2-filtros select', op[0]); await pg.waitForTimeout(900); }
      afirma('3 · com filtro de responsável, a contagem "sem responsável" (do total sem filtro) NÃO aparece', op.length > 0 && !/sem responsável/.test(await txt(pg, '[data-gv2-conferencia]')), await txt(pg, '[data-gv2-conferencia]'));
      await ctx.close(); }
  } catch (e) { falhas++; console.log('ERRO ' + (e.message || e).split('\n')[0]); }
  await b.close(); console.log(`GERAL V2 · R4 × RESPOSTAS CRUAS 674fa53e (${NT}, ${W}x${H}): ${ok} ok, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
})();
