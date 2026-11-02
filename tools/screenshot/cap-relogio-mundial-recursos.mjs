// cap-relogio-mundial-recursos.mjs — prova dos recursos que a suíte principal não cobre.
// @version 1.0.0  @created 2026-07-30
//
// A suíte principal (cap-relogio-mundial.mjs) prova montagem, mapa, camadas, temas e
// responsividade. Estes aqui são os recursos que a DOCUMENTAÇÃO afirma e que ninguém
// tinha exercitado ponta a ponta:
//
//   • exportação PNG — o arquivo sai mesmo, e é uma imagem válida?
//   • link compartilhável — abrir a URL gerada REPRODUZ a configuração?
//   • navegação por teclado — dá para chegar em tudo com Tab, sem armadilha de foco?
//   • semântica ARIA — botão sem nome acessível, id duplicado, referência quebrada?
//
// A lição que originou este arquivo: na rodada anterior "WCAG AAA" e "animações
// fluidas" estavam escritos na doc e os dois eram falsos. Afirmação sem medição é
// chute — então tudo que a doc afirma passa a ter um teste.
//
//   WCM_OUT=/tmp/wcm node tools/screenshot/cap-relogio-mundial-recursos.mjs

import fs from 'node:fs';
import path from 'node:path';
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = process.env.WCM_OUT || '/tmp/wcm-proof';
const ROTA = '#/panel-relogio-mundial';

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  if (!cond) falhas++;
  console.log(`${cond ? '  OK  ' : ' FALHA'} │ ${nome}${extra ? ' — ' + extra : ''}`);
};
const secao = (t) => console.log(`\n── ${t} ──`);

fs.mkdirSync(OUT, { recursive: true });


/**
 * ESTADO CONHECIDO ANTES DE MEDIR.
 *
 * As preferências do painel são salvas NO SERVIDOR. Sem este reset, cada execução
 * herdava o que a anterior deixou — uma rodada que trocou para o globo fazia a
 * seguinte contar marcadores num globo, e a contagem oscilava entre 5 e 10 sem que
 * nada no código tivesse mudado. Suíte não hermética produz número que não significa
 * nada; este reset é o que torna as asserções comparáveis entre execuções.
 */
async function resetarPreferencias(page) {
  const r = await page.evaluate(async () => {
    const pegaCsrf = async () => {
      const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (meta) return meta;
      const g = window.SecurityCSRF?.getToken?.();
      if (g) return g;
      const res = await fetch('/api/auth/check.php', { credentials: 'include', headers: { Accept: 'application/json' } });
      const j = await res.json().catch(() => null);
      return j?.data?.session?.csrf_token || '';
    };
    try {
      localStorage.removeItem('dsd:world-clock:preferences');
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': await pegaCsrf() },
        // null = "sem preferência salva"; o painel volta aos padrões de fábrica.
        body: JSON.stringify({ key: 'world_clock.preferences', value: null }),
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, erro: String(e).slice(0, 60) };
    }
  });
  return r;
}

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
    '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({
  viewport: { width: 1560, height: 940 },
  ignoreHTTPSErrors: true,
  acceptDownloads: true,
  permissions: ['clipboard-read', 'clipboard-write'],
});
try { await ctx.addCookies(await getSessionCookies()); } catch { /* login por formulário */ }
const page = await ctx.newPage();

