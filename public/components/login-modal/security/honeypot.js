import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.4.0-P17WI";
const MODULE_ID = "login-modal-honeypot";
const HONEYPOT_FIELD_NAME = "website_url";
const HONEYPOT_FIELD_ID = "login-website";
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
    if (logger.error) logger.error(...["[honeypot]"].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...["[honeypot]"].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...["[honeypot]"].concat(args));
};
function HoneypotValidator(config) {
  if (!config) config = {};
  const hp = config.honeypot || {};
  this.fieldName = hp.fieldName || HONEYPOT_FIELD_NAME;
  this.fieldId = hp.fieldId || HONEYPOT_FIELD_ID;
  this.enabled = hp.enabled !== false;
  this._metrics = { checks: 0, botsDetected: 0, passed: 0 };
  _initPorts();
}
HoneypotValidator.prototype.getFieldHTML = function() {
  if (!this.enabled) return "";
  return `<div class="lm-honeypot" aria-hidden="true" inert style="position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;height:0;width:0;overflow:hidden;"><label for="${this.fieldId}">Website (deixe em branco)</label><input type="text" id="${this.fieldId}" name="${this.fieldName}" tabindex="-1" autocomplete="off" data-honeypot="true"></div>`;
};
HoneypotValidator.prototype.validate = function(form) {
  this._metrics.checks++;
  if (!this.enabled) {
    this._metrics.passed++;
    return { valid: true, isBot: false };
  }
  let honeypotField = null;
  if (form && form.querySelector) {
    honeypotField = form.querySelector('[data-honeypot="true"]') || form.querySelector(`#${this.fieldId}`) || form.querySelector(`[name="${this.fieldName}"]`);
  }
  if (!honeypotField) {
    _log("warn", "Campo honeypot nao encontrado no form");
    this._metrics.passed++;
    return { valid: true, isBot: false, reason: "field_not_found" };
  }
  const value = (honeypotField.value || "").trim();
  if (value.length > 0) {
    this._metrics.botsDetected++;
    _log("warn", "BOT DETECTADO - Honeypot preenchido", { fieldValue: value.substring(0, 20) });
    return { valid: false, isBot: true, reason: "honeypot_filled", fieldValue: value };
  }
  this._metrics.passed++;
  _log("info", "Honeypot check passed");
  return { valid: true, isBot: false };
};
HoneypotValidator.prototype.reset = (form) => {
  if (!form || !form.querySelector) return;
  const honeypotField = form.querySelector('[data-honeypot="true"]');
  if (honeypotField) honeypotField.value = "";
};
HoneypotValidator.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, fieldName: this.fieldName, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() };
};
HoneypotValidator.prototype.healthCheck = function() {
  const logger = _getPort("logger");
  const checks = { enabled: this.enabled, lowBotRate: this._metrics.checks === 0 || this._metrics.botsDetected / this._metrics.checks < 0.5, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
function getHoneypotFieldHTML(config) {
  const validator = new HoneypotValidator(config);
  return validator.getFieldHTML();
}
var honeypot_default = HoneypotValidator;
export {
  HoneypotValidator,
  MODULE_ID,
  VERSION,
  honeypot_default as default,
  getHoneypotFieldHTML,
  getPorts,
  injectPorts
};
