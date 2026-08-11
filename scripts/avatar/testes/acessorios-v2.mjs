// testes/acessorios-v2.mjs — mega onda 1301+ (decisões #140–#143, flags
// as6.acess_v2 / as6.acess_hub / as6.nav_grupos): ACESSÓRIOS como
// categoria-mãe multi-slot (briefing 2026-08-11 §36–§37) + navegação em
// macrogrupos.
//   A) flag ON: hub por regiões (contagens, breadcrumb, filtro,
//      em_preparacao desabilitada); multi-equip em 8 slots finos
//      SIMULTÂNEOS; substituição no mesmo slot; conflito declarado por
//      dados (headset VR × óculos); undo; aleatório sem duplicar asset;
//      autosave carrega os slots finos.
//   B) byte-stability (#141): rascunho LEGADO (acessorio_cabeca:
//      ace_aureola) restaurado com a flag ON fica ONDE ESTÁ (nunca
//      re-slota salvo); re-equipar migra para o slot fino (comando).
//   C) macrogrupos (as6.nav_grupos): cabeçalhos; colapso nunca esconde
//      a categoria ativa.
//   D) rollback §651: flags OFF = grade única sem hub + sidebar plana +
//      equipar volta ao slot legado byte a byte.
// @version 1.0.0  @created 2026-08-11
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const irCategoria = async (p, nome) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes(n))?.click(); }, nome);
  await p.waitForTimeout(450);
};
const equiparCard = async (p, nome) => {
  // busca global antes de clicar: isola o card mesmo com a grade
  // virtualizada (e exercita a busca §18 de quebra)
  await p.fill('input[aria-label="Buscar itens"]', nome);
  await p.waitForTimeout(400);
  await p.evaluate((n) => {
    const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
      .find((x) => x.querySelector('.avst-card-nome')?.textContent?.trim() === n);
    c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, nome);
  await p.fill('input[aria-label="Buscar itens"]', '');
  await p.waitForTimeout(400);
};
const lerRascunho = async (p) => {
  await p.waitForTimeout(1300); // autosave §139 = 800ms
  return p.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('dshow.avst5.rascunho.v1') ?? 'null'); } catch { return null; }
  });
};
const slotsAcessorio = (r) => Object.fromEntries(
  Object.entries(r?.config?.camadas ?? {}).filter(([k, v]) => k.startsWith('acessorio') && v));

