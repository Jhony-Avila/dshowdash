import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "3.2.0-P2-ENTERPRISE";
const MODULE_ID = "components._shared.permissions.loader";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
let _loaded = false;
function load(options) {
  if (!options) options = {};
  if (_loaded) return Promise.resolve({ ok: true, alreadyLoaded: true });
  return import("./integration.js").then((module) => {
    const Integration = module.default;
    return Integration.init({ debug: options.debug || false });
  }).then(() => {
    if (options.uiFeedback !== false) {
      return import("./ui-feedback.js").then((module) => {
        const UIFeedback = module.default;
        UIFeedback.init({ mode: options.uiFeedbackMode || "disable", debug: options.debug || false });
      });
    }
  }).then(() => import("./migration-bridge.js")).then(() => {
    _loaded = true;
    _log("info", `Permissions System loaded v${VERSION}`);
    return { ok: true, alreadyLoaded: false };
  }).catch((error) => {
    _log("error", "Failed to load:", error ? error.message : "");
    return { ok: false, error: error.message };
  });
}
function isLoaded() {
  return _loaded;
}
function healthCheck() {
  const ps = Ports.snapshot();
  const logger = _getPort("logger");
  return {
    status: _loaded ? "HEALTHY" : "NOT_LOADED",
    version: VERSION,
    moduleId: MODULE_ID,
    loaded: _loaded,
    loggerAvailable: !!logger,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, loaded: _loaded, timestamp: Date.now() };
}
var loader_default = { load, isLoaded, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  loader_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isLoaded,
  load
};
