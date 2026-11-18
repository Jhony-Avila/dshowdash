// UX-1 (a) e (b): coluna de origem mista no Preencher; "Obrigatórios pendentes" na Ficha pela lista do servidor.
// Harness 8112, banco de validação. 1 navegador, 1 aba. Kit de teste criado e DESATIVADO no fim; valores limpos. Uso: nice -n 10 node teste-ux1b.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = 'http://127.0.0.1:8112';
let ok = 0, falhas = 0;
const afirma = (nome, cond, extra = '') => { if (cond) { ok++; console.log('ok    ' + nome); } else { falhas++; console.log('FALHA ' + nome + (extra ? ' · ' + extra : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const ir = async (rota, sel) => { await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.goto(`${B}/${rota}`); await pg.reload({ waitUntil: 'networkidle' }); if (sel) await pg.waitForSelector(sel, { timeout: 40000 }); await pg.waitForTimeout(600); };
  const api = (metodo, rota, corpo, params = {}) => pg.evaluate(async ([metodo, rota, corpo, params]) => {
    const t = (await (await fetch('/api/auth/check.php', { credentials: 'same-origin' })).json())?.data?.session?.csrf_token ?? '';
    const r = await fetch('/api/atributos/index.php?' + new URLSearchParams({ r: rota, ...params }), { method: metodo, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t }, body: metodo === 'POST' ? JSON.stringify(corpo) : undefined });
    let j = null; try { j = await r.json(); } catch {} return { status: r.status, j }; }, [metodo, rota, corpo, params]);
  const ficha = async (pid) => (await api('GET', 'ficha_produto', null, { product_id: pid })).j.data;
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const P = 147;   // um produto do kit Cabos
  const f0 = await ficha(P);
  const geralOpc = f0.itens.filter((i) => !i.obrigatorio && i.origens.length === 1 && i.origens[0].tipo === 'kit' && (i.origens[0].motivos || []).every((x) => x.tipo === 'todos'));
  const [X, Xsó] = [geralOpc[0], geralOpc[1]];
  const dic = (await api('GET', 'dicionario')).j.data.atributos.filter((a) => a.ativo);
  const naFicha = new Set(f0.itens.map((i) => i.atributo_id));
  const livres = (tipo) => dic.filter((a) => a.tipo === tipo && !naFicha.has(a.id));
  const [T1, T2, T3] = livres('texto'); const N1 = livres('numero')[0]; const BO = livres('booleano')[0];
  // kit de teste: X (opcional, também no kit geral) + 5 obrigatórios para o item (b)
  const kid = (await api('POST', 'kit', { nome: `UX-1 teste ${Date.now() % 100000}`, aplica_a_todos: 0 })).j.data.kit.id;
  let kv = (await api('GET', 'kit', null, { id: kid })).j.data.kit.versao;
  const itens = [{ atributo_id: X.atributo_id, obrigatorio: 0 }, ...[T1, T2, T3, N1, BO].map((a) => ({ atributo_id: a.id, obrigatorio: 1 }))];
  const ri = await api('POST', 'kit_itens', { id: kid, versao: kv, itens });
  afirma('preparo: kit de teste com X (opcional) + 5 obrigatórios', ri.status === 200, JSON.stringify(ri.j?.error));
  await api('POST', 'produto_kit', { product_id: P, versao_vinculos: (await ficha(P)).versao_vinculos, grupo_id: kid, ativo: 1 });

  // (a) origem mista aparece pelo kit E por "Usar selecionados"; opcional só do kit geral não aparece por "Usar selecionados"
  const colunas = () => pg.$$eval('table.at-tabela--grade thead th', (ths) => ths.map((t) => t.textContent));
  await ir('#/panel-atributos/preencher', 'select[aria-label="Kit"]');
  const opt = await pg.$$eval('select[aria-label="Kit"] option', (os) => os.find((o) => o.textContent.startsWith('UX-1 teste'))?.value);
  await pg.selectOption('select[aria-label="Kit"]', opt); await pg.waitForSelector('table.at-tabela--grade', { timeout: 40000 }); await pg.waitForTimeout(800);
  afirma(`(a) pelo kit de teste: a coluna "${X.rotulo}" (origem mista) aparece`, (await colunas()).some((c) => c.includes(X.rotulo)));
  await ir('#/panel-atributos', 'label.at-cartao__marcar');
  await pg.fill('input[type="search"]', String(P)); await pg.waitForTimeout(600);
  await pg.locator('label.at-cartao__marcar').first().click(); await pg.waitForTimeout(300);
  await pg.click('button.at-nav__item:has-text("Preencher")'); await pg.waitForSelector('table.at-tabela--grade', { timeout: 40000 }); await pg.waitForTimeout(800);
  const cs = await colunas();
  afirma(`(a) por "Usar selecionados": "${X.rotulo}" (geral + kit de teste) aparece`, cs.some((c) => c.includes(X.rotulo)), cs.join(' | ').slice(0, 300));
  afirma(`(a) por "Usar selecionados": "${Xsó?.rotulo}" (opcional SÓ do kit geral) segue fora`, !Xsó || !cs.some((c) => c.includes(Xsó.rotulo)));

  // (b) "Obrigatórios pendentes" = lista do servidor: sem valor + Desconhecido; fora: Não se aplica, zero, "Não"
  await api('POST', 'valor', { product_id: P, atributo_id: T2.id, estado: 'desconhecido' });
  await api('POST', 'valor', { product_id: P, atributo_id: T3.id, estado: 'nao_se_aplica' });
  await api('POST', 'valor', { product_id: P, atributo_id: N1.id, valor: '0', estado: 'informado' });
  await api('POST', 'valor', { product_id: P, atributo_id: BO.id, valor: false, estado: 'informado' });
  const fb = await ficha(P);
  const nossos = new Set([T1.id, T2.id, T3.id, N1.id, BO.id]);
  const servNossos = fb.completude.obrigatorios_vazios.filter((id) => nossos.has(id)).sort();
  await ir(`#/panel-atributos/produto/${P}`, '.at-ficha');
  const rotPend = await pg.$eval('button:has-text("Obrigatórios pendentes")', (e) => e.textContent);
  await pg.click('button:has-text("Obrigatórios pendentes")'); await pg.waitForTimeout(400);
  const lista = [...new Set(await pg.$$eval('[data-atributo]', (ls) => ls.map((l) => Number(l.getAttribute('data-atributo')))))];   // UX-1b: cada célula marca data-atributo
  afirma('(b) servidor: dos 5 obrigatórios do teste, pendentes = sem valor + Desconhecido (2)', JSON.stringify(servNossos) === JSON.stringify([T1.id, T2.id].sort()), JSON.stringify(servNossos));
  afirma('(b) o contador do filtro "Obrigatórios pendentes" = o total do servidor', rotPend.includes(`(${fb.completude.obrigatorios_vazios.length})`), rotPend);
  afirma('(b) a lista do filtro tem EXATAMENTE os pendentes do servidor (os 2 do teste dentro; Não se aplica, zero e "Não" fora)',
    JSON.stringify([...lista].sort()) === JSON.stringify([...fb.completude.obrigatorios_vazios].sort()) && lista.includes(T1.id) && lista.includes(T2.id) && ![T3.id, N1.id, BO.id].some((x) => lista.includes(x)), JSON.stringify(lista));
  afirma('(b) a linha pendente diz "Pendente" na coluna "Estado e sugestão"', await pg.$eval(`[data-atributo="${T1.id}"] .at-estado-txt`, (e) => e.textContent) === 'Pendente');
  await pg.screenshot({ path: 'capturas-ux1/depois-1c-ficha-obrigatorios-pendentes.png' });

  // limpeza: valores limpos, kit tirado do produto e desativado
  for (const a of [T2, T3, N1, BO]) { const i = (await ficha(P)).itens.find((x) => x.atributo_id === a.id); if (i?.valor) await api('POST', 'valor_limpar', { product_id: P, atributo_id: a.id, versao: i.valor.versao, versao_conjunto: i.versao_conjunto }); }
  await api('POST', 'produto_kit', { product_id: P, versao_vinculos: (await ficha(P)).versao_vinculos, grupo_id: kid, ativo: 0 });
  kv = (await api('GET', 'kit', null, { id: kid })).j.data.kit.versao; const rk = await api('POST', 'kit_ativo', { id: kid, versao: kv, ativo: 0, motivo: 'kit de teste UX-1 (desativado)' });
  afirma('limpeza: valores limpos e kit de teste desativado', rk.status === 200);
  console.log(`UX-1 (a/b): ${ok} ok, ${falhas} falhas`);
  await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
