// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/mobile-marker
// PURPOSE: Marcador central de mobile do shell (Track D).
//   Liga #app-shell[data-mobile] + data-viewport + data-orientation a partir de
//   LARGURA e ALTURA (sem UA-sniffing). É a decisão de layout CENTRALIZADA que a
//   global-mobile.css consome. TUDO atrás da flag `as6.mobile_shell` (default OFF):
//   flag OFF → nenhum atributo é setado → desktop/mobile atuais BYTE A BYTE.
// ───────────────────────────────────────────────────────────────
// EXPORTS: isMobileShellEnabled, computeViewport, applyMobileMarker,
//          initMobileMarker, teardownMobileMarker
// BROWSER APIs: window.innerWidth/innerHeight, matchMedia, addEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '0.1.0-TRACK-D';
export const MODULE_ID = 'app-shell.responsive-adapter.mobile-marker';

const FLAG = 'as6.mobile_shell';
const LS_KEY = 'dshow.shell.flags.v1';

// Fronteiras (largura). Landscape baixo também conta como mobile (altura).
const W_MOBILE_MAX = 768; // ≤768 = composição mobile
const H_LANDSCAPE_MAX = 520; // altura ≤520 em paisagem = mobile mesmo em largura maior

/** Lê a flag de forma SÍNCRONA e à prova de falha. Default: false (OFF).
 *  Fontes, em ordem: store global (se exposto), override local (QA), senão OFF.
 *  Nunca lança. */
export function isMobileShellEnabled(): boolean {
  try {
    // 1) override local (QA) AUTORITATIVO
    if (typeof localStorage !== 'undefined') {
      const local = JSON.parse(localStorage.getItem(LS_KEY) || '{}') as Record<string, unknown>;
      if (FLAG in local) return local[FLAG] === true;
    }
    // 2) store global
    const g = (globalThis as Record<string, unknown>);
    const snap = (g.__DSHOW_FLAGS__ || (g.DshowFlags as Record<string, unknown> | undefined)?.snapshot) as
      | Record<string, unknown>
      | undefined;
    if (snap && typeof snap === 'object' && FLAG in snap) return snap[FLAG] === true;
  } catch {
    /* fail-closed */
  }
  return false;
}

export interface ViewportInfo {
  mobile: boolean;
  viewport: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  orientation: 'portrait' | 'landscape';
  w: number;
  h: number;
}

/** Calcula a classe de viewport considerando LARGURA e ALTURA (nunca UA). */
export function computeViewport(w: number, h: number): ViewportInfo {
  const orientation: ViewportInfo['orientation'] = h >= w ? 'portrait' : 'landscape';
  let viewport: ViewportInfo['viewport'] = 'xxl';
  if (w <= 575) viewport = 'xs';
  else if (w <= 767) viewport = 'sm';
  else if (w <= 991) viewport = 'md';
  else if (w <= 1199) viewport = 'lg';
  else if (w <= 1399) viewport = 'xl';
  // mobile: largura estreita OU paisagem baixa (ex.: 844×390)
  const mobile = w <= W_MOBILE_MAX || (orientation === 'landscape' && h <= H_LANDSCAPE_MAX);
  return { mobile, viewport, orientation, w, h };
}

function shellRoot(): HTMLElement | null {
  try {
    return (document.getElementById('app-shell') as HTMLElement | null);
  } catch {
    return null;
  }
}

/** Aplica/remove os atributos no #app-shell. Idempotente e fail-safe. */
export function applyMobileMarker(): void {
  const root = shellRoot();
  if (!root) return;
  // Flag OFF: garante que NADA fica marcado (limpa resíduo eventual) e sai.
  if (!isMobileShellEnabled()) {
    root.removeAttribute('data-mobile');
    root.removeAttribute('data-viewport');
    root.removeAttribute('data-orientation');
    return;
  }
  const w = window.innerWidth || document.documentElement.clientWidth || 0;
  const h = window.innerHeight || document.documentElement.clientHeight || 0;
  const info = computeViewport(w, h);
  if (info.mobile) root.setAttribute('data-mobile', '1');
  else root.removeAttribute('data-mobile');
  root.setAttribute('data-viewport', info.viewport);
  root.setAttribute('data-orientation', info.orientation);
  // Track D onda 2: liga/desliga o COMPORTAMENTO mobile (drawer/Mais/ticker).
  // Import dinâmico p/ não acoplar o marcador ao enhancer; falha nunca quebra o shell.
  try {
    void import('./mobile-shell.js').then((m) => { if (info.mobile) m.enhanceMobileShell(); else m.teardownMobileShell(); }).catch(() => { /* ok */ });
  } catch { /* ok */ }
}

let _wired = false;
let _handler: (() => void) | null = null;
let _mo: MutationObserver | null = null;
let _timers: ReturnType<typeof setTimeout>[] = [];
let _pending = false;
let _hardStop: ReturnType<typeof setTimeout> | null = null;
function estaMontado(): boolean {
  try {
    const root = shellRoot();
    if (!root || root.getAttribute('data-mobile') == null) return false;
    return !!document.querySelector('.avst6-hdr-menu') && !!document.querySelector('.avst6-bottomnav');
  } catch { return false; }
}
function pararCuradores(): void {
  if (_mo) { try { _mo.disconnect(); } catch { /* ok */ } _mo = null; }
  _timers.forEach((t) => clearTimeout(t)); _timers = [];
  if (_hardStop) { clearTimeout(_hardStop); _hardStop = null; }
}
function curar(): void {
  applyMobileMarker();
  // NÃO parar em estaMontado(): ☰+bottomnav surgem cedo, mas os componentes
  // secundários do header (relógio/clima/integrações) carregam TARDE. Manter o
  // curador vivo até o hardStop garante que a faixa (strip) e o botão Mais sejam
  // montados quando esses componentes aparecerem. Só encerra se a flag desligar.
  if (!isMobileShellEnabled()) pararCuradores();
}
export function initMobileMarker(): void {
  if (_wired) return;
  applyMobileMarker();
  if (!isMobileShellEnabled()) return; // OFF → nada → desktop byte-a-byte
  _wired = true;
  _handler = () => applyMobileMarker();
  window.addEventListener('resize', _handler, { passive: true });
  window.addEventListener('orientationchange', _handler, { passive: true });
  const agenda = () => { if (_pending) return; _pending = true; setTimeout(() => { _pending = false; curar(); }, 120); };
  try { _mo = new MutationObserver(agenda); _mo.observe(document.documentElement || document, { childList: true, subtree: true }); } catch { /* ok */ }
  [0, 150, 400, 900, 1800, 3500].forEach((ms) => _timers.push(setTimeout(curar, ms)));
  try { window.addEventListener('load', curar, { once: true }); } catch { /* ok */ }
  try { document.addEventListener('shell:ready', curar as EventListener, { once: true }); } catch { /* ok */ }
  _hardStop = setTimeout(pararCuradores, 16000);
}
export function teardownMobileMarker(): void {
  pararCuradores();
  if (_handler) {
    window.removeEventListener('resize', _handler);
    window.removeEventListener('orientationchange', _handler);
    _handler = null;
  }
  _wired = false;
}

export default { isMobileShellEnabled, computeViewport, applyMobileMarker, initMobileMarker, teardownMobileMarker };
