import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "7.4.0-P17WI";
const MODULE_ID = "footer.version-env";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    if (logger.error) logger.error(`[${MODULE_ID}]`, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(`[${MODULE_ID}]`, args.join(" "));
};
function FooterVersionEnv() {
  this.mounted = false;
  this.container = null;
  this.props = {};
}
FooterVersionEnv.prototype.mount = function(container, props, integrations) {
  if (this.mounted) return;
  _initPorts();
  this.container = container;
  this.props = props || {};
  this.mounted = true;
  _log("info", "Mounted (compatibility mode - merged with brand)");
};
FooterVersionEnv.prototype.update = function(partial) {
  Object.assign(this.props, partial || {});
};
FooterVersionEnv.prototype.destroy = function() {
  this.mounted = false;
  _log("info", "Destroyed");
};
FooterVersionEnv.getVersion = () => VERSION;
FooterVersionEnv.setDebug = (enabled) => {
};
FooterVersionEnv.prototype.getVersion = () => VERSION;
FooterVersionEnv.prototype.setDebug = (enabled) => {
};
FooterVersionEnv.prototype.getMetrics = function() {
  return { mountCount: this.mounted ? 1 : 0 };
};
FooterVersionEnv.prototype.healthCheck = function() {
  const portsSnapshot = Ports.snapshot();
  return { status: portsSnapshot._initialized ? "HEALTHY" : "DEGRADED", score: 100, checks: { mounted: this.mounted, hasLogger: !!_getPort("logger"), portsInitialized: portsSnapshot._initialized }, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
FooterVersionEnv.prototype.info = function() {
  const portsSnapshot = Ports.snapshot();
  return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, note: "Merged with brand component", portsInitialized: portsSnapshot._initialized };
};
FooterVersionEnv.injectPorts = injectPorts;
FooterVersionEnv.getPorts = getPorts;
var version_env_default = FooterVersionEnv;
export {
  FooterVersionEnv,
  MODULE_ID,
  VERSION,
  version_env_default as default,
  getPorts,
  injectPorts
};
