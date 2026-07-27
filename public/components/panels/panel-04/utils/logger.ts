// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.1-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04.utils.logger
// PURPOSE: Panel-04 Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   TELEMETRY_INTENTS from /core/runtime/events/catalog/telemetry.events.js
//   PAINEL_ID, VERSION as PANEL_VERSION from ../core/constants.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   Logger() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_EVENTS.ERROR
//   TELEMETRY_INTENTS.TRACK
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import { PAINEL_ID, VERSION as PANEL_VERSION } from '../core/constants.js';

export const MODULE_ID = 'panel-04.utils.logger';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

function Logger(this: any, panelId = PAINEL_ID, version = PANEL_VERSION) {
  this.panelId = panelId;
  this.version = version;
  this.prefix = `[${panelId}]`;
  _initPorts();
  const cfg = _getPort('config');
  this.debugEnabled = cfg?.app?.debug ? true : false;
}

Logger.prototype._formatMessage = function(level: string, action: string, data: Record<string, unknown> = {}) { return { timestamp: new Date().toISOString(), level, panelId: this.panelId, version: this.version, action, ...data }; };
Logger.prototype._shouldLog = function(level: string) { if (level === 'debug' && !this.debugEnabled) return false; return true; };

Logger.prototype.debug = function(action: string, data: Record<string, unknown> = {}) { if (!this._shouldLog('debug')) return; const logger = _getPort('logger'); if (logger?.debug) logger.debug(this.prefix, action, data); };
Logger.prototype.info = function(action: string, data: Record<string, unknown> = {}) { if (!this._shouldLog('info')) return; const logger = _getPort('logger'); if (logger?.info) logger.info(this.prefix, action, data); };
Logger.prototype.warn = function(action: string, data: Record<string, unknown> = {}) { if (!this._shouldLog('warn')) return; const logger = _getPort('logger'); if (logger?.warn) logger.warn(this.prefix, action, data); };
Logger.prototype.error = function(action: string, data: Record<string, unknown> = {}) { if (!this._shouldLog('error')) return; const logger = _getPort('logger'); if (logger?.error) logger.error(this.prefix, action, data); const eventBus = _getPort('eventBus'); if (eventBus?.emit) eventBus.emit(PANEL_EVENTS.ERROR, { panelId: this.panelId, action, timestamp: Date.now(), source: MODULE_ID, ...data }); };

Logger.prototype.track = function(event: string, data: Record<string, unknown> = {}) { const payload = this._formatMessage('track', event, data); const logger = _getPort('logger'); if (this.debugEnabled && logger?.debug) logger.debug(this.prefix, 'track:', event, data); const eventBus = _getPort('eventBus'); if (eventBus?.emit) eventBus.emit(TELEMETRY_INTENTS.TRACK, { moduleId: MODULE_ID, timestamp: Date.now(), source: MODULE_ID, ...payload }); return payload; };
Logger.prototype.getInfo = () => ({
  moduleId: MODULE_ID,
  version: VERSION
});
Logger.prototype.healthCheck = function() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, debugEnabled: this.debugEnabled }; };

export { Logger };
export default Logger;
