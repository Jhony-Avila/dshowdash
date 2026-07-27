// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-integration-mercado-livre/accessibility/announce
// PURPOSE: Integration Mercado Livre - Accessibility Announcer (Autocontido AAA)
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
//   destroy() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
export const MODULE_ID = 'panels/panel-integration-mercado-livre/accessibility/announce';

let _liveRegion: HTMLElement | null = null;
let _container: HTMLElement | null = null;

function _ensureContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.className = 'panel-announcer-container';
    _container.setAttribute('data-announcer-owner', MODULE_ID);
    const panel = document.querySelector('[data-panel="panel-integration-mercado-livre"]') || document.querySelector('.panel-integration-mercado-livre');
    (panel || document.documentElement).appendChild(_container);
  }
  return _container;
}

export function announce(message: string, priority = 'polite') {
  if (!_liveRegion) {
    _liveRegion = document.createElement('div');
    _liveRegion.setAttribute('role', 'status');
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');
    _liveRegion.className = 'sr-only';
    _liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
    _ensureContainer().appendChild(_liveRegion);
  }
  _liveRegion.setAttribute('aria-live', priority);
  _liveRegion.textContent = '';
  setTimeout(() => { _liveRegion!.textContent = message; }, 100);
}

export function announcePolite(message: string) { announce(message, 'polite'); }
export function announceAssertive(message: string) { announce(message, 'assertive'); }
export function destroy() { if (_container) { _container.remove(); _container = null; _liveRegion = null; } }

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID, hasLiveRegion: !!_liveRegion, noBodyAppend: true }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { announce, announcePolite, announceAssertive, destroy, healthCheck, info, VERSION, MODULE_ID };
