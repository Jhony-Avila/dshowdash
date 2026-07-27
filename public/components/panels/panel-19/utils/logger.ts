// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.1-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-19.utils.logger
// PURPOSE: Panel-19 - Logger Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   Logger() — exported function
//   LOG_LEVELS — exported value
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

export const MODULE_ID = 'panel-19.utils.logger';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function Logger(this: any, panelId: string, version: string, options: Record<string, unknown> = {}) { this.panelId = panelId; this.version = version; this.minLevel = options.minLevel || 'debug'; this.traceId = this.generateTraceId(); this.buffer = []; this.maxBuffer = 100; _initPorts(); }

Logger.prototype.generateTraceId = function() { return `${this.panelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; };
Logger.prototype.shouldLog = function(level: string) { return LOG_LEVELS[level as keyof typeof LOG_LEVELS] >= LOG_LEVELS[this.minLevel as keyof typeof LOG_LEVELS]; };
Logger.prototype.formatEntry = function(level: string, event: string, data: Record<string, unknown> = {}) { return { level, event, panelId: this.panelId, version: this.version, traceId: this.traceId, timestamp: new Date().toISOString(), ...data }; };

Logger.prototype.log = function(level: string, event: string, data?: Record<string, unknown>) { if (!this.shouldLog(level)) return; const entry = this.formatEntry(level, event, data); this.buffer.push(entry); if (this.buffer.length > this.maxBuffer) this.buffer.shift(); const globalLogger = _getPort('logger'); if (globalLogger) { const fn = globalLogger[level]; if (typeof fn === 'function') fn.call(globalLogger, `[${this.panelId}] ${event}`, entry); } };

Logger.prototype.debug = function(event: string, data?: Record<string, unknown>) { this.log('debug', event, data); };
Logger.prototype.info = function(event: string, data?: Record<string, unknown>) { this.log('info', event, data); };
Logger.prototype.warn = function(event: string, data?: Record<string, unknown>) { this.log('warn', event, data); };
Logger.prototype.error = function(event: string, data?: Record<string, unknown>) { this.log('error', event, data); };
Logger.prototype.getRecentLogs = function(count = 20) { return this.buffer.slice(-count); };
Logger.prototype.clearBuffer = function() { this.buffer = []; };
Logger.prototype.renewTraceId = function() { this.traceId = this.generateTraceId(); return this.traceId; };
Logger.prototype.getInfo = function() { return { panelId: this.panelId, version: this.version, traceId: this.traceId, minLevel: this.minLevel, bufferSize: this.buffer.length }; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export { Logger, LOG_LEVELS };
export default Logger;
