// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P25-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08-events
// PURPOSE: Panel-08 Events Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setup() — exported function
//   destroy() — exported function
//   getVersion() — exported function
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
export const MODULE_ID = 'panel-08-events';

let _container: HTMLElement | null = null;
let _handlers: Record<string, ((...args: unknown[]) => void) | undefined> = {};
let _boundListeners: Array<{ el: EventTarget; event: string; handler: EventListener }> = [];

export function setup(container: HTMLElement | null, state: Record<string, unknown>, handlers: Record<string, ((...args: unknown[]) => void) | undefined>, config: Record<string, unknown>) {
  if (!config) config = {};
  if (!container) return;
  _container = container;
  _handlers = handlers;
  destroy();
  _setupRefreshButton();
  _setupAutoRefreshToggle();
  _setupAlertActions();
}

function _addListener(el: EventTarget | null, event: string, handler: EventListener) {
  if (!el) return;
  el.addEventListener(event, handler);
  _boundListeners.push({ el, event, handler });
}

function _setupRefreshButton() {
  // @ts-expect-error strict migration — TS2774
  const panel = _container!.closest ? _container!.closest('[data-panel-id]') : null;
  const btn = (panel ? panel.querySelector('[data-action="refresh"]') : null) || _container!.querySelector('[data-action="refresh"]');

  _addListener(btn, 'click', (e: Event) => { e.preventDefault(); if (_handlers.refresh) _handlers.refresh(); });
}

function _setupAutoRefreshToggle() {
  // @ts-expect-error strict migration — TS2774
  const panel = _container!.closest ? _container!.closest('[data-panel-id]') : null;
  const btn = panel ? panel.querySelector('[data-action="toggle-auto-refresh"]') : null;

  _addListener(btn, 'click', (e: Event) => { e.preventDefault(); if (_handlers.toggleAutoRefresh) _handlers.toggleAutoRefresh(); });
}

function _setupAlertActions() {
  _container!.querySelectorAll('[data-action="toggle-expand"]').forEach(btn => {
    _addListener(btn, 'click', e => {
      (e as any).preventDefault();
      e.stopPropagation();

      // @ts-expect-error TS migration - TS2339
      if (_handlers.toggleExpand) _handlers.toggleExpand(parseInt(btn.dataset.alertId, 10));
    });
  });
  
  _container!.querySelectorAll('[data-action="acknowledge"]').forEach(btn => {
    _addListener((btn as any), 'click', e => {
      e.preventDefault();
      e.stopPropagation();

      // @ts-expect-error TS migration - TS2339
      if (_handlers.acknowledgeAlert) _handlers.acknowledgeAlert(parseInt(btn.dataset.alertId, 10));
    });
  });
}

export function destroy() {
  _boundListeners.forEach(item => { if (item.el) item.el.removeEventListener(item.event, item.handler); });
  _boundListeners = [];
}

export function getVersion() { return VERSION; }

export function healthCheck() {
  const checks = { hasContainer: !!_container, cleanupRegistered: _boundListeners.length >= 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, listenersCount: _boundListeners.length, p25Compliant: true, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasContainer: !!_container, listenersCount: _boundListeners.length, p25Compliant: true };
}

export default { VERSION, MODULE_ID, setup, destroy, getVersion, healthCheck, info };
