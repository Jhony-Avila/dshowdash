// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.services.toast-service
// PURPOSE: Global notification system - Facade para ToastService
// ───────────────────────────────────────────────────────────────
// @contract TOAST_FACADE - Re-exports do ToastService component
// @contract GLOBAL_WINDOW - Expõe window.Toast
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ToastService from /components/toast/service/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show/success/info/warning/error/critical — métodos de exibição
//   dismiss/dismissAll — métodos de dismissal
//   setPosition/getQueue/getVisible — utilitários
//   healthCheck() — status de saúde
//   getInfo() — informações do serviço
//   injectPorts(p) — inject port dependencies
//
// @changelog v2.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v2.3.0-ENTERPRISE: ES6 modernization, P18EC
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import ToastService from '/components/toast/service/index.js';

const MODULE_ID = 'core.services.toast-service';
const VERSION = '2.4.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

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
export { VERSION, MODULE_ID };

if (typeof window !== 'undefined') {
  _initPorts();
  window.Toast = ToastService;
  const logger = _getPort('logger');
  logger?.info?.(`[Toast Service] v${ToastService.VERSION} loaded`);
}

export default ToastService;
