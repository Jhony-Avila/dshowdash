import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P17WI";
const MODULE_ID = "login-modal-critical-css";
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
  const logger = _getPort("logger");
  if (!logger) return;
  const args = Array.prototype.slice.call(arguments, 1);
  if (level === "error") {
    if (logger.error) logger.error(...["[critical-css]"].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...["[critical-css]"].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...["[critical-css]"].concat(args));
};
const CRITICAL_CSS = ".lm-modal{position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}.lm-modal[hidden]{display:none}.lm-modal:not([hidden]){opacity:1;visibility:visible}.lm-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px)}.lm-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;opacity:.3}.lm-wrapper{position:relative;z-index:1;width:100%;max-width:420px;padding:1rem}.lm-container{background:rgba(15,23,42,.95);border-radius:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);overflow:hidden;border:1px solid rgba(255,255,255,.1)}.lm-inner{padding:2.5rem}.lm-form{display:flex;flex-direction:column;gap:1.25rem}.lm-floating-group{position:relative}.lm-input-wrapper{position:relative;display:flex;align-items:center}.lm-input{width:100%;height:56px;padding:1rem 1rem 1rem 3rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#fff;font-size:1rem;transition:all .2s}.lm-input:focus{outline:none;border-color:rgba(139,92,246,.5);box-shadow:0 0 0 3px rgba(139,92,246,.2)}.lm-floating-label{position:absolute;left:3rem;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.5);font-size:1rem;pointer-events:none;transition:all .2s}.lm-input:focus~.lm-floating-label,.lm-input:not(:placeholder-shown)~.lm-floating-label{top:.5rem;transform:translateY(0);font-size:.75rem;color:rgba(139,92,246,.8)}.lm-input-icon{position:absolute;left:1rem;width:20px;height:20px;color:rgba(255,255,255,.4)}.lm-button{width:100%;height:48px;background:linear-gradient(135deg,#8b5cf6,#a855f7);border:none;border-radius:12px;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;transition:all .2s}.lm-button:hover{transform:translateY(-2px);box-shadow:0 10px 20px rgba(139,92,246,.3)}.lm-button:disabled{opacity:.6;cursor:not-allowed;transform:none}.lm-error{min-height:1.5rem;color:#f87171;font-size:.875rem;text-align:center}.lm-sr-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}";
function CriticalCSS(config) {
  if (!config) config = {};
  const cc = config.criticalCSS || {};
  this.config = config;
  this.enabled = cc.enabled !== false;
  this.customCSS = cc.custom || "";
  this._injected = false;
  this._styleElement = null;
  this._metrics = { injections: 0, loadTime: 0 };
  _initPorts();
}
CriticalCSS.prototype.inject = function() {
  if (!this.enabled || this._injected || typeof document === "undefined") return false;
  const startTime = performance.now();
  try {
    if (document.querySelector('style[data-critical-css="login-modal"]')) {
      this._injected = true;
      return true;
    }
    this._styleElement = document.createElement("style");
    this._styleElement.setAttribute("data-critical-css", "login-modal");
    this._styleElement.textContent = CRITICAL_CSS + this.customCSS;
    const firstChild = document.head.firstChild;
    if (firstChild) document.head.insertBefore(this._styleElement, firstChild);
    else document.head.appendChild(this._styleElement);
    this._injected = true;
    this._metrics.injections++;
    this._metrics.loadTime = performance.now() - startTime;
    _log("info", `Critical CSS injetado em ${this._metrics.loadTime.toFixed(2)}ms`);
    return true;
  } catch (error) {
    _log("error", "Erro ao injetar critical CSS", error);
    return false;
  }
};
CriticalCSS.prototype.loadFullCSSAsync = (cssUrl) => {
  if (typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssUrl;
  link.media = "print";
  link.onload = () => {
    link.media = "all";
    _log("info", "CSS completo carregado:", cssUrl);
  };
  document.head.appendChild(link);
};
CriticalCSS.prototype.preloadCSS = (cssUrl) => {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[rel="preload"][href="${cssUrl}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "style";
  link.href = cssUrl;
  document.head.appendChild(link);
};
CriticalCSS.prototype.remove = function() {
  if (this._styleElement) {
    this._styleElement.remove();
    this._styleElement = null;
  }
  this._injected = false;
};
CriticalCSS.prototype.isInjected = function() {
  return this._injected;
};
CriticalCSS.prototype.getCriticalCSS = () => CRITICAL_CSS;
CriticalCSS.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, injected: this._injected, cssSize: CRITICAL_CSS.length, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
CriticalCSS.prototype.healthCheck = function() {
  const logger = _getPort("logger");
  const checks = { enabled: this.enabled, injected: this._injected, hasDocument: typeof document !== "undefined", loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? "HEALTHY" : "DEGRADED", score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var critical_css_default = CriticalCSS;
export {
  CRITICAL_CSS,
  CriticalCSS,
  MODULE_ID,
  VERSION,
  critical_css_default as default,
  getPorts,
  injectPorts
};
