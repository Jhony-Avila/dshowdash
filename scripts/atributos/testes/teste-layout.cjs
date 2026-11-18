// UX-1b: layout do módulo. Em cada aba, alturas 700/900/1200, claro e escuro:
//  título = nome da aba; ícone em cada aba; página (main#main do shell) NÃO rola; só .at-conteudo rola; rolar até o fim deixa
//  título e abas parados; área fixa > 40% → modo "tudo rola" (sem rolagem dupla). Capturas da aba Atributos.
// Uso: flock /srv/dshow-modularizacao/locks/navegador.lock nice -n 10 node teste-layout.cjs [pasta-capturas]
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const B = 'http://127.0.0.1:8112'; const CAP = process.argv[2] || 'capturas-ux1b';
require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const pendentes = new Set();
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const ABAS = [['visao-geral', 'Visão geral'], ['produtos', 'Produtos'], ['vincular', 'Vincular'], ['preencher', 'Preencher'], ['kits', 'Kits'], ['atributos', 'Atributos'], ['unidades', 'Unidades'], ['conferencia', 'Conferência']];
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  for (const altura of [700, 900, 1200]) for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: altura } }); const pg = await ctx.newPage();
    await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
    const resumo = [];
    for (const [slug, titulo] of ABAS) {
      await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
      await pg.goto(`${B}/#/panel-atributos/${slug}`); await pg.reload({ waitUntil: 'networkidle' });
      await pg.waitForSelector('[data-at-host] .at-raiz', { timeout: 40000 });
      // tema pelo botão do Dash que aplica os DOIS sinais (html[data-theme] e body.theme-*): "Tema Escuro"/"Tema Claro" da barra do painel
      const temaAtual = () => pg.evaluate(() => getComputedStyle(document.querySelector('[data-bl-root]')).getPropertyValue('--bl-texto').trim());
      const alvoTexto = tema === 'dark' ? '#e8eaf2' : '#1b2030';
      // o botão de tema do TOPO do Dash (lua/sol: troca só html[data-theme]; o body pode continuar theme-light) — o módulo tem de seguir o html
      if ((await pg.evaluate(() => document.documentElement.getAttribute('data-theme'))) !== tema) { await pg.click('button.dsd-theme-toggle'); await pg.waitForTimeout(400); }
      await pg.waitForTimeout(1800);   // dados carregados
      afirma(`${altura}px ${tema} · ${titulo}: html[data-theme]=${tema} e o módulo segue (--bl-texto ${alvoTexto}), qualquer que seja a classe do body`, (await temaAtual()) === alvoTexto && (await pg.evaluate(() => document.documentElement.getAttribute('data-theme'))) === tema,
        `${await temaAtual()} body=${await pg.evaluate(() => document.body.className.match(/theme-\w+/)?.[0])}`);
      const m = await pg.evaluate(() => {
        const r = document.querySelector('.at-raiz'), c = r.querySelector('.at-conteudo'), f = r.querySelector('.at-fixo'), main = document.querySelector('main#main');
        const h1 = r.querySelector('.at-cabecalho h1')?.textContent; const icones = r.querySelectorAll('.at-nav__item svg.at-icone').length;
        const modo = r.classList.contains('at-raiz--tudo-rola') ? 'tudo' : 'fixa';
        const rolador = modo === 'fixa' ? c : r;
        const antes = f.getBoundingClientRect().top; rolador.scrollTop = rolador.scrollHeight; const depois = f.getBoundingClientRect().top;
        const fixoVisivel = depois >= 0 && f.getBoundingClientRect().bottom > 0;
        const dupla = [...r.querySelectorAll('*')].filter((e) => e !== c && e !== r && /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 2 && e.clientHeight > 120).map((e) => e.className.toString().slice(0, 40));
        const fundo = getComputedStyle(f).backgroundColor;
        return { h1, icones, modo, paginaRola: main ? main.scrollHeight - main.clientHeight : 0, conteudoRola: c.scrollHeight - c.clientHeight, chegouAoFim: Math.abs(rolador.scrollTop + rolador.clientHeight - rolador.scrollHeight) < 3,
          fixoParado: Math.abs(antes - depois) < 1, fixoVisivel, fracao: +(f.offsetHeight / r.offsetHeight).toFixed(2), dupla, fundo };
      });
      resumo.push(`${titulo}:${m.modo}(${m.fracao})`);
      const pre = `${altura}px ${tema} · ${titulo}`;
      afirma(`${pre}: título = "${titulo}" e 8 ícones nas abas`, m.h1 === titulo && m.icones === 8, `h1=${m.h1} ícones=${m.icones}`);
      afirma(`${pre}: a página do shell não rola (só o módulo)`, m.paginaRola <= 2, `sobra=${m.paginaRola}`);
      if (m.modo === 'fixa') afirma(`${pre}: rolar até o fim → título e abas PARADOS e visíveis (área fixa ${Math.round(m.fracao * 100)}%)`, m.chegouAoFim && m.fixoParado && m.fixoVisivel, JSON.stringify(m));
      else afirma(`${pre}: área fixa ${Math.round(m.fracao * 100)}% > 40% → tudo rola junto`, m.fracao > 0.4 && m.chegouAoFim, JSON.stringify(m));
      // rolagens internas que dependem da ESQUERDA (PARA-STATUS §41): TabelaDados com rolagem="propria" (at-td) e a lista do Vincular
      const daEsquerda = m.dupla.filter((c) => /\bat-td\b|at-lista-produtos/.test(c)); const outras = m.dupla.filter((c) => !daEsquerda.includes(c));
      if (daEsquerda.length) { pendentes.add(`${titulo}: ${daEsquerda.join(', ')}`); }
      afirma(`${pre}: sem rolagem dupla (fora as pendentes da ESQUERDA)`, outras.length === 0, outras.join(', '));
      if (slug === 'atributos' && altura === 900) {
        await pg.evaluate(() => { const r = document.querySelector('.at-raiz'); (r.classList.contains('at-raiz--tudo-rola') ? r : r.querySelector('.at-conteudo')).scrollTop = 0; });
        await pg.screenshot({ path: `${CAP}/depois-atributos-${tema}-topo.png` });
        await pg.evaluate(() => { const r = document.querySelector('.at-raiz'); const x = r.classList.contains('at-raiz--tudo-rola') ? r : r.querySelector('.at-conteudo'); x.scrollTop = x.scrollHeight; });
        await pg.waitForTimeout(200); await pg.screenshot({ path: `${CAP}/depois-atributos-${tema}-fim.png` });
      }
    }
    console.log(`info  ${altura}px ${tema}: ${resumo.join(' · ')}`);
    await ctx.close();
  }
  for (const x of pendentes) console.log('PENDENTE (ESQUERDA) rolagem interna: ' + x);
  console.log(`LAYOUT (UX-1b): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