// ── A) flag ON: hub + multi-equip + conflitos + undo + aleatório ────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.tax_v2': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irCategoria(p, 'Acess');
    // hub presente, com contagens e em_preparacao desabilitada (§32)
    // #144: as subcategorias moram na ÁRVORE da sidebar (hierarquia
    // convencional sob a categoria-mãe — feedback visual do Jhony)
    ok(await p.locator('.avst5-sidebar [data-teste="arv-acessorios"]').count() === 1, 'árvore de subcategorias ausente da sidebar com a flag ON');
    const nDesab = await p.locator('[data-teste="arv-acessorios"] button:disabled').count();
    ok(nDesab >= 3, `esperava ≥3 subcategorias em preparação desabilitadas (veio ${nDesab})`);
    // filtro por subcategoria + breadcrumb (§17–§18)
    await p.evaluate(() => document.querySelector('[data-teste="arv-aureolas"]')?.click());
    await p.waitForTimeout(400);
    const soAureola = await p.evaluate(() => [...document.querySelectorAll('.avst5-painel .avst-card .avst-card-nome')].map((n) => n.textContent.trim()));
    ok(soAureola.length === 2 && soAureola.includes('Auréola'), `filtro Auréolas deveria isolar 1 item + Nenhum (veio ${soAureola.join(',')})`);
    ok(await p.evaluate(() => [...document.querySelectorAll('[data-teste="arv-acessorios"] .avst6-arv-regiao > em')].some((e) => e.textContent.includes('Especiais'))),
      'região Especiais ausente da árvore (hierarquia visível substitui o breadcrumb §17)');
    await p.evaluate(() => document.querySelector('[data-teste="arv-todos"]')?.click());
    await p.waitForTimeout(400);
    // §36/§37: 8 acessórios SIMULTÂNEOS — um por slot fino
    for (const nome of ['Boné Snapback', 'Pintura de Guerra', 'Óculos de Grau', 'Brinco de Argola',
      'Colar de Pérolas', 'Mochila a Jato', 'Auréola', 'Drone Companion']) await equiparCard(p, nome);
    let slots = slotsAcessorio(await lerRascunho(p));
    ok(Object.keys(slots).length === 8, `esperava 8 slots preenchidos (veio ${Object.keys(slots).length}: ${JSON.stringify(slots)})`);
    ok(slots.acessorio_flutuante === 'ace_aureola', 'auréola fora do slot flutuante');
    ok(slots.acessorio_costas === 'ace_mochila_jato', 'mochila fora do slot costas');
    ok((await p.locator('[data-teste="hub-resumo"]').textContent())?.startsWith('8 '), 'resumo (na grade) não conta 8');
    await p.screenshot({ path: `${SAIDA}/acessorios-v2-multi.png` });
    // substituição no MESMO slot (§36): abre o modal §69.1 ("nada de
    // troca silenciosa") — confirmar aplica Coroa e remove o Boné
    await equiparCard(p, 'Coroa do Top 1');
    ok(await p.locator('.avst5-modal-fundo').count() === 1, 'substituição não abriu o modal §69.1');
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-modal button')].find((x) => x.textContent.includes('substituir'))?.click(); });
    await p.waitForTimeout(400);
    slots = slotsAcessorio(await lerRascunho(p));
    ok(slots.acessorio_cabeca === 'ace_coroa', 'coroa não substituiu no slot cabeça');
    ok(Object.values(slots).filter((v) => v === 'ace_bone').length === 0, 'boné continuou equipado após substituição');
    // conflito DECLARADO por dados (§10): headset VR remove os óculos
    await equiparCard(p, 'Headset VR');
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-modal button')].find((x) => x.textContent.includes('substituir'))?.click(); });
    await p.waitForTimeout(400);
    slots = slotsAcessorio(await lerRascunho(p));
    ok(slots.acessorio_cabeca === 'ace_viseira_vr', 'viseira VR não equipou na cabeça');
    ok(!slots.acessorio_olhos, `conflito headsets-vr×olhos não removeu os óculos (${slots.acessorio_olhos})`);
    // undo (§297): desfazer devolve o estado anterior ao headset
    // (foco fora do input de busca — o atalho ignora campos de texto)
    await p.evaluate(() => document.querySelector('input[aria-label="Buscar itens"]')?.blur());
    await p.keyboard.press('Control+z');
    await p.waitForTimeout(400);
    slots = slotsAcessorio(await lerRascunho(p));
    ok(slots.acessorio_olhos === 'ace_oculos', 'undo não devolveu os óculos');
    // aleatório multi-slot: nunca o MESMO asset em 2 slots
    await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Aleatório'))?.click(); });
    await p.waitForTimeout(900);
    slots = slotsAcessorio(await lerRascunho(p));
    const ids = Object.values(slots);
    ok(new Set(ids).size === ids.length, `aleatório duplicou asset entre slots: ${ids.join(',')}`);
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) byte-stability #141: salvo legado NUNCA re-slota ─────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.tax_v2': false }));
      // rascunho como o modelo ANTIGO gravava: auréola no slot cabeça
      localStorage.setItem('dshow.avst5.rascunho.v1', JSON.stringify({
        config: { versao: 2, base: 'b01', paleta: {}, camadas: { olhos: 'olh_padrao', boca: 'boc_sorriso', roupa: 'rou_camiseta', fundo: 'fun_estudio', acessorio_cabeca: 'ace_aureola' } },
        versaoBase: 0, em: new Date().toISOString(), aba: 'outra-aba',
      }));
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('[data-teste="rascunho"]').count() === 1, 'banner de rascunho recuperado não apareceu');
    await p.evaluate(() => { document.querySelector('[data-teste="rascunho"] button')?.click(); });
    await p.waitForTimeout(600);
    let slots = slotsAcessorio(await lerRascunho(p));
    ok(slots.acessorio_cabeca === 'ace_aureola', `salvo legado foi re-slotado (veio ${JSON.stringify(slots)}) — quebra #141`);
    ok(!slots.acessorio_flutuante, 'auréola legada apareceu TAMBÉM no slot fino (duplicou)');
    // re-equipar MIGRA (comando com undo): sai da cabeça, entra no fino
    await irCategoria(p, 'Acess');
    await equiparCard(p, 'Auréola');
    slots = slotsAcessorio(await lerRascunho(p));
    ok(slots.acessorio_flutuante === 'ace_aureola' && !slots.acessorio_cabeca, `re-equipar não migrou para o slot fino (${JSON.stringify(slots)})`);
    ok(erros.length === 0, `erros de página (legado): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (legado): ${e.message}`); }
  await b.close();
}

