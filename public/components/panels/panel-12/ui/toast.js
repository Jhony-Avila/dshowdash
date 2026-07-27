import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-12/ui/toast";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ? true : false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger["info"];
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`, ...args]);
};
const _toastMap = /* @__PURE__ */ new Map();
const show = (message, type = "info", persistent = false) => {
  _initPorts();
  const toastService = _getPort("toast");
  if (toastService?.show) {
    const id = toastService.show(message, type, persistent ? 0 : 3e3);
    const fakeToast = { _toastId: id, _removed: false };
    _toastMap.set(id, fakeToast);
    return fakeToast;
  }
  _log("warn", "Toast Service not available");
  return null;
};
const hide = (toast) => {
  if (!toast) return;
  const toastService = _getPort("toast");
  if (toast._toastId && toastService?.dismiss) {
    toastService.dismiss(toast._toastId);
    toast._removed = true;
    _toastMap.delete(toast._toastId);
    return;
  }
  const toastEl = toast;
  if (toastEl.parentNode && toastEl.classList) {
    toastEl.classList.remove("painel-12-toast-show");
    setTimeout(() => {
      if (toastEl.parentNode) toastEl.remove();
    }, 300);
  }
};
const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const toastService = _getPort("toast");
  const logger = _getPort("logger");
  const checks = { toastReady: !!toastService, loggerReady: !!logger, portsInitialized: portsSnapshot._initialized };
  const values = Object.values(checks);
  const passed = values.filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized };
};
const info = () => {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized, healthCheck: healthCheck() };
};
export {
  MODULE_ID,
  VERSION,
  getPorts,
  healthCheck,
  hide,
  info,
  injectPorts,
  show
};
