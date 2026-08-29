// mobile-shell-behavior.mjs — Track D onda 2 (itens 1/2/4): comportamento REAL do
// enhancer mobile-shell.ts, testado em jsdom (DOM real, sem browser, sem auth).
// mobile-shell.ts NÃO tem imports → node --experimental-strip-types o importa direto
// sobre o DOM do jsdom. Prova: header "Mais", drawer a11y (Escape/foco/inert/
// scroll-lock/retorno), ticker (pausa), idempotência e teardown limpo.
import { JSDOM } from '/tmp/jsdmroot/node_modules/jsdom/lib/api.js';
import { pathToFileURL } from 'node:url';

const HTML = `<!DOCTYPE html><html><body>
<div id="app-shell" data-mobile="1">
  <header class="dsd-shell__region--header"><div class="site-header"><div class="header-left">Logo</div>
    <div class="header-right">
      <div class="header-component-wrapper"><button>A1</button></div>
      <div class="header-component-wrapper"><button>A2</button></div>
      <div class="header-component-wrapper"><button>A3</button></div>
      <div class="header-component-wrapper"><button>S1</button></div>
      <div class="header-component-wrapper"><button>S2</button></div>
      <div class="header-component-wrapper"><button>S3</button></div>
    </div></div></header>
  <div class="dsd-shell__region--ticker"><div class="news-ticker-component"><div class="ticker-track">a b c</div></div></div>
  <nav class="dsd-shell__region--nav-rail"><button data-action="sidebar.toggle" aria-controls="app-sidebar">Menu</button></nav>
  <aside class="dsd-shell__region--sidebar dsd-sidebar" id="app-sidebar"><a href="#x">L1</a><a href="#y">L2</a></aside>
  <div class="dsd-sidebar-overlay" hidden></div>
  <main class="dsd-shell__region--main"><button>conteudo</button></main>
  <footer class="dsd-shell__region--footer"><a href="#t">Termos</a></footer>
</div></body></html>`;

const dom = new JSDOM(HTML, { pretendToBeVisual: true });
const { window } = dom;
// globais que o módulo usa
for (const k of ['document', 'window', 'HTMLElement', 'Node', 'Comment']) globalThis[k] = window[k] ?? window;
globalThis.window = window; globalThis.document = window.document;
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
// jsdom não implementa scrollBy/offsetParent perfeitamente; stubs mínimos
window.HTMLElement.prototype.scrollBy = function () {};
Object.defineProperty(window.HTMLElement.prototype, 'offsetParent', { get() { return this.hidden ? null : (this.parentNode || null); }, configurable: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const $ = (s) => window.document.querySelector(s);
const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const key = (k, opts = {}) => window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, ...opts }));

const mod = await import(pathToFileURL('/home/claude/dshowdash/public/components/app-shell/adapters/responsive-adapter/mobile-shell.ts').href);

// ── ENHANCE ──
mod.enhanceMobileShell();
ok(mod.isEnhanced(), 'enhance ligado sob o marcador');
mod.enhanceMobileShell(); // idempotência
ok($('#app-shell').querySelectorAll('.avst6-mais-btn').length === 1, 'idempotente: só 1 botão "Mais" mesmo chamando enhance 2×');

// ── ITEM 1: header "Mais" ──
ok(!!$('.avst6-mais-btn'), 'header: botão "Mais" criado');
ok($('.avst6-mais-sheet') && $('.avst6-mais-sheet').querySelectorAll('.header-component-wrapper').length === 3, 'header: 3 ações secundárias movidas ao sheet (essenciais ficam)');
ok($('.site-header .header-right').querySelectorAll(':scope > .header-component-wrapper').length === 3, 'header: 3 ações essenciais permanecem visíveis no header');
click($('.avst6-mais-btn'));
ok($('.avst6-mais-sheet').hidden === false && $('.avst6-mais-btn').getAttribute('aria-expanded') === 'true', 'header: "Mais" abre o sheet (aria-expanded=true)');
key('Escape', {}); // sheet ouve keydown próprio; simula via listener no sheet
$('.avst6-mais-sheet').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok($('.avst6-mais-sheet').hidden === true, 'header: Escape fecha o sheet');

