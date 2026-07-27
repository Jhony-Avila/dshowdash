import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.8.0-P17WI";
const MODULE_ID = "login-modal-appshell-adapter";
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
  const prefix = "[login-appshell-adapter]";
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
function AppShellAdapter(config) {
  if (!config) config = {};
  this.config = config;
  this.appShell = null;
  this._connected = false;
  this._metrics = { connections: 0, disconnections: 0, signals: 0 };
}
AppShellAdapter.prototype.connect = function() {
  if (this._connected) return true;
  try {
    _initPorts();
    this.appShell = _getPort("appShell");
    if (this.appShell) {
      this._connected = true;
      this._metrics.connections++;
      _log("info", "Conectado ao AppShell");
      return true;
    }
    _log("info", "AppShell nao disponivel - funcionando standalone");
    return false;
  } catch (error) {
    _log("error", "Erro ao conectar AppShell", error);
    return false;
  }
};
AppShellAdapter.prototype.disconnect = function() {
  if (!this._connected) return;
  this.appShell = null;
  this._connected = false;
  this._metrics.disconnections++;
  _log("debug", "Desconectado do AppShell");
};
AppShellAdapter.prototype.signalReady = function() {
  if (!this._connected || !this.appShell) return false;
  try {
    if (typeof this.appShell.componentReady === "function") {
      this.appShell.componentReady("login-modal");
      this._metrics.signals++;
      _log("debug", "Signal ready enviado ao AppShell");
      return true;
    }
    return false;
  } catch (error) {
    _log("error", "Erro ao sinalizar ready", error);
    return false;
  }
};
AppShellAdapter.prototype.signalError = function(error) {
  if (!this._connected || !this.appShell) return false;
  try {
    if (typeof this.appShell.componentError === "function") {
      this.appShell.componentError("login-modal", error);
      this._metrics.signals++;
      return true;
    }
    return false;
  } catch (err) {
    _log("error", "Erro ao sinalizar error", err);
    return false;
  }
};
AppShellAdapter.prototype.getContainer = function() {
  if (!this._connected || !this.appShell) return null;
  try {
    if (typeof this.appShell.getOverlayContainer === "function") return this.appShell.getOverlayContainer();
    return null;
  } catch (error) {
    _log("error", "Erro ao obter container", error);
    return null;
  }
};
AppShellAdapter.prototype.isAvailable = () => typeof window !== "undefined";
AppShellAdapter.prototype.isConnected = function() {
  return this._connected;
};
AppShellAdapter.prototype.getStatus = function() {
  return { connected: this._connected, hasAppShell: !!this.appShell, metrics: Object.assign({}, this._metrics) };
};
AppShellAdapter.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, connected: this._connected, hasAppShell: !!this.appShell, portsInitialized: Ports.isInitialized(), loggerAvailable: !!_getPort("logger"), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
AppShellAdapter.prototype.healthCheck = () => {
  const checks = { notInErrorState: true, canConnect: typeof window !== "undefined", loggerAvailable: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var appshell_adapter_default = AppShellAdapter;
function createAppShellAdapter(loginModal, config) {
  return new AppShellAdapter(config);
}
export {
  AppShellAdapter,
  MODULE_ID,
  VERSION,
  createAppShellAdapter,
  appshell_adapter_default as default,
  getPorts,
  injectPorts
};
