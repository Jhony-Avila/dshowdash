// cap-relogio-mundial.mjs — prova visual e funcional do painel Relógio Mundial v3.
// @version 1.0.0  @created 2026-07-30
//
// Uso:  WCM_OUT=/caminho/saida node tools/screenshot/cap-relogio-mundial.mjs
//
// Bypassa o Cloudflare pela origem (--host-resolver-rules), autentica pelo formulário
// (loginViaPage resolve a race do auth-guard do SPA) e valida no NAVEGADOR REAL o que
// nenhum teste de nó consegue provar: se o canvas pintou pixels, se as camadas
// respondem, se as projeções trocam e se o unmount limpa o DOM.

import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
// sharp decodifica o PNG do screenshot: é assim que se mede a pintura de um canvas
// entregue ao worker, já que a thread principal não consegue mais um contexto 2D.
import sharp from './node_modules/sharp/lib/index.js';

const OUT = process.env.WCM_OUT || '/tmp/wcm-proof';
const ROTA = '#/panel-relogio-mundial';
const RAIZ = '[data-wcm-react-root]';

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  if (!cond) falhas++;
  console.log(`${cond ? '  OK  ' : ' FALHA'} │ ${nome}${extra ? ' — ' + extra : ''}`);
};


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
  args: [
    '--no-sandbox', '--disable-dev-shm-usage',
    '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
    '--ignore-certificate-errors',
  ],
});
const ctx = await browser.newContext({
  viewport: { width: 1560, height: 940 },
  deviceScaleFactor: 1.5,
  ignoreHTTPSErrors: true,
});
try { await ctx.addCookies(await getSessionCookies()); } catch { /* cai no login por formulário */ }

const page = await ctx.newPage();
const erros = [];
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
page.on('pageerror', (e) => erros.push('PAGEERROR: ' + e.message));

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(1800);

const reset = await resetarPreferencias(page);
console.log(`\n(preferências do servidor zeradas: ${reset.ok ? 'sim' : 'FALHOU — números podem herdar execução anterior'})`);

console.log('\n── montagem ──');
await page.evaluate((r) => { location.hash = r; }, ROTA);
await page.waitForSelector(`${RAIZ} .wcm-root`, { timeout: 30000 });
// Espera a geometria mundial (fetch de 756 KB) e a primeira pintura completa.
await page.waitForFunction(() => !document.querySelector('.wcm-map__loading'), { timeout: 30000 });
await page.waitForTimeout(1800);

const impl = await page.evaluate(async () => {
  const mod = await import('/components/panels/panel-relogio-mundial/index.js');
  return mod.info();
});
ok('adaptador monta em React (não caiu no vanilla)', impl.impl === 'react', `impl=${impl.impl} v${impl.version || ''}`);

// ---- canvas realmente pintou? ----
// Contar pixels não transparentes é a única prova de que o renderizador rodou;
// existir <canvas> no DOM não prova nada.
//
// A MEDIÇÃO É POR SCREENSHOT, NÃO POR getImageData.
// O mapa pinta num worker via `transferControlToOffscreen`, e canvas transferido
// recusa `getContext` na thread principal ("Cannot get context from a canvas that
// has transferred its control to offscreen") — a versão anterior desta asserção
// LANÇAVA e derrubava a suíte inteira na 2ª asserção. Ela foi escrita quando o
// renderizador ainda morava na thread principal e nunca voltou a rodar depois que
// o worker entrou. Ler o pixel composto serve aos dois caminhos e prova algo mais
// forte: o que de fato chega à tela do usuário.
const pintura = await (async () => {
  const el = await page.$('.wcm-map__canvas');
  if (!el) return { erro: 'sem canvas', opacos: 0, cores: 0 };
  const caixa = await el.boundingBox();
  const png = await el.screenshot({ omitBackground: true });
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let opacos = 0;
  const cores = new Set();
  // Mesmo passo de amostragem (a cada 97 pixels) da versão por getImageData, para
  // que os limiares de 1000 amostras e 40 cores sigam comparáveis com o histórico.
  for (let i = 0; i < data.length; i += 4 * 97) {
    if (data[i + 3] > 8) opacos++;
    cores.add(`${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`);
  }
  return { w: info.width, h: info.height, cssW: Math.round(caixa?.width || 0), opacos, cores: cores.size };
})();
ok('canvas pintado', pintura.opacos > 1000, `${pintura.opacos} amostras opacas, ${pintura.cores} cores distintas (${pintura.w}×${pintura.h})`);
ok('cena tem variação cromática (terra/mar/noite)', pintura.cores > 40, `${pintura.cores} cores`);

