// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator.utils.logger
// PURPOSE: Orchestrator Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   OrchestratorLogger() — exported function
//   logger — exported value
//   LOG_LEVELS — exported value
//   LOG_COLORS — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-orchestrator.utils.logger';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debugEnabled = () => { const cfg = _getPort('config'); return cfg?.app?.debug ? true : false; };

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, CRITICAL: 4 };
const LOG_COLORS = { DEBUG: '#6c757d', INFO: '#0d6efd', WARN: '#ffc107', ERROR: '#dc3545', CRITICAL: '#721c24' };

function OrchestratorLogger(this: any) { this.namespace = 'Orchestrator'; this.level = LOG_LEVELS.DEBUG; this.history = []; this.maxHistory = 500; this.enabled = true; }

OrchestratorLogger.prototype.getVersion = () => VERSION;
OrchestratorLogger.prototype.setLevel = function(level: string) { if ((LOG_LEVELS as Record<string, number>)[level] !== undefined) this.level = (LOG_LEVELS as Record<string, number>)[level]; };
OrchestratorLogger.prototype.setEnabled = function(enabled: boolean) { this.enabled = !!enabled; };
OrchestratorLogger.prototype.setDebug = function(enabled: boolean) { this.setEnabled(enabled); };
OrchestratorLogger.prototype._shouldLog = function(level: string) { return this.enabled && (LOG_LEVELS as Record<string, number>)[level] >= this.level; };

OrchestratorLogger.prototype._addToHistory = function(level: string, message: string, data: unknown) { const entry = { level, message, data, timestamp: Date.now(), time: new Date().toISOString() }; this.history.push(entry); if (this.history.length > this.maxHistory) this.history.shift(); return entry; };

OrchestratorLogger.prototype._formatMessage = function(level: string, message: string) { return `[${this.namespace}][${level}] ${message}`; };

OrchestratorLogger.prototype._log = function(level: string, message: string, data: unknown = null) {
  this._addToHistory(level, message, data);
  if (!this._shouldLog(level)) return;
  _initPorts();
  if (!_debugEnabled() && level !== 'ERROR' && level !== 'CRITICAL' && level !== 'WARN') return;
  const formattedMessage: string = this._formatMessage(level, message);
  const logger = _getPort('logger');
  if (logger) {
    if (level === 'ERROR' || level === 'CRITICAL') { if (logger.error) logger.error(`[${MODULE_ID}]`, formattedMessage, data || ''); }
    else if (level === 'WARN') { if (logger.warn) logger.warn(`[${MODULE_ID}]`, formattedMessage, data || ''); }
    else { if (logger.debug) logger.debug(`[${MODULE_ID}]`, formattedMessage, data || ''); }
  }
};

OrchestratorLogger.prototype.debug = function(message: string, data?: unknown) { this._log('DEBUG', message, data); };
OrchestratorLogger.prototype.info = function(message: string, data?: unknown) { this._log('INFO', message, data); };
OrchestratorLogger.prototype.warn = function(message: string, data?: unknown) { this._log('WARN', message, data); };
OrchestratorLogger.prototype.error = function(message: string, data?: unknown) { this._log('ERROR', message, data); };
OrchestratorLogger.prototype.critical = function(message: string, data?: unknown) { this._log('CRITICAL', message, data); };
OrchestratorLogger.prototype.getHistory = function() { return this.history.slice(); };
OrchestratorLogger.prototype.getRecentLogs = function(count: number = 50) { return this.history.slice(-count); };
OrchestratorLogger.prototype.getLogsByLevel = function(level: string) { return this.history.filter((entry: { level: string }) => entry.level === level); };
OrchestratorLogger.prototype.clearHistory = function() { this.history = []; };

OrchestratorLogger.prototype.getStats = function() { const counts: Record<string, number> = {}; Object.keys(LOG_LEVELS).forEach((level) => { counts[level] = this.history.filter((e: { level: string }) => e.level === level).length; }); return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, level: Object.keys(LOG_LEVELS).find((k) => (LOG_LEVELS as Record<string, number>)[k] === this.level), historySize: this.history.length, counts, portsInitialized: Ports.isInitialized() }; };

// @ts-expect-error strict migration — TS7009
const logger = new OrchestratorLogger();

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() });
export const healthCheck = () => { const loggerPort = _getPort('logger'); return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { loggerReady: !!loggerPort, portsInitialized: Ports.isInitialized() }, timestamp: Date.now() }; };

export { OrchestratorLogger, logger, LOG_LEVELS, LOG_COLORS };
export default logger;
