// FOTOS NA FICHA (CIMA, 19/11) · teste LEVE da tela (2200×1470, flags de shell da produção). O proxy /api/midia (DIREITA) ainda não existe:
// as rotas são SIMULADAS (route) pelo contrato PROVISÓRIO da tela (lib/fotos.ts). Quando sair /srv/dshow-docs/briefings/CONTRATO-PROXY-MIDIA.md,
// esta simulação passa a seguir ESSE contrato. Nada vai ao app. Cenários: flag do app desligada (404) e usuário fora da publicação (403) = sem
// botões; publicador (o 75 na 1ª entrega): arquivo, ordem, principal, estados por foto (salvo / resposta perdida → Conferir / recusa), sem
// "Salvo" sem recibo, arrastar, colar, webcam (fake device), câmera negada/ausente, fechar com pendência, aba Fotos (capa, ordem, remover + Desfazer).
// Uso: PORTA=8112 flock … nice -n 10 node teste-fotos-ficha.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`; const CAP = 'capturas-fotos'; require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const png = (n) => Buffer.concat([PNG, Buffer.alloc(n, 7)]);   // bytes diferentes por arquivo (o PNG continua válido)
const P = 552;
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const nova = async (init) => { const ctx = await b.newContext({ viewport: { width: 2200, height: 1470 }, deviceScaleFactor: 1, permissions: ['camera'] }); if (init) await ctx.addInitScript(init); const pg = await ctx.newPage();
    await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 }); return pg; };
  const abrir = async (pg) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/#/panel-atributos/produto/${P}`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-resumo-v3', { timeout: 40000 }); await pg.waitForTimeout(1200); };
  // ── simulação do proxy (contrato provisório)
  const simular = async (pg, modo) => {
    const s = { versao: 3, fotos: [{ id: 9001, capa: true, posicao: 1, origem: 'precifica', autor_user_id: null, criado_em: '2026-10-01T10:00:00Z', largura: 800, altura: 600, cor: 'dddddd' }], removidas: [], posts: [], gets: [], proxId: 9100, plano: [] };
    await pg.route('**/api/midia/index.php?**', async (route) => {
      const u = new URL(route.request().url()); const r = u.searchParams.get('r'); const h = route.request().headers(); const m = route.request().method();
      if (r === 'foto') return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
      if (r === 'fotos') { if (modo === 'desligado') return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'NOT_FOUND', meta: { message: 'Recurso não disponível.' } }) });
        if (modo === 'sem75') return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'FORBIDDEN', meta: { message: 'Seu usuário não publica fotos.' } }) });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { produto: { id: P, nome: 'Produto', ativo: true, pode_receber_foto: true }, versao_galeria: s.versao, limite_fotos: 20, fotos: s.fotos, removidas: s.removidas } }) }); }
      if (r === 'conferir_gravacao') { s.gets.push(u.searchParams.get('chave')); const p = s.posts.find((x) => x.chave === u.searchParams.get('chave') && x.recibo);
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: p ? { estado: 'aplicada', operacao: 'publicar', desfecho: 'aplicada', recibo: p.recibo } : { estado: 'nao_encontrada' } }) }); }
      if (m !== 'POST') return route.continue();
      const corpo = route.request().postDataBuffer(); const reg = { r, chave: h['x-chave-operacao'], bytes: corpo ? corpo.length : 0, json: r !== 'foto_enviar' ? JSON.parse(route.request().postData() || '{}') : null }; s.posts.push(reg);
      const acao = s.plano.length ? s.plano.shift() : 'ok';
      if (acao === 'perdida') { s.versao++; const id = s.proxId++; s.fotos.push({ id, capa: false, posicao: s.fotos.length + 1, origem: 'dshow', autor_user_id: 75, autor_nome: 'Jhony', criado_em: new Date().toISOString(), largura: 1, altura: 1, cor: null });
        reg.recibo = { operacao: 'publicar', chave: reg.chave, desfecho: 'aplicada', confirmado_em: 'x', foto_id: id, produto_id: P, versao_nova: s.versao, duplicada: false }; return route.abort('connectionreset'); }   // gravou, mas a resposta se perdeu
      if (acao === 'recusa') return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'INVALID_IMAGE', meta: { message: 'O arquivo não é uma imagem válida.', desfecho: 'recusada' } }) });
      if (acao === 'semrecibo') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { desfecho: 'aplicada' } }) });
      if (acao === 'conflito') return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'VERSION_CONFLICT', meta: { message: 'As fotos mudaram.', desfecho: 'conflito' } }) });
      s.versao++; let fotoId = null;
      if (r === 'foto_enviar') { fotoId = s.proxId++; s.fotos.push({ id: fotoId, capa: false, posicao: s.fotos.length + 1, origem: 'dshow', autor_user_id: 75, autor_nome: 'Jhony', criado_em: new Date().toISOString(), largura: 1, altura: 1, cor: null }); }
      if (r === 'foto_capa') { fotoId = reg.json.foto_id; s.fotos.forEach((f) => { f.capa = f.id === fotoId; }); }
      if (r === 'foto_ordem') reg.json.ordem.forEach((id, k) => { const f = s.fotos.find((x) => x.id === id); if (f) f.posicao = k + 1; });
      if (r === 'foto_remover') { fotoId = reg.json.foto_id; const i = s.fotos.findIndex((x) => x.id === fotoId); if (i >= 0) s.removidas.push({ ...s.fotos.splice(i, 1)[0], removida_em: 'x', motivo: null }); }
      if (r === 'foto_restaurar') { fotoId = reg.json.foto_id; const i = s.removidas.findIndex((x) => x.id === fotoId); if (i >= 0) s.fotos.push({ ...s.removidas.splice(i, 1)[0], posicao: s.fotos.length + 1 }); }
      reg.recibo = { operacao: { foto_enviar: 'publicar', foto_capa: 'capa', foto_ordem: 'ordem', foto_remover: 'remover', foto_restaurar: 'restaurar' }[r], chave: reg.chave, desfecho: 'aplicada', confirmado_em: 'x', foto_id: fotoId, produto_id: P, versao_nova: s.versao, duplicada: false };
      return route.fulfill({ status: r === 'foto_enviar' ? 201 : 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { desfecho: 'aplicada', recibo: reg.recibo } }) });
    });
    return s;
  };
  const dlg = '.at-portal-modal [role="dialog"]';
  // (1) flag do app desligada e (2) usuário fora da publicação: nenhum botão de escrita
  for (const modo of ['desligado', 'sem75']) {
    const pg = await nova(); await simular(pg, modo); await abrir(pg);
    afirma(`${modo === 'desligado' ? 'flag PRODUCT_PHOTO_WEB_UPLOAD_ENABLED desligada (404)' : 'usuário fora da publicação (403)'}: sem "Adicionar fotos", sem dica de arrastar/colar; o carrossel da ficha continua`,
      !(await pg.$('.at-resumo-v3__add')) && !(await pg.$('.at-resumo-v3__dica')) && (await pg.textContent('.at-resumo-v3__contador')) === '1 de 1');
    await pg.click('.at-fixo button[role="tab"]:has-text("Fotos")'); await pg.waitForTimeout(400);
    afirma(`${modo}: aba Fotos sem gerenciar (somente leitura de sempre)`, !(await pg.$('.at-fotos-ger')));
    await pg.context().close();
  }
  // (3) publicador
  const pg = await nova(`{ const o = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); window.__fluxos = []; navigator.mediaDevices.getUserMedia = async (c) => { const f = await o(c); window.__fluxos.push(f); return f; }; }`); const s = await simular(pg, 'ok'); await abrir(pg);
  afirma('publicador: "Adicionar fotos" e a dica "Arraste fotos para cá ou cole com Ctrl+V" no resumo; carrossel pela galeria (1 de 1)', !!(await pg.$('.at-resumo-v3__add')) && !!(await pg.$('.at-resumo-v3__dica')) && (await pg.textContent('.at-resumo-v3__contador')) === '1 de 1');
  await pg.screenshot({ path: `${CAP}/1-resumo-publicador.png` });
  await pg.click('.at-resumo-v3__add'); await pg.waitForSelector(`${dlg}:has-text("Adicionar fotos")`);
  afirma('diálogo mostra o destino (ID + nome do produto)', /Produto ID 552 · /.test(await pg.textContent('.at-fotos-add__destino')));
  await pg.setInputFiles('input[data-at-fotos-input]', [{ name: 'a.png', mimeType: 'image/png', buffer: png(10) }, { name: 'b.png', mimeType: 'image/png', buffer: png(20) }, { name: 'c.png', mimeType: 'image/png', buffer: png(30) }]);
  await pg.waitForTimeout(400);
  const nomes = () => pg.$$eval('.at-fotos-fila__nome', (xs) => xs.map((x) => x.textContent.replace(/^\d+\.\s*/, '').split(' ')[0]));
  afirma('escolher 3 arquivos → 3 prévias na fila, na ordem', JSON.stringify(await nomes()) === '["a.png","b.png","c.png"]' && (await pg.$$('.at-fotos-fila__previa')).length === 3);
  await pg.click('button[aria-label="Subir c.png"]'); await pg.waitForTimeout(200);
  afirma('ordem: "Subir" troca a posição (a, c, b)', JSON.stringify(await nomes()) === '["a.png","c.png","b.png"]');
  await pg.locator('.at-fotos-fila__item').nth(1).locator('input[type=radio]').check();   // principal = c
  s.plano = ['ok', 'ok', 'perdida'];   // a → salvo, c → salvo, b → gravou mas a resposta se perdeu
  await pg.click(`${dlg} button:has-text("Enviar 3 fotos")`); await pg.waitForTimeout(1500);
  const estados = () => pg.$$eval('.at-fotos-fila__item', (xs) => xs.map((x) => x.dataset.atFotoFila));
  const env = s.posts.filter((p) => p.r === 'foto_enviar');
  afirma('3 envios na ORDEM da fila (a, c, b), uma chave diferente por arquivo', env.length === 3 && env.map((p) => p.bytes).join() === [png(10).length, png(30).length, png(20).length].join() && new Set(env.map((p) => p.chave)).size === 3, JSON.stringify(env.map((p) => [p.bytes, p.chave])));
  afirma('estados por foto: Salvo, Salvo, "Não conseguimos confirmar" (+ Conferir e Tentar de novo)', JSON.stringify(await estados()) === '["salvo","salvo","desconhecido"]' && !!(await pg.$('.at-fotos-fila__item--desconhecido button:has-text("Conferir gravação")')));
  const capa = s.posts.find((p) => p.r === 'foto_capa');
  afirma('foto principal (c): capa marcada com o foto_id do recibo de c, chave própria e a versão do último recibo', !!capa && capa.json.foto_id === env[1].recibo.foto_id && capa.json.versao === 5 && !env.some((p) => p.chave === capa.chave), JSON.stringify(capa?.json));
  await pg.screenshot({ path: `${CAP}/2-fila-estados.png` });
  await pg.click('.at-fotos-fila__item--desconhecido button:has-text("Conferir gravação")'); await pg.waitForTimeout(600);
  afirma('Conferir (só GET, mesma chave de b) → Salvo pelo recibo ORIGINAL; nenhum POST novo', s.gets.at(-1) === env[2].chave && JSON.stringify(await estados()) === '["salvo","salvo","salvo"]' && s.posts.filter((p) => p.r === 'foto_enviar').length === 3);
  // recusa e "sem recibo"
  await pg.setInputFiles('input[data-at-fotos-input]', [{ name: 'd.png', mimeType: 'image/png', buffer: png(40) }, { name: 'e.png', mimeType: 'image/png', buffer: png(50) }]);
  s.plano = ['recusa', 'semrecibo']; await pg.click(`${dlg} button:has-text("Enviar 2 fotos")`); await pg.waitForTimeout(1200);
  const st2 = await estados(); const txt = await pg.textContent('.at-fotos-fila');
  afirma('recusa: "Não foi salvo · O arquivo não é uma imagem válida."; 2xx SEM recibo: nunca "Salvo" (Não conseguimos confirmar)', st2[3] === 'recusada' && txt.includes('O arquivo não é uma imagem válida.') && st2[4] === 'desconhecido', JSON.stringify(st2));
  afirma('a foto principal NÃO é remarcada num segundo envio do mesmo diálogo', s.posts.filter((p) => p.r === 'foto_capa').length === 1);
  const chaveE = s.posts.filter((p) => p.r === 'foto_enviar').at(-1).chave;
  await pg.click('.at-fotos-fila__item--desconhecido button:has-text("Tentar de novo")'); await pg.waitForTimeout(600);
  afirma('"Tentar de novo" reenvia com a MESMA chave', s.posts.at(-1).chave === chaveE && s.posts.at(-1).r === 'foto_enviar');
  // fechar com pendência (d recusada continua na fila) → confirmação
  await pg.click(`${dlg} button:has-text("Fechar")`); await pg.waitForTimeout(300);
  afirma('fechar com foto ainda na fila/não confirmada → pede confirmação', !!(await pg.$(`${dlg}:has-text("Fechar com fotos não confirmadas?")`)));
  await pg.click(`${dlg} button:has-text("Fechar mesmo assim")`); await pg.waitForTimeout(800);
  afirma('depois de salvar, o carrossel do resumo mostra as fotos novas da galeria', /de [4-9]$/.test(await pg.textContent('.at-resumo-v3__contador')), await pg.textContent('.at-resumo-v3__contador'));
  // arrastar e soltar sobre o resumo
  const solta = async (sel, tipo) => pg.evaluate(([sel, tipo, b64]) => { const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const dt = new DataTransfer(); dt.items.add(new File([bin], 'arrastada.png', { type: 'image/png' }));
    const el = document.querySelector(sel); if (tipo === 'drop') { el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); }
    else { const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }); el.dispatchEvent(ev); } }, [sel, tipo, png(60).toString('base64')]);
  await solta('.at-resumo-v3', 'drop'); await pg.waitForTimeout(500);
  afirma('arrastar uma foto para o resumo → abre "Adicionar fotos" com ela na fila', JSON.stringify(await nomes()) === '["arrastada.png"]');
  await pg.click(`${dlg} button:has-text("Fechar")`); await pg.click(`${dlg} button:has-text("Fechar mesmo assim")`).catch(() => {}); await pg.waitForTimeout(400);
  await solta('body', 'paste'); await pg.waitForTimeout(500);
  afirma('colar (Ctrl+V) uma imagem na Ficha → abre "Adicionar fotos" com ela', JSON.stringify(await nomes()) === '["arrastada.png"]');
  // webcam (fake device): capturar → prévia → usar
  await pg.click(`${dlg} button:has-text("Tirar foto (webcam)")`); await pg.waitForSelector(`${dlg}:has-text("Tirar foto") video`, { timeout: 10000 }); await pg.waitForTimeout(1200);
  await pg.click(`${dlg} button:has-text("Capturar")`); await pg.waitForSelector('[data-at-webcam-previa]', { timeout: 5000 });
  afirma('webcam: prévia ao vivo → Capturar → prévia da foto', true);
  await pg.click(`${dlg} button:has-text("Usar esta foto")`); await pg.waitForTimeout(500);
  const nW = await nomes(); const vid = await pg.evaluate(() => ({ abertas: (window.__fluxos || []).flatMap((f) => f.getTracks()).filter((t) => t.readyState !== 'ended').length, fluxos: (window.__fluxos || []).length, videoNoDialogo: !!document.querySelector('.at-portal-modal video') }));
  afirma('webcam: "Usar esta foto" põe a captura na fila (webcam-….jpg) e a câmera desliga', nW.some((n) => /^webcam-\d+\.jpg$/.test(n)) && vid.fluxos >= 1 && vid.abertas === 0 && !vid.videoNoDialogo, JSON.stringify({ nW, vid }));
  await pg.screenshot({ path: `${CAP}/3-fila-colar-webcam.png` });
  await pg.click(`${dlg} button:has-text("Fechar")`); await pg.click(`${dlg} button:has-text("Fechar mesmo assim")`).catch(() => {}); await pg.waitForTimeout(400);
  // aba Fotos: capa, ordem, remover + Desfazer
  await pg.click('.at-fixo button[role="tab"]:has-text("Fotos")'); await pg.waitForSelector('.at-fotos-ger');
  const n0 = s.posts.length; const primeira = await pg.$eval('.at-fotos-ger__item:nth-child(2)', (e) => Number(e.dataset.foto));
  await pg.click('.at-fotos-ger__item:nth-child(2) button[aria-label^="Marcar a foto 2"]'); await pg.waitForTimeout(600);
  const pc = s.posts[n0]; afirma('aba Fotos: ☆ → foto_capa com a versão da galeria e chave própria; a foto vira "Principal"', pc?.r === 'foto_capa' && pc.json.foto_id === primeira && !!(await pg.$(`.at-fotos-ger__item--capa[data-foto="${primeira}"]`)));
  await pg.click('.at-fotos-ger__item:nth-child(1) button[aria-label^="Mover a foto 1 para a direita"]'); await pg.waitForTimeout(600);
  afirma('aba Fotos: → manda foto_ordem com a lista completa (as duas primeiras trocadas)', s.posts.at(-1).r === 'foto_ordem' && s.posts.at(-1).json.ordem.length === s.fotos.length);
  const nAntes = await pg.$$eval('.at-fotos-ger > .at-fotos-ger__grade > li', (x) => x.length);
  await pg.click('.at-fotos-ger__item:nth-child(1) button[aria-label^="Remover a foto 1"]'); await pg.waitForTimeout(600);
  afirma('remover → foto sai da grade e aparece "Desfazer"', (await pg.$$eval('.at-fotos-ger > .at-fotos-ger__grade > li', (x) => x.length)) === nAntes - 1 && !!(await pg.$('.at-fotos-ger__topo button:has-text("Desfazer")')));
  await pg.click('.at-fotos-ger__topo button:has-text("Desfazer")'); await pg.waitForTimeout(600);
  afirma('Desfazer → foto_restaurar com a versão do recibo da remoção; a foto volta', s.posts.at(-1).r === 'foto_restaurar' && (await pg.$$eval('.at-fotos-ger > .at-fotos-ger__grade > li', (x) => x.length)) === nAntes);
  s.plano = ['conflito']; await pg.click('.at-fotos-ger__item:nth-child(1) button[aria-label^="Mover a foto 1 para a direita"]'); await pg.waitForTimeout(600);
  afirma('conflito de versão → "As fotos deste produto mudaram…" e a galeria é relida', /mudaram desde que você abriu/.test(await pg.textContent('.at-fotos-ger__topo')));
  await pg.screenshot({ path: `${CAP}/4-aba-fotos.png` });
  await pg.context().close();
  // câmera negada / ausente
  for (const [nome, msg] of [['NotAllowedError', 'Permissão da câmera negada'], ['NotFoundError', 'Nenhuma câmera encontrada']]) {
    const p2 = await nova(`navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('x'), { name: '${nome}' }));`); await simular(p2, 'ok'); await abrir(p2);
    await p2.click('.at-resumo-v3__add'); await p2.click(`${dlg} button:has-text("Tirar foto (webcam)")`); await p2.waitForSelector('[data-at-webcam-erro]', { timeout: 8000 }).catch(() => {});
    afirma(`webcam ${nome}: "${msg}…" e o caminho de arquivo continua disponível`, ((await p2.textContent('[data-at-webcam-erro]').catch(() => '')) || '').includes(msg));
    await p2.context().close();
  }
  console.log(`FOTOS NA FICHA (rotas simuladas, contrato provisório): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