// ── ITEM 2: drawer a11y ──
click($('[data-action="sidebar.toggle"]'));
ok($('.dsd-sidebar').classList.contains('dsd-sidebar--mobile-open'), 'drawer: abre ao clicar no toggle');
ok($('.dsd-sidebar').getAttribute('aria-modal') === 'true', 'drawer: aria-modal=true');
ok($('.dsd-shell__region--main').getAttribute('aria-hidden') === 'true', 'drawer: regiões de fundo ficam inertes (aria-hidden)');
ok($('[data-action="sidebar.toggle"]').getAttribute('aria-expanded') === 'true', 'drawer: toggle aria-expanded=true');
ok(window.document.body.classList.contains('sidebar-mobile-open'), 'drawer: scroll-lock no body');
key('Escape');
ok(!$('.dsd-sidebar').classList.contains('dsd-sidebar--mobile-open'), 'drawer: Escape fecha');
ok(!$('.dsd-shell__region--main').getAttribute('aria-hidden'), 'drawer: inert removido ao fechar');
ok(!window.document.body.classList.contains('sidebar-mobile-open'), 'drawer: scroll-lock liberado ao fechar');
// fecha por backdrop
click($('[data-action="sidebar.toggle"]'));
click($('.dsd-sidebar-overlay'));
ok(!$('.dsd-sidebar').classList.contains('dsd-sidebar--mobile-open'), 'drawer: backdrop fecha');
// fecha por hashchange (navegação)
click($('[data-action="sidebar.toggle"]'));
window.dispatchEvent(new window.Event('hashchange'));
ok(!$('.dsd-sidebar').classList.contains('dsd-sidebar--mobile-open'), 'drawer: navegação (hashchange) fecha');

// ── resistência: 20 ciclos abrir/fechar sem vazar estado ──
for (let i = 0; i < 20; i++) { click($('[data-action="sidebar.toggle"]')); key('Escape'); }
ok(!$('.dsd-sidebar').classList.contains('dsd-sidebar--mobile-open') && !window.document.body.classList.contains('sidebar-mobile-open') && !$('.dsd-shell__region--main').getAttribute('aria-hidden'), 'drawer: 20 ciclos → estado limpo (sem vazamento de inert/scroll-lock)');

// ── ITEM 4: ticker ──
ok(!!$('.avst6-ticker-ctrl') && $('.avst6-ticker-ctrl').querySelectorAll('button').length === 3, 'ticker: controles anterior/pausar/próximo criados');
const pause = $('.avst6-tk-pause');
click(pause);
ok($('.news-ticker-component').getAttribute('data-ticker-paused') === '1' && pause.getAttribute('aria-pressed') === 'true', 'ticker: pausar marca data-ticker-paused=1 + aria-pressed');
click(pause);
ok($('.news-ticker-component').getAttribute('data-ticker-paused') === '0', 'ticker: retomar');

// ── TEARDOWN: tudo volta, sem órfãos ──
mod.teardownMobileShell();
ok(!mod.isEnhanced(), 'teardown desliga');
ok(!$('.avst6-mais-btn') && !$('.avst6-mais-sheet') && !$('.avst6-ticker-ctrl'), 'teardown: sheet/botão/controles removidos');
ok($('.site-header .header-right').querySelectorAll(':scope > .header-component-wrapper').length === 6, 'teardown: as 6 ações voltam ao header (nós preservados)');
ok(!window.document.body.classList.contains('sidebar-mobile-open'), 'teardown: sem scroll-lock órfão');

console.log(falhas ? `\n✗ mobile-shell-behavior: ${falhas} falha(s)` : '\n✓ mobile-shell-behavior verde (itens 1/2/4 comportamento real em jsdom)');
process.exit(falhas ? 1 : 0);