const abrirPainel = async () => {
  await page.evaluate((r) => { location.hash = r; }, ROTA);
  await page.waitForSelector('[data-wcm-react-root] .wcm-root', { timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector('.wcm-map__loading'), { timeout: 30000 });
  await page.waitForTimeout(1600);
};

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(1800);
const reset = await resetarPreferencias(page);
console.log(`(preferências do servidor zeradas: ${reset.ok ? 'sim' : 'FALHOU'})`);
await abrirPainel();

// ===================== exportação PNG =====================
secao('exportação PNG');
{
  const esperaDownload = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await page.click('button[aria-label="Exportar imagem do mapa em PNG"]');
  const dl = await esperaDownload;

  if (!dl) {
    ok('download do PNG disparado', false, 'nenhum evento de download em 15 s');
  } else {
    const destino = path.join(OUT, 'export-teste.png');
    await dl.saveAs(destino);
    const tam = fs.statSync(destino).size;
    const buf = fs.readFileSync(destino);

    // Assinatura PNG + leitura do cabeçalho IHDR (largura/altura em big-endian).
    const assinatura = buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    const largura = buf.readUInt32BE(16);
    const altura = buf.readUInt32BE(20);

    ok('nome do arquivo com carimbo de data', /^relogio-mundial_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.png$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    ok('assinatura PNG válida', assinatura, `${(tam / 1024).toFixed(0)} KB`);
    ok('dimensões plausíveis', largura > 600 && altura > 400, `${largura}×${altura}`);
    // A imagem tem cabeçalho + mapa + legenda: precisa ser MAIS ALTA que o canvas.
    const alturaCanvas = await page.evaluate(() => document.querySelector('.wcm-map__canvas').height);
    ok('imagem inclui cabeçalho e legenda além do mapa', altura > alturaCanvas + 60,
      `${altura} > canvas ${alturaCanvas} + 60`);
  }
}

// ===================== link compartilhável =====================
secao('link compartilhável (ida e volta)');
{
  // Monta uma configuração RECONHECÍVEL: globo, Tóquio ativo, timeline deslocada.
  await page.selectOption('#wcm-proj', 'orthographic');
  await page.waitForTimeout(700);
  await page.fill('.wcm-search__input', 'toqu');
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const t = document.querySelector('.wcm-timeline__track');
    t.focus();
  });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);

  const antes = await page.evaluate(() => ({
    projecao: document.querySelector('#wcm-proj').value,
    ativa: document.querySelector('.wcm-clock__place strong')?.textContent,
    offset: Number(document.querySelector('.wcm-timeline__track')?.getAttribute('aria-valuenow') || 0),
    cidades: document.querySelectorAll('.wcm-marker').length,
  }));

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.wcm-hbtn')].find((x) => /Compartilhar/.test(x.textContent));
    b?.click();
  });
  await page.waitForTimeout(900);

  const url = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  ok('link copiado para a área de transferência', /[?&]wc=1/.test(url), url.slice(0, 110));
  ok('link carrega projeção, cidade ativa e deslocamento',
    /p=orthographic/.test(url) && /a=tokyo/.test(url) && /[?&]t=/.test(url),
    url.replace(/^https?:\/\/[^/]+/, '').slice(0, 130));

  // Volta ao padrão e abre o link: a configuração tem que ser reproduzida.
  await page.evaluate(() => { location.hash = '#/panel-home'; });
  await page.waitForTimeout(1500);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-wcm-react-root] .wcm-root', { timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector('.wcm-map__loading'), { timeout: 30000 });
  await page.waitForTimeout(2200);

  const depois = await page.evaluate(() => ({
    projecao: document.querySelector('#wcm-proj')?.value,
    ativa: document.querySelector('.wcm-clock__place strong')?.textContent,
    offset: Number(document.querySelector('.wcm-timeline__track')?.getAttribute('aria-valuenow') || 0),
    urlLimpa: !/[?&]wc=1/.test(location.href),
  }));

  ok('projeção reproduzida', depois.projecao === antes.projecao, `${antes.projecao} → ${depois.projecao}`);
  ok('cidade em destaque reproduzida', depois.ativa === antes.ativa, `${antes.ativa} → ${depois.ativa}`);
  ok('deslocamento da timeline reproduzido', depois.offset === antes.offset, `${antes.offset} → ${depois.offset} min`);
  // Deixar os parâmetros na barra faria um F5 desfazer tudo que o usuário mexer depois.
  ok('parâmetros limpos da barra de endereços após aplicar', depois.urlLimpa);
}

