// mobile-shell-a11y-stability.mjs — Track D onda 3 (itens 8/9): acessibilidade e
// estabilidade do enhancer mobile-shell em jsdom. Determinístico, sem browser/auth.
import { getJSDOM } from './_jsdom.mjs';
const JSDOM = await getJSDOM();
import { pathToFileURL } from 'node:url';

const HTML = `<!DOCTYPE html><html><body>
<div id="app-shell" data-mobile="1">
  <header class="dsd-shell__region--header" role="banner"><div class="site-header"><div class="header-left">Logo</div>
    <div class="header-right">
      ${Array.from({ length: 6 }, (_, i) => `<div class="header-component-wrapper"><button aria-label="acao ${i}">X${i}</button></div>`).join('')}
    </div></div></header>
  <div class="dsd-shell__region--ticker"><div class="news-ticker-component"><div class="ticker-track">a b c</div></div></div>
  <nav class="dsd-shell__region--nav-rail" role="navigation" aria-label="Navegação mobile"><button data-action="sidebar.toggle" aria-controls="app-sidebar" aria-expanded="false">Menu</button></nav>
  <aside class="dsd-shell__region--sidebar dsd-sidebar" id="app-sidebar"><a href="#x">L1</a></aside>
  <div class="dsd-sidebar-overlay" hidden></div>
  <main class="dsd-shell__region--main" role="main"><button>c</button></main>
  <footer class="dsd-shell__region--footer" role="contentinfo"><a href="#t">Termos</a></footer>
</div></body></html>`;
const dom = new JSDOM(HTML, { pretendToBeVisual: true });
const { window } = dom;
for (const k of ['document', 'window', 'Node', 'Comment']) globalThis[k] = window[k] ?? window;
globalThis.window = window; globalThis.document = window.document;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.HTMLElement.prototype.scrollBy = function () {};
Object.defineProperty(window.HTMLElement.prototype, 'offsetParent', { get() { return this.hidden ? null : this.parentNode; }, configurable: true });

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const $ = (s) => window.document.querySelector(s);
const $$ = (s) => [...window.document.querySelectorAll(s)];
const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const key = (k) => window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));

const mod = await import(new URL('../../../public/components/app-shell/adapters/responsive-adapter/mobile-shell.ts', import.meta.url).href);
const nodesBase = window.document.querySelectorAll('*').length;
mod.enhanceMobileShell();

// ── A11Y ──
const mais = $('.avst6-mais-btn');
ok(mais.getAttribute('aria-haspopup') === 'dialog' && mais.getAttribute('aria-controls') === 'avst6-mais-sheet', 'a11y: botão Mais tem aria-haspopup + aria-controls');
ok(mais.getAttribute('aria-expanded') === 'false', 'a11y: Mais aria-expanded inicia false');
click(mais); ok(mais.getAttribute('aria-expanded') === 'true', 'a11y: Mais aria-expanded=true ao abrir'); $('.avst6-mais-sheet').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok($('.avst6-mais-sheet').getAttribute('role') === 'dialog' && $('.avst6-mais-sheet').getAttribute('aria-label'), 'a11y: sheet role=dialog + aria-label');
click($('[data-action="sidebar.toggle"]'));
ok($('.dsd-sidebar').getAttribute('role') === 'dialog' && $('.dsd-sidebar').getAttribute('aria-modal') === 'true', 'a11y: drawer role=dialog + aria-modal');
ok($('[data-action="sidebar.toggle"]').getAttribute('aria-expanded') === 'true', 'a11y: toggle aria-expanded=true com drawer aberto');
key('Escape');
ok($$('.avst6-tk').every((b) => b.getAttribute('aria-label')), 'a11y: todos os controles do ticker têm aria-label');
ok($('.avst6-tk-pause').getAttribute('aria-pressed') !== null, 'a11y: pausar tem aria-pressed');
// landmarks únicos
for (const role of ['banner', 'main', 'contentinfo']) ok($$(`[role="${role}"]`).length === 1, `a11y: landmark '${role}' único`);
// sem IDs duplicados
const ids = $$('[id]').map((e) => e.id); ok(new Set(ids).size === ids.length, 'a11y: sem IDs duplicados após enhance');

// ── ESTABILIDADE ──
for (let i = 0; i < 20; i++) { click(mais); $('.avst6-mais-sheet').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); }
ok($$('.avst6-mais-sheet').length === 1 && $$('.avst6-mais-btn').length === 1, 'estab: 20 ciclos do Mais → 1 sheet, 1 botão (sem duplicação)');
for (let i = 0; i < 20; i++) { click($('[data-action="sidebar.toggle"]')); key('Escape'); }
ok($$('.dsd-sidebar-overlay').length === 1, 'estab: 20 ciclos do drawer → 1 overlay (sem duplicação)');
ok(!window.document.body.classList.contains('sidebar-mobile-open') && !$('.dsd-shell__region--main').getAttribute('aria-hidden'), 'estab: sem scroll-lock/inert órfão após 40 ciclos');
// múltiplos enhance não vazam
for (let i = 0; i < 5; i++) mod.enhanceMobileShell();
ok($$('.avst6-mais-btn').length === 1 && $$('.avst6-ticker-ctrl').length === 1, 'estab: enhance idempotente (5×) sem duplicar controles');
// teardown volta ao baseline de nós
mod.teardownMobileShell();
const nodesFim = window.document.querySelectorAll('*').length;
ok(nodesFim === nodesBase, `estab: contagem de nós volta ao baseline após teardown (${nodesBase} → ${nodesFim})`);

console.log(falhas ? `\n✗ mobile-shell-a11y-stability: ${falhas} falha(s)` : '\n✓ mobile-shell-a11y-stability verde');
process.exit(falhas ? 1 : 0);
