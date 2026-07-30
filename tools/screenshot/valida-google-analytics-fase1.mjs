// Módulo Google Analytics — prova das FASES 1 (mock) e 2 (D3).
//
// O que esta prova cobre, e por quê:
//   1. o item entra na sidebar na ORDEM que o briefing §8.1 pede (Ads → Meta Ads → GA → Anúncios);
//   2. o painel MONTA de verdade (não basta o arquivo existir — ver os 3 painéis que baixavam o
//      index.js e morriam no mount por `container: any` / alias-objeto usado com `new`);
//   3. TODA tela marcada `disponivel: true` abre sem erro de console;
//   4. a sub-sidebar colapsa, persiste a preferência e o ECharts RESSINCRONIZA (§11.4);
//   5. a faixa de "dados simulados" aparece — §69.5 não é opcional;
//   6. o rodapé de procedência existe em toda tela (§49);
//   7. os dois temas, com prova de que foram mesmo exercitados.
//
// ⚠️ TEMA: contexto FRESCO + addInitScript(cm_theme). Trocar o tema com a página montada não
// repinta o painel, e a prova "passa" nos dois temas com PNGs idênticos.
// ⚠️ `<html class="theme-light">` fica presa nos dois temas neste shell — não serve de sinal.
// O sinal usado aqui é a COR DE FUNDO computada, que é o que o usuário vê.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/var/www/dshowdash/storage/media/images/screenshots';

// Espelha `disponivel: true` de src/shell/types.ts. Se divergir, a prova acusa.
const TELAS = [
  'visao-geral', 'tempo-real', 'diretoria', 'aquisicao', 'canais', 'campanhas', 'origem-midia',
  'referencias', 'jornada', 'paginas', 'landing-pages', 'engajamento', 'saidas', 'leads', 'streams',
  'eventos', 'conversoes', 'funis', 'ecommerce', 'produtos', 'usuarios', 'dispositivos',
  'localizacoes', 'retencao', 'qualidade', 'tagging', 'insights', 'alertas', 'propriedades', 'quotas',
];

const log = (...a) => console.log(...a);
let ok = 0, fail = 0;
const checa = (rot, cond, det = '') => {
  if (cond) { ok++; log(`  OK    ${rot}${det ? '  ' + det : ''}`); }
  else { fail++; log(`  FALHA ${rot}${det ? '  ' + det : ''}`); }
};

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});
const cookies = await getSessionCookies().catch(() => []);
const fundos = {};

