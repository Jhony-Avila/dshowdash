// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-07/ui/toast
// PURPOSE: Panel-07 Toast Notifications
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
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
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-07/ui/toast';
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); const fn = (logger as Record<string, unknown>)?.[level]; if (typeof fn === 'function') (fn as Function)(`[${MODULE_ID}]`, ...args); };
export class ToastManager {
  [key: string]: unknown;
  constructor() { this._ready = false; }
  init() { _initPorts(); this._ready = true; return this; }
  show(message: string, type = 'info', duration?: number) { const toast = _getPort('toast'); if ((toast as Record<string, unknown>)?.show) return (toast as Record<string, (...a: unknown[]) => unknown>).show(message, type, duration); _log('warn', 'Toast Service not available'); return null; }
  dismiss(toastId: unknown) { const toast = _getPort('toast'); const fn = (toast as Record<string, unknown>)?.dismiss; if (typeof fn === 'function') (fn as Function)(toastId); }
  success(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, unknown>)?.success ? (toast as Record<string, (...a: unknown[]) => unknown>).success(message, { duration }) : this.show(message, 'success', duration); }
  warning(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, unknown>)?.warning ? (toast as Record<string, (...a: unknown[]) => unknown>).warning(message, { duration }) : this.show(message, 'warning', duration); }
  error(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, unknown>)?.error ? (toast as Record<string, (...a: unknown[]) => unknown>).error(message, { duration }) : this.show(message, 'error', duration); }
  info(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, unknown>)?.info ? (toast as Record<string, (...a: unknown[]) => unknown>).info(message, { duration }) : this.show(message, 'info', duration); }
  destroy() { this._ready = false; }
}
export default ToastManager;
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export const healthCheck = () => { const toast = _getPort('toast'); return { status: toast ? 'HEALTHY' : 'NOT_INITIALIZED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized }; };