// ===================== navegação por teclado =====================
secao('navegação por teclado');
await abrirPainel();
{
  const r = await page.evaluate(async () => {
    const raiz = document.querySelector('[data-wcm-react-root]');
    // Coloca o foco antes do painel e percorre com Tab, registrando onde para.
    const focaveis = raiz.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])',
    );
    return {
      focaveis: focaveis.length,
      semNomeAcessivel: [...focaveis].filter((el) => {
        const texto = (el.textContent || '').trim();
        const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
        // <select> é nomeado por <label for> ou aria-label.
        if (el.tagName === 'SELECT' || el.tagName === 'INPUT') {
          const id = el.id;
          const rot = id ? raiz.querySelector(`label[for="${CSS.escape(id)}"]`) : el.closest('label');
          return !aria && !rot;
        }
        return !texto && !aria;
      }).map((el) => el.className || el.tagName).slice(0, 6),
      tabindexPositivo: [...raiz.querySelectorAll('[tabindex]')]
        .filter((el) => Number(el.getAttribute('tabindex')) > 0).length,
    };
  });

  ok('elementos focáveis no painel', r.focaveis >= 25, `${r.focaveis} focáveis`);
  ok('todo controle focável tem nome acessível', r.semNomeAcessivel.length === 0,
    r.semNomeAcessivel.length ? r.semNomeAcessivel.join(' · ') : 'nenhum anônimo');
  // tabindex positivo quebra a ordem natural e é sempre um erro em componente.
  ok('sem tabindex positivo (não sequestra a ordem de tabulação)', r.tabindexPositivo === 0, `${r.tabindexPositivo}`);

  // Percurso real: 40 Tabs a partir do primeiro controle do painel. O foco tem que
  // andar (sem armadilha) e passar por controles distintos.
  // IDENTIDADE do elemento, não a classe dele.
  //
  // A primeira versão comparava `TAG.primeiraClasse` e acusava armadilha no header —
  // que tem 9 botões seguidos, todos `BUTTON.wcm-hbtn`. Tabular de um para o outro
  // produzia strings idênticas e o teste dava FALHA num painel perfeitamente
  // navegável. Agora cada elemento visitado é carimbado com um número de sequência:
  // armadilha de verdade é o MESMO elemento receber foco duas vezes seguidas.
  await page.evaluate(() => {
    document.querySelectorAll('[data-wcm-tab]').forEach((el) => el.removeAttribute('data-wcm-tab'));
    document.querySelector('.wcm-hbtn')?.focus();
  });
  let presoEm = null;
  let distintos = 0;
  let anteriorCarimbo = -1;
  for (let i = 0; i < 45; i++) {
    const r = await page.evaluate((passo) => {
      const a = document.activeElement;
      if (!a) return { carimbo: -1, desc: 'nenhum' };
      let carimbo = a.getAttribute('data-wcm-tab');
      const novo = carimbo === null;
      if (novo) { carimbo = String(passo); a.setAttribute('data-wcm-tab', carimbo); }
      return {
        carimbo: Number(carimbo),
        novo,
        desc: `${a.tagName}.${String(a.className).split(' ')[0]}`,
      };
    }, i);
    if (i > 0 && r.carimbo === anteriorCarimbo) { presoEm = r.desc; break; }
    if (r.novo) distintos++;
    anteriorCarimbo = r.carimbo;
    await page.keyboard.press('Tab');
  }
  await page.evaluate(() => document.querySelectorAll('[data-wcm-tab]').forEach((el) => el.removeAttribute('data-wcm-tab')));
  ok('Tab percorre o painel sem armadilha de foco', presoEm === null,
    presoEm ? `preso em ${presoEm}` : `${distintos} elementos distintos alcançados`);

  // O mapa precisa ser operável só com teclado.
  await page.evaluate(() => document.querySelector('.wcm-map')?.focus());
  const zoomAntes = await page.evaluate(() => document.querySelector('.wcm-toolbar__zoom')?.textContent);
  await page.keyboard.press('+');
  await page.keyboard.press('+');
  await page.waitForTimeout(600);
  const zoomDepois = await page.evaluate(() => document.querySelector('.wcm-toolbar__zoom')?.textContent);
  ok('teclado amplia o mapa', zoomAntes !== zoomDepois, `${zoomAntes} → ${zoomDepois}`);
  await page.keyboard.press('0');
  await page.waitForTimeout(500);
  const zoomReset = await page.evaluate(() => document.querySelector('.wcm-toolbar__zoom')?.textContent);
  ok('tecla 0 reenquadra', zoomReset === zoomAntes, `${zoomDepois} → ${zoomReset}`);

  // Foco visível: a WCAG exige indicador perceptível.
  await page.evaluate(() => document.querySelector('.wcm-hbtn')?.focus());
  const contorno = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { outline: cs.outlineStyle, largura: cs.outlineWidth, cor: cs.outlineColor };
  });
  ok('foco tem indicador visível', contorno.outline !== 'none' && parseFloat(contorno.largura) >= 1.5,
    `${contorno.outline} ${contorno.largura} ${contorno.cor}`);
}

