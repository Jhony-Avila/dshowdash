// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.1-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: lifecycle
// PURPOSE: Panel-08 Lifecycle Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   MODULE_ID, PANEL_NAME, CSS_PREFIX from ./contracts.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   mount() — exported function
//   unmount() — exported function
//   refresh() — exported function
//   getVersion() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_EVENTS.MOUNTED
//   PANEL_EVENTS.UNMOUNTED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { MODULE_ID, PANEL_NAME, CSS_PREFIX } from './contracts.js';
import * as Controller from './controller.js';
import * as Store from '../state/store.js';
import tracker from '../telemetry/tracker.js';

const VERSION = '9.3.0-P2-ENTERPRISE';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _container: HTMLElement | null = null;
let _mounted = false;
let _cssLoaded = false;

function _loadCSS() {
  if (_cssLoaded) return;
  const href = `/components/panels/${MODULE_ID}/styles/index.css`;
  if (hasDocument && document.querySelector(`link[href*="${MODULE_ID}/styles/index.css"]`)) { _cssLoaded = true; return; }
  if (hasDocument) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; link.setAttribute('data-panel', MODULE_ID); document.head.appendChild(link); }
  _cssLoaded = true;
}

function _renderStructure(container: HTMLElement) {
  container.innerHTML = `<div class="${CSS_PREFIX}" role="region" aria-label="${PANEL_NAME}"><header class="${CSS_PREFIX}__header"><div class="${CSS_PREFIX}__title-group"><svg class="${CSS_PREFIX}__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><h2 class="${CSS_PREFIX}__title">${PANEL_NAME}</h2></div><div class="${CSS_PREFIX}__toolbar"><div class="${CSS_PREFIX}__auto-refresh"><button type="button" class="${CSS_PREFIX}__btn ${CSS_PREFIX}__btn--ghost" data-action="toggle-auto-refresh" title="Auto-refresh (A)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span data-countdown>60s</span></button></div><button type="button" class="${CSS_PREFIX}__btn ${CSS_PREFIX}__btn--secondary" data-action="refresh" title="Atualizar (R)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>Atualizar</button></div></header><main class="${CSS_PREFIX}__content" data-content></main><footer class="${CSS_PREFIX}__footer"><span class="${CSS_PREFIX}__timestamp" data-timestamp></span></footer></div>`;
}

export function mount(container: HTMLElement, config: Record<string, unknown>) {
  config = config || {}; _initPorts();
  if (_mounted) return Promise.resolve({ ok: true });
  if (!container) return Promise.resolve({ ok: false, error: 'NO_CONTAINER' });
  _container = container; _loadCSS(); _renderStructure(container);
  const contentEl = container.querySelector('[data-content]') as HTMLElement | null;
  return Controller.init(contentEl, config).then(() => Controller.mount()).then(() => {

    // @ts-expect-error TS migration - TS2339
    _mounted = true; tracker.mounted();
    const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(PANEL_EVENTS.MOUNTED, { panelId: MODULE_ID, timestamp: Date.now(), source: MODULE_ID });
    return { ok: true };
  });
}

export function unmount() {
  if (!_mounted) return Promise.resolve({ ok: true });
  Controller.unmount(); if (_container) { _container.innerHTML = ''; _container = null; }

  // @ts-expect-error TS migration - TS2339
  _mounted = false; tracker.unmounted();
  const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(PANEL_EVENTS.UNMOUNTED, { panelId: MODULE_ID, timestamp: Date.now(), source: MODULE_ID });
  return Promise.resolve({ ok: true });
}

export function refresh() { return Controller.refresh(); }
export function getVersion() { return VERSION; }
export function healthCheck() { return Object.assign({}, Controller.healthCheck(), { mounted: _mounted, cssLoaded: _cssLoaded }); }

export { VERSION };
export default { VERSION, mount, unmount, refresh, getVersion, healthCheck, injectPorts, getPorts };
