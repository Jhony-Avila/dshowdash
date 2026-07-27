import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.8.0-P17WI";
const MODULE_ID = "login-modal-preloader-adapter";
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
  const prefix = "[login-preloader-adapter]";
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
function PreloaderAdapter(config) {
  if (!config) config = {};
  this.config = config;
  this.preloader = null;
  this._connected = false;
  this._metrics = { connections: 0, shows: 0, hides: 0 };
}
PreloaderAdapter.prototype.connect = function() {
  if (this._connected) return true;
  try {
    _initPorts();
    this.preloader = _getPort("preloader") || _getPort("preloaderManager");
    if (this.preloader) {
      this._connected = true;
      this._metrics.connections++;
      _log("info", "Conectado ao Preloader");
      return true;
    }
    _log("info", "Preloader nao disponivel - funcionando standalone");
    return false;
  } catch (error) {
    _log("error", "Erro ao conectar Preloader", error);
    return false;
  }
};
PreloaderAdapter.prototype.disconnect = function() {
  if (!this._connected) return;
  this.preloader = null;
  this._connected = false;
  _log("debug", "Desconectado do Preloader");
};
PreloaderAdapter.prototype.show = function(message) {
  if (!message) message = "";
  this._metrics.shows++;
  if (!this._connected || !this.preloader) return false;
  try {
    if (typeof this.preloader.show === "function") {
      this.preloader.show(message);
      return true;
    }
    return false;
  } catch (error) {
    _log("error", "Erro ao mostrar preloader", error);
    return false;
  }
};
PreloaderAdapter.prototype.hide = function() {
  this._metrics.hides++;
  if (!this._connected || !this.preloader) return false;
  try {
    if (typeof this.preloader.hide === "function") {
      this.preloader.hide();
      return true;
    }
    return false;
  } catch (error) {
    _log("error", "Erro ao esconder preloader", error);
    return false;
  }
};
PreloaderAdapter.prototype.setProgress = function(percent) {
  if (!this._connected || !this.preloader) return false;
  try {
    if (typeof this.preloader.setProgress === "function") {
      this.preloader.setProgress(percent);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
PreloaderAdapter.prototype.isAvailable = () => typeof window !== "undefined";
PreloaderAdapter.prototype.isConnected = function() {
  return this._connected;
};
PreloaderAdapter.prototype.getStatus = function() {
  return { connected: this._connected, hasPreloader: !!this.preloader, metrics: Object.assign({}, this._metrics) };
};
PreloaderAdapter.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, connected: this._connected, hasPreloader: !!this.preloader, portsInitialized: Ports.isInitialized(), loggerAvailable: !!_getPort("logger"), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
PreloaderAdapter.prototype.healthCheck = () => {
  const checks = { notInErrorState: true, canConnect: typeof window !== "undefined", loggerAvailable: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var preloader_adapter_default = PreloaderAdapter;
function createPreloaderAdapter(loginModal, config) {
  return new PreloaderAdapter(config);
}
export {
  MODULE_ID,
  PreloaderAdapter,
  VERSION,
  createPreloaderAdapter,
  preloader_adapter_default as default,
  getPorts,
  injectPorts
};
