// FICHA · VÍNCULOS COM CHAVE (CIMA, 23/11) · teste de GRAVAÇÃO COMPLETO das 9 chamadas produto_atributo / produto_kit da Ficha + kit_itens (real, desfeito)
// e sugestao (SIMULADA: decidir de verdade é irreversível, não há rota para reabrir).
// Grava de verdade na base de validação COMPARTILHADA (ATRWEB_VAL_EQ, aviso no PARA-STATUS §98) e DESFAZ cada ação pela inversa; no fim, os vínculos
// do produto (kits diretos, avulsos, exceções, unidades) têm de ser IDÊNTICOS aos do começo. Nenhum valor de atributo é tocado.
// Por gravação: X-Chave-Operacao presente, NOVA a cada intenção, recibo com a MESMA chave, "Salvo" na tela só com recibo.
// Simulados (rotas do Playwright): resposta perdida DEPOIS de gravar → "Não conseguimos confirmar" + "Conferir gravação" → "Salvo";
// conferir = nao_encontrada → "Tentar de novo com segurança" reenvia a MESMA chave e não duplica; 409 → conflito na linha, nada gravado.
// Uso: PORTA=8112 W=2200 H=1470 flock … nice -n 10 node teste-ficha-chave-vinculos.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const W = Number(process.env.W || 2200), H = Number(process.env.H || 1470);
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const CAP = 'capturas-ficha-chave-' + W; require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const DLG = '.at-portal-modal [role="dialog"]';
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const api = (rota, q = '') => pg.evaluate(async ([r, q]) => (await (await fetch(`/api/atributos/index.php?r=${r}${q}`, { credentials: 'same-origin' })).json()).data, [rota, q]);
  // registro de TODO POST de vínculo: rota, chave enviada, status e chave do recibo
  const posts = [];
  pg.on('request', (rq) => { const u = rq.url(); if (rq.method() === 'POST' && /r=(produto_atributo|produto_kit|sugestao|kit_itens)\b/.test(u)) posts.push({ r: /r=(\w+)/.exec(u)[1], chave: rq.headers()['x-chave-operacao'] ?? null, corpo: rq.postData(), status: null, recibo: null, req: rq }); });
  pg.on('response', async (rs) => { const p = posts.find((x) => x.req === rs.request()); if (!p) return; p.status = rs.status(); try { const j = await rs.json(); p.recibo = j?.data?.recibo?.chave ?? null; } catch { /* resposta perdida */ } });

  // ── escolher o produto e os alvos (só leitura)
  const P = Number(process.env.PRODUTO || 550);
  const foto = async () => { const f = await api('ficha_produto', `&product_id=${P}`);
    return { kitsDiretos: f.kits.filter((k) => k.motivos.some((x) => x.tipo === 'direto')).map((k) => k.id).sort(), avulsos: f.itens.filter((i) => i.origens.some((o) => o.tipo === 'avulso')).map((i) => i.atributo_id).sort(),
      excecoes: f.excecoes.map((e) => e.atributo_id).sort(), unidades: f.itens.filter((i) => i.unidade_produto_id).map((i) => `${i.atributo_id}:${i.unidade_produto_id}`).sort(), f }; };
  const ini = await foto(); const fi = ini.f;
  const kits = (await api('kits')).kits.filter((k) => k.ativo && k.itens > 0 && !fi.kits.some((x) => x.id === k.id));
  const dic = (await api('dicionario')).atributos.filter((a) => a.ativo && !fi.itens.some((i) => i.atributo_id === a.id) && !fi.fora_da_ficha.some((i) => i.atributo_id === a.id));
  const kitAlvo = kits[0]; const avAlvo = dic[0]; const avAlvo2 = dic[1];
  const uniAlvo = fi.itens.find((i) => (i.tipo === 'numero' || i.tipo === 'inteiro') && i.unidades.length > 1 && !i.unidade_produto_id && !i.origens.some((o) => o.tipo === 'avulso'));
  const excAlvo = fi.itens.find((i) => !i.origens.every((o) => o.tipo === 'avulso') && i.atributo_id !== uniAlvo?.atributo_id);
  afirma(`pré-condição (produto ${P}): há kit para aplicar, 2 avulsos candidatos, 1 atributo numérico com unidades e 1 item de kit`, !!kitAlvo && !!avAlvo && !!avAlvo2 && !!uniAlvo && !!excAlvo, JSON.stringify({ kit: kitAlvo?.id, av: avAlvo?.id, uni: uniAlvo?.atributo_id, exc: excAlvo?.atributo_id }));

  const abrirFicha = async (aba) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/#/panel-atributos/produto/${P}`); await pg.reload({ waitUntil: 'networkidle' });
    await pg.waitForSelector('.at-fixo button[role="tab"]', { timeout: 40000 }); await pg.click(`.at-fixo button[role="tab"]:has-text("${aba}")`); await pg.waitForTimeout(800); };
  const esperarEstado = async (fase, onde = '') => pg.waitForSelector(`${onde} [data-vinculo-estado="${fase}"]`.trim(), { timeout: 20000 }).then(() => true, () => false);
  const chavesVistas = new Set();
  /** Uma INTENÇÃO real: 1 POST, chave presente e nova, recibo com a mesma chave, "Salvo" na tela. */
  const intencao = async (nome, rota, fazer, onde = '', exigirTela = true) => {   // exigirTela=false: o bloco some depois do recibo (último item) → a prova é o recibo
    const n0 = posts.length; await fazer();
    const salvo = exigirTela ? await esperarEstado('salvo', onde) : await pg.waitForFunction(() => true).then(async () => { for (let k = 0; k < 60 && !(posts[n0] && posts[n0].recibo); k++) await pg.waitForTimeout(250); return !!(posts[n0] && posts[n0].recibo); });
    // a resposta é lida pelo ouvinte de forma assíncrona; e a ficha recarrega depois do recibo (a próxima ação precisa da versão nova)
    for (let k = 0; k < 40 && posts[n0] && posts[n0].status === null; k++) await pg.waitForTimeout(125);
    await pg.waitForLoadState('networkidle').catch(() => {}); await pg.waitForTimeout(300);
    const novos = posts.slice(n0); const p = novos[0] || {};
    afirma(`${nome}: 1 POST ${rota} com X-Chave-Operacao nova; recibo com a MESMA chave; "Salvo" na tela`, novos.length === 1 && p.r === rota && !!p.chave && !chavesVistas.has(p.chave) && p.recibo === p.chave && p.status >= 200 && p.status < 300 && salvo,
      JSON.stringify({ n: novos.length, r: p.r, chave: p.chave, recibo: p.recibo, status: p.status, salvo }));
    if (p.chave) chavesVistas.add(p.chave); return p;
  };
  const KITS = '.at-painel:has(h3:has-text("Kits deste produto"))', ATR = '.at-painel:has(h3:has-text("Atributos e origem"))';

  // ── (1) aba Vínculos: aplicar kit → remover kit direto
  await abrirFicha('Vínculos');
  await intencao(`aplicar kit "${kitAlvo.nome}"`, 'produto_kit', async () => { await pg.selectOption('select[aria-label="Kit para aplicar"]', String(kitAlvo.id)); await pg.click(`${KITS} button:has-text("Aplicar kit")`); }, KITS);
  await pg.screenshot({ path: `${CAP}/1-aplicar-kit-salvo.png` });
  await pg.waitForSelector(`${KITS} li:has-text("${kitAlvo.nome}") button:has-text("Remover kit direto")`, { timeout: 20000 });
  await intencao(`remover kit direto "${kitAlvo.nome}" (desfaz)`, 'produto_kit', () => pg.click(`${KITS} li:has-text("${kitAlvo.nome}") button:has-text("Remover kit direto")`), KITS);

  // ── (2) adicionar avulso (diálogo) → remover avulso
  const n2 = posts.length;
  await pg.click(`${KITS} button:has-text("Adicionar atributo avulso")`); await pg.waitForSelector(`${DLG} input[aria-label="Buscar atributo"]`);
  await pg.fill(`${DLG} input[aria-label="Buscar atributo"]`, avAlvo.codigo || avAlvo.rotulo); await pg.waitForTimeout(400);
  await pg.click(`${DLG} label:has-text("${avAlvo.rotulo}")`); await pg.click(`${DLG} button:has-text("Adicionar ${avAlvo.rotulo}")`);
  await pg.waitForFunction((n) => !document.querySelector('.at-portal-modal [role="dialog"]'), null, { timeout: 20000 }).catch(() => {}); await pg.waitForTimeout(800);
  { const p = posts[n2] || {}; afirma(`adicionar avulso "${avAlvo.rotulo}": chave nova, recibo com a mesma chave; o diálogo fecha só depois do recibo`, posts.length === n2 + 1 && !!p.chave && !chavesVistas.has(p.chave) && p.recibo === p.chave && !(await pg.$(DLG)), JSON.stringify({ chave: p.chave, recibo: p.recibo })); chavesVistas.add(p.chave); }
  await pg.waitForSelector(`${ATR} tr:has-text("${avAlvo.rotulo}") button:has-text("Remover avulso")`, { timeout: 20000 });
  await intencao(`remover avulso "${avAlvo.rotulo}" (desfaz)`, 'produto_atributo', () => pg.click(`${ATR} tr:has-text("${avAlvo.rotulo}") button:has-text("Remover avulso")`), ATR);

  // ── (3) unidade deste produto → voltar ao padrão
  const uSel = `select[aria-label="Unidade deste produto para ${uniAlvo.rotulo}"]`; const uOutra = uniAlvo.unidades.find((u) => !u.padrao) ?? uniAlvo.unidades[1];
  await intencao(`unidade de "${uniAlvo.rotulo}" = ${uOutra.simbolo}`, 'produto_atributo', () => pg.selectOption(uSel, String(uOutra.id)), ATR);
  await pg.waitForTimeout(600);
  await intencao(`unidade de "${uniAlvo.rotulo}" de volta ao padrão (desfaz)`, 'produto_atributo', () => pg.selectOption(uSel, ''), ATR);

  // ── (4) excluir só neste produto (motivo) → desfazer exceção (aba Atributos)
  await pg.click(`${ATR} tr:has-text("${excAlvo.rotulo}") button:has-text("Excluir só neste produto")`); await pg.waitForSelector(`${DLG} input.at-campo`);
  await pg.fill(`${DLG} input.at-campo`, 'teste CIMA chave de operação');
  await intencao(`excluir "${excAlvo.rotulo}" só neste produto`, 'produto_atributo', () => pg.click(`${DLG} button:has-text("Excluir neste produto")`), ATR);
  await pg.click('.at-fixo button[role="tab"]:has-text("Atributos")'); await pg.waitForSelector('.at-bloco:has-text("Exceções deste produto")', { timeout: 20000 });
  await intencao(`desfazer a exceção de "${excAlvo.rotulo}" (desfaz)`, 'produto_atributo', () => pg.click(`.at-bloco:has-text("Exceções deste produto") .at-attr:has-text("${excAlvo.rotulo}") button:has-text("Desfazer exceção")`), '', false);

  // ── (5) SIMULADO · resposta perdida DEPOIS de gravar → desconhecido → Conferir gravação (real) → Salvo
  await abrirFicha('Vínculos');
  await pg.route('**/api/atributos/index.php?r=produto_kit*', async (route) => { if (route.request().method() !== 'POST') return route.continue(); await route.fetch(); await route.abort('connectionreset'); });
  const n5 = posts.length;
  await pg.selectOption('select[aria-label="Kit para aplicar"]', String(kitAlvo.id)); await pg.click(`${KITS} button:has-text("Aplicar kit")`);
  const desc = await esperarEstado('desconhecido', KITS); const t5 = await pg.textContent(`${KITS} [data-vinculo-estado="desconhecido"]`).catch(() => '');
  afirma('resposta perdida: "Não conseguimos confirmar se foi salvo." + "Conferir gravação" (nunca "Salvo" sem recibo); o botão fica travado', desc && /Não conseguimos confirmar se foi salvo/.test(t5) && /Conferir gravação/.test(t5) && (await pg.isDisabled(`${KITS} button:has-text("Aplicar kit")`)), t5);
  await pg.screenshot({ path: `${CAP}/5-resposta-perdida.png` });
  await pg.unroute('**/api/atributos/index.php?r=produto_kit*');
  await pg.click(`${KITS} [data-vinculo-estado="desconhecido"] button:has-text("Conferir gravação")`);
  afirma('"Conferir gravação" (GET, não grava) acha o recibo → "Salvo"; nenhum POST novo', (await esperarEstado('salvo', KITS)) && posts.length === n5 + 1);
  await pg.waitForSelector(`${KITS} li:has-text("${kitAlvo.nome}") button:has-text("Remover kit direto")`, { timeout: 20000 });
  await intencao(`remover kit direto "${kitAlvo.nome}" (desfaz o simulado)`, 'produto_kit', () => pg.click(`${KITS} li:has-text("${kitAlvo.nome}") button:has-text("Remover kit direto")`), KITS);

  // ── (6) SIMULADO · conferir = nao_encontrada → "Tentar de novo com segurança" reenvia a MESMA chave; o servidor devolve o recibo original
  await pg.route('**/api/atributos/index.php?r=produto_atributo*', async (route) => { if (route.request().method() !== 'POST') return route.continue(); await route.fetch(); await route.abort('connectionreset'); });
  await pg.route('**/api/atributos/index.php?r=conferir_gravacao*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { chave: 'x', resultado: 'nao_encontrada', operacao: null, recibo: null }, error: null }) }));
  const uSel2 = `select[aria-label="Unidade deste produto para ${uniAlvo.rotulo}"]`; const n6 = posts.length;
  await pg.selectOption(uSel2, String(uOutra.id)); await esperarEstado('desconhecido', ATR);
  await pg.click(`${ATR} [data-vinculo-estado="desconhecido"] button:has-text("Conferir gravação")`); await pg.waitForTimeout(600);
  const t6 = await pg.textContent(`${ATR} [data-vinculo-estado]`).catch(() => '');
  afirma('conferir "não encontrada": continua a conferir (não prova "não salvo") e oferece "Tentar de novo com segurança"', /Ainda não encontramos o resultado desta gravação/.test(t6) && /Tentar de novo com segurança/.test(t6), t6);
  await pg.unroute('**/api/atributos/index.php?r=produto_atributo*'); await pg.unroute('**/api/atributos/index.php?r=conferir_gravacao*');
  await pg.click(`${ATR} [data-vinculo-estado] button:has-text("Tentar de novo com segurança")`);
  const s6 = await esperarEstado('salvo', ATR); const a6 = posts[n6], b6 = posts[n6 + 1];
  afirma('"Tentar de novo com segurança": o MESMO corpo com a MESMA chave; recibo com essa chave; "Salvo"', s6 && posts.length === n6 + 2 && a6.chave === b6.chave && a6.corpo === b6.corpo && b6.recibo === b6.chave, JSON.stringify({ a: a6?.chave, b: b6?.chave, rec: b6?.recibo }));
  const meio = await foto();
  afirma('sem efeito duplo: a unidade ficou gravada UMA vez (1 ajuste)', meio.unidades.filter((x) => x.startsWith(`${uniAlvo.atributo_id}:`)).length === 1, JSON.stringify(meio.unidades));
  await pg.waitForTimeout(400);
  await intencao(`unidade de volta ao padrão (desfaz o simulado)`, 'produto_atributo', () => pg.selectOption(uSel2, ''), ATR);

  // ── (7) SIMULADO · 409 conflito → mensagem na linha, nada gravado
  await pg.route('**/api/atributos/index.php?r=produto_atributo*', (route) => route.request().method() !== 'POST' ? route.continue()
    : route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ ok: false, data: null, error: 'VERSION_CONFLICT', meta: { message: 'Os vínculos mudaram.', desfecho: 'conflito' } }) }));
  await pg.click(`${ATR} tr:has-text("${excAlvo.rotulo}") button:has-text("Excluir só neste produto")`); await pg.waitForSelector(`${DLG} input.at-campo`);
  await pg.fill(`${DLG} input.at-campo`, 'teste conflito'); await pg.click(`${DLG} button:has-text("Excluir neste produto")`);
  const c7 = await esperarEstado('conflito', ATR); const t7 = await pg.textContent(`${ATR} [data-vinculo-estado="conflito"]`).catch(() => '');
  afirma('409: "os vínculos mudaram… Nada foi gravado" na linha (não é "Salvo")', c7 && /Nada foi gravado/.test(t7), t7);
  await pg.screenshot({ path: `${CAP}/7-conflito.png` });
  await pg.unroute('**/api/atributos/index.php?r=produto_atributo*');

  // ── (8) "fora da ficha" e "legado": vincular → remover avulso (só se a base tiver esses casos)
  const vit = await api('vitrine'); let feitos = 0;
  for (const q of vit.produtos.filter((p) => p.fora_da_ficha > 0).slice(0, 20)) {
    const fq = await api('ficha_produto', `&product_id=${q.id}`); const alvo = fq.fora_da_ficha.find((i) => i.atributo_ativo); if (!alvo || !fq.pode_vincular) continue;
    const antes = JSON.stringify(fq.itens.map((i) => i.atributo_id).sort());
    await pg.goto(`${B}/#/panel-atributos/produto/${q.id}`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-bloco--fora', { timeout: 40000 }); await pg.waitForTimeout(600);
    await intencao(`fora da ficha (produto ${q.id}): vincular "${alvo.rotulo}"`, 'produto_atributo', () => pg.click(`.at-bloco--fora .at-attr:has-text("${alvo.rotulo}") button:has-text("Vincular a este produto")`), '', false);
    await pg.click('.at-fixo button[role="tab"]:has-text("Vínculos")'); await pg.waitForSelector(`${ATR} tr:has-text("${alvo.rotulo}") button:has-text("Remover avulso")`, { timeout: 20000 });
    await intencao(`fora da ficha (produto ${q.id}): remover avulso (desfaz)`, 'produto_atributo', () => pg.click(`${ATR} tr:has-text("${alvo.rotulo}") button:has-text("Remover avulso")`), ATR);
    const depois = await api('ficha_produto', `&product_id=${q.id}`);
    afirma(`fora da ficha (produto ${q.id}): os vínculos voltaram ao que eram`, JSON.stringify(depois.itens.map((i) => i.atributo_id).sort()) === antes && depois.fora_da_ficha.some((i) => i.atributo_id === alvo.atributo_id));
    feitos++; break;
  }
  if (!feitos) console.log('aviso  nenhum produto com "fora da ficha" vinculável na base de validação: caso não exercitado');
  let leg = 0;
  for (const q of vit.produtos.filter((p) => p.legado).slice(0, 40)) {
    const fq = await api('ficha_produto', `&product_id=${q.id}`); const alvo = (fq.legado_nao_vinculado || []).find((i) => i.atributo_ativo); if (!alvo || !fq.pode_vincular) continue;
    await pg.goto(`${B}/#/panel-atributos/produto/${q.id}`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-bloco--legado', { timeout: 40000 }); await pg.waitForTimeout(600);
    await intencao(`legado (produto ${q.id}): vincular "${alvo.rotulo}"`, 'produto_atributo', () => pg.click(`.at-bloco--legado .at-attr:has-text("${alvo.rotulo}") button:has-text("Vincular a este produto")`), '', false);
    await pg.click('.at-fixo button[role="tab"]:has-text("Vínculos")'); await pg.waitForSelector(`${ATR} tr:has-text("${alvo.rotulo}") button:has-text("Remover avulso")`, { timeout: 20000 });
    await intencao(`legado (produto ${q.id}): remover avulso (desfaz)`, 'produto_atributo', () => pg.click(`${ATR} tr:has-text("${alvo.rotulo}") button:has-text("Remover avulso")`), ATR);
    leg++; break;
  }
  if (!leg) console.log('aviso  nenhum produto com "legado sem vínculo" ativo na base de validação: caso não exercitado');


  // ── (9) "Adicionar ao kit…" (kit_itens) — REAL e desfeito: o kit volta à lista ORIGINAL de itens (pela API, com chave)
  { let feito = false;
    for (const q of vit.produtos.filter((p) => p.fora_da_ficha > 0).slice(0, 30)) {
      const fq = await api('ficha_produto', `&product_id=${q.id}`); const alvo = fq.fora_da_ficha.find((i) => i.atributo_ativo); const kit = fq.kits.find((k) => !k.motivos.some((x) => x.tipo === 'todos'));
      if (!alvo || !kit || !fq.pode_vincular) continue;
      const k0 = (await api('kit', `&id=${kit.id}`)).kit; const itens0 = k0.atributos.map((a) => ({ atributo_id: a.atributo_id, posicao: a.posicao, obrigatorio: a.obrigatorio, visivel: a.visivel, destaque: a.destaque, importancia: a.importancia, unidade_id: a.unidade_id }));
      if (itens0.some((x) => x.atributo_id === alvo.atributo_id)) continue;
      await pg.goto(`${B}/#/panel-atributos/produto/${q.id}`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-bloco--fora', { timeout: 40000 }); await pg.waitForTimeout(600);
      await pg.click(`.at-bloco--fora .at-attr:has-text("${alvo.rotulo}") button:has-text("Adicionar ao kit…")`); await pg.waitForSelector(`${DLG} select.at-campo`);
      await pg.selectOption(`${DLG} select.at-campo`, String(kit.id));
      await intencao(`adicionar "${alvo.rotulo}" ao kit "${kit.nome}" (kit_itens)`, 'kit_itens', () => pg.click(`${DLG} button:has-text("Adicionar ao kit")`), '', false);
      const k1 = (await api('kit', `&id=${kit.id}`)).kit;
      afirma('kit_itens: o atributo entrou no kit UMA vez', k1.atributos.filter((a) => a.atributo_id === alvo.atributo_id).length === 1);
      // desfaz: devolve a lista original (com chave, como a tela faz)
      const volta = await pg.evaluate(async ([id, versao, itens]) => { const t = window.SecurityCSRF?.getToken?.() || document.querySelector('meta[name="csrf-token"]')?.content || (await (await fetch('/api/auth/check.php')).json())?.data?.session?.csrf_token || '';
        const r = await fetch('/api/atributos/index.php?r=kit_itens', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': t, 'X-Chave-Operacao': `op-teste-cima-${Date.now().toString(36)}` }, body: JSON.stringify({ id, versao, itens }) });
        return r.status; }, [kit.id, k1.versao, itens0]);
      const k2 = (await api('kit', `&id=${kit.id}`)).kit; const sem = (k) => JSON.stringify(k.atributos.map((a) => [a.atributo_id, a.posicao, a.obrigatorio, a.visivel, a.destaque, a.importancia, a.unidade_id]).sort((x, y) => x[0] - y[0]));
      afirma(`kit "${kit.nome}": itens de volta IDÊNTICOS aos do começo (desfeito, HTTP ${volta})`, volta === 200 && sem(k2) === sem(k0), JSON.stringify({ volta }));
      feito = true; break;
    }
    if (!feito) console.log('aviso  nenhum produto com "fora da ficha" + kit específico na base de validação: kit_itens não exercitado'); }

  // ── (10) SUGESTÃO (aceitar/recusar) — SIMULADA: decidir uma sugestão de verdade é irreversível (não há rota para reabrir)
  { const pr = vit.produtos.find((p) => p.ativo) || vit.produtos[0]; const fq = await api('ficha_produto', `&product_id=${pr.id}`);
    const it = fq.itens.find((i) => !i.valor) || fq.itens[0];
    const sug = { id: 990001, versao: 1, tipo: 'nome', fonte: 'nome', estado: 'pendente', valor_proposto: '42', unidade_id: null, opcao_id: null, evidencia: 'teste simulado' };
    await pg.route(`**/api/atributos/index.php?r=ficha_produto*`, async (route) => { const r = await route.fetch(); const j = await r.json(); const x = j.data.itens.find((i) => i.atributo_id === it.atributo_id); if (x) { x.valor = null; x.sugestoes = [sug]; } j.data.pode_editar = true; await route.fulfill({ response: r, json: j }); });
    let modo = 'ok'; const sugPosts = [];
    await pg.route('**/api/atributos/index.php?r=sugestao*', async (route) => { const rq = route.request(); if (rq.method() !== 'POST') return route.continue(); const ch = rq.headers()['x-chave-operacao']; sugPosts.push(ch);
      if (modo === 'perdida') return route.abort('connectionreset');
      if (modo === 'conflito') return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ ok: false, data: null, error: 'VERSION_CONFLICT', meta: { message: 'A sugestão mudou.', desfecho: 'conflito' } }) });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { desfecho: 'aplicada', recibo: { operacao: 'sugestao', chave: ch, desfecho: 'aplicada', confirmado_em: 'agora' } }, error: null }) }); });
    await pg.route('**/api/atributos/index.php?r=conferir_gravacao*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { chave: 'x', resultado: 'aplicada', operacao: 'sugestao', recibo: { operacao: 'sugestao', chave: new URL(route.request().url()).searchParams.get('chave'), desfecho: 'aplicada', confirmado_em: 'agora' } }, error: null }) }));
    const abrirSug = async () => { await pg.goto(`${B}/#/panel-atributos/produto/${pr.id}`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-sugestao', { timeout: 40000 }); await pg.waitForTimeout(500); };
    await abrirSug(); modo = 'perdida';
    await pg.click('.at-sugestao button:has-text("Recusar")');
    const d10 = await esperarEstado('desconhecido', '.at-sugestao'); const t10 = await pg.textContent('.at-sugestao [data-vinculo-estado]').catch(() => '');
    afirma('sugestão (simulado) · resposta perdida: chave enviada; "Não conseguimos confirmar se foi salvo." + "Conferir gravação"; botões travados', d10 && !!sugPosts[0] && /Não conseguimos confirmar se foi salvo/.test(t10) && (await pg.isDisabled('.at-sugestao button:has-text("Recusar")')), t10);
    await pg.screenshot({ path: `${CAP}/10-sugestao-perdida.png` });
    await pg.click('.at-sugestao [data-vinculo-estado] button:has-text("Conferir gravação")');
    afirma('sugestão (simulado) · "Conferir gravação" acha o recibo → "Salvo"; nenhum POST novo', (await esperarEstado('salvo', '.at-sugestao').catch(() => false)) && sugPosts.length === 1);
    await abrirSug(); modo = 'conflito';   // página nova: com dados reais a sugestão decidida sai da lista; aqui a rota simulada a devolve await pg.click('.at-sugestao button:has-text("Recusar")');
    { const c = await esperarEstado('conflito', '.at-sugestao'); const est = await pg.$$eval('.at-sugestao [data-vinculo-estado]', (xs) => xs.map((x) => x.dataset.vinculoEstado + ':' + x.textContent.slice(0, 80))).catch(() => []);
      afirma('sugestão (simulado) · 409: conflito na linha, nada gravado; chave nova nesta intenção', c && sugPosts.length === 2 && sugPosts[1] && sugPosts[1] !== sugPosts[0], JSON.stringify({ c, n: sugPosts.length, est })); }
    await pg.waitForSelector('.at-sugestao button:has-text("Recusar"):not([disabled])', { timeout: 20000 }); await pg.waitForTimeout(400); modo = 'ok'; const n10 = sugPosts.length; await pg.click('.at-sugestao button:has-text("Usar")'); await pg.waitForTimeout(800);
    afirma('sugestão (simulado) · "Usar": 1 POST com chave nova e recibo com a mesma chave', sugPosts.length === n10 + 1 && !!sugPosts[n10] && !sugPosts.slice(0, n10).includes(sugPosts[n10]));
    await pg.unroute('**/api/atributos/index.php?r=ficha_produto*'); await pg.unroute('**/api/atributos/index.php?r=sugestao*'); await pg.unroute('**/api/atributos/index.php?r=conferir_gravacao*'); }

  // ── no fim: os vínculos do produto P idênticos aos do começo
  const fim = await foto(); const sem = (x) => JSON.stringify({ k: x.kitsDiretos, a: x.avulsos, e: x.excecoes, u: x.unidades });
  afirma(`produto ${P}: vínculos IDÊNTICOS aos do começo (kits diretos, avulsos, exceções, unidades)`, sem(fim) === sem(ini), JSON.stringify({ ini: sem(ini), fim: sem(fim) }));
  afirma(`todas as gravações mandaram chave (${posts.length} POSTs de vínculo/kit/sugestão, nenhum sem X-Chave-Operacao)`, posts.length > 0 && posts.every((p) => !!p.chave), JSON.stringify(posts.filter((p) => !p.chave).map((p) => p.r)));
  console.log(`FICHA · VÍNCULOS COM CHAVE (${W}x${H}): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
