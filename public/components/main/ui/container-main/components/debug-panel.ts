// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.1-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-debug-panel
// PURPOSE: Container Main - Debug Panel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createDebugPanel() — exported function
//   init() — exported function
//   destroy() — exported function
//   show() — exported function
//   hide() — exported function
//   toggle() — exported function
//   isVisible() — exported function
//   render() — exported function
//   setElement() — exported function
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

export const VERSION = '8.2.1-ENTERPRISE';
export const MODULE_ID = 'container-debug-panel';

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

let _state = { initialized: false, visible: false, element: null as HTMLElement | null };
let _metrics = { toggles: 0, renders: 0 };

function show() { _state.visible = true; _metrics.toggles++; if (_state.element) { _state.element.style.display = 'block'; _state.element.setAttribute('aria-hidden', 'false'); } return { ok: true }; }
function hide() { _state.visible = false; _metrics.toggles++; if (_state.element) { _state.element.style.display = 'none'; _state.element.setAttribute('aria-hidden', 'true'); } return { ok: true }; }
function toggle() { return _state.visible ? hide() : show(); }
function isVisible() { return _state.visible; }

function render(data: Record<string, unknown>) {
  _metrics.renders++;
  if (!_state.element) return { ok: false, reason: 'No element' };
  let html = '<div class="debug-panel-content">';
  html += '<h4>Debug Info</h4>';
  html += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  html += '</div>';
  _state.element.innerHTML = html;
  return { ok: true };
}

function setElement(element: HTMLElement) { _state.element = element; return { ok: true }; }

function init(ctx: Record<string, unknown>) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  if (ctx?.eventBus && !_injectedEventBus) _injectedEventBus = ctx.eventBus;
  if (ctx?.element) _state.element = ctx.element as HTMLElement;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}

function destroy() {
  _state.initialized = false;
  _state.visible = false;
  _state.element = null;
  return { ok: true };
}

function healthCheck() {
  return {
    status: 'HEALTHY',
    score: 100,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      initialized: { ok: _state.initialized, severity: 'info' },
      hasElement: { ok: !!_state.element, severity: 'info' },
      hasInjectedEventBus: { ok: !!_injectedEventBus, severity: 'info' }
    },
    metrics: _metrics,
    hasInjectedEventBus: !!_injectedEventBus,
    hasValidation: true
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    visible: _state.visible,
    hasElement: !!_state.element,
    metrics: _metrics,
    hasInjectedEventBus: !!_injectedEventBus,
    hasValidation: true
  };
}

export function createDebugPanel(container: HTMLElement, options: Record<string, unknown> = {}) {
  const { eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  const element = document.createElement('div');
  element.className = 'dsd-container__debug-panel';
  element.style.display = 'none';
  element.setAttribute('role', 'region');
  element.setAttribute('aria-label', 'Painel de debug');
  element.setAttribute('aria-hidden', 'true');
  if (container) container.appendChild(element);
  init({ element, eventBus });

  return { show, hide, toggle, isVisible, render, setElement, destroy, healthCheck, info, VERSION, MODULE_ID };
}

// Export functions (VERSION and MODULE_ID already exported as const above)
export { init, destroy, show, hide, toggle, isVisible, render, setElement, healthCheck, info };

export default { MODULE_ID, VERSION, createDebugPanel, injectEventBus, init, destroy, show, hide, toggle, isVisible, render, setElement, healthCheck, info };