// ── C) macrogrupos (as6.nav_grupos; tax_v2 OFF = camada #143) ───────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.tax_v2': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    const cabs = await p.evaluate(() => [...document.querySelectorAll('.avst6-navg-cab')].map((c) => c.textContent.trim()));
    ok(cabs.length === 4 && cabs.includes('Personagem') && cabs.includes('Vestuário'), `macrogrupos errados: ${cabs.join(',')}`);
    // todas as 13 categorias seguem alcançáveis (nada some — §32)
    const nCats = await p.locator('.avst5-cat').count();
    ok(nCats >= 13, `categorias sumiram no agrupamento (veio ${nCats})`);
    // colapsar o grupo da categoria ATIVA não a esconde
    await irCategoria(p, 'Moldura');
    await p.evaluate(() => document.querySelector('[data-teste="navg-cab-identidade"]')?.click());
    await p.waitForTimeout(300);
    ok(await p.evaluate(() => [...document.querySelectorAll('.avst5-cat')].some((c) => c.textContent.includes('Moldura'))),
      'colapso escondeu a categoria ativa');
    ok(erros.length === 0, `erros de página (grupos): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (grupos): ${e.message}`); }
  await b.close();
}

// ── D) rollback §651: flags OFF = comportamento anterior ────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.acess_v2': false, 'as6.acess_hub': false, 'as6.nav_grupos': false, 'as6.tax_v2': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst6-navg-cab').count() === 0, 'flag OFF ainda mostra macrogrupos');
    await irCategoria(p, 'Acess');
    ok(await p.locator('[data-teste="arv-acessorios"]').count() === 0, 'flag OFF ainda mostra a árvore de subcategorias');
    // equipar volta ao SLOT LEGADO (decisão #41 byte a byte)
    await equiparCard(p, 'Auréola');
    const slots = slotsAcessorio(await lerRascunho(p));
    ok(slots.acessorio_cabeca === 'ace_aureola' && !slots.acessorio_flutuante,
      `flag OFF não equipou no slot legado (${JSON.stringify(slots)})`);
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

