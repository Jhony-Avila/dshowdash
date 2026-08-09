// testes/dock-inferior.mjs — onda 1111 (decisão #112, flag
// as6.dock_inferior): o SHELL adota a estrutura do Modo Clássico —
// nav esquerda → preview central (fit-to-view) → DOCK horizontal de
// assets abaixo do preview (reuso do DockAssets/.avst-trilho).
//   A) flag ON (padrão): dock abaixo do viewport (largura total, sem
//      coluna direita), trilho clássico dentro ([data-teste=dock-v3]),
//      avatar INTEIRO no palco (fit-to-view + margem), estados de
//      altura ciclam e persistem, controles de cenário fora do palco
//      (toolbar "Cenário"), câmera manual continua mandando, equipar/
//      busca funcionam na dock, drawer de propriedades flutua.
//   B) contraste (#112.5): card selecionado legível nos DOIS temas
//      (nunca fundo escuro + texto escuro).
//   C) rollback §651: flag OFF = coluna lateral direita byte a byte
//      (aside à direita do main, zoom por categoria, pills no palco).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

/** luminância relativa (WCAG) a partir de "rgb(r, g, b)". */
const contrasteDe = (corA, corB) => {
  const lum = (c) => {
    // aceita "rgb(r, g, b)" (0–255) E "color(srgb r g b)" (0–1)
    const m = c.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
    const canais = c.trim().startsWith('color(') ? m.slice(0, 3) : m.slice(0, 3).map((v) => v / 255);
    const [r, g, b] = canais.map((s) =>
      (s <= 0.03928 ? s / 12.92 : (((s + 0.055) / 1.055) ** 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b2] = [lum(corA), lum(corB)];
  return (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05);
};

// ── A) flag ON — layout, fit, estados, funcionalidade ───────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1500);
    const geo = await p.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect() ?? null;
      const svg = r('.avst5-palco svg'); const palco = r('.avst5-palco');
      return {
        attr: !!document.querySelector('.avst5-shell[data-dock-inferior]'),
        main: r('.avst5-viewport'), painel: r('.avst5-painel'),
        dockV3: !!document.querySelector('.avst5-painel [data-teste="dock-v3"]'),
        trilho: !!document.querySelector('.avst5-painel [data-teste="dock-inferior"]'),
        estado: document.querySelector('.avst5-painel')?.dataset.dockEstado,
        cards: document.querySelectorAll('.avst5-painel .avst-card').length,
        pills: document.querySelectorAll('.avst5-viewport > .avst5-fundos').length,
        cenTool: !!document.querySelector('[data-teste="cen-tool"]'),
        svgDentro: !!(svg && palco && svg.top >= palco.top && svg.bottom <= palco.bottom
          && svg.left >= palco.left && svg.right <= palco.right),
        margem: svg && palco ? Math.min(svg.top - palco.top, palco.bottom - svg.bottom) : -1,
      };
    });
    ok(geo.attr, 'shell sem [data-dock-inferior] com a flag ON');
    ok(!!geo.main && !!geo.painel && geo.painel.top >= geo.main.bottom - 2,
      'a dock deveria ficar ABAIXO do preview (não à direita)');
    ok(geo.painel.width > 1000, `dock deveria usar a largura toda (veio ${Math.round(geo.painel?.width)})`);
    ok(geo.dockV3 && geo.trilho, 'dock sem o trilho do clássico (reuso DockAssets/[data-dock-v3])');
    ok(geo.estado === 'padrao', `estado inicial deveria ser padrão (veio ${geo.estado})`);
    ok(geo.cards >= 10, `trilho sem cards (${geo.cards})`);
    ok(geo.pills === 0 && geo.cenTool, 'pills de cenário deveriam morar na toolbar "Cenário" (#112.6)');
    ok(geo.svgDentro && geo.margem >= 8,
      `fit-to-view: avatar cortado ou sem margem segura (margem=${Math.round(geo.margem)})`);
    // câmera manual segue mandando (zoom intencional nunca é sobrescrito)
    await p.locator('[data-teste="cam6-rosto"]').click();
    await p.waitForTimeout(600);
    const escala = await p.evaluate(() => {
      const m = getComputedStyle(document.querySelector('.avst5-zoom')).transform;
      return m.startsWith('matrix') ? Number(m.slice(7).split(',')[0]) : 1;
    });
    ok(escala > 1.2, `preset Rosto deveria aproximar a câmera (escala=${escala.toFixed(2)})`);
    await p.locator('[data-teste="cam6-auto"]').click();
    await p.waitForTimeout(400);
    // estados de altura ciclam e PERSISTEM
    const h0 = (await p.locator('.avst5-painel').boundingBox()).height;
    await p.locator('[data-teste="dock-altura"]').click();
    await p.waitForTimeout(400);
    const h1 = (await p.locator('.avst5-painel').boundingBox()).height;
    ok(h1 > h0 + 60, `expandida deveria ser mais alta (${h0}→${h1})`);
    ok(await p.evaluate(() => localStorage.getItem('dshow.avst6.dockinf.v1')) === 'expandida',
      'estado da dock não persistiu');
    // expandida: grade em linhas + scroll vertical próprio (sem deslocar o preview)
    const mainAntes = (await p.locator('.avst5-viewport').boundingBox()).y;
    await p.locator('.avst5-painel-scroll').evaluate((el) => { el.scrollTop = 300; });
    await p.waitForTimeout(200);
    ok((await p.locator('.avst5-viewport').boundingBox()).y === mainAntes,
      'scroll da dock deslocou o preview');
    await p.locator('[data-teste="dock-altura"]').click(); // → compacta
    await p.waitForTimeout(400);
    ok((await p.locator('.avst5-painel').boundingBox()).height < h0,
      'compacta deveria ser mais baixa que padrão');
    await p.screenshot({ path: `${SAIDA}/dock-inferior-compacta.png` });
    await p.locator('[data-teste="dock-altura"]').click(); // → padrão
    await p.waitForTimeout(400);
    // recolhida = botão de sempre
    await p.locator('.avst5-painel-topo .avst5-painel-btn').first().click();
    await p.waitForTimeout(300);
    ok((await p.locator('.avst5-painel').boundingBox()).height < 60, 'recolher não encolheu a dock');
    await p.locator('.avst5-painel-topo .avst5-painel-btn').first().click();
    await p.waitForTimeout(300);
    // EQUIPAR direto do trilho + busca na dock
    const antes = await p.evaluate(() => document.querySelector('.avst5-palco svg')?.innerHTML.length ?? 0);
    await p.locator('.avst5-painel .avst-card').nth(3).click();
    await p.waitForTimeout(700);
    const depois = await p.evaluate(() => document.querySelector('.avst5-palco svg')?.innerHTML.length ?? 0);
    ok(antes > 0 && depois > 0 && antes !== depois, 'equipar pelo trilho não mudou o avatar');
    await p.locator('.avst-busca input').fill('androide');
    await p.waitForTimeout(700);
    const filtrados = await p.evaluate(() => document.querySelectorAll('.avst5-painel .avst-card').length);
    ok(filtrados >= 1 && filtrados <= 4, `busca na dock não filtrou (${filtrados} cards)`);
    await p.locator('.avst-busca input').fill('');
    await p.waitForTimeout(500);
    // drawer de propriedades flutua (overlay — preview não sai do centro)
    await p.locator('.avst5-painel-btn[title="Cores e propriedades"]').click();
    await p.waitForTimeout(400);
    const drawer = await p.locator('[data-teste="insp-drawer"]').boundingBox();
    ok(!!drawer, 'drawer de propriedades não abriu na dock');
    ok((await p.locator('.avst5-viewport').boundingBox()).y === mainAntes,
      'abrir propriedades deslocou o preview (deveria ser overlay)');
    // toolbar Cenário abre o cluster completo
    await p.locator('[data-teste="cen-tool-abrir"]').click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cen-caixa"] [data-teste="cenarios-2d"]').count() === 1,
      'toolbar Cenário não expôs os controles');
    await p.screenshot({ path: `${SAIDA}/dock-inferior-on.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) contraste do card selecionado nos DOIS temas (#112.5) ────────
for (const tema of ['dark', 'light']) {
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1500);
    // o data-theme é aplicado pelo bootstrap do index.html em produção;
    // no harness aplicamos direto (mesmo atributo, mesmo alvo)
    await p.evaluate((tm) => document.documentElement.setAttribute('data-theme', tm), tema);
    await p.waitForTimeout(400);
    const cores = await p.evaluate(() => {
      const card = document.querySelector('.avst5-painel .avst-card-ativo')
        ?? document.querySelector('.avst5-painel .avst-card');
      const nome = card?.querySelector('.avst-card-nome');
      if (!card || !nome) return null;
      const fundoDe = (el) => {
        let n = el;
        while (n && n !== document.body) {
          const bg = getComputedStyle(n).backgroundColor;
          if (bg && !bg.includes('0, 0, 0, 0') && bg !== 'transparent') return bg;
          n = n.parentElement;
        }
        return 'rgb(0,0,0)';
      };
      return { texto: getComputedStyle(nome).color, fundo: fundoDe(card) };
    });
    ok(!!cores, `(${tema}) card/nome não encontrados`);
    if (cores) {
      const razao = contrasteDe(cores.texto, cores.fundo);
      ok(razao >= 4.5, `(${tema}) contraste do card selecionado ${razao.toFixed(2)}:1 < 4.5:1 (texto ${cores.texto} sobre ${cores.fundo})`);
    }
    if (tema === 'light') await p.screenshot({ path: `${SAIDA}/dock-inferior-light.png` });
  } catch (e) { falhas.push(`exceção (${tema}): ${e.message}`); }
  await b.close();
}

// ── C) rollback §651: flag OFF = lateral direita byte a byte ────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    const geo = await p.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect() ?? null;
      return {
        attr: !!document.querySelector('.avst5-shell[data-dock-inferior]'),
        main: r('.avst5-viewport'), painel: r('.avst5-painel'),
        pills: document.querySelectorAll('.avst5-viewport > .avst5-fundos').length,
        cenTool: !!document.querySelector('[data-teste="cen-tool"]'),
        trilho: !!document.querySelector('.avst5-painel [data-teste="dock-inferior"]'),
        zoom: getComputedStyle(document.querySelector('.avst5-zoom')).transform,
      };
    });
    ok(!geo.attr, 'flag OFF ainda marca [data-dock-inferior]');
    ok(geo.painel.left >= geo.main.right - 2, 'flag OFF: painel deveria voltar à DIREITA do preview');
    ok(geo.pills >= 2 && !geo.cenTool, 'flag OFF: pills de cenário deveriam voltar ao palco');
    ok(!geo.trilho, 'flag OFF ainda monta o trilho na lateral');
    ok(geo.zoom.startsWith('matrix') && Number(geo.zoom.slice(7).split(',')[0]) > 1.2,
      'flag OFF: enquadramento automático por categoria (R2) deveria voltar');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[dock-inferior] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[dock-inferior] FALHAS: nenhuma');
console.log('[dock-inferior] ERROS JS: nenhum');
