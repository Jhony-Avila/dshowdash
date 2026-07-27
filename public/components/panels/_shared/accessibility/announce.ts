// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/_shared/accessibility/announce
// PURPOSE: Panels Shared - Screen Reader Announcer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   announce() — exported function
//   announcePolite() — exported function
//   announceAssertive() — exported function
//   announceLoading() — exported function
//   announceLoaded() — exported function
//   announceError() — exported function
//   destroy() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/_shared/accessibility/announce';

let _liveRegion: HTMLDivElement | null = null;

function ensureLiveRegion() {
  if (_liveRegion && document.contains(_liveRegion)) return _liveRegion;
  
  _liveRegion = document.createElement('div');
  _liveRegion.setAttribute('role', 'status');
  _liveRegion.setAttribute('aria-live', 'polite');
  _liveRegion.setAttribute('aria-atomic', 'true');
  _liveRegion.className = 'sr-only';
  _liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
  document.body.appendChild(_liveRegion);
  return _liveRegion;
}

export function announce(message: string, priority = 'polite') {
  const region = ensureLiveRegion();
  region.setAttribute('aria-live', priority);
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}

export function announcePolite(message: string) { announce(message, 'polite'); }
export function announceAssertive(message: string) { announce(message, 'assertive'); }

export function announceLoading(context = '') {
  announce(`Carregando ${context}...`.trim(), 'polite');
}

export function announceLoaded(context = '') {
  announce(`${context} carregado com sucesso`.trim(), 'polite');
}

export function announceError(message: string) {
  announce(`Erro: ${message}`, 'assertive');
}

export function destroy() {
  if (_liveRegion && _liveRegion.parentNode) {
    _liveRegion.parentNode.removeChild(_liveRegion);
  }
  _liveRegion = null;
}

export default { announce, announcePolite, announceAssertive, announceLoading, announceLoaded, announceError, destroy, VERSION, MODULE_ID };

