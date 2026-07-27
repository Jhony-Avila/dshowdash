import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-02.ui.toast";
const hasWindow = typeof window !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _getToast() {
  const portToast = _getPort("toast");
  if (portToast) return portToast;
  if (hasWindow && window.Core?.windowAdapter?.get) {
    const waToast = window.Core.windowAdapter.get("Toast");
    if (waToast) return waToast;
  }
  if (isStrict()) return null;
  if (hasWindow && window.Toast) {
    recordViolation("WINDOW_TOAST_FALLBACK", { module: MODULE_ID });
    return window.Toast;
  }
  return null;
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger["info"];
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
class ToastManager {
  constructor() {
    this._ready = false;
  }
  init() {
    this._ready = true;
    return this;
  }
  show(message, type = "info", duration) {
    const toast = _getToast();
    if (toast?.show) return toast.show(message, type, duration);
    _log("warn", "Toast Service not available");
    return null;
  }
  dismiss(toastId) {
    const toast = _getToast();
    if (toast?.dismiss) return toast.dismiss(toastId);
  }
  success(message, duration) {
    const toast = _getToast();
    if (toast?.success) return toast.success(message, { duration });
    return this.show(message, "success", duration);
  }
  warning(message, duration) {
    const toast = _getToast();
    if (toast?.warning) return toast.warning(message, { duration });
    return this.show(message, "warning", duration);
  }
  error(message, duration) {
    const toast = _getToast();
    if (toast?.error) return toast.error(message, { duration });
    return this.show(message, "error", duration);
  }
  info(message, duration) {
    const toast = _getToast();
    if (toast?.info) return toast.info(message, { duration });
    return this.show(message, "info", duration);
  }
  destroy() {
    this._ready = false;
  }
}
var toast_default = ToastManager;
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    strictMode: isStrict()
  };
}
function healthCheck() {
  const toast = _getToast();
  return {
    status: toast ? "HEALTHY" : "NOT_INITIALIZED",
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    strictMode: isStrict(),
    toastAvailable: !!toast,
    timestamp: Date.now()
  };
}
export {
  MODULE_ID,
  ToastManager,
  VERSION,
  toast_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
