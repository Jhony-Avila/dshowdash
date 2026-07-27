// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-18/ui/toast
// PURPOSE: Panel-18 Toast Notifications
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
const MODULE_ID = 'panel-18/ui/toast';
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger') as Record<string, unknown>; (logger?.[level] as ((...a: unknown[]) => void) | undefined)?.(`[${MODULE_ID}]`, ...args); };
class ToastManager {
  [key: string]: any;
  constructor() { this._ready = false; _initPorts(); }
  init() { this._ready = true; return this; }
  show(message: string, type = 'info', duration?: number) { const toast = _getPort('toast') as Record<string, unknown>; if (toast?.show) return (toast.show as (...a: unknown[]) => unknown)(message, type, duration); _log('warn', 'Toast Service not available'); return null; }
  dismiss(toastId: unknown) { const toast = _getPort('toast') as Record<string, unknown>; (toast?.dismiss as ((...a: unknown[]) => void) | undefined)?.(toastId); }
  success(message: string, duration?: number) { const toast = _getPort('toast') as Record<string, unknown>; return toast?.success ? (toast.success as (...a: unknown[]) => unknown)(message, { duration }) : this.show(message, 'success', duration); }
  warning(message: string, duration?: number) { const toast = _getPort('toast') as Record<string, unknown>; return toast?.warning ? (toast.warning as (...a: unknown[]) => unknown)(message, { duration }) : this.show(message, 'warning', duration); }
  error(message: string, duration?: number) { const toast = _getPort('toast') as Record<string, unknown>; return toast?.error ? (toast.error as (...a: unknown[]) => unknown)(message, { duration }) : this.show(message, 'error', duration); }
  info(message: string, duration?: number) { const toast = _getPort('toast') as Record<string, unknown>; return toast?.info ? (toast.info as (...a: unknown[]) => unknown)(message, { duration }) : this.show(message, 'info', duration); }
  destroy() { this._ready = false; }
}
export { ToastManager, VERSION, MODULE_ID, injectPorts, getPorts };
export default ToastManager;
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export const healthCheck = () => ({ status: _getPort('toast') ? 'HEALTHY' : 'NOT_INITIALIZED', moduleId: MODULE_ID, version: VERSION, loggerReady: !!_getPort('logger'), portsInitialized: Ports.snapshot()._initialized });