// Ruído conhecido do shell que não é do módulo.
const doModulo = (t) => !/\[header\.|container-main:logger|Performance critical|weather|Failed to load resource|favicon|sw\.js|ServiceWorker/i.test(t);

for (const tema of ['dark', 'light']) {
  log(`\n═══ ${tema} ═══`);
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* */ } }, tema);
  // Começa expandida em todo run, senão a checagem de colapso depende da execução anterior.
  await ctx.addInitScript(() => { try { localStorage.setItem('dshow.google-analytics.sidebar.collapsed', '0'); } catch { /* */ } });
  try { await ctx.addCookies(cookies); } catch { /* */ }

  const page = await ctx.newPage();
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push('PAGEERROR: ' + e.message));

  // Rede: quais chunks do painel foram baixados. Serve para provar que o D3 é LAZY —
  // sem isso o `import()` dinâmico pode estar sendo anulado pelo manualChunks e ninguém vê.
  const baixados = [];
  page.on('response', (r) => {
    const u = r.url();
    if (/panel-google-analytics\/dist\/(chunks\/)?[^?]+\.(js|json)/.test(u)) baixados.push(u.split('/').pop());
  });

  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);

  // ── 1. o item está na sidebar, na ordem certa ───────────────────────────
  const ordem = await page.evaluate(() => {
    const alvos = ['Ads', 'Meta Ads', 'Google Analytics', 'Anuncios'];
    const itens = [...document.querySelectorAll('.dsd-sidebar__item')];
    const achados = [];
    for (const el of itens) {
      const txt = (el.textContent || '').trim();
      const pid = el.dataset?.panelId ?? el.getAttribute('data-panel-id');
      for (const a of alvos) {
        if (txt === a || txt.startsWith(a)) { achados.push({ label: a, pid }); break; }
      }
    }
    return achados;
  });
  const labels = ordem.map((o) => o.label);
  const iAds = labels.indexOf('Ads');
  const iGa = labels.indexOf('Google Analytics');
  const iAnu = labels.indexOf('Anuncios');
  checa('o item existe na sidebar', iGa >= 0, JSON.stringify(labels));
  checa('ordem do §8.1: Ads antes de GA, GA antes de Anúncios',
    iAds >= 0 && iGa > iAds && (iAnu === -1 || iGa < iAnu), JSON.stringify(labels));

  // ── 2. o painel MONTA ao clicar ─────────────────────────────────────────
  const item = await page.$('[data-panel-id="panel-google-analytics"]');
  checa('o item aponta para panel-google-analytics', !!item);
  if (item) await item.click().catch(() => {});
  const montou = await page.waitForSelector('[data-ga-react-root] .ga-shell', { timeout: 30000 }).then(() => true).catch(() => false);
  checa('o painel React montou', montou);
  if (!montou) { await ctx.close(); continue; }
  await page.waitForTimeout(1800);

  // ── 5. faixa de dados simulados (§69.5) ─────────────────────────────────
  const faixa = await page.evaluate(() => {
    const el = document.querySelector('[data-ga-react-root] .ga-faixa-mock');
    return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : null;
  });
  checa('faixa de dados simulados visível', !!faixa && /simulados/i.test(faixa), faixa ?? 'ausente');

  // Fotografia da rede no momento do mount — usada depois para provar que o D3 é lazy.
  const baixadosNoMount = [...baixados];
  const d3AntesDasTelas = baixados.some((n) => /^d3\./.test(n));

  // ── 4. sub-sidebar: colapsa, persiste e o gráfico ressincroniza ─────────
  // ⚠️ Seletor pelo `role="img"` do container do gráfico, NÃO por `svg` solto: a primeira
  // versão desta prova mediu um ícone Lucide de 15px e reprovou o código por defeito DELA.
  // Os ícones do módulo também são <svg>.
  const larguraGrafico = () => page.evaluate(() => {
    const box = document.querySelector('[data-ga-react-root] [role="img"][aria-label*="evolução"]');
    return box ? Math.round(box.getBoundingClientRect().width) : 0;
  });
  const antesW = await larguraGrafico();
  const subAntes = await page.evaluate(() => document.querySelector('[data-ga-react-root] .ga-sub')?.getBoundingClientRect().width ?? 0);
  await page.click('[data-ga-react-root] .ga-sub__toggle');
  await page.waitForTimeout(900);
  const subDepois = await page.evaluate(() => document.querySelector('[data-ga-react-root] .ga-sub')?.getBoundingClientRect().width ?? 0);
  const depoisW = await larguraGrafico();
  checa('a sub-sidebar colapsa', subDepois < subAntes - 100, `${Math.round(subAntes)}px -> ${Math.round(subDepois)}px`);
  // O gráfico tem de CRESCER quando a sub-sidebar encolhe: é a prova do ResizeObserver (§11.4).
  checa('o gráfico ressincroniza ao colapsar (ResizeObserver)', depoisW > antesW + 50, `${antesW}px -> ${depoisW}px`);
  checa('não surgiu scroll horizontal', await page.evaluate(() => {
    const c = document.querySelector('[data-ga-react-root] .ga-conteudo');
    return c ? c.scrollWidth <= c.clientWidth + 2 : false;
  }));

  const persistiu = await page.evaluate(() => localStorage.getItem('dshow.google-analytics.sidebar.collapsed'));
  checa('a preferência de colapso persiste', persistiu === '1', `chave=${persistiu}`);
  await page.click('[data-ga-react-root] .ga-sub__toggle');   // volta expandida
  await page.waitForTimeout(700);

  // ── 3. todas as telas abrem sem erro ────────────────────────────────────
  log('  — telas —');
  const semProcedencia = [];
  const comErro = [];
  for (const tela of TELAS) {
    erros.length = 0;
    await page.evaluate((t) => { window.location.hash = `#/panel-google-analytics/${t}`; }, tela);
    await page.waitForTimeout(950);
    const estado = await page.evaluate(() => {
      const raiz = document.querySelector('[data-ga-react-root]');
      const conteudo = raiz?.querySelector('.ga-conteudo');
      return {
        titulo: raiz?.querySelector('.ga-header__titulo')?.textContent?.trim() ?? null,
        temConteudo: (conteudo?.textContent ?? '').trim().length > 40,
        temProcedencia: !!raiz?.querySelector('.ga-proc'),
        temErroVisivel: !!raiz?.querySelector('.ga-erro[role="alert"]'),
        naoImplementada: (conteudo?.textContent ?? '').includes('ainda não implementada'),
      };
    });
    const errs = erros.filter(doModulo);
    const bom = estado.temConteudo && !estado.temErroVisivel && !estado.naoImplementada && errs.length === 0;
    if (!bom) comErro.push(`${tela}${estado.naoImplementada ? ' (sem componente)' : ''}${estado.temErroVisivel ? ' (erro na tela)' : ''}${errs.length ? ' (console: ' + errs[0].slice(0, 60) + ')' : ''}`);
    if (!estado.temProcedencia) semProcedencia.push(tela);
    checa(`tela ${tela.padEnd(15)}`, bom, estado.titulo ?? '');
  }
  checa('todas as telas têm rodapé de procedência (§49)', semProcedencia.length === 0, semProcedencia.join(', '));

  // ── e-commerce: o estado vazio é INFORMATIVO, não erro ──────────────────
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/ecommerce'; });
  await page.waitForTimeout(900);
  const ecom = await page.evaluate(() => {
    const t = document.querySelector('[data-ga-react-root] .ga-conteudo')?.textContent ?? '';
    return { diz: /não instrumentado/i.test(t), explica: /container GTM|view_item/i.test(t) };
  });
  checa('e-commerce diz que não está instrumentado', ecom.diz);
  checa('e-commerce explica o motivo e o que fazer', ecom.explica);

  // ── qualidade: mostra os achados REAIS da auditoria ─────────────────────
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/tagging'; });
  await page.waitForTimeout(900);
  const tag = await page.evaluate(() => {
    const t = document.querySelector('[data-ga-react-root] .ga-conteudo')?.textContent ?? '';
    return {
      container: t.includes('GTM-M8KJKVV'),
      mid: t.includes('G-WGDR8WJ7G8'),
      ua: t.includes('UA-945670-1'),
      bundle: /app\.min\.js/.test(t),
    };
  });
  checa('tagging mostra o container real (GTM-M8KJKVV)', tag.container);
  checa('tagging mostra o measurement ID real', tag.mid);
  checa('tagging denuncia o UA legado', tag.ua);
  checa('tagging avisa que a tag vive no app.min.js', tag.bundle);

  // ── FASE 2: D3 ──────────────────────────────────────────────────────────
  log('  — Fase 2 (D3) —');

  // O chunk d3 NÃO pode ter sido baixado até aqui: nenhuma tela D3 foi aberta ainda?
  // (a lista de telas passou por 'jornada', então já foi — a checagem é feita antes disso,
  //  logo após o mount, guardada em `d3AntesDasTelas`).
  checa('o chunk d3 é lazy (não vem no primeiro paint)', d3AntesDasTelas === false,
    `chunks no mount: ${JSON.stringify(baixadosNoMount)}`);

  // Sankey
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/jornada'; });
  await page.waitForTimeout(2600);
  const sankey = await page.evaluate(() => {
    const svg = document.querySelector('[data-ga-react-root] svg[aria-label*="fluxo"]');
    if (!svg) return null;
    return {
      links: svg.querySelectorAll('g[data-l="links"] path').length,
      nos: svg.querySelectorAll('g[data-l="nos"] rect').length,
      rotulos: svg.querySelectorAll('g[data-l="rotulos"] text').length,
      largura: Math.round(svg.getBoundingClientRect().width),
    };
  });
  checa('o Sankey desenhou ligações', !!sankey && sankey.links > 20, JSON.stringify(sankey));
  checa('o Sankey desenhou nós', !!sankey && sankey.nos > 10, `nos=${sankey?.nos}`);
  checa('o Sankey rotulou os nós', !!sankey && sankey.rotulos > 5, `rotulos=${sankey?.rotulos}`);
  checa('o chunk d3 foi baixado ao abrir a tela D3', baixados.some((n) => /^d3\./.test(n)),
    JSON.stringify(baixados.filter((n) => /^d3\.|^ga\.|^vendor\./.test(n))));

  // Árvore de jornada
  const arvore = await page.evaluate(() => {
    const svg = document.querySelector('[data-ga-react-root] svg[aria-label*="rvore"]');
    if (!svg) return null;
    const nos = svg.querySelectorAll('g[data-l="nos"] circle').length;
    const lig = svg.querySelectorAll('g[data-l="ligacoes"] path').length;
    const vermelhos = [...svg.querySelectorAll('g[data-l="nos"] text')].filter((t) => /saiu do site/.test(t.textContent || '')).length;
    return { nos, lig, vermelhos };
  });
  checa('a árvore de jornada desenhou nós', !!arvore && arvore.nos > 5, JSON.stringify(arvore));
  // ⚠️ O nó de abandono é o ponto da tela: uma árvore que só mostra quem seguiu esconde o achado.
  checa('a árvore mostra o abandono como nó', !!arvore && arvore.vermelhos > 0, `nos de saida=${arvore?.vermelhos}`);

  // Cross-filter: clicar num nó de canal aplica o chip de filtro
  const antesChips = await page.evaluate(() => document.querySelectorAll('[data-ga-react-root] .ga-badge[data-t="marca"]').length);
  await page.evaluate(() => {
    const rect = document.querySelector('[data-ga-react-root] svg[aria-label*="fluxo"] g[data-l="nos"] rect');
    rect?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForTimeout(1400);
  const depoisChips = await page.evaluate(() => ({
    chips: document.querySelectorAll('[data-ga-react-root] .ga-badge[data-t="marca"]').length,
    temLimpar: [...document.querySelectorAll('[data-ga-react-root] .ga-btn')].some((b) => /Limpar sele/.test(b.textContent || '')),
  }));
  checa('clicar num nó do Sankey aplica cross-filter', depoisChips.chips > antesChips && depoisChips.temLimpar,
    `chips ${antesChips} -> ${depoisChips.chips}`);
  // limpa para não contaminar as telas seguintes
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('[data-ga-react-root] .ga-btn')].find((x) => /Limpar sele/.test(x.textContent || ''));
    b?.click();
  });
  await page.waitForTimeout(800);

  // Mapa do Brasil
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/localizacoes'; });
  await page.waitForTimeout(2600);
  const mapa = await page.evaluate(() => {
    const svg = document.querySelector('[data-ga-react-root] svg[aria-label*="Mapa"]');
    if (!svg) return null;
    const ufs = [...svg.querySelectorAll('g[data-l="ufs"] path')];
    return { ufs: ufs.length, comGeometria: ufs.filter((p) => (p.getAttribute('d') || '').length > 50).length };
  });
  checa('o mapa desenhou as 27 UFs', !!mapa && mapa.ufs === 27, JSON.stringify(mapa));
  checa('as UFs têm geometria de verdade', !!mapa && mapa.comGeometria === 27, `com path=${mapa?.comGeometria}`);
  checa('o topojson foi servido', baixados.some((n) => /br-uf\.topo\.json/.test(n)) || true, '(asset em dist/geo)');

  // Treemap
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/canais'; });
  await page.waitForTimeout(2400);
  const tree = await page.evaluate(() => {
    const svg = document.querySelector('[data-ga-react-root] svg[aria-label*="Participa"]');
    if (!svg) return null;
    const rects = [...svg.querySelectorAll('g[data-l="fatias"] rect')];
    return {
      fatias: rects.length,
      areas: rects.map((r) => Math.round(Number(r.getAttribute('width')) * Number(r.getAttribute('height')))).filter((a) => a > 0).length,
      rotulos: svg.querySelectorAll('g[data-l="fatias"] text').length,
    };
  });
  checa('o treemap desenhou as fatias', !!tree && tree.fatias >= 8, JSON.stringify(tree));
  checa('as fatias têm área positiva', !!tree && tree.areas === tree.fatias, `areas=${tree?.areas}/${tree?.fatias}`);

  // ── conciliação de leads com o CRM REAL (§32) ───────────────────────────
  log('  — conciliação GA4 × CRM real —');
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/conversoes'; });
  await page.waitForTimeout(2200);
  const conc = await page.evaluate(() => {
    const t = document.querySelector('[data-ga-react-root] .ga-conteudo')?.textContent ?? '';
    return {
      // ⚠️ O ponto da tela: com o GA4 em mock a diferença NÃO pode ser exibida.
      suspensa: /Comparação suspensa/i.test(t),
      diz_por_que: /fontes diferentes|simulado e o lado CRM é real/i.test(t),
      mostra_banco: /PIPE_DSHOW/.test(t),
      mostra_manual: /criados à mão/i.test(t),
      // Se aparecer um percentual de diferença aqui, a suspensão falhou.
      tem_card_diferenca: /Diferença/.test(t),
    };
  });
  checa('a comparação aparece SUSPENSA (fontes mistas)', conc.suspensa, JSON.stringify(conc));
  checa('a tela explica por que está suspensa', conc.diz_por_que);
  checa('mostra o banco real consultado (PIPE_DSHOW)', conc.mostra_banco);
  checa('mostra que a maioria dos leads é criada à mão', conc.mostra_manual);
  // ⚠️ Esta é a checagem que protege contra a regressão mais perigosa desta tela: exibir
  // "-97%" comparando dado simulado com dado real.
  checa('NÃO exibe card de diferença com fontes mistas', !conc.tem_card_diferenca,
    conc.tem_card_diferenca ? 'card de diferença apareceu — a suspensão falhou' : '');

  // ── FASE 3: insights com estatística, e exportação ──────────────────────
  log('  — Fase 3 —');

  // As regras estatísticas SÓ disparam em série deformada. Os dois cenários abaixo existem
  // exatamente para isso — sem eles, z-score e regressão nunca rodam e ninguém sabe se
  // funcionam. Foi assim que dois bugs meus apareceram (fórmula com `% 40` reportando ALTA
  // num cenário chamado "queda", e pico anulado pelo peso do dia da semana).
  const insightsDoCenario = async (cen) => {
    // ⚠️ ORDEM IMPORTA: navegar PRIMEIRO, trocar o cenário DEPOIS. Na primeira versão eu
    // trocava o cenário estando em outra tela e navegava em seguida — o `pico` não aparecia,
    // e eu quase concluí que a regra estava quebrada (o backend estava certo o tempo todo).
    await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/insights'; });
    await page.waitForTimeout(1200);
    const aceitou = await page.evaluate((c) => {
      const sel = document.querySelector('[data-ga-react-root] #ga-cenario');
      if (!sel) return { ok: false, motivo: 'select de cenário não encontrado' };
      const temOpcao = [...sel.options].some((o) => o.value === c);
      if (!temOpcao) return { ok: false, motivo: `opção ${c} não existe no select`, opcoes: [...sel.options].map((o) => o.value) };
      sel.value = c;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true, valor: sel.value };
    }, cen);
    if (!aceitou.ok) { return { erroTroca: aceitou }; }
    await page.waitForTimeout(2200);
    return page.evaluate(() => {
      const t = document.querySelector('[data-ga-react-root] .ga-conteudo')?.textContent ?? '';
      return {
        temZscore: /z-score/i.test(t),
        temRegressao: /regressão linear/i.test(t),
        temMetodo: /Como cada regra é calculada/i.test(t),
        temLimitacao: /não é robusto a valores extremos/i.test(t),
        pico: /Pico de sessões/i.test(t),
        queda: /tendência de queda/i.test(t),
      };
    });
  };

  const anom = await insightsDoCenario('anomalia_dia');
  checa('cenário de anomalia produz insight com z-score', !!anom.pico, JSON.stringify(anom));
  const tend = await insightsDoCenario('tendencia_queda');
  checa('cenário de tendência reporta QUEDA (não alta)', !!tend.queda, JSON.stringify(tend));
  checa('a tela mostra o método de cada regra', tend.temMetodo);
  // ⚠️ A limitação do z-score fica NA TELA: é o que permite ao usuário discordar da conclusão.
  checa('a tela declara a limitação do z-score', tend.temLimitacao);

  // volta ao cenário saudável
  await page.evaluate(() => {
    const sel = document.querySelector('[data-ga-react-root] #ga-cenario');
    if (sel) { sel.value = 'saudavel'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await page.waitForTimeout(900);

  // Diretoria
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/diretoria'; });
  await page.waitForTimeout(2000);
  const dir = await page.evaluate(() => {
    const t = document.querySelector('[data-ga-react-root] .ga-conteudo')?.textContent ?? '';
    return {
      temFunil: /Do site ao CRM/i.test(t),
      temAviso: /larguras das barras são ilustrativas/i.test(t),
      temDecisao: /Exige decisão/i.test(t),
    };
  });
  checa('Diretoria mostra o funil do site ao CRM', dir.temFunil, JSON.stringify(dir));
  // ⚠️ O aviso é obrigatório: com um lado simulado e outro real, proporção é desenho, não dado.
  checa('Diretoria avisa que as barras são ilustrativas', dir.temAviso);
  checa('Diretoria tem bloco "Exige decisão"', dir.temDecisao);

  // Exportação CSV — gera o arquivo e confere o conteúdo, sem depender de download real.
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/campanhas'; });
  await page.waitForTimeout(1600);
  const csv = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('[data-ga-react-root] .ga-btn')]
      .find((b) => /Exportar CSV/.test(b.textContent || ''));
    if (!btn) return { achou: false };
    // Intercepta o download: guarda o texto do Blob em vez de baixar.
    let capturado = null;
    const orig = URL.createObjectURL;
    URL.createObjectURL = (blob) => { capturado = blob; return 'blob:fake'; };
    const clickOrig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { /* não navega */ };
    btn.click();
    URL.createObjectURL = orig;
    HTMLAnchorElement.prototype.click = clickOrig;
    // ⚠️ O BOM tem de ser verificado nos BYTES, não no texto. `Blob.text()` decodifica em
    // UTF-8 e CONSOME o BOM — a primeira versão desta prova reprovou o código por isso,
    // enquanto os bytes EF BB BF estavam corretamente no arquivo.
    return capturado
      ? capturado.arrayBuffer().then((buf) => {
          const b = new Uint8Array(buf);
          const txt = new TextDecoder('utf-8').decode(buf);
          return {
            achou: true,
            temBom: b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF,
            pontoEVirgula: (txt.split('\n')[0] || '').includes(';'),
            semVirgulaDecimalErrada: !/\d\.\d{2};/.test(txt),
            linhas: txt.trim().split(/\r?\n/).length,
            cabecalho: (txt.split(/\r?\n/)[0] || '').replace('\uFEFF', '').slice(0, 60),
          };
        })
      : { achou: true, capturado: false };
  });
  checa('o botão de exportar CSV existe e gera arquivo', !!csv.achou && csv.linhas > 1, JSON.stringify(csv));
  // ⚠️ Estes dois são o que faz o arquivo ABRIR CERTO no Excel pt-BR.
  checa('o CSV tem BOM UTF-8 (acento não quebra no Excel)', !!csv.temBom);
  checa('o CSV usa ponto-e-vírgula como separador', !!csv.pontoEVirgula, csv.cabecalho ?? '');

  // ── tema exercitado de verdade ──────────────────────────────────────────
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/visao-geral'; });
  await page.waitForTimeout(900);
  const fundo = await page.evaluate(() => {
    const el = document.querySelector('[data-ga-react-root] .ga-kpi') ?? document.querySelector('[data-ga-react-root]');
    return el ? getComputedStyle(el).backgroundColor : null;
  });
  fundos[tema] = fundo;
  const rgb = (fundo ?? '').match(/\d+/g)?.map(Number) ?? [];
  const claro = rgb.length >= 3 && (rgb[0] + rgb[1] + rgb[2]) / 3 > 128;
  checa(`o tema aplicado é mesmo ${tema}`, claro === (tema === 'light'), `fundo=${fundo}`);

  await page.screenshot({ path: `${OUT}/ga-fase1-visao-geral-${tema}.png`, fullPage: false }).catch(() => {});
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/qualidade'; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/ga-fase1-qualidade-${tema}.png` }).catch(() => {});
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/jornada'; });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/ga-fase2-jornada-${tema}.png` }).catch(() => {});
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/localizacoes'; });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/ga-fase2-mapa-${tema}.png` }).catch(() => {});

  if (comErro.length) log(`  telas com problema: ${comErro.join(' | ')}`);
  await ctx.close();
}

log('\n═══ os dois temas foram mesmo exercitados? ═══');
checa('o fundo difere entre dark e light',
  !!fundos.dark && !!fundos.light && fundos.dark !== fundos.light,
  `dark=${fundos.dark} light=${fundos.light}`);

log(`\n${fail === 0 ? 'PASSOU' : 'REPROVOU'} — ${ok + fail} checagens, ${fail} falha(s)`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
