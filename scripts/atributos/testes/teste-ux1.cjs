// Aceite do PACOTE UX-1 (só tela) no harness 8112, banco de validação. 1 navegador, 1 aba. Desfaz o que cria (vínculo avulso removido,
// atributo e kit de teste DESATIVADOS — nada é apagado). Uso: nice -n 10 node teste-ux1.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = 'http://127.0.0.1:8112';
let ok = 0, falhas = 0;
const afirma = (nome, cond, extra = '') => { if (cond) { ok++; console.log('ok    ' + nome); } else { falhas++; console.log('FALHA ' + nome + (extra ? ' · ' + extra : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const ir = async (rota, sel) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/${rota}`); await pg.reload({ waitUntil: 'networkidle' }); if (sel) await pg.waitForSelector(sel, { timeout: 30000 }); await pg.waitForTimeout(700); };
  const api = (metodo, rota, corpo, params = {}) => pg.evaluate(async ([metodo, rota, corpo, params]) => {
    const t = (await (await fetch('/api/auth/check.php', { credentials: 'same-origin' })).json())?.data?.session?.csrf_token ?? '';
    const r = await fetch('/api/atributos/index.php?' + new URLSearchParams({ r: rota, ...params }), { method: metodo, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t }, body: metodo === 'POST' ? JSON.stringify(corpo) : undefined });
    let j = null; try { j = await r.json(); } catch {} return { status: r.status, j }; }, [metodo, rota, corpo, params]);
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });

  // 1. FICHA 154 — sem trocar de aba: onde adicionar e onde digitar
  await ir('#/panel-atributos/produto/154', '.at-ficha');
  const abaAtiva = await pg.$eval('.at-abas [aria-selected="true"]', (e) => e.textContent);
  afirma('Ficha: abre na aba Atributos com o botão "Adicionar atributo a este produto" à vista', /^Atributos/.test(abaAtiva) && !!(await pg.$('button:has-text("Adicionar atributo a este produto")')));
  afirma('Ficha: colunas "Valor DSHOW" e "Referência do Precifica · somente leitura"', await pg.$eval('.at-tabela-ficha thead', (e) => e.textContent.includes('Valor DSHOW') && e.textContent.includes('Referência do Precifica · somente leitura')));
  afirma('Ficha: aviso de preço fora do cabeçalho', !(await pg.$eval('.at-fontes', (e) => /Preço/.test(e.textContent))));
  await pg.click('button:has-text("Detalhes")'); await pg.waitForTimeout(300);
  afirma('Ficha: aviso de preço em Detalhes', await pg.$eval('.at-portal-modal [role="dialog"]', (e) => /Preço/.test(e.textContent) && /Precifica/.test(e.textContent))); await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  await pg.click('button:has-text("Adicionar atributo a este produto")'); await pg.waitForSelector('.at-portal-modal [role="dialog"][aria-label="Adicionar atributo a este produto"]');
  afirma('Ficha: o botão abre o MESMO seletor de Vínculos (aplicar kit + atributo avulso)', !!(await pg.$('.at-portal-modal [role="dialog"] select[aria-label="Kit para aplicar"]')) && !!(await pg.$('.at-portal-modal [role="dialog"] button:has-text("Adicionar atributo avulso")')));
  await pg.click('.at-portal-modal [role="dialog"] button:has-text("Adicionar atributo avulso")'); await pg.waitForSelector('.at-portal-modal [role="dialog"][aria-label="Adicionar atributo avulso a este produto"] input[type=radio]', { timeout: 20000 });
  await pg.selectOption('[aria-label="Adicionar atributo avulso a este produto"] select[aria-label="Tipo"]', 'texto'); await pg.waitForTimeout(300);
  const radio = pg.locator('[aria-label="Adicionar atributo avulso a este produto"] input[type=radio]').first(); await radio.check();
  const nomeEscolhido = (await pg.locator('[aria-label="Adicionar atributo avulso a este produto"] label.ativo strong').first().textContent()).trim();
  await pg.click('[aria-label="Adicionar atributo avulso a este produto"] button:has-text("Adicionar")');
  await pg.waitForTimeout(2500);
  const foco = await pg.evaluate(() => { const a = document.activeElement; const l = a?.closest('[data-atributo]'); return { tag: a?.tagName, atributo: l?.getAttribute('data-atributo'), rotulo: (l?.closest('tr') ?? l)?.querySelector('.at-attr__rotulo')?.textContent }; });
  afirma(`Ficha: depois de adicionar ("${nomeEscolhido}"), o campo novo aparece JÁ COM FOCO para digitar`, foco.tag === 'INPUT' && (foco.rotulo || '').startsWith(nomeEscolhido), JSON.stringify(foco));
  await pg.screenshot({ path: 'capturas-ux1/depois-1b-ficha-campo-novo-com-foco.png' });
  if (foco.atributo) { const vv = (await api('GET', 'ficha_produto', null, { product_id: 154 })).j.data.versao_vinculos; const d = await api('POST', 'produto_atributo', { product_id: 154, atributo_id: Number(foco.atributo), modo: null, versao_vinculos: vv });
    afirma('Ficha: limpeza — vínculo avulso de teste removido', d.status === 200, String(d.status)); }

  // 2. PRODUTOS
  await ir('#/panel-atributos', 'input[type="search"]');
  afirma('Produtos: texto de abertura novo', (await pg.$eval('.at-cabecalho p', (e) => e.textContent.trim())) === 'Busque pelo nome ou código. Clique no produto para abrir a ficha.');
  await pg.click('button.at-filtro:has-text("Sem foto")'); await pg.fill('input[type="search"]', 'zzqx tubo'); await pg.waitForTimeout(700);
  const bt = await pg.$('button:has-text("em todo o catálogo")');
  afirma('Produtos: busca vazia com filtros → "Nenhum produto encontrado com estes filtros." + "Buscar ‘termo’ em todo o catálogo" (inclui inativos)', !!(await pg.$('text=Nenhum produto encontrado com estes filtros.')) && !!bt && (await bt.textContent()).includes('‘zzqx tubo’') && !!(await pg.$('text=inclui produtos inativos')));
  await bt.click(); await pg.waitForTimeout(600);
  afirma('Produtos: o botão mantém o termo, tira os filtros e inclui inativos', (await pg.inputValue('input[type="search"]')) === 'zzqx tubo' && (await pg.$eval('select[aria-label="Situação"]', (s) => s.value)) === 'todos' && !(await pg.$('button.at-filtro--ativo')));
  await pg.fill('input[type="search"]', ''); await pg.waitForTimeout(500);
  const marcar = pg.locator('label.at-cartao__marcar').first();
  await marcar.click(); await pg.waitForTimeout(400);
  afirma('Produtos: clicar em "Selecionar" marca o produto e NÃO abre a ficha', !(await pg.$('.at-ficha')) && (await pg.locator('article.at-cartao--sel').count()) === 1);
  await marcar.click(); await pg.waitForTimeout(300);
  await pg.locator('button.at-cartao__abrir').first().click(); await pg.waitForSelector('.at-ficha', { timeout: 15000 }).catch(() => {});
  afirma('Produtos: clicar no cartão abre a ficha', !!(await pg.$('.at-ficha')));

  // 3. PREENCHER (kit Cabos)
  await ir('#/panel-atributos/preencher', 'select[aria-label="Kit"]');
  const opt = await pg.$$eval('select[aria-label="Kit"] option', (os) => os.find((o) => o.textContent.startsWith('Cabos'))?.value);
  await pg.selectOption('select[aria-label="Kit"]', opt); await pg.waitForSelector('table.at-tabela--grade', { timeout: 40000 }); await pg.waitForTimeout(1500);
  const pre = await pg.evaluate(() => ({ preencher: [...document.querySelectorAll('.at-tabela--grade input[placeholder="Preencher"], .at-tabela--grade select option')].filter((e) => e.tagName === 'INPUT' || e.textContent === 'Preencher').length,
    estrelaCab: [...document.querySelectorAll('.at-tabela--grade thead .at-obrig')].length, etiquetaCel: [...document.querySelectorAll('.at-tabela--grade tbody')].some((t) => /\bobrigatório\b/.test(t.textContent)),
    fora: document.querySelectorAll('.at-fora-ficha').length, travessao: [...document.querySelectorAll('.at-grade-cel > span.at-fraco')].filter((e) => e.textContent.trim() === '—').length,
    sugestao: [...document.querySelectorAll('.at-sugestao--cel')].map((e) => e.textContent.trim()).slice(0, 1) }));
  afirma('Preencher: células vazias editáveis dizem "Preencher"', pre.preencher > 0, JSON.stringify(pre));
  afirma('Preencher: uma só marcação de obrigatório (sem "*" no cabeçalho e sem etiqueta na célula; fica o texto "Obrigatório" da coluna)', pre.estrelaCab === 0 && !pre.etiquetaCel);
  afirma('Preencher: sem vínculo = "Fora da ficha" (nenhum "—" solto)', pre.travessao === 0, `fora=${pre.fora}`);
  console.log(`info  Preencher (Cabos): ${pre.fora} célula(s) "Fora da ficha"; sugestão: ${pre.sugestao[0] ?? '(nenhuma na grade)'}`);

  // 4. ATRIBUTOS (novo, com opções)
  await ir('#/panel-atributos/atributos', 'button:has-text("Novo atributo")'); await pg.click('button:has-text("Novo atributo")'); await pg.waitForSelector('.at-portal-modal [role="dialog"]');
  const dlg = await pg.$eval('.at-portal-modal [role="dialog"]', (e) => e.textContent);
  afirma('Atributos: "Nome do atributo", "Como será preenchido?" e "Código gerado automaticamente" (sem campo de código)', dlg.includes('Nome do atributo') && dlg.includes('Como será preenchido?') && dlg.includes('Código gerado automaticamente') && !(await pg.$('.at-portal-modal [role="dialog"] input.at-dic-codigo')));
  const sel = await pg.$('.at-portal-modal [role="dialog"] select'); const vOp = await sel.evaluate((s) => [...s.options].find((o) => /op[cç]/i.test(o.textContent) && !/v[aá]rias|m[uú]lt/i.test(o.textContent))?.value); await sel.selectOption(vOp);
  const nomeAtr = `Teste UX-1 opções ${Date.now() % 100000}`;
  await pg.fill('.at-portal-modal [role="dialog"] label:has-text("Nome do atributo") input', nomeAtr);
  const btCriar = await pg.$('.at-portal-modal [role="dialog"] button:has-text("Criar e cadastrar opções")');
  afirma('Atributos: tipo com opções → botão "Criar e cadastrar opções"', !!btCriar);
  await btCriar.click(); await pg.waitForSelector('.at-portal-modal [role="dialog"] input[aria-label="Nova opção"]', { timeout: 20000 }); await pg.waitForTimeout(800);
  afirma('Atributos: depois de criar, o foco vai direto para "Nova opção"', await pg.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Nova opção'));
  await pg.screenshot({ path: 'capturas-ux1/depois-4c-atributo-foco-nova-opcao.png' });
  const atr = (await api('GET', 'dicionario')).j.data.atributos.find((a) => a.rotulo === nomeAtr);
  if (atr) { const r = await api('POST', 'atributo_ativo', { id: atr.id, ativo: 0, versao: atr.versao, motivo: 'atributo de teste UX-1 (desativado)' }); afirma('Atributos: limpeza — atributo de teste desativado', r.status === 200, String(r.status)); }

  // 5. KITS (novo)
  await ir('#/panel-atributos/kits', 'button:has-text("Criar kit")'); await pg.click('button:has-text("Criar kit")'); await pg.waitForSelector('.at-portal-modal [role="dialog"]');
  afirma('Kits: "Aplica a todos os produtos" saiu da criação', !(await pg.$eval('.at-portal-modal [role="dialog"]', (e) => e.textContent.includes('Aplica a todos os produtos') && !!e.querySelector('input[type=checkbox]'))));
  await pg.fill('.at-portal-modal [role="dialog"] input', `Kit teste UX-1 ${Date.now() % 100000}`); await pg.click('.at-portal-modal [role="dialog"] button:has-text("Criar kit")');
  await pg.waitForSelector('text=Kit criado. Escolha os atributos que ele terá.', { timeout: 20000 }).catch(() => {});
  afirma('Kits: kit recém-criado e vazio → "Kit criado. Escolha os atributos que ele terá." + "Escolher atributos"', !!(await pg.$('text=Kit criado. Escolha os atributos que ele terá.')) && !!(await pg.$('button:has-text("Escolher atributos")')));
  await pg.click('button:has-text("Escolher atributos")'); await pg.waitForSelector('.at-portal-modal [role="dialog"] input[type=checkbox]', { timeout: 20000 });
  afirma('Kits: no seletor, "Usar seleção (0)" desligado', await pg.$eval('.at-portal-modal [role="dialog"] button:has-text("Usar seleção")', (e) => e.textContent.includes('(0)') && e.disabled));
  await pg.locator('.at-portal-modal [role="dialog"] input[type=checkbox]').first().check();
  afirma('Kits: marcou 1 → "Usar seleção (1)"', await pg.$eval('.at-portal-modal [role="dialog"] button:has-text("Usar seleção")', (e) => e.textContent.includes('(1)') && !e.disabled));
  await pg.click('.at-portal-modal [role="dialog"] button:has-text("Usar seleção")'); await pg.waitForTimeout(500);
  afirma('Kits: na seção do kit, "Salvar atributos do kit"', !!(await pg.$('button:has-text("Salvar atributos do kit")')) && !(await pg.$('button:has-text("Salvar itens")')));
  const kid = Number((await pg.evaluate(() => location.hash)).split('/').pop());
  if (kid > 0) { const k = (await api('GET', 'kit', null, { id: kid })).j.data.kit; const r = await api('POST', 'kit_ativo', { id: kid, versao: k.versao, ativo: 0, motivo: 'kit de teste UX-1 (desativado)' }); afirma('Kits: limpeza — kit de teste desativado', r.status === 200, String(r.status)); }

  // 6. VISÃO GERAL: o número do cartão = o total da lista aberta
  await ir('#/panel-atributos/visao-geral', '.at-resumo');
  const cart = await pg.evaluate(() => { const c = [...document.querySelectorAll('.at-resumo *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'sem kit específico'); const box = c?.closest('button, a, [role=button], div'); return box ? { n: box.closest('button, a, [role=button]')?.textContent || box.parentElement?.textContent } : null; });
  const numCartao = Number(((cart?.n || '').match(/\d+/) || [])[0]);
  await pg.click('text=sem kit específico'); await pg.waitForSelector('.at-filtros__total', { timeout: 20000 }); await pg.waitForTimeout(600);
  const totalLista = Number((await pg.$eval('.at-filtros__total', (e) => e.textContent)).match(/\d+/)[0]);
  afirma(`Visão geral: cartão "sem kit específico" (${numCartao}) = total da lista aberta (${totalLista}), filtro "Sem kit"`, numCartao > 0 && numCartao === totalLista && !!(await pg.$('button.at-filtro--ativo:has-text("Sem kit")')));
  console.log(`UX-1: ${ok} ok, ${falhas} falhas`);
  await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message); process.exit(2); });