// ── E) TAXONOMIA v2 (#145/#146, as6.tax_v2 — padrão ON): várias
//     categorias-mãe (acordeão), principais na sidebar, subcategorias
//     na DOCK; multi-equip através da navegação nova; coroa em Adornos;
//     ferramentas §5.11 acessíveis ─────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false })); },
  });
  const irPrincipal = async (mae, pr) => {
    await p.evaluate((m) => { document.querySelector(`[data-teste="tax-cab-${m}"]`)?.click(); }, mae);
    await p.waitForTimeout(250);
    await p.evaluate((x) => { document.querySelector(`[data-teste="tax-p-${x}"]`)?.click(); }, pr);
    await p.waitForTimeout(500);
  };
  const equipar = async (nome) => {
    await p.evaluate((n) => {
      const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
        .find((x) => x.querySelector('.avst-card-nome')?.textContent?.trim() === n);
      card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, nome);
    await p.waitForTimeout(400);
  };
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    // árvore v2: mães presentes; "Acessório" NÃO existe mais como botão
    // único (critério de aceite 1); Equipamentos desabilitada Em breve
    ok(await p.locator('[data-teste="tax-v2"]').count() === 1, 'árvore tax v2 ausente');
    const maes = await p.evaluate(() => [...document.querySelectorAll('[data-teste="tax-v2"] .avst6-navg-cab')].map((c) => c.textContent.trim()));
    for (const m of ['Personagem', 'Vestuário', 'Cabeça e Rosto', 'Joias e Adornos', 'Costas e Mobilidade', 'Companheiros', 'Elementos Especiais'])
      ok(maes.some((x) => x.startsWith(m)), `mãe ausente: ${m}`);
    ok(await p.evaluate(() => ![...document.querySelectorAll('.avst5-cat')].some((c) => c.textContent.trim().endsWith('Acessório'))),
      'botão único "Acessório" ainda existe (critério 1)');
    ok(await p.evaluate(() => document.querySelector('[data-teste="tax-cab-equipamentos"]')?.disabled === true),
      'Equipamentos (zero assets) deveria estar Em breve/desabilitada');
    // Visão → chips na dock (Todos + subcategorias) e grade limitada
    await irPrincipal('cabeca-rosto', 'visao');
    const chips = await p.evaluate(() => [...document.querySelectorAll('[data-teste="dock-subcats"] .avst5-chip')].map((c) => c.textContent.trim()));
    ok(chips[0] === 'Todos' && chips.includes('Óculos'), `chips da dock errados: ${chips.join(',')}`);
    const nomesVisao = await p.evaluate(() => [...document.querySelectorAll('.avst5-painel .avst-card .avst-card-nome')].map((n) => n.textContent.trim()));
    ok(nomesVisao.includes('Óculos de Grau') && !nomesVisao.includes('Boné Snapback'),
      `grade de Visão deveria conter só visão (veio ${nomesVisao.join(',')})`);
    // chip filtra dentro do conjunto
    await p.evaluate(() => document.querySelector('[data-teste="dock-sub-oculos"]')?.click());
    await p.waitForTimeout(400);
    const soOculos = await p.evaluate(() => [...document.querySelectorAll('.avst5-painel .avst-card .avst-card-nome')].map((n) => n.textContent.trim()));
    ok(soOculos.length === 5 && !soOculos.includes('Tapa-olho'), `chip Óculos não isolou (${soOculos.join(',')})`);
    // multi-equip ATRAVÉS da navegação nova (4 mães diferentes)
    await equipar('Óculos de Grau');
    await irPrincipal('joias', 'pescoco');
    await equipar('Colar de Pérolas');
    await irPrincipal('costas', 'propulsores');
    await equipar('Mochila a Jato');
    await irPrincipal('especiais', 'aureolas');
    await equipar('Auréola');
    const r = await lerRascunho(p);
    const slots = slotsAcessorio(r);
    ok(Object.keys(slots).length === 4, `esperava 4 slots via navegação nova (${JSON.stringify(slots)})`);
    // coroa migrou de navegação (Adornos), continua slot cabeca
    await irPrincipal('cabeca-rosto', 'adornos-cab');
    const adornos = await p.evaluate(() => [...document.querySelectorAll('.avst5-painel .avst-card .avst-card-nome')].map((n) => n.textContent.trim()));
    ok(adornos.includes('Coroa do Top 1'), 'Coroa deveria estar em Adornos de cabeça (§8)');
    // ferramentas §5.11: presentes e funcionais (Presets abre a aba)
    ok(await p.locator('[data-teste="tax-ferramentas"] .avst5-cat').count() >= 5, 'seção de ferramentas ausente');
    await p.evaluate(() => document.querySelector('[data-teste="tax-f-presets"]')?.click());
    await p.waitForTimeout(400);
    ok(await p.evaluate(() => [...document.querySelectorAll('button')].some((x) => x.textContent.trim() === 'Presets' && (x.getAttribute('aria-selected') === 'true' || x.className.includes('on')))),
      'ferramenta Presets não abriu a aba');
    await p.screenshot({ path: `${SAIDA}/acessorios-v2-taxv2.png` });
    ok(erros.length === 0, `erros de página (tax v2): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (tax v2): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[acessorios-v2] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[acessorios-v2] FALHAS: nenhuma');
console.log('[acessorios-v2] ERROS JS: nenhum');
