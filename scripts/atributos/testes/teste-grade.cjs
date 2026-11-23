// UX-1 · grade do Preencher (harness 8112, banco de validação). 1 navegador, 1 aba. Desfaz o que grava. Uso: nice -n 10 node teste-grade.cjs
// O limite de Profundidade (394) é posto/retirado pelo roteiro de fora (maximo = 1000 mm).
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = `http://127.0.0.1:${process.env.PORTA || 8112}`;
let ok = 0, falhas = 0;
const afirma = (nome, cond, extra = '') => { if (cond) { ok++; console.log('ok    ' + nome); } else { falhas++; console.log('FALHA ' + nome + (extra ? ' · ' + extra : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const ir = async (rota, sel) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/${rota}`); await pg.reload({ waitUntil: 'networkidle' }); if (sel) await pg.waitForSelector(sel, { timeout: 30000 }); await pg.waitForTimeout(600); };
  const api = (metodo, rota, corpo, params = {}) => pg.evaluate(async ([metodo, rota, corpo, params]) => {
    const t = (await (await fetch('/api/auth/check.php', { credentials: 'same-origin' })).json())?.data?.session?.csrf_token ?? '';
    const r = await fetch('/api/atributos/index.php?' + new URLSearchParams({ r: rota, ...params }), { method: metodo, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t }, body: metodo === 'POST' ? JSON.stringify(corpo) : undefined });
    let j = null; try { j = await r.json(); } catch {} return { status: r.status, j }; }, [metodo, rota, corpo, params]);
  const ficha = async (pid) => (await api('GET', 'ficha_produto', null, { product_id: pid })).j.data;
  const it = (f, aid) => f.itens.find((i) => i.atributo_id === aid);
  const valorTxt = (f, aid) => { const i = it(f, aid); const v = i?.valor; if (!v) return 'vazio'; const u = (i.unidades || []).find((x) => x.id === v.unidade_id); return v.numero !== null ? `${Number(v.numero)}${u ? ' ' + u.simbolo : ''}` : v.texto ?? v.estado; };
  const limpar = async (pid, aid) => { const i = it(await ficha(pid), aid); if (i?.valor) await api('POST', 'valor_limpar', { product_id: pid, atributo_id: aid, versao: i.valor.versao, versao_conjunto: i.versao_conjunto }); };
  const grade = async (kitNome) => { await ir('#/panel-atributos/preencher', 'select[aria-label="Kit"]'); const v = await pg.$$eval('select[aria-label="Kit"] option', (os, n) => os.find((o) => o.textContent.startsWith(n))?.value, kitNome); await pg.selectOption('select[aria-label="Kit"]', v); await pg.waitForSelector('.pv2-corpo__rola > .pv2-linha, table.at-tabela--grade tbody tr', { timeout: 60000 }); await pg.waitForTimeout(1200); };
  const pidLinha = (l) => pg.$eval(`.pv2-corpo__fixo > .pv2-linha--fixa:nth-child(${l + 1}) .pv2-td--id, table.at-tabela--grade tbody tr:nth-child(${l + 1}) td.at-fixa--2`, (e) => Number(e.textContent));   // V2: painel fixo
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const A = 394;   // Profundidade (mm; cm/m/mm), no kit Cabos

  // ---- 1. teclado: setas no seletor de unidade não mudam de linha
  await grade('Cabos');
  const [p0, p1] = [await pidLinha(0), await pidLinha(1)];
  await limpar(p0, A); await limpar(p1, A);
  await api('POST', 'valor', { product_id: p1, atributo_id: A, valor: '8', estado: 'informado' });   // valor anterior da 2ª linha
  await grade('Cabos');
  const selU = `[data-l="0"][data-c="${A}"] select`;
  await pg.focus(selU);
  const ops = await pg.$$eval(`${selU} option`, (os) => os.map((o) => o.textContent)); const atual = await pg.$eval(selU, (s) => s.options[s.selectedIndex].textContent);
  const passos = ops.indexOf('cm') - ops.indexOf(atual);
  for (let k = 0; k < Math.abs(passos); k++) { await pg.keyboard.press(passos > 0 ? 'ArrowDown' : 'ArrowUp'); await pg.waitForTimeout(150); }
  const focoAinda = await pg.evaluate(() => { const td = document.activeElement?.closest('[data-l]'); return td ? `${td.dataset.l}/${td.dataset.c}/${document.activeElement.tagName}` : null; });
  afirma('teclado: setas no seletor de unidade ficam no seletor (foco continua na 1ª linha)', focoAinda === `0/${A}/SELECT` && (await pg.$eval(selU, (s) => s.options[s.selectedIndex].textContent)) === 'cm', `${focoAinda} ${await pg.$eval(selU, (s) => s.options[s.selectedIndex].textContent)}`);
  await pg.focus(`[data-l="0"][data-c="${A}"] input`); await pg.keyboard.type('15'); await pg.keyboard.press('Tab'); await pg.waitForTimeout(2500);
  const [f0, f1] = [await ficha(p0), await ficha(p1)];
  afirma(`teclado: reabrir as fichas — 1ª (${p0}) = 15 cm; 2ª (${p1}) com o valor anterior intacto (8 mm)`, valorTxt(f0, A) === '15 cm' && valorTxt(f1, A) === '8 mm', `${valorTxt(f0, A)} / ${valorTxt(f1, A)}`);
  await limpar(p0, A); await limpar(p1, A);

  // ---- 2. Enter: acima do limite fica e explica; corrigido salva e desce UMA linha
  await grade('Cabos');
  const p2 = await pidLinha(2); await limpar(p2, A); await grade('Cabos');
  const inp2 = `[data-l="2"][data-c="${A}"] input`;
  await pg.focus(inp2); await pg.keyboard.type('5000'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(2500);
  const ctx2 = await pg.evaluate(() => { const td = document.activeElement?.closest('[data-l]'); return { foco: td ? `${td.dataset.l}` : null, motivo: td?.querySelector('.at-salvo__motivo')?.textContent || '' }; });
  afirma('Enter com valor acima do limite: o foco FICA na linha e o motivo aparece ao lado', ctx2.foco === '2' && ctx2.motivo.length > 5 && valorTxt(await ficha(p2), A) === 'vazio', JSON.stringify(ctx2));
  await pg.fill(inp2, '50'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(2500);
  const ctx3 = await pg.evaluate(() => { const td = document.activeElement?.closest('[data-l]'); return td ? td.dataset.l : null; });
  afirma('corrigido + Enter: salva (50 mm) e desce UMA linha (foco na linha 3)', valorTxt(await ficha(p2), A) === '50 mm' && ctx3 === '3', `${valorTxt(await ficha(p2), A)} foco=${ctx3}`);
  await limpar(p2, A);

  // ---- 3. sugestão de TEXTO "00154": igual na Ficha e na grade; aceita → "00154"
  const fs = await ficha(p0); const txt = fs.itens.find((i) => i.tipo === 'texto' && !i.valor && i.kit === 'Cabos' && i.atributo_ativo);
  const ins = await pg.evaluate(async ([pid, aid]) => ({ pid, aid }), [p0, txt.atributo_id]);
  console.log(`info  sugestão de teste: produto ${ins.pid}, atributo "${txt.rotulo}" (${txt.atributo_id}) — inserida pelo roteiro de fora`);
  require('child_process').execFileSync('mysql', [`--defaults-extra-file=/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini`, 'ATRWEB_VAL_EQ', '-e',
    `INSERT INTO eq_sugestao (chave, product_id, atributo_id, fonte, tipo, valor_proposto, evidencia) VALUES ('ux1-00154-${Date.now()}', ${p0}, ${txt.atributo_id}, 'nome_produto', 'valor', '00154', 'teste UX-1')`]);
  await grade('Cabos');
  const naGrade = await pg.$eval(`[data-l="0"][data-c="${txt.atributo_id}"]`, (e) => e.querySelector('.at-sugestao--cel')?.textContent || e.querySelector('.pv2-sugestao')?.getAttribute('title') || '').catch(() => '');
  await ir(`#/panel-atributos/produto/${p0}`, '.at-ficha');
  const naFicha = await pg.$eval(`[data-atributo="${txt.atributo_id}"] .at-sugestao__val`, (e) => e.textContent.trim()).catch(() => '');
  afirma('sugestão de texto "00154": aparece igual na grade e na Ficha', naGrade.includes('Sugestão: 00154') && naFicha === '00154', `grade="${naGrade}" ficha="${naFicha}"`);
  await pg.click(`[data-atributo="${txt.atributo_id}"] button:has-text("Usar")`); await pg.waitForTimeout(2000);
  afirma('depois do aceite, a ficha mostra "00154"', valorTxt(await ficha(p0), txt.atributo_id) === '00154', valorTxt(await ficha(p0), txt.atributo_id));
  await limpar(p0, txt.atributo_id);

  // ---- 4. obrigatório por produto (Largura 406 no kit Fontes): kit de teste com Largura OBRIGATÓRIA aplicado a um produto só
  const L = 406;
  const kitR = await api('POST', 'kit', { nome: `Obrig UX-1 ${Date.now() % 100000}`, aplica_a_todos: 0 }); const kid = kitR.j.data.kit.id;
  const kv = (await api('GET', 'kit', null, { id: kid })).j.data.kit.versao;
  await api('POST', 'kit_itens', { id: kid, versao: kv, itens: [{ atributo_id: L, obrigatorio: 1 }] });
  const marcas = async () => pg.evaluate((L) => ({ cab: (() => { const th = [...document.querySelectorAll('.pv2-cab .pv2-th, table.at-tabela--grade thead th')].find((x) => x.textContent.includes('Largura')); const rot = th?.querySelector('.pv2-th__rot'); return rot ? rot.textContent + (rot.querySelector('.at-obrig') ? ' Obrigatório' : '') : th?.textContent || ''; })(),   // V2: rótulo visível + '*' (a ajuda para leitor de tela explica 'em parte dos produtos')
    cel: (document.querySelector('.pv2-grade') ? [...document.querySelectorAll('.pv2-corpo__fixo > .pv2-linha--fixa')].map((fx, l) => ({ l, pid: Number(fx.querySelector('.pv2-td--id')?.textContent), obrig: !!document.querySelectorAll('.pv2-corpo__rola > .pv2-linha')[l]?.querySelector(`[data-c="${L}"] .pv2-cel-obrig`) }))
      : [...document.querySelectorAll(`table.at-tabela--grade tbody tr`)].map((tr, l) => ({ l, pid: Number(tr.querySelector('td.at-fixa--2')?.textContent), obrig: !!tr.querySelector(`td[data-c="${L}"] .at-cel-obrig`) }))) }), L);
  for (const linhaB of [1, 0]) {   // B = 2ª linha; depois inverte: B = 1ª linha
    await grade('Fontes');
    const pre = await marcas();
    const pB = pre.cel[linhaB].pid;
    const vv = (await ficha(pB)).versao_vinculos;
    await api('POST', 'produto_kit', { product_id: pB, versao_vinculos: vv, grupo_id: kid, ativo: 1 });
    await grade('Fontes');
    const m = await marcas();
    afirma(`obrigatório por produto (B na linha ${linhaB + 1}): cabeçalho SEM "Obrigatório"; só a célula de B marcada`, !m.cab.includes('Obrigatório') && m.cel.filter((x) => x.obrig).map((x) => x.pid).join(',') === String(pB), JSON.stringify({ cab: m.cab.slice(0, 60), marcadas: m.cel.filter((x) => x.obrig).map((x) => x.pid), pB }));
    const vv2 = (await ficha(pB)).versao_vinculos; await api('POST', 'produto_kit', { product_id: pB, versao_vinculos: vv2, grupo_id: kid, ativo: 0 });
  }
  const kv2 = (await api('GET', 'kit', null, { id: kid })).j.data.kit.versao; await api('POST', 'kit_ativo', { id: kid, versao: kv2, ativo: 0, motivo: 'kit de teste UX-1 (desativado)' });

  // ---- 5. DSHOW-067: 1ª carga da grade falha → "Tentar novamente" → os dois produtos selecionados aparecem (seleção mantida)
  await ir('#/panel-atributos', 'label.at-cartao__sel, label.at-cartao__marcar');
  await pg.locator('label.at-cartao__sel, label.at-cartao__marcar').nth(0).click(); await pg.locator('label.at-cartao__sel, label.at-cartao__marcar').nth(1).click(); await pg.waitForTimeout(300);
  let falhar = true;
  await pg.route('**/api/atributos/**', async (route) => { if (falhar && route.request().url().includes('ficha_produto')) { falhar = false; return route.abort('connectionreset'); } return route.continue(); });
  await pg.click('button.at-nav__item:has-text("Preencher")');
  await pg.waitForSelector('button:has-text("Tentar novamente"), button:has-text("Tentar de novo")', { timeout: 30000 }).catch(() => {});
  const temErro = !!(await pg.$('.at-erro-bloco'));
  afirma('DSHOW-067: 1ª carga falha → mensagem com "Tentar novamente" (sem "carregando" eterno), seleção mantida', temErro && !(await pg.$('text=Montando a grade')));
  await pg.click('.at-erro-bloco button'); await pg.waitForSelector('.pv2-corpo__rola > .pv2-linha, table.at-tabela--grade tbody tr', { timeout: 40000 }).catch(() => {});
  afirma('DSHOW-067: retentativa ok → os DOIS produtos aparecem', (await pg.locator('.pv2-corpo__rola > .pv2-linha, table.at-tabela--grade tbody tr').count()) === 2);
  await pg.unroute('**/api/atributos/**');
  console.log(`GRADE (UX-1): ${ok} ok, ${falhas} falhas`);
  await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
