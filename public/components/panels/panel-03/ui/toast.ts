// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-03.ui.toast
// PURPOSE: Panel-03 Toast Notifications
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Toast (via Ports fallback only)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-03.ui.toast';

const hasWindow = typeof window !== 'undefined';
const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger') as Record<string, unknown>; if (!logger) return; const fn = (logger[level] || logger['info']) as ((...a: unknown[]) => void) | undefined; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };

function _getToast() {
  if (typeof window === 'undefined') return null;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const wt = window.Core.windowAdapter.get('Toast');
    if (wt) return wt;
  }
  if (strictMode) return null;
  if (window.Toast) {
    recordViolation('WINDOW_TOAST_FALLBACK', { module: MODULE_ID });
    return window.Toast;
  }
  return null;
}

export class ToastManager {
  [key: string]: any;
  constructor() { this._ready = false; }
  init() { this._ready = true; return this; }
  show(message: string, type = 'info', duration?: number) { const toast = _getToast(); if (toast?.show) return toast.show(message, type, duration); _log('warn', 'Toast Service not available'); return null; }
  dismiss(toastId: string) { const toast = _getToast(); if (toast?.dismiss) return toast.dismiss(toastId); }
  success(message: string, duration?: number) { const toast = _getToast(); if (toast?.success) return toast.success(message, { duration }); return this.show(message, 'success', duration); }
  warning(message: string, duration?: number) { const toast = _getToast(); if (toast?.warning) return toast.warning(message, { duration }); return this.show(message, 'warning', duration); }
  error(message: string, duration?: number) { const toast = _getToast(); if (toast?.error) return toast.error(message, { duration }); return this.show(message, 'error', duration); }
  info(message: string, duration?: number) { const toast = _getToast(); if (toast?.info) return toast.info(message, { duration }); return this.show(message, 'info', duration); }
  destroy() { this._ready = false; }
}

export default ToastManager;
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: _getToast() ? 'HEALTHY' : 'NOT_INITIALIZED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