// ===================== semântica ARIA =====================
secao('semântica ARIA');
{
  const r = await page.evaluate(() => {
    const raiz = document.querySelector('[data-wcm-react-root]');
    const problemas = [];

    // aria-controls / aria-labelledby / aria-describedby apontando para id inexistente.
    for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-activedescendant']) {
      for (const el of raiz.querySelectorAll(`[${attr}]`)) {
        const v = el.getAttribute(attr);
        if (!v) continue;
        for (const id of v.split(/\s+/)) {
          // aria-activedescendant pode apontar para item que só existe com a lista aberta.
          if (attr === 'aria-activedescendant' && !id) continue;
          if (id && !document.getElementById(id)) {
            problemas.push(`${attr}="${id}" sem alvo (${String(el.className).split(' ')[0]})`);
          }
        }
      }
    }

    // ids duplicados dentro do painel quebram todas as referências acima.
    const ids = [...raiz.querySelectorAll('[id]')].map((e) => e.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) problemas.push(`ids duplicados: ${[...new Set(dup)].slice(0, 4).join(', ')}`);

    // role=slider precisa de faixa e valor.
    for (const el of raiz.querySelectorAll('[role="slider"]')) {
      if (!el.hasAttribute('aria-valuenow') || !el.hasAttribute('aria-valuemin') || !el.hasAttribute('aria-valuemax')) {
        problemas.push('slider sem aria-valuenow/min/max');
      }
    }

    // aria-pressed / aria-expanded só valem em elementos interativos.
    for (const el of raiz.querySelectorAll('[aria-pressed], [aria-expanded]')) {
      if (!['BUTTON', 'A', 'INPUT'].includes(el.tagName) && !el.hasAttribute('role')) {
        problemas.push(`${el.tagName} com aria-pressed/expanded sem papel interativo`);
      }
    }

    return {
      problemas,
      landmarks: raiz.querySelectorAll('header, nav, section, [role="toolbar"], [role="application"]').length,
      live: raiz.querySelectorAll('[aria-live]').length,
    };
  });

  ok('nenhuma referência ARIA quebrada nem id duplicado', r.problemas.length === 0,
    r.problemas.length ? r.problemas.slice(0, 5).join(' · ') : 'referências íntegras');
  ok('landmarks e papéis presentes', r.landmarks >= 5, `${r.landmarks} regiões`);
  ok('regiões aria-live para anúncios dinâmicos', r.live >= 2, `${r.live}`);
}

// ===================== tela cheia =====================
secao('tela cheia');
{
  // O fullscreen é pedido ao ELEMENTO do painel (não ao document), para a barra
  // lateral e o cabeçalho do shell saírem de cena. Nunca tinha sido exercitado.
  const antes = await page.evaluate(() => ({
    fs: Boolean(document.fullscreenElement),
    largura: Math.round(document.querySelector('.wcm-root').getBoundingClientRect().width),
  }));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.wcm-hbtn')].find((x) => /Tela cheia/.test(x.textContent));
    b?.click();
  });
  await page.waitForTimeout(1200);
  const dentro = await page.evaluate(() => ({
    fs: Boolean(document.fullscreenElement),
    alvo: document.fullscreenElement?.className || '',
    largura: Math.round(document.querySelector('.wcm-root').getBoundingClientRect().width),
    canvas: Math.round(document.querySelector('.wcm-map__canvas').getBoundingClientRect().width),
  }));
  ok('entra em tela cheia', dentro.fs, `elemento = ${dentro.alvo || 'nenhum'}`);
  ok('o elemento em tela cheia é a raiz do painel', /wcm-root/.test(dentro.alvo), dentro.alvo);
  ok('painel ocupa mais espaço em tela cheia', dentro.largura > antes.largura,
    `${antes.largura}px → ${dentro.largura}px`);
  ok('canvas acompanha o novo tamanho', dentro.canvas > antes.largura * 0.9, `canvas ${dentro.canvas}px`);

  // O caminho do usuário é o próprio botão (ele alterna). Esc não é testável aqui:
  // o navegador trata a tecla no gerenciador de tela cheia, camada que a tecla
  // sintética do Playwright não alcança em headless — testar Esc mediria o
  // Playwright, não o painel.
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.wcm-hbtn')].find((x) => /Restaurar|Tela cheia/.test(x.textContent));
    b?.click();
  });
  await page.waitForTimeout(1200);
  const fora = await page.evaluate(() => Boolean(document.fullscreenElement));
  ok('o botão sai da tela cheia (alterna)', !fora);
  const largura = await page.evaluate(() => Math.round(document.querySelector('.wcm-root').getBoundingClientRect().width));
  ok('painel volta ao tamanho do container', largura === antes.largura, `${largura}px (era ${antes.largura}px)`);
  await page.waitForTimeout(800);
}