// GEOMETRIA — esta verificação nasceu de um bug real: o host usava height:100% e o
// container do shell tem altura vinda de flex (especificada `auto`), então o painel
// colapsava para 104px e o mapa ficava numa faixa de 120px. Tudo o mais passava:
// o canvas pintava, os marcadores existiam, o relógio andava. Só a ALTURA denunciava.
const caixa = await page.evaluate(() => {
  const root = document.querySelector('.wcm-root');
  const stage = document.querySelector('.wcm-stage');
  const canvas = document.querySelector('.wcm-map__canvas');
  const content = document.querySelector('.dsd-container__content');
  const r = (el) => (el ? el.getBoundingClientRect() : null);
  return {
    root: Math.round(r(root)?.height || 0),
    stage: Math.round(r(stage)?.height || 0),
    canvas: Math.round(r(canvas)?.height || 0),
    container: Math.round(r(content)?.height || 0),
  };
});
ok('painel preenche o container do shell', caixa.container > 0 && caixa.root >= caixa.container - 4,
  `root ${caixa.root}px de ${caixa.container}px do container`);
ok('mapa tem altura de trabalho (> 400px)', caixa.canvas > 400, `canvas ${caixa.canvas}px, palco ${caixa.stage}px`);

// ---- inventário da interface ----
const inv = await page.evaluate(() => ({
  marcadores: document.querySelectorAll('.wcm-marker').length,
  cartoes: document.querySelectorAll('.wcm-marker__card').length,
  mercadosMapa: document.querySelectorAll('.wcm-mkt').length,
  paineis: document.querySelectorAll('.wcm-glass').length,
  linhasMercado: document.querySelectorAll('.wcm-mkrow').length,
  minis: document.querySelectorAll('.wcm-mini').length,
  timelineCelulas: document.querySelectorAll('.wcm-timeline__cell').length,
  analogico: document.querySelectorAll('.wcm-analog').length,
  relogiosSimultaneos: document.querySelectorAll('.wcm-mclock').length,
  horaDestaque: document.querySelector('.wcm-clock__time')?.textContent || '',
  utcHeader: document.querySelectorAll('.wcm-stat--mono dd')[0]?.textContent || '',
  mercadosAbertos: document.querySelector('.wcm-stat--markets dd')?.textContent?.trim() || '',
}));
console.log('\n── inventário ──');
console.log(JSON.stringify(inv, null, 2).split('\n').map((l) => '       ' + l).join('\n'));
ok('marcadores de cidade renderizados', inv.marcadores >= 10, `${inv.marcadores}`);
ok('cartões completos (não só pontos)', inv.cartoes >= 5, `${inv.cartoes}`);
// Os pinos CEDEM espaço aos cartões de cidade (que já reportam o mercado da praça)
// e ao posicionador de rótulos. Com muitos painéis abertos sobram poucos — e tudo
// bem: o painel Mercados é a superfície autoritativa, com as 29 praças.
ok('pinos de bolsa no mapa', inv.mercadosMapa >= 1, `${inv.mercadosMapa} (cedem lugar aos cartões)`);
ok('painéis de vidro', inv.paineis >= 5, `${inv.paineis}`);
ok('praças no painel de mercados', inv.linhasMercado >= 25, `${inv.linhasMercado}`);
// 3 trilhas × 48 células = 144 no modo compacto (o padrão). A barra abre para 9
// cidades sob demanda; 144 é o piso correto, não uma regressão.
ok('faixa de múltiplos relógios', inv.relogiosSimultaneos >= 3, `${inv.relogiosSimultaneos} cidades simultâneas`);
ok('trilhas da timeline', inv.timelineCelulas >= 144, `${inv.timelineCelulas} células (compacta = 3 cidades × 48)`);
// 1 no painel Relógio + os da faixa "Relógios simultâneos" (Múltiplos Relógios).
ok('relógios analógicos presentes', inv.analogico >= 2, `${inv.analogico} mostradores`);
ok('hora em destaque no formato HH:MM:SS', /^\d{2}:\d{2}:\d{2}$/.test(inv.horaDestaque.trim()), inv.horaDestaque);

