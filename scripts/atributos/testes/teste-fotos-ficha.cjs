// FOTOS NA FICHA (CIMA) · teste LEVE da tela (2200×1470, flags de shell da produção), com o proxy SIMULADO exatamente pelo contrato da DIREITA
// (/srv/dshow-docs/briefings/CONTRATO-PROXY-MIDIA.md v1.0, ramo feat/fotos1-dash d572b279) e o roteiro aprovado (PESQUISA-FOTOS-UX-chatgpt-2026-11-19.md).
// ACEITE (produto 550): 3 fotos — uma publica, uma já existe, uma perde a resposta; fechar e reabrir; o resultado das três continua identificável;
// conferir SÓ a terceira; capa e contagem certas; nenhuma duplicação. Também: 403/404 sem botões; colar só no diálogo; arrastar; retirar prévia;
// HEIC sem prévia; câmera (fake) sem microfone e desligada ao usar; câmera bloqueada com a fila intacta; aba Fotos (principal, reordenar, remover+Desfazer, conflito).
// Nada vai ao app. Uso: PORTA=8112 flock … nice -n 10 node teste-fotos-ficha.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const CAP = 'capturas-fotos'; require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const png = (n) => Buffer.concat([PNG, Buffer.alloc(n, 7)]);
const P = 550;
const ok200 = (data, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify({ ok: true, data, error: null }) });
const erro = (status, code, meta) => ({ status, contentType: 'application/json', body: JSON.stringify({ ok: false, data: null, error: code, meta }) });
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const nova = async (init) => { const ctx = await b.newContext({ viewport: { width: 2200, height: 1470 }, deviceScaleFactor: 1, permissions: ['camera'] }); if (init) await ctx.addInitScript(init); const pg = await ctx.newPage();
    await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 }); return pg; };
  const abrir = async (pg) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/#/panel-atributos/produto/${P}`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-resumo-v3', { timeout: 40000 }); await pg.waitForTimeout(1200); };
  // ── proxy simulado (contrato v1.0)
  const simular = async (pg, modo) => {
    const s = { versao: 7, fotos: [{ id: 801, capa: true, posicao: 1, origem: 'precifica', autor_user_id: null, criado_em: '2026-10-01T10:00:00Z', largura: 800, altura: 600, cor: '#dddddd', versao_arquivo: 1 },
      { id: 802, capa: false, posicao: 2, origem: 'dshow', autor_user_id: 75, criado_em: '2026-11-10T10:00:00Z', largura: 800, altura: 600, cor: null, versao_arquivo: 1 }], removidas: [], posts: [], gets: [], proxId: 900, plano: [], porChave: new Map() };
    const recibo = (op, chave, extra) => ({ canal: 'dash', chave, confirmado_em: new Date().toISOString(), desfecho: 'aplicada', duplicada: false, foto_id: null, operacao: op, produto_id: P, versao_nova: s.versao, ...extra });
    await pg.route('**/api/midia/index.php?**', async (route) => {
      const u = new URL(route.request().url()); const r = u.searchParams.get('r'); const h = route.request().headers(); const m = route.request().method();
      if (r === 'imagem') return route.fulfill({ status: 200, contentType: 'image/png', body: PNG, headers: { ETag: '"x"', 'Cache-Control': 'private, max-age=86400' } });
      if (r === 'galeria') { if (modo === 'desligado') return route.fulfill(erro(404, 'NOT_FOUND', { message: 'Recurso não disponível.' }));
        if (modo === 'sem75') return route.fulfill(erro(403, 'NOT_AUTHORIZED', { message: 'Você não tem permissão para gerenciar as fotos.' }));
        return route.fulfill(ok200({ produto: { id: P, nome: 'Produto 550', ativo: true, pode_receber_foto: true }, versao_galeria: s.versao, limite_fotos: 30, fotos: s.fotos, removidas: s.removidas })); }
      if (r === 'conferir') { const ch = u.searchParams.get('chave'); s.gets.push(ch); const rec = s.porChave.get(ch);
        return route.fulfill(ok200(rec ? { resultado: 'aplicada', operacao: rec.operacao, recibo: rec } : { resultado: 'nao_encontrada', reenvio_seguro: true })); }
      if (m !== 'POST') return route.continue();
      const chave = h['x-chave-operacao']; const corpo = route.request().postDataBuffer(); const reg = { r, chave, bytes: corpo ? corpo.length : 0, json: r !== 'publicar' ? JSON.parse(route.request().postData() || '{}') : null, ct: h['content-type'] }; s.posts.push(reg);
      if (s.porChave.has(chave)) return route.fulfill(ok200({ desfecho: 'aplicada', recibo: s.porChave.get(chave), repetido: true }, r === 'publicar' ? 201 : 200));   // reenvio da mesma chave
      const acao = s.plano.length ? s.plano.shift() : 'ok';
      if (acao === 'conflito') return route.fulfill(erro(409, 'VERSION_CONFLICT', { message: 'As fotos deste produto mudaram desde que você abriu.', desfecho: 'conflito', gravado: false, chave, versao_atual: s.versao }));
      if (acao === 'duplicada') { const rec = recibo('foto_publicar', chave, { desfecho: 'sem_mudanca', duplicada: true, foto_id: 802 }); s.porChave.set(chave, rec); return route.fulfill(ok200({ desfecho: 'sem_mudanca', recibo: rec, repetido: false })); }
      s.versao++; let rec;
      if (r === 'publicar') { const id = s.proxId++; s.fotos.push({ id, capa: false, posicao: s.fotos.length + 1, origem: 'dshow', autor_user_id: 75, criado_em: new Date().toISOString(), largura: 1, altura: 1, cor: null, versao_arquivo: 1 }); rec = recibo('foto_publicar', chave, { foto_id: id }); }
      if (r === 'capa') { s.fotos.forEach((f) => { f.capa = f.id === reg.json.id; }); rec = recibo('foto_capa', chave, { foto_id: reg.json.id }); }
      if (r === 'ordem') { reg.json.ordem.forEach((id, k) => { const f = s.fotos.find((x) => x.id === id); if (f) { f.posicao = k + 1; f.capa = k === 0; } }); rec = recibo('foto_ordem', chave, { ordem: reg.json.ordem }); }
      if (r === 'remover') { const i = s.fotos.findIndex((x) => x.id === reg.json.id); if (i >= 0) s.removidas.push({ ...s.fotos.splice(i, 1)[0], removida_em: 'x', motivo: null }); rec = recibo('foto_remover', chave, { foto_id: reg.json.id }); }
      if (r === 'restaurar') { const i = s.removidas.findIndex((x) => x.id === reg.json.id); if (i >= 0) s.fotos.push({ ...s.removidas.splice(i, 1)[0], posicao: s.fotos.length + 1 }); rec = recibo('foto_restaurar', chave, { foto_id: reg.json.id }); }
      s.porChave.set(chave, rec);
      if (acao === 'perdida') return route.abort('connectionreset');   // GRAVOU, mas a resposta não chegou
      return route.fulfill(ok200({ desfecho: 'aplicada', recibo: rec, repetido: false }, r === 'publicar' ? 201 : 200));
    });
    return s;
  };
  const dlg = '.at-portal-modal [role="dialog"]'; const fila = `${dlg} .at-fotos-fila`;
  const estados = (pg) => pg.$$eval('.at-fotos-fila__item', (xs) => xs.map((x) => x.dataset.atFotoFila));
  const nomes = (pg) => pg.$$eval('.at-fotos-fila__nome', (xs) => xs.map((x) => x.textContent.replace(/^\d+\.\s*/, '').split(' ')[0]));
  // (1) 404 e 403: nenhum botão de escrita
  for (const modo of ['desligado', 'sem75']) {
    const pg = await nova(); await simular(pg, modo); await abrir(pg);
    const semBotao = !(await pg.$('.at-resumo-v3__add'));
    await pg.click('.at-fixo button[role="tab"]:has-text("Fotos")'); await pg.waitForTimeout(300);
    afirma(`${modo === 'desligado' ? '404 (flag/rota)' : '403 NOT_AUTHORIZED (piloto: só o 75)'}: sem "Adicionar fotos"; a aba Fotos fica como hoje`, semBotao && !(await pg.$('.at-fotos-ger')));
    await pg.context().close();
  }
  // (2) ACEITE do produto 550
  const pg = await nova(`{ const o = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); window.__pedidos = []; window.__fluxos = []; navigator.mediaDevices.getUserMedia = async (c) => { window.__pedidos.push(JSON.stringify(c)); const f = await o(c); window.__fluxos.push(f); return f; }; }`);
  const s = await simular(pg, 'ok'); await abrir(pg);
  afirma('publicador: "Adicionar fotos" no resumo; carrossel pela galeria (1 de 2)', !!(await pg.$('.at-resumo-v3__add')) && (await pg.textContent('.at-resumo-v3__contador')) === '1 de 2');
  const colar = (sel, nome) => pg.evaluate(([sel, nome, b64]) => { const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const dt = new DataTransfer(); dt.items.add(new File([bin], nome, { type: 'image/png' })); document.querySelector(sel).dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt })); }, [sel, nome, png(5).toString('base64')]);
  await colar('body', 'fora.png'); await pg.waitForTimeout(400);
  afirma('Ctrl+V na Ficha (fora do diálogo) NÃO abre nada (o teclado da tabela fica livre)', !(await pg.$(`${dlg}:has-text("Adicionar fotos")`)));
  await pg.click('.at-resumo-v3__add'); await pg.waitForSelector(`${dlg}:has-text("Adicionar fotos · 550 — ")`);
  afirma('título "Adicionar fotos · 550 — <nome>"; formatos e vagas restantes da galeria (30 − 2 = 28)', (await pg.textContent('[data-at-formatos]')).includes('JPEG, PNG, WebP ou HEIC · até 15 MB por foto · 28 vagas restantes'));
  await pg.setInputFiles('input[data-at-fotos-input]', [{ name: 'nova.png', mimeType: 'image/png', buffer: png(10) }, { name: 'repetida.png', mimeType: 'image/png', buffer: png(20) }, { name: 'perdida.png', mimeType: 'image/png', buffer: png(30) }, { name: 'retirar.png', mimeType: 'image/png', buffer: png(40) }]);
  await pg.waitForTimeout(300);
  await pg.click('button[aria-label="Retirar retirar.png"]'); await pg.waitForTimeout(200);
  afirma('prévias na fila; a 4ª foi RETIRADA antes de publicar; botão "Publicar 3 fotos"', JSON.stringify(await nomes(pg)) === '["nova.png","repetida.png","perdida.png"]' && !!(await pg.$(`${dlg} button:has-text("Publicar 3 fotos")`)));
  s.plano = ['ok', 'duplicada', 'perdida'];
  await pg.click(`${dlg} button:has-text("Publicar 3 fotos")`); await pg.waitForTimeout(1500);
  const pub = s.posts.filter((p) => p.r === 'publicar');
  afirma('3 envios em bytes (octet-stream), uma chave por foto (16–64), na ordem', pub.length === 3 && pub.every((p) => /octet-stream/.test(p.ct) && /^[A-Za-z0-9_-]{16,64}$/.test(p.chave)) && new Set(pub.map((p) => p.chave)).size === 3 && pub.map((p) => p.bytes).join() === [png(10).length, png(20).length, png(30).length].join(), JSON.stringify(pub.map((p) => [p.ct, p.chave, p.bytes])));
  afirma('estados: Publicada · "Esta foto já está na galeria" (+ Ver foto) · "Não conseguimos confirmar o envio" (+ Conferir gravação)', JSON.stringify(await estados(pg)) === '["publicada","duplicada","desconhecido"]'
    && !!(await pg.$('.at-fotos-fila__item--duplicada button:has-text("Ver foto")')) && (await pg.textContent('.at-fotos-fila__item--desconhecido')).includes('Não conseguimos confirmar o envio'), JSON.stringify(await estados(pg)));
  afirma('resumo do lote: "1 publicada · 1 já existente · 1 a conferir"', (await pg.textContent('[data-at-fotos-resumo]')) === '1 publicada · 1 já existente · 1 a conferir', await pg.textContent('[data-at-fotos-resumo]').catch(() => ''));
  await pg.screenshot({ path: `${CAP}/aceite-1-lote.png` });
  await pg.click(`${dlg} button:has-text("Fechar")`); await pg.waitForTimeout(400);
  afirma('fechar não perde nada (sem diálogo de confirmação: a fila fica guardada)', !(await pg.$(`${dlg}`)));
  await pg.click('.at-resumo-v3__add'); await pg.waitForSelector(fila);
  afirma('reabrir: as 3 fotos com o mesmo resultado e o mesmo resumo', JSON.stringify(await estados(pg)) === '["publicada","duplicada","desconhecido"]' && (await pg.textContent('[data-at-fotos-resumo]')) === '1 publicada · 1 já existente · 1 a conferir');
  await pg.click('.at-fotos-fila__item--desconhecido button:has-text("Conferir gravação")'); await pg.waitForTimeout(700);
  afirma('Conferir SÓ a 3ª: um GET com a chave dela; nenhum POST novo; vira "Publicada" pelo recibo original', s.gets.length === 1 && s.gets[0] === pub[2].chave && s.posts.filter((p) => p.r === 'publicar').length === 3 && JSON.stringify(await estados(pg)) === '["publicada","duplicada","publicada"]');
  afirma('resumo final: "2 publicadas · 1 já existente"', (await pg.textContent('[data-at-fotos-resumo]')) === '2 publicadas · 1 já existente');
  await pg.screenshot({ path: `${CAP}/aceite-2-depois-de-conferir.png` });
  await pg.click('.at-fotos-fila__item--duplicada button:has-text("Ver foto")'); await pg.waitForTimeout(600);
  afirma('"Ver foto" abre a foto que já estava na galeria (ampliada)', /Foto 2 de 4/.test(await pg.textContent(dlg).catch(() => '')), await pg.textContent(dlg).catch(() => ''));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  afirma('contagem e capa certas: 4 fotos na galeria (2 + nova + perdida-conferida), capa continua a 801, nenhuma duplicação', s.fotos.length === 4 && s.fotos.filter((f) => f.capa).map((f) => f.id).join() === '801' && (await pg.textContent('.at-resumo-v3__contador')).endsWith('de 4'));
  await pg.click('.at-resumo-v3__add'); await pg.waitForSelector(fila);
  await pg.click(`${dlg} button:has-text("Tirar concluídas da lista")`); await pg.waitForTimeout(200);
  await colar('.at-fotos-add', 'colada.png'); await pg.waitForTimeout(300);
  await pg.evaluate((b64) => { const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const dt = new DataTransfer(); dt.items.add(new File([bin], 'arrastada.png', { type: 'image/png' })); dt.items.add(new File([bin], 'foto.heic', { type: 'image/heic' }));
    const z = document.querySelector('.at-fotos-add__zona'); z.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); z.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); }, png(6).toString('base64'));
  await pg.waitForTimeout(300);
  afirma('dentro do diálogo: colar e arrastar entram na MESMA fila; HEIC aceito, sem prévia, com explicação', JSON.stringify(await nomes(pg)) === '["colada.png","arrastada.png","foto.heic"]' && (await pg.textContent('.at-fotos-fila__previa--heic')).includes('aparece depois do processamento'), JSON.stringify(await nomes(pg)));
  afirma('a câmera ainda NÃO foi pedida', (await pg.evaluate(() => window.__pedidos.length)) === 0);
  await pg.click(`${dlg} button:has-text("Usar câmera")`); await pg.waitForSelector(`${dlg}:has-text("Usar câmera") video`, { timeout: 10000 }); await pg.waitForTimeout(1200);
  await pg.click(`${dlg} button:has-text("Capturar")`); await pg.waitForSelector('[data-at-camera-previa]', { timeout: 5000 });
  await pg.click(`${dlg} button:has-text("Usar foto")`); await pg.waitForTimeout(500);
  const cam = await pg.evaluate(() => ({ pedidos: window.__pedidos, abertas: window.__fluxos.flatMap((f) => f.getTracks()).filter((t) => t.readyState !== 'ended').length }));
  afirma('câmera: pedida só no clique, SEM microfone (audio: false); "Usar foto" põe na fila; a câmera desliga', cam.pedidos.length === 1 && /"audio":false/.test(cam.pedidos[0]) && cam.abertas === 0 && (await nomes(pg)).some((n) => /^camera-\d+\.jpg$/.test(n)), JSON.stringify(cam));
  await pg.screenshot({ path: `${CAP}/fila-colar-arrastar-heic-camera.png` });
  await pg.click(`${dlg} button:has-text("Fechar")`); await pg.waitForTimeout(300);
  await pg.click('.at-fixo button[role="tab"]:has-text("Fotos")'); await pg.waitForSelector('.at-fotos-ger');
  const n0 = s.posts.length;
  await pg.click('.at-fotos-ger__item[data-foto="802"] button:has-text("Definir como principal")'); await pg.waitForTimeout(600);
  afirma('"Definir como principal" → POST capa {id, versao} com chave própria', s.posts[n0]?.r === 'capa' && s.posts[n0].json.id === 802 && typeof s.posts[n0].json.versao === 'number' && !!(await pg.$('.at-fotos-ger__item[data-foto="802"] .at-fotos-ger__principal')));
  await pg.click('.at-fotos-ger__topo button:has-text("Reordenar")'); await pg.waitForTimeout(200);
  afirma('Reordenar: aviso "A primeira foto será a principal" + Salvar ordem / Cancelar', (await pg.textContent('.at-fotos-ger__topo')).includes('A primeira foto será a principal') && !!(await pg.$('.at-fotos-ger__topo button:has-text("Salvar ordem")')));
  await pg.click('.at-fotos-ger__grade li:nth-child(1) button[aria-label^="Mover a foto 1 para a direita"]'); await pg.click('.at-fotos-ger__topo button:has-text("Salvar ordem")'); await pg.waitForTimeout(600);
  const po = s.posts.at(-1); afirma('Salvar ordem → POST ordem {product_id, versao, ordem completa}', po.r === 'ordem' && po.json.product_id === P && po.json.ordem.length === 4);
  const nAntes = await pg.$$eval('.at-fotos-ger > .at-fotos-ger__grade > li', (x) => x.length);
  await pg.click('.at-fotos-ger__grade li:nth-child(1) button[aria-label^="Remover a foto 1"]'); await pg.waitForTimeout(600);
  await pg.click('.at-fotos-ger__topo button:has-text("Desfazer")'); await pg.waitForTimeout(600);
  const rr = s.posts.slice(-2); afirma('remover {id, versao} → "Desfazer" = restaurar com CHAVE NOVA; a foto volta', rr[0].r === 'remover' && rr[1].r === 'restaurar' && rr[0].chave !== rr[1].chave && (await pg.$$eval('.at-fotos-ger > .at-fotos-ger__grade > li', (x) => x.length)) === nAntes);
  s.plano = ['conflito']; await pg.click('.at-fotos-ger__grade li:nth-child(2) button:has-text("Definir como principal")').catch(() => {}); await pg.waitForTimeout(600);
  afirma('409 VERSION_CONFLICT → aviso de que as fotos mudaram (outra aba) e a galeria é relida', /mudaram/.test(await pg.textContent('.at-fotos-ger__topo')));
  await pg.screenshot({ path: `${CAP}/aba-fotos.png` });
  await pg.context().close();
  const p2 = await nova(`navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' }));`); await simular(p2, 'ok'); await abrir(p2);
  await p2.click('.at-resumo-v3__add'); await p2.setInputFiles('input[data-at-fotos-input]', [{ name: 'antes.png', mimeType: 'image/png', buffer: png(9) }]);
  await p2.click(`${dlg} button:has-text("Usar câmera")`); await p2.waitForSelector('[data-at-camera-erro]', { timeout: 8000 }).catch(() => {});
  const tErro = await p2.textContent('[data-at-camera-erro]').catch(() => '');
  await p2.click(`${dlg} button:has-text("Voltar e escolher arquivos")`); await p2.waitForTimeout(300);
  afirma('câmera bloqueada: mensagem do cadeado; volta ao diálogo com a foto já escolhida na fila e "Escolher arquivos" disponível', /bloqueou a câmera/.test(tErro) && JSON.stringify(await nomes(p2)) === '["antes.png"]' && !!(await p2.$(`${dlg} button:has-text("Escolher arquivos")`)));
  await p2.context().close();
  console.log(`FOTOS NA FICHA (contrato CONTRATO-PROXY-MIDIA v1.0, rotas simuladas): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
