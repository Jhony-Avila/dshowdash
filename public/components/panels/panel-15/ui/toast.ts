// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15/ui/toast
// PURPOSE: Panel-15 Toast Notifications
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   ToastManager — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-15/ui/toast';
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); (logger as Record<string, (...a: unknown[]) => void>)?.[level]?.(`[${MODULE_ID}]`, ...args); };
class ToastManager {
  [key: string]: any;
  constructor() { this._ready = false; _initPorts(); }
  init() { this._ready = true; return this; }
  show(message: string, type = 'info', duration?: number) { const toast = _getPort('toast'); if (toast && (toast as Record<string, unknown>).show) return (toast as Record<string, (...a: unknown[]) => unknown>).show(message, type, duration); _log('warn', 'Toast Service not available'); return null; }
  dismiss(toastId: string) { (_getPort('toast') as Record<string, (...a: unknown[]) => void>)?.dismiss?.(toastId); }
  success(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, unknown>)?.success ? (toast as Record<string, (...a: unknown[]) => unknown>).success(message, { duration }) : this.show(message, 'success', duration); }
  warning(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, unknown>)?.warning ? (toast as Record<string, (...a: unknown[]) => unknown>).warning(message, { duration }) : this.show(message, 'warning', duration); }
  error(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, unknown>)?.error ? (toast as Record<string, (...a: unknown[]) => unknown>).error(message, { duration }) : this.show(message, 'error', duration); }
  info(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, unknown>)?.info ? (toast as Record<string, (...a: unknown[]) => unknown>).info(message, { duration }) : this.show(message, 'info', duration); }
  destroy() { this._ready = false; }
}
export { ToastManager, VERSION, MODULE_ID, injectPorts, getPorts };
export default ToastManager;
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export const healthCheck = () => ({ status: _getPort('toast') ? 'HEALTHY' : 'NOT_INITIALIZED', moduleId: MODULE_ID, version: VERSION, loggerReady: !!_getPort('logger'), portsInitialized: Ports.snapshot()._initialized });
