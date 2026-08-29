// mobile-flag-mutation.mjs — Track D onda 3 (item 12): mutação da flag. Prova em
// TODAS as camadas que as6.mobile_shell default OFF ⇒ nenhum efeito (desktop safe),
// e ON ⇒ marcador + enhancer. Sem browser; stubs mínimos de DOM.
import { getJSDOM } from './_jsdom.mjs';
const JSDOM = await getJSDOM();
import { importTs } from './_ts.mjs';
const dom = new JSDOM('<!DOCTYPE html><body><div id="app-shell"></div></body>', { pretendToBeVisual: true });
const { window } = dom;
for (const k of ['document', 'window', 'Node', 'Comment', 'HTMLElement']) globalThis[k] = window[k] ?? window;
globalThis.window = window; globalThis.document = window.document;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
let store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };

let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const marker = await importTs(new URL('../../../public/components/app-shell/adapters/responsive-adapter/mobile-marker.ts', import.meta.url).href);
const shell = await importTs(new URL('../../../public/components/app-shell/adapters/responsive-adapter/mobile-shell.ts', import.meta.url).href);
const root = () => window.document.getElementById('app-shell');

// ── DEFAULT OFF (sem store / sem localStorage) ──
store = {};
ok(marker.isMobileShellEnabled() === false, 'default OFF: isMobileShellEnabled()=false sem store/localStorage');
window.innerWidth = 390; window.innerHeight = 844;
marker.applyMobileMarker();
ok(!root().hasAttribute('data-mobile'), 'default OFF: applyMobileMarker NÃO seta data-mobile (mobile viewport, flag OFF)');
shell.enhanceMobileShell();
ok(shell.isEnhanced() === false, 'default OFF: enhanceMobileShell é no-op sem o marcador (nada é injetado)');

// ── mutação: liga a flag ──
store['dshow.shell.flags.v1'] = JSON.stringify({ 'as6.mobile_shell': true });
ok(marker.isMobileShellEnabled() === true, 'ON: isMobileShellEnabled()=true via override local');
marker.applyMobileMarker();
ok(root().getAttribute('data-mobile') === '1' && root().getAttribute('data-viewport') === 'xs', 'ON + 390×844: data-mobile=1 data-viewport=xs');
// com o marcador presente, o enhancer liga
window.HTMLElement.prototype.scrollBy = function () {};
shell.enhanceMobileShell();
ok(shell.isEnhanced() === true, 'ON: enhanceMobileShell liga sob o marcador');

// ── mutação inversa: desliga → marcador limpo + enhancer desligável ──
store['dshow.shell.flags.v1'] = JSON.stringify({ 'as6.mobile_shell': false });
ok(marker.isMobileShellEnabled() === false, 'OFF de novo: isMobileShellEnabled()=false');
marker.applyMobileMarker();
ok(!root().hasAttribute('data-mobile'), 'OFF de novo: data-mobile removido (resíduo limpo)');
shell.teardownMobileShell();
ok(shell.isEnhanced() === false, 'OFF de novo: teardown desliga o enhancer');

// ── valor inválido / ausente = fail-closed OFF ──
store = { 'dshow.shell.flags.v1': 'json-quebrado{{' };
ok(marker.isMobileShellEnabled() === false, 'fail-closed: JSON inválido no override → OFF');
store = { 'dshow.shell.flags.v1': JSON.stringify({ outra: true }) };
ok(marker.isMobileShellEnabled() === false, 'fail-closed: flag ausente no override → OFF');

console.log(falhas ? `\n✗ mobile-flag-mutation: ${falhas} falha(s)` : '\n✓ mobile-flag-mutation verde (OFF em todas as camadas por default; ON só com override explícito)');
process.exit(falhas ? 1 : 0);
