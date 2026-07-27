import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.8.0-P17WI";
const MODULE_ID = "login-modal-permissions-adapter";
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
const _log = function(level, ...rest) {
  const logger = _getPort("logger");
  if (!logger) return;
  const args = rest;
  const prefix = "[login-permissions-adapter]";
  if (level === "error") {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(...[prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...[prefix].concat(args));
};
function PermissionsAdapter(config) {
  if (!config) config = {};
  this.config = config;
  this.permissionsManager = null;
  this._connected = false;
  this._metrics = { connections: 0, checks: 0, grants: 0 };
}
PermissionsAdapter.prototype.connect = function() {
  if (this._connected) return true;
  try {
    _initPorts();
    this.permissionsManager = _getPort("permissionsManager");
    if (this.permissionsManager) {
      this._connected = true;
      this._metrics.connections++;
      _log("info", "Conectado ao PermissionsManager");
      return true;
    }
    _log("info", "PermissionsManager nao disponivel - funcionando standalone");
    return false;
  } catch (error) {
    _log("error", "Erro ao conectar PermissionsManager", error);
    return false;
  }
};
PermissionsAdapter.prototype.disconnect = function() {
  if (!this._connected) return;
  this.permissionsManager = null;
  this._connected = false;
  _log("debug", "Desconectado do PermissionsManager");
};
PermissionsAdapter.prototype.hasPermission = function(permission) {
  this._metrics.checks++;
  if (!this._connected || !this.permissionsManager) return true;
  try {
    if (typeof this.permissionsManager.check === "function") return this.permissionsManager.check(permission);
    return true;
  } catch (error) {
    _log("error", "Erro ao verificar permissao", error);
    return true;
  }
};
PermissionsAdapter.prototype.grantTemporary = function(permission, durationMs) {
  if (!durationMs) durationMs = 6e4;
  this._metrics.grants++;
  if (!this._connected || !this.permissionsManager) return false;
  try {
    if (typeof this.permissionsManager.grantTemporary === "function") {
      this.permissionsManager.grantTemporary(permission, durationMs);
      return true;
    }
    return false;
  } catch (error) {
    _log("error", "Erro ao conceder permissao", error);
    return false;
  }
};
PermissionsAdapter.prototype.isAvailable = () => typeof window !== "undefined";
PermissionsAdapter.prototype.isConnected = function() {
  return this._connected;
};
PermissionsAdapter.prototype.getStatus = function() {
  return { connected: this._connected, hasPermissionsManager: !!this.permissionsManager, metrics: Object.assign({}, this._metrics) };
};
PermissionsAdapter.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, connected: this._connected, hasPermissionsManager: !!this.permissionsManager, portsInitialized: Ports.isInitialized(), loggerAvailable: !!_getPort("logger"), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
PermissionsAdapter.prototype.healthCheck = () => {
  const checks = { notInErrorState: true, canConnect: typeof window !== "undefined", loggerAvailable: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var permissions_adapter_default = PermissionsAdapter;
function createPermissionsAdapter(loginModal, config) {
  return new PermissionsAdapter(config);
}
export {
  MODULE_ID,
  PermissionsAdapter,
  VERSION,
  createPermissionsAdapter,
  permissions_adapter_default as default,
  getPorts,
  injectPorts
};