// ===================== impressão =====================
secao('folha de impressão');
{
  // A doc diz que o PDF sai da impressão do navegador. Se a folha @media print
  // deixasse o host absolute, o papel sairia com uma página só e conteúdo cortado.
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(900);
  const impresso = await page.evaluate(() => {
    const host = document.querySelector('[data-wcm-react-root]');
    const cs = getComputedStyle(host);
    const alturaDoc = document.documentElement.scrollHeight;
    const visiveis = (sel) => [...document.querySelectorAll(sel)]
      .filter((e) => getComputedStyle(e).display !== 'none').length;
    return {
      posicao: cs.position,
      alturaDoc,
      toolbars: visiveis('.wcm-toolbar'),
      acoesHeader: visiveis('.wcm-header__actions'),
      paineis: visiveis('.wcm-glass'),
    };
  });
  ok('host volta ao fluxo no papel', impresso.posicao === 'static', `position: ${impresso.posicao}`);
  // Uma "página" A4 em 96dpi tem ~1123px. Sair com 940px significava que o recorte
  // do shell (#main fixed + overflow) estava vencendo a folha de impressão.
  ok('conteúdo se estende por mais de uma página', impresso.alturaDoc > 1400, `${impresso.alturaDoc}px de altura`);
  ok('controles não vão para o papel', impresso.toolbars === 0 && impresso.acoesHeader === 0,
    `toolbars=${impresso.toolbars} ações=${impresso.acoesHeader}`);
  ok('painéis de conteúdo permanecem', impresso.paineis >= 3, `${impresso.paineis} painéis`);
  await page.emulateMedia({ media: 'screen' });
  await page.waitForTimeout(700);
}

// ===================== clima indisponível =====================
secao('degradação quando o clima cai');
{
  // A doc afirma que o painel NÃO inventa temperatura quando o upstream falha.
  await page.route('**/api/weather/bulk.php*', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, data: null, error: 'UPSTREAM_UNAVAILABLE' }),
  }));
  await page.evaluate(() => { location.hash = '#/panel-home'; });
  await page.waitForTimeout(1500);
  await abrirPainel();
  await page.waitForTimeout(1500);

  const semClima = await page.evaluate(() => {
    const cartoes = [...document.querySelectorAll('.wcm-marker__card')];
    return {
      cartoes: cartoes.length,
      comTemperatura: cartoes.filter((c) => /°C/.test(c.textContent || '')).length,
      erroNaTela: /erro|falha|undefined|NaN/i.test(document.querySelector('.wcm-stage')?.textContent || ''),
      mapaOk: document.querySelectorAll('.wcm-marker').length,
    };
  });
  ok('painel continua funcionando sem clima', semClima.mapaOk >= 5, `${semClima.mapaOk} marcadores`);
  ok('nenhuma temperatura inventada', semClima.comTemperatura === 0,
    `${semClima.comTemperatura} de ${semClima.cartoes} cartões com °C`);
  ok('sem NaN/undefined vazando para a tela', !semClima.erroNaTela);
  await page.unroute('**/api/weather/bulk.php*');
}

// ===================== persistência no servidor =====================
secao('persistência das preferências no servidor');
{
  await page.evaluate(() => { location.hash = '#/panel-home'; });
  await page.waitForTimeout(1200);
  await abrirPainel();

  // Muda algo verificável e espera o debounce de 900 ms subir para o servidor.
  await page.selectOption('#wcm-proj', 'naturalEarth');
  await page.waitForTimeout(2500);

  const noServidor = await page.evaluate(async () => {
    const r = await fetch('/api/user/preferences', { credentials: 'include', headers: { Accept: 'application/json' } });
    const b = await r.json();
    const bag = b?.data?.preferences ?? b?.preferences ?? b?.data ?? b;
    return bag?.['world_clock.preferences']?.projection ?? null;
  });
  ok('preferência gravada no SERVIDOR (não só no localStorage)', noServidor === 'naturalEarth',
    `projection no servidor = ${noServidor}`);

  // Limpa o espelho local e recarrega: se voltar Natural Earth, veio do servidor.
  await page.evaluate(() => localStorage.removeItem('dsd:world-clock:preferences'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  // isLoginPage() casa com o input de senha mesmo OCULTO (o modal de login fica no
  // DOM o tempo todo), então dá falso positivo com a sessão válida. Aqui a checagem
  // é por VISIBILIDADE real.
  const precisaLogar = await page.evaluate(() => {
    const el = document.querySelector('input[type="password"]');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  });
  if (precisaLogar) await loginViaPage(page);
  await abrirPainel();
  await page.waitForTimeout(2000);
  const restaurado = await page.evaluate(() => document.querySelector('#wcm-proj')?.value);
  ok('preferência volta do servidor sem espelho local', restaurado === 'naturalEarth',
    `projeção após recarga = ${restaurado}`);
}

console.log('\n════════════════════════════════════════');
console.log(falhas === 0 ? 'TODOS OS TESTES DE RECURSOS PASSARAM' : `${falhas} FALHA(S)`);
console.log('════════════════════════════════════════\n');

await browser.close();
process.exit(falhas === 0 ? 0 : 1);
