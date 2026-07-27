import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-07/ui/toast";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  const fn = logger?.[level];
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
class ToastManager {
  constructor() {
    this._ready = false;
  }
  init() {
    _initPorts();
    this._ready = true;
    return this;
  }
  show(message, type = "info", duration) {
    const toast = _getPort("toast");
    if (toast?.show) return toast.show(message, type, duration);
    _log("warn", "Toast Service not available");
    return null;
  }
  dismiss(toastId) {
    const toast = _getPort("toast");
    const fn = toast?.dismiss;
    if (typeof fn === "function") fn(toastId);
  }
  success(message, duration) {
    const toast = _getPort("toast");
    return toast?.success ? toast.success(message, { duration }) : this.show(message, "success", duration);
  }
  warning(message, duration) {
    const toast = _getPort("toast");
    return toast?.warning ? toast.warning(message, { duration }) : this.show(message, "warning", duration);
  }
  error(message, duration) {
    const toast = _getPort("toast");
    return toast?.error ? toast.error(message, { duration }) : this.show(message, "error", duration);
  }
  info(message, duration) {
    const toast = _getPort("toast");
    return toast?.info ? toast.info(message, { duration }) : this.show(message, "info", duration);
  }
  destroy() {
    this._ready = false;
  }
}
var toast_default = ToastManager;
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => {
  const toast = _getPort("toast");
  return { status: toast ? "HEALTHY" : "NOT_INITIALIZED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized };
};
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