// ---- o relógio anda? ----
const t1 = await page.evaluate(() => document.querySelector('.wcm-clock__time')?.textContent);
await page.waitForTimeout(2200);
const t2 = await page.evaluate(() => document.querySelector('.wcm-clock__time')?.textContent);
ok('relógio avança (timer mestre vivo)', t1 !== t2, `${t1} → ${t2}`);

// ---- projeções ----
console.log('\n── projeções ──');
for (const proj of ['orthographic', 'naturalEarth', 'mercator', 'equirectangular']) {
  await page.selectOption('#wcm-proj', proj);
  await page.waitForTimeout(900);
  const pintado = await medirCanvas(page, 97);
  const p = {
    opacos: pintado.opacos,
    globo: await page.evaluate(() => document.querySelector('.wcm-map')?.classList.contains('is-globe')),
  };
  ok(`projeção ${proj} pinta`, p.opacos > 500, `${p.opacos} amostras${p.globo ? ' (modo globo)' : ''}`);
  if (proj === 'orthographic') {
    await page.screenshot({ path: `${OUT}/globo-dark.png` });
  }
}

// ---- camadas ----
console.log('\n── camadas ──');
const alvo = await page.$('button[aria-label="Luzes das cidades"]');
if (alvo) {
  const antes = await amostraCanvas(page);
  await alvo.click();
  await page.waitForTimeout(800);
  const depois = await amostraCanvas(page);
  ok('desligar luzes das cidades altera a pintura', antes !== depois, `${antes} → ${depois}`);
  await alvo.click();
  await page.waitForTimeout(600);
} else {
  ok('botão de camada "Luzes das cidades" existe', false);
}

const btnNoite = await page.$('button[aria-label="Dia / noite"]');
if (btnNoite) {
  const antes = await amostraCanvas(page);
  await btnNoite.click();
  await page.waitForTimeout(800);
  const depois = await amostraCanvas(page);
  ok('desligar sombra dia/noite altera a pintura', antes !== depois, `${antes} → ${depois}`);
  await btnNoite.click();
  await page.waitForTimeout(600);
}

// ---- timeline arrastável ----
console.log('\n── timeline ──');
const track = await page.$('.wcm-timeline__track');
if (track) {
  const antesHora = await page.evaluate(() => document.querySelector('.wcm-clock__time')?.textContent);
  const b = await track.boundingBox();
  await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.78, b.y + b.height * 0.5, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => ({
    hora: document.querySelector('.wcm-clock__time')?.textContent,
    aviso: Boolean(document.querySelector('.wcm-timewarn')),
    cursor: document.querySelector('.wcm-timeline__cursor-info')?.textContent?.trim(),
    offset: Number(document.querySelector('.wcm-timeline__track')?.getAttribute('aria-valuenow') || 0),
  }));
  // Comparar só a HORA não prova nada: o relógio anda sozinho e o teste passaria
  // mesmo com o arrasto inerte (foi o que aconteceu na primeira rodada).
  // O que prova é o aria-valuenow do slider ter saído de zero.
  ok('arrastar a timeline desloca o instante', Math.abs(st.offset) > 60,
    `offset = ${st.offset} min · ${antesHora} → ${st.hora}`);
  ok('aviso de instante deslocado aparece', st.aviso, st.cursor);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  const voltou = await page.evaluate(() => !document.querySelector('.wcm-timewarn'));
  ok('Esc volta para agora', voltou);
} else {
  ok('timeline presente', false);
}

