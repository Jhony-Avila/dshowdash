// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-17/ui/toast
// PURPOSE: Panel-17 Toast Notifications
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
const MODULE_ID = 'panel-17/ui/toast';
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger') as Record<string, Function> | null; if (logger && typeof logger[level] === 'function') logger[level](`[${MODULE_ID}]`, ...args); };
class ToastManager {
  [key: string]: any;
  constructor() { this._ready = false; _initPorts(); }
  init() { this._ready = true; return this; }
  show(message: string, type = 'info', duration?: number) { const toast = _getPort('toast'); if ((toast as Record<string, unknown>)?.['show']) return (toast as Record<string, Function>)['show'](message, type, duration); _log('warn', 'Toast Service not available'); return null; }
  dismiss(toastId: string) { (_getPort('toast') as Record<string, Function>)?.['dismiss']?.(toastId); }
  success(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, Function>)?.['success'] ? (toast as Record<string, Function>)['success'](message, { duration }) : this.show(message, 'success', duration); }
  warning(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, Function>)?.['warning'] ? (toast as Record<string, Function>)['warning'](message, { duration }) : this.show(message, 'warning', duration); }
  error(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, Function>)?.['error'] ? (toast as Record<string, Function>)['error'](message, { duration }) : this.show(message, 'error', duration); }
  info(message: string, duration?: number) { const toast = _getPort('toast'); return (toast as Record<string, Function>)?.['info'] ? (toast as Record<string, Function>)['info'](message, { duration }) : this.show(message, 'info', duration); }
  destroy() { this._ready = false; }
}
export { ToastManager, VERSION, MODULE_ID, injectPorts, getPorts };
export default ToastManager;
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
export const healthCheck = () => ({ status: _getPort('toast') ? 'HEALTHY' : 'NOT_INITIALIZED', moduleId: MODULE_ID, version: VERSION, loggerReady: !!_getPort('logger'), portsInitialized: Ports.snapshot()._initialized });
