import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-11/ui/toast";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort("config")?.app?.debug ?? false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!_debug() && level === "debug") return;
  logger?.[level]?.(`[${MODULE_ID}]`, ...args);
};
class ToastComponent {
  constructor(logger) {
    this.logger = logger || { debug: (...args) => _log("debug", ...args) };
    this._ready = false;
    _initPorts();
  }
  init() {
    this._ready = true;
    this.logger?.debug?.("toast.init - using global Toast Service");
  }
  show(message, type = "info", duration) {
    const toastService = _getPort("toast");
    if (toastService?.show) {
      const id = toastService.show(message, type, duration);
      this.logger?.debug?.("toast.show", { type, message, id });
      return id;
    }
    _log("warn", "Toast Service not available");
    return null;
  }
  success(message, duration) {
    const ts = _getPort("toast");
    return ts?.success ? ts.success(message, { duration }) : this.show(message, "success", duration);
  }
  warning(message, duration) {
    const ts = _getPort("toast");
    return ts?.warning ? ts.warning(message, { duration }) : this.show(message, "warning", duration);
  }
  error(message, duration) {
    const ts = _getPort("toast");
    return ts?.error ? ts.error(message, { duration }) : this.show(message, "error", duration);
  }
  info(message, duration) {
    const ts = _getPort("toast");
    return ts?.info ? ts.info(message, { duration }) : this.show(message, "info", duration);
  }
  clearAll() {
    _getPort("toast")?.dismissAll?.();
  }
  destroy() {
    this._ready = false;
  }
}
const healthCheck = () => {
  const checks = { toastReady: !!_getPort("toast"), loggerReady: !!_getPort("logger"), portsInitialized: Ports.snapshot()._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, moduleId: MODULE_ID, version: VERSION };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized, healthCheck: healthCheck() });
var toast_default = ToastComponent;
export {
  MODULE_ID,
  ToastComponent,
  VERSION,
  toast_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
