// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-13/ui/toast
// PURPOSE: Panel-13 Toast Notifications
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
export const MODULE_ID = 'panel-13/ui/toast';
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); const fn = (logger as Record<string, unknown>)?.[level]; if (typeof fn === 'function') (fn as (...a: unknown[]) => void)(`[${MODULE_ID}]`, ...args); };
export class ToastManager {
  [key: string]: any;
  constructor() { this._ready = false; }
  init() { _initPorts(); this._ready = true; return this; }
  show(message: string, type = 'info', duration?: number) { const toast = _getPort('toast'); if (toast?.show) return toast.show(message, type, duration); _log('warn', 'Toast Service not available'); return null; }
  dismiss(toastId: string) { _getPort('toast')?.dismiss?.(toastId); }
  success(message: string, duration?: number) { const toast = _getPort('toast'); return toast?.success ? toast.success(message, { duration }) : this.show(message, 'success', duration); }
  warning(message: string, duration?: number) { const toast = _getPort('toast'); return toast?.warning ? toast.warning(message, { duration }) : this.show(message, 'warning', duration); }
  error(message: string, duration?: number) { const toast = _getPort('toast'); return toast?.error ? toast.error(message, { duration }) : this.show(message, 'error', duration); }
  info(message: string, duration?: number) { const toast = _getPort('toast'); return toast?.info ? toast.info(message, { duration }) : this.show(message, 'info', duration); }
  destroy() { this._ready = false; }
}
export default ToastManager;
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized, ports: Object.keys(Ports.snapshot()).filter(k => k !== '_initialized') });
export const healthCheck = () => { const toast = _getPort('toast'); const logger = _getPort('logger'); return { status: toast ? 'HEALTHY' : 'NOT_INITIALIZED', moduleId: MODULE_ID, version: VERSION, loggerReady: !!logger, portsInitialized: Ports.snapshot()._initialized }; };
