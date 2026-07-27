import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
import { PAINEL_ID, VERSION as PANEL_VERSION } from "../core/constants.js";
const MODULE_ID = "panel-04.utils.logger";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
function Logger(panelId = PAINEL_ID, version = PANEL_VERSION) {
  this.panelId = panelId;
  this.version = version;
  this.prefix = `[${panelId}]`;
  _initPorts();
  const cfg = _getPort("config");
  this.debugEnabled = cfg?.app?.debug ? true : false;
}
Logger.prototype._formatMessage = function(level, action, data = {}) {
  return { timestamp: (/* @__PURE__ */ new Date()).toISOString(), level, panelId: this.panelId, version: this.version, action, ...data };
};
Logger.prototype._shouldLog = function(level) {
  if (level === "debug" && !this.debugEnabled) return false;
  return true;
};
Logger.prototype.debug = function(action, data = {}) {
  if (!this._shouldLog("debug")) return;
  const logger = _getPort("logger");
  if (logger?.debug) logger.debug(this.prefix, action, data);
};
Logger.prototype.info = function(action, data = {}) {
  if (!this._shouldLog("info")) return;
  const logger = _getPort("logger");
  if (logger?.info) logger.info(this.prefix, action, data);
};
Logger.prototype.warn = function(action, data = {}) {
  if (!this._shouldLog("warn")) return;
  const logger = _getPort("logger");
  if (logger?.warn) logger.warn(this.prefix, action, data);
};
Logger.prototype.error = function(action, data = {}) {
  if (!this._shouldLog("error")) return;
  const logger = _getPort("logger");
  if (logger?.error) logger.error(this.prefix, action, data);
  const eventBus = _getPort("eventBus");
  if (eventBus?.emit) eventBus.emit(PANEL_EVENTS.ERROR, { panelId: this.panelId, action, timestamp: Date.now(), source: MODULE_ID, ...data });
};
Logger.prototype.track = function(event, data = {}) {
  const payload = this._formatMessage("track", event, data);
  const logger = _getPort("logger");
  if (this.debugEnabled && logger?.debug) logger.debug(this.prefix, "track:", event, data);
  const eventBus = _getPort("eventBus");
  if (eventBus?.emit) eventBus.emit(TELEMETRY_INTENTS.TRACK, { moduleId: MODULE_ID, timestamp: Date.now(), source: MODULE_ID, ...payload });
  return payload;
};
Logger.prototype.getInfo = () => ({
  moduleId: MODULE_ID,
  version: VERSION
});
Logger.prototype.healthCheck = function() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, debugEnabled: this.debugEnabled };
};
var logger_default = Logger;
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getPorts,
  injectPorts
};
