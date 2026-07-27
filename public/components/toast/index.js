import { createCorePorts } from "/core/runtime/ports-profiles.js";
import ToastService from "./service/index.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "toast-wrapper";
const VERSION = "6.6.0-P2-ENTERPRISE";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  fn?.(`[${MODULE_ID}]`, ...args);
};
const show = ToastService.show;
const success = ToastService.success;
const info = ToastService.info;
const warning = ToastService.warning;
const error = ToastService.error;
const critical = ToastService.critical;
const dismiss = ToastService.dismiss;
const dismissAll = ToastService.dismissAll;
const setPosition = ToastService.setPosition;
const getQueue = ToastService.getQueue;
const getVisible = ToastService.getVisible;
const healthCheck = ToastService.healthCheck;
const getInfo = ToastService.getInfo;
const SERVICE_VERSION = ToastService.VERSION;
const SERVICE_MODULE_ID = ToastService.MODULE_ID;
const remove = dismiss;
const clear = dismissAll;
const cleanup = () => {
  dismissAll();
  return { success: true, moduleId: MODULE_ID };
};
const reset = () => cleanup();
const destroy = () => cleanup();
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
  window.__dev = window.__dev || {};
  window.__dev.Toast = Toast;
  if (!isStrict()) {
    window.Toast = Toast;
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.Toast" });
  }
  _log("info", `v${ToastService.VERSION} (Enterprise Service)`);
}
var toast_default = Toast;
export {
  MODULE_ID,
  SERVICE_MODULE_ID,
  SERVICE_VERSION,
  VERSION,
  cleanup,
  clear,
  critical,
  toast_default as default,
  destroy,
  dismiss,
  dismissAll,
  error,
  getInfo,
  getPorts,
  getQueue,
  getVisible,
  healthCheck,
  info,
  injectPorts,
  remove,
  reset,
  setPosition,
  show,
  success,
  warning
};
