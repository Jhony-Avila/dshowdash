// coordinator-flag-off-diff.mjs — Track D onda 3 (item 1 / #D-m22): PROVA
// diferencial de que o caminho FLAG OFF do setup-coordinator é byte a byte com a
// baseline A (742c55e1), enquanto o caminho ON leva o fix (#D-m15).
// Exercita o handler REAL (mobile-handler.ts) em jsdom, com os 3 imports não-DOM
// shimados (SIDEBAR_EVENTS/createUiPorts/CSS_CLASSES). Sem browser, sem auth.
import { getJSDOM } from './_jsdom.mjs';
const JSDOM = await getJSDOM();
import { readFileSync } from 'node:fs';
import { importTs } from './_ts.mjs';
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

// ── shim: substitui os imports absolutos por stubs locais ──
const SRC = new URL('../../../public/components/sidebar/features/mobile-handler.ts', import.meta.url).pathname;
let code = readFileSync(SRC, 'utf8')
  .replace(/import \{ SIDEBAR_EVENTS \} from '[^']*';/, "const SIDEBAR_EVENTS = { MOBILE_CHANGED:'mc', MOBILE_CLOSED:'mcl', MOBILE_OPENED:'mo', MOBILE_HANDLER_INITIALIZED:'mi' };")
  .replace(/import \{ createUiPorts \} from '[^']*';/, "const createUiPorts = () => { let s = {}; return { init(){}, get(k){return s[k];}, inject(p){Object.assign(s,p);}, snapshot(){return {...s};} }; };")
  .replace(/import \{ CSS_CLASSES as C \} from '[^']*';/, "const C = { MOD_MOBILE:'is-mobile', MOD_MOBILE_OPEN:'is-mobile-open' };");

// ── DOM (jsdom) ──
const dom = new JSDOM('<!DOCTYPE html><body></body>', { pretendToBeVisual: true });
const { window } = dom;
for (const k of ['document', 'window', 'Node']) globalThis[k] = window[k] ?? window;
globalThis.window = window; globalThis.document = window.document;
window.HTMLElement.prototype.scrollBy = function () {};

const mod = await importTs(new URL('../../../public/components/sidebar/features/mobile-handler.ts', import.meta.url).href, code);
const { setupMobileHandler, setupOverlayClick } = mod;
const container = () => { const d = window.document.createElement('div'); return d; };

// helper: roda o handler e observa se engine.setMobile (via onMobileChange) dispara
function rodarDetect(deps) {
  let setMobileCalls = 0; const dep2 = { ...deps };
  if (dep2.onMobileChange) { const orig = dep2.onMobileChange; dep2.onMobileChange = (m) => { setMobileCalls++; orig(m); }; }
  window.innerWidth = 1200; const cleanup = setupMobileHandler(dep2);
  window.innerWidth = 400; window.dispatchEvent(new window.Event('resize'));   // cruza p/ mobile
  window.innerWidth = 1200; window.dispatchEvent(new window.Event('resize'));  // cruza p/ desktop
  cleanup && cleanup();
  return { setMobileCalls };
}

// ── A: shape da baseline A (onMobileChange presente) → o handler NOVO o CHAMA ──
const A = rodarDetect({ onMobileChange() {}, onCloseMobile() {} });
ok(A.setMobileCalls > 0, 'controle: com o handler novo, passar onMobileChange DISPARA engine.setMobile (por isso o caminho OFF NÃO pode passá-lo)');

// ── OFF (wave3): sem onMobileChange → engine.setMobile NÃO dispara (== baseline A observável) ──
const OFF = rodarDetect({ onCloseMobile() {} });
ok(OFF.setMobileCalls === 0, 'FLAG OFF: setupMobileDetect({onCloseMobile}) → engine.setMobile NÃO é chamado (byte a byte com a baseline A, que ignorava o callback)');

// ── ON (wave3): com container+onMobileChange → fix ativo ──
const ON = rodarDetect({ container: container(), breakpoint: 768, onMobileChange() {} });
ok(ON.setMobileCalls > 0, 'FLAG ON: setupMobileDetect({container,onMobileChange}) → engine.setMobile dispara (fix ativo)');

// ── setupOverlayClick: OFF (função crua) não fecha; ON ({container,onClose}) fecha ──
function rodarOverlay(arg) {
  window.document.body.innerHTML = '';
  let fechou = 0; const a = (typeof arg === 'function') ? arg : { ...arg, onClose: () => { fechou++; } };
  const api = setupOverlayClick(a);
  const ov = window.document.querySelector('.dsd-sidebar-overlay');
  ov && ov.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  api && api.destroy && api.destroy();
  return fechou;
}
ok(rodarOverlay(() => {}) === 0, 'FLAG OFF: setupOverlayClick(função) → onClose undefined → clique NÃO fecha (== baseline A)');
ok(rodarOverlay({ container: container() }) === 1, 'FLAG ON: setupOverlayClick({container,onClose}) → clique fecha (fix ativo)');

// ── prova de origem: o caminho OFF do coordenador reproduz a baseline A ──
const COORD = readFileSync(new URL('../../../public/components/sidebar/lifecycle/setup-coordinator.ts', import.meta.url).pathname, 'utf8');
ok(/_mobileShellAutorizado\(\)/.test(COORD), 'coordenador: decide caminho ON/OFF por _mobileShellAutorizado() (flag as6.mobile_shell)');
ok(/else\s*\{[\s\S]*?setupMobileDetect\(\s*\{\s*onCloseMobile\s*\}\s*\)[\s\S]*?setupOverlayClick\(onCloseMobile\)/.test(COORD), 'coordenador: caminho OFF = setupMobileDetect({onCloseMobile}) + setupOverlayClick(onCloseMobile) (baseline A)');

console.log(falhas ? `\n✗ coordinator-flag-off-diff: ${falhas} falha(s)` : '\n✓ coordinator-flag-off-diff verde (FLAG_OFF == baseline A; fix preservado no ON)');
process.exit(falhas ? 1 : 0);
