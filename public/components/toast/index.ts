// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.toast-wrapper
// PURPOSE: Toast wrapper with service delegation for notifications
// ───────────────────────────────────────────────────────────────
// @contract SHOW - show(options) shows toast
// @contract SUCCESS - success(message, options) shows success toast
// @contract INFO - info(message, options) shows info toast
// @contract WARNING - warning(message, options) shows warning toast
// @contract ERROR - error(message, options) shows error toast
// @contract CRITICAL - critical(message, options) shows critical toast
// @contract DISMISS - dismiss(id) dismisses toast
// @contract DISMISS_ALL - dismissAll() dismisses all toasts
// @contract SET_POSITION - setPosition(position) sets toast position
// @contract GET_QUEUE - getQueue() gets queue
// @contract GET_VISIBLE - getVisible() gets visible toasts
// @contract CLEANUP - cleanup() cleans up toasts
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and getInfo() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: ToastService from ./service/index.js
// PROVIDES: Toast, show, success, info, warning, error, critical, dismiss, dismissAll,
//           setPosition, getQueue, getVisible, healthCheck, getInfo, cleanup, reset,
//           destroy, injectPorts, getPorts, SERVICE_VERSION, SERVICE_MODULE_ID,
//           VERSION, MODULE_ID
// @changelog v6.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v6.5.0-ENTERPRISE-STRICT-MODE: Strict mode integration
// @changelog v6.5.0-ENTERPRISE: ES6 modernization
// @changelog v6.4.0-ENTERPRISE: Added destroy for complete lifecycle
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import ToastService from './service/index.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

const MODULE_ID = 'toast-wrapper';
const VERSION = '6.6.0-P2-ENTERPRISE';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const fn = logger[level] || logger.info;
  fn?.(`[${MODULE_ID}]`, ...args);
};

export const show = ToastService.show;
export const success = ToastService.success;
export const info = ToastService.info;
export const warning = ToastService.warning;
export const error = ToastService.error;
export const critical = ToastService.critical;
export const dismiss = ToastService.dismiss;
export const dismissAll = ToastService.dismissAll;
export const setPosition = ToastService.setPosition;
export const getQueue = ToastService.getQueue;
export const getVisible = ToastService.getVisible;
export const healthCheck = ToastService.healthCheck;
export const getInfo = ToastService.getInfo;
export const SERVICE_VERSION = ToastService.VERSION;
export const SERVICE_MODULE_ID = ToastService.MODULE_ID;

export const remove = dismiss;
export const clear = dismissAll;

export const cleanup = () => { dismissAll(); return { success: true, moduleId: MODULE_ID }; };
export const reset = () => cleanup();
export const destroy = () => cleanup();

const Toast = {
  show: ToastService.show,
  success: ToastService.success,
  info: ToastService.info,
  warning: ToastService.warning,
  error: ToastService.error,
  critical: ToastService.critical,
  dismiss: ToastService.dismiss,
  dismissAll: ToastService.dismissAll,
  setPosition: ToastService.setPosition,
  getQueue: ToastService.getQueue,
  getVisible: ToastService.getVisible,
  healthCheck: ToastService.healthCheck,
  getInfo: ToastService.getInfo,
  remove: dismiss,
  clear: dismissAll,
  cleanup,
  reset,
  destroy,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};

if (hasWindow) {
  _initPorts();

  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.Toast = Toast;

  // Exposição global só em modo não-strict
  if (!isStrict()) {
    window.Toast = Toast;
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.Toast' });
  }

  _log('info', `v${ToastService.VERSION} (Enterprise Service)`);
}

export { VERSION, MODULE_ID };
export default Toast;
