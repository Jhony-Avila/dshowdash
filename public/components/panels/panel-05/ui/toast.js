import { recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:toast";
function _getToast() {
  if (window.Core?.windowAdapter?.get) {
    const wt = window.Core.windowAdapter.get("Toast");
    if (wt) return wt;
  }
  if (window.Toast) {
    recordViolation("WINDOW_TOAST_FALLBACK", { module: MODULE_ID });
    return window.Toast;
  }
  return null;
}
function _getLogger() {
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get("Logger");
    if (wl) return wl;
  }
  return null;
}
class ToastManager {
  constructor() {
    this._container = null;
    this._ready = false;
  }
  init(parentContainer = document.body) {
    this._ready = true;
    return this;
  }
  destroy() {
    this._ready = false;
  }
  success(message, options = {}) {
    return this._show("success", message, options);
  }
  error(message, options = {}) {
    return this._show("error", message, options);
  }
  warning(message, options = {}) {
    return this._show("warning", message, options);
  }
  info(message, options = {}) {
    return this._show("info", message, options);
  }
  _show(type, message, options = {}) {
    const { title, duration, action, actionLabel = "A\xE7\xE3o", persist = false } = options;
    const toast = _getToast();
    if (toast?.show) {
      const toastOptions = {
        type,
        message,
        title: title || void 0,
        duration: persist ? 0 : duration,
        actions: action ? [{ label: actionLabel, primary: true, onClick: action }] : []
      };
      return toast.show(toastOptions);
    }
    const logger = _getLogger();
    logger?.warn?.("[panel-05:toast] Toast Service not available");
    return null;
  }
  dismiss(id) {
    const toast = _getToast();
    if (toast?.dismiss) {
      return toast.dismiss(id);
    }
  }
  dismissAll() {
    const toast = _getToast();
    if (toast?.dismissAll) {
      return toast.dismissAll();
    }
  }
  getInfo() {
    const toast = _getToast();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      activeToasts: toast?.getVisible?.()?.length || 0
    };
  }
  healthCheck() {
    const toast = _getToast();
    return {
      status: toast ? "HEALTHY" : "NOT_INITIALIZED",
      moduleId: MODULE_ID,
      version: VERSION,
      timestamp: Date.now()
    };
  }
}
const toastManager = new ToastManager();
var toast_default = toastManager;
export {
  MODULE_ID,
  VERSION,
  toast_default as default,
  toastManager
};