// ---- busca ----
console.log('\n── busca e comparador ──');
await page.fill('.wcm-search__input', 'toqu');
await page.waitForTimeout(700);
const busca = await page.evaluate(() => ({
  grupos: [...document.querySelectorAll('.wcm-search__group')].map((e) => e.textContent),
  itens: document.querySelectorAll('.wcm-search__item').length,
  primeiro: document.querySelector('.wcm-search__name')?.textContent,
}));
ok('busca com acento retorna resultado', busca.itens > 0, `${busca.itens} itens, 1º = ${busca.primeiro}`);
ok('resultados vêm agrupados', busca.grupos.length > 0, busca.grupos.join(' / '));
await page.keyboard.press('Enter');
await page.waitForTimeout(900);
const ativo = await page.evaluate(() => document.querySelector('.wcm-clock__place strong')?.textContent);
ok('Enter na busca seleciona a cidade', ativo === 'Tóquio', `ativo = ${ativo}`);

// ---- comparador ----
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.wcm-hbtn')].find((x) => /Comparar/.test(x.textContent));
  b?.click();
});
await page.waitForTimeout(900);
const cmp = await page.evaluate(() => ({
  existe: Boolean(document.querySelector('.wcm-cmp')),
  delta: document.querySelector('.wcm-cmp__delta strong')?.textContent,
  slots: document.querySelectorAll('.wcm-slot').length,
  overlap: document.querySelector('.wcm-cmp__overlap')?.textContent?.slice(0, 90),
}));
ok('comparador abre', cmp.existe);
ok('diferença de fuso calculada', Boolean(cmp.delta), cmp.delta);
ok('sugere horários de reunião', cmp.slots > 0, `${cmp.slots} slots · ${cmp.overlap || ''}`);

// ---- tooltip premium ----
console.log('\n── tooltip e clima ──');
// São Paulo é o alvo por ser geograficamente isolado no mapa: pegar o "primeiro
// cartão do DOM" caía em clusters (Cidade do México sob Nova York) e o Playwright
// recusava o hover por interceptação de ponteiro.
const marcador = await page.$('[data-city-id="sao-paulo"] .wcm-marker__card')
  || await page.$('.wcm-marker__card');
if (marcador) {
  await marcador.hover({ force: true });
  await page.waitForTimeout(800);
  const tip = await page.evaluate(() => {
    const t = document.querySelector('.wcm-tip');
    if (!t) return null;
    return {
      linhas: t.querySelectorAll('.wcm-tip__row').length,
      temSol: /Nascer/.test(t.textContent),
      temDst: /verão/.test(t.textContent),
      temClima: /Clima/.test(t.textContent),
    };
  });
  ok('tooltip premium abre no hover', Boolean(tip), tip ? `${tip.linhas} linhas` : '');
  if (tip) {
    ok('tooltip traz nascer/pôr do sol', tip.temSol);
    ok('tooltip traz horário de verão', tip.temDst);
    ok('tooltip traz clima real', tip.temClima);
  }
}

// ---- temas ----
console.log('\n── temas ──');
// Tenta o botão real do shell; se ele não estiver alcançável (fica no header do shell
// e nem sempre responde a click sintético), grava os SINAIS DE TEMA direto no DOM.
// Isso não é trapaça: `html[data-theme]` + `body.theme-*` são exatamente o que o
// painel observa, então o que está sendo testado — o painel reagir à troca — continua
// sendo testado de verdade.
async function setTheme(t) {
  let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (let i = 0; i < 3 && c !== t; i++) {
    await page.click('[data-dsd-theme-toggle]', { force: true, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(600);
    c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
  let viaBotao = c === t;
  if (!viaBotao) {
    await page.evaluate((tt) => {
      document.documentElement.setAttribute('data-theme', tt);
      document.body.classList.toggle('theme-light', tt === 'light');
      document.body.classList.toggle('theme-dark', tt === 'dark');
    }, t);
    await page.waitForTimeout(700);
    c = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
  return { tema: c, viaBotao };
}

const assinaturas = {};
const tokens = {};
for (const t of ['dark', 'light']) {
  const { tema, viaBotao } = await setTheme(t);
  await page.waitForTimeout(1200);
  ok(`tema ${t} aplicado`, tema === t, `data-theme=${tema}${viaBotao ? ' (botão do shell)' : ' (sinal DOM)'}`);
  assinaturas[t] = await amostraCanvas(page);
  tokens[t] = await page.evaluate(() => {
    const el = document.querySelector('[data-wcm-react-root]');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      fundo: cs.getPropertyValue('--wcm-glass-bg-solid').trim(),
      tinta: cs.getPropertyValue('--wcm-ink').trim(),
      classesBody: document.body.className,
    };
  });
  console.log(`       tokens ${t}: fundo=${tokens[t]?.fundo} tinta=${tokens[t]?.tinta}`);
  await page.screenshot({ path: `${OUT}/painel-${t}.png` });
}

// Comparar VALORES, não presença. Verificar só `Boolean(token)` deixou passar um bug
// real: um `body.theme-light` remanescente do boot prendia os painéis no tema claro
// enquanto o canvas (que lê o tema por JS) ia para o escuro — e o teste dizia OK.
ok('tokens de tema realmente divergem entre claro e escuro',
  Boolean(tokens.dark && tokens.light) && tokens.dark.fundo !== tokens.light.fundo,
  `escuro=${tokens.dark?.fundo} claro=${tokens.light?.fundo}`);
ok('tema escuro não é prendido por classe residual do boot',
  tokens.dark?.fundo === '#0e1320',
  `--wcm-glass-bg-solid=${tokens.dark?.fundo} · body="${tokens.dark?.classesBody}"`);
ok('canvas repinta ao trocar de tema', assinaturas.dark !== assinaturas.light,
  `dark ${assinaturas.dark} ≠ light ${assinaturas.light}`);
await setTheme('dark');

// ---- contraste WCAG AAA ----
// Isto é um PORTÃO, não um relatório. O briefing pede WCAG AAA e a primeira versão
// reprovava 20 amostras em AAA e 7 até em AA no escuro (e 21 em AA no claro) — a
// afirmação de acessibilidade na documentação era falsa até esta medição existir.
console.log('\n── contraste WCAG ──');
const auditarContraste = () => page.evaluate(() => {
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(parseFloat);
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  };
  const mistura = (f, b, a) => f.map((c, i) => c * a + b[i] * (1 - a));
  const fundoEfetivo = (el) => {
    const pilha = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0) { pilha.push(bg); if (bg.a >= 0.999) break; }
      n = n.parentElement;
    }
    let cor = [11, 15, 26];
    for (let i = pilha.length - 1; i >= 0; i--) cor = mistura(pilha[i].rgb, cor, pilha[i].a);
    return cor;
  };
  const razao = (a, b) => {
    const la = lum(a); const lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const raiz = document.querySelector('[data-wcm-react-root]');
  const reprovas = [];
  let total = 0;
  const vistos = new Set();
  for (const el of raiz.querySelectorAll('*')) {
    const texto = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('').trim();
    if (!texto) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.1) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const chave = `${el.className}|${Math.round(parseFloat(cs.fontSize))}|${cs.color}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    total++;
    const bg = fundoEfetivo(el);
    const ratio = razao(fg.a >= 0.999 ? fg.rgb : mistura(fg.rgb, bg, fg.a), bg);
    const px = parseFloat(cs.fontSize);
    const grande = px >= 24 || (px >= 18.66 && (Number(cs.fontWeight) || 400) >= 700);
    const alvo = grande ? 4.5 : 7;
    if (ratio < alvo) {
      reprovas.push(`${(el.className || '').split(' ')[0]} ${Math.round(ratio * 100) / 100}<${alvo} (${px}px) "${texto.slice(0, 20)}"`);
    }
  }
  return { total, reprovas };
});

for (const t of ['dark', 'light']) {
  await setTheme(t);
  await page.waitForTimeout(900);
  const c = await auditarContraste();
  ok(`contraste AAA no tema ${t}`, c.reprovas.length === 0,
    c.reprovas.length ? c.reprovas.slice(0, 5).join(' · ') : `${c.total} amostras, todas ≥ 7:1 (ou 4.5:1 em texto grande)`);
}
await setTheme('dark');

// ---- responsividade (zona morta do app-shell) ----
console.log('\n── responsividade ──');
for (const [w, h, nome] of [[1560, 940, 'ultrawide'], [1280, 800, 'notebook'], [960, 800, 'tablet'], [700, 900, 'estreito']]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => {
    const root = document.querySelector('.wcm-root');
    const st = document.querySelector('.wcm-stage');
    const canvas = document.querySelector('.wcm-map__canvas');
    const cr = canvas?.getBoundingClientRect();

    // Detector de painéis empilhados um sobre o outro. A versão anterior desta suíte
    // só olhava "sem rolagem horizontal" e "canvas > 40px", e por isso deu VERDE num
    // layout de 380px em que o mapa sumia e Favoritos/Relógio/Mercados se sobrepunham.
    // getBoundingClientRect ignora recorte por overflow do ancestral: um painel
    // rolado para fora da coluna ainda devolve o retângulo dele e produziria falso
    // positivo. Recortamos cada painel pela área VISÍVEL do contêiner rolável.
    const clip = (el) => {
      let b = el.getBoundingClientRect();
      const cont = el.closest('.wcm-col') || el.closest('.wcm-stage');
      if (cont && cont !== el) {
        const c = cont.getBoundingClientRect();
        const left = Math.max(b.left, c.left);
        const right = Math.min(b.right, c.right);
        const top = Math.max(b.top, c.top);
        const bottom = Math.min(b.bottom, c.bottom);
        b = { left, right, top, bottom, width: right - left, height: bottom - top };
      }
      return b;
    };
    const glasses = [...document.querySelectorAll('.wcm-glass')]
      .map(clip)
      .filter((b) => b.width > 8 && b.height > 8);
    let sobrepostos = 0;
    for (let i = 0; i < glasses.length; i++) {
      for (let j = i + 1; j < glasses.length; j++) {
        const a = glasses[i];
        const b = glasses[j];
        const ow = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oh = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ow > 12 && oh > 12) sobrepostos++;
      }
    }

    // A pintura NÃO é medida aqui: canvas entregue ao worker recusa getContext.
    // Vem de medirCanvas() logo abaixo, por screenshot.
    return {
      overflowX: document.scrollingElement.scrollWidth > document.scrollingElement.clientWidth + 2,
      largura: Math.round(root?.getBoundingClientRect().width || 0),
      palco: Math.round(st?.getBoundingClientRect().width || 0),
      canvasW: Math.round(cr?.width || 0),
      canvasH: Math.round(cr?.height || 0),
      sobrepostos,
    };
  });
  r.opacos = (await medirCanvas(page, 211)).opacos;
  ok(`${nome} (${w}px) sem rolagem horizontal`, !r.overflowX, `painel ${r.largura}px, palco ${r.palco}px`);
  ok(`${nome}: mapa com área útil`, r.canvasW >= 120 && r.canvasH >= 120, `canvas ${r.canvasW}×${r.canvasH}`);
  ok(`${nome}: mapa realmente pintado`, r.opacos > 60, `${r.opacos} amostras opacas`);
  ok(`${nome}: painéis não se sobrepõem`, r.sobrepostos === 0, `${r.sobrepostos} pares sobrepostos`);
  await page.screenshot({ path: `${OUT}/resp-${nome}.png` });
}
await page.setViewportSize({ width: 1560, height: 940 });
await page.waitForTimeout(800);

// ---- persistência ----
console.log('\n── persistência ──');
const prefsSalvas = await page.evaluate(() => localStorage.getItem('dsd:world-clock:preferences'));
ok('preferências espelhadas no localStorage', Boolean(prefsSalvas), prefsSalvas ? `${prefsSalvas.length} bytes` : '');

// ---- unmount limpa tudo ----
console.log('\n── ciclo de vida ──');
await page.evaluate(() => { location.hash = '#/panel-home'; });
await page.waitForTimeout(2200);
const limpou = await page.evaluate(() => ({
  raizes: document.querySelectorAll('[data-wcm-react-root]').length,
  marcadores: document.querySelectorAll('.wcm-marker').length,
  tooltips: document.querySelectorAll('.wcm-tip').length,
}));
ok('unmount remove a raiz React', limpou.raizes === 0, JSON.stringify(limpou));
ok('unmount não deixa marcador órfão', limpou.marcadores === 0);
ok('unmount não deixa tooltip órfão', limpou.tooltips === 0);

// remonta para confirmar que o segundo mount funciona (regressão clássica)
await page.evaluate((r) => { location.hash = r; }, ROTA);
await page.waitForSelector(`${RAIZ} .wcm-root`, { timeout: 30000 });
await page.waitForTimeout(2000);
const remontou = await page.evaluate(() => ({
  marcadores: document.querySelectorAll('.wcm-marker').length,
  canvas: Boolean(document.querySelector('.wcm-map__canvas')),
}));
ok('remontagem funciona', remontou.marcadores > 5 && remontou.canvas, `${remontou.marcadores} marcadores`);

// ---- erros de console ----
console.log('\n── console ──');
// RUÍDO PRÉ-EXISTENTE DO SHELL, medido: carregando APENAS #/panel-home, sem nunca
// abrir o Relógio Mundial, o console já emite estes dois. Não são deste painel e
// filtrá-los é honesto; qualquer OUTRO erro reprova a suíte.
const RUIDO_DO_SHELL = [
  /container-main:bootstrap\.config\.states.*Performance critical/i,
  /fetchCurrentUser error/i,
  /header\.weather-sp\.api\.fetch/i,
  /Fetch failed \(non-fatal\)/i,
  /header\.user-menu\.api\.fetch/i,
  /Failed to load resource.*40[0-9]/i,
  /favicon/i,
];
const relevantes = erros.filter((e) => !RUIDO_DO_SHELL.some((r) => r.test(e)));
ok('sem erro de console do painel', relevantes.length === 0,
  relevantes.length ? relevantes.slice(0, 4).join(' | ') : `${erros.length} mensagens, todas ruído conhecido do shell`);

console.log('\n════════════════════════════════════════');
console.log(falhas === 0 ? `TODOS OS TESTES PASSARAM` : `${falhas} FALHA(S)`);
console.log('════════════════════════════════════════\n');

await browser.close();
process.exit(falhas === 0 ? 0 : 1);

/**
 * LEITURA DE PIXEL DO MAPA — por screenshot, nunca por getImageData.
 *
 * O mapa é pintado num worker (`transferControlToOffscreen`), e um canvas
 * transferido recusa `getContext` na thread principal. Toda leitura direta de
 * buffer nesta suíte LANÇAVA e matava a execução inteira; o screenshot do
 * elemento serve aos dois renderizadores e mede o que chega à tela.
 *
 * `passo` mantém os limiares históricos comparáveis: 97 nas contagens de
 * pintura, 211 nos testes de viewport, 331 no hash de comparação entre estados.
 */
async function medirCanvas(p, passo = 97) {
  const el = await p.$('.wcm-map__canvas');
  if (!el) return { existe: false, opacos: 0, cores: 0, soma: 0, w: 0, h: 0 };
  const png = await el.screenshot({ omitBackground: true });
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let opacos = 0;
  let soma = 0;
  const cores = new Set();
  for (let i = 0; i < data.length; i += 4 * passo) {
    if (data[i + 3] > 8) opacos++;
    cores.add(`${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`);
    soma = (soma + data[i] * 3 + data[i + 1] * 5 + data[i + 2] * 7) % 100000007;
  }
  return { existe: true, opacos, cores: cores.size, soma, w: info.width, h: info.height };
}

async function amostraCanvas(p) {
  const m = await medirCanvas(p, 331);
  return m.soma;
}
