// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.1-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10.utils.logger
// PURPOSE: Panel-10 Logger Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   Logger() — exported function
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

export const MODULE_ID = 'panel-10.utils.logger';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

function Logger(this: any, panelId: string, version: string) { this.panelId = panelId; this.version = version || '1.0.0'; this.traceId = `${panelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; this._debugEnabled = null; this._buffer = []; this._maxBuffer = 50; _initPorts(); }

Logger.prototype._isDebugEnabled = function() { if (this._debugEnabled !== null) return this._debugEnabled; try { const cfg = _getPort('config'); if (cfg?.app?.debug === true) { this._debugEnabled = true; return true; } if (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') { this._debugEnabled = true; return true; } if (cfg?.debugMode === true) { this._debugEnabled = true; return true; } } catch (e) {} this._debugEnabled = false; return false; };

Logger.prototype._log = function(level: string, event: string, data: Record<string, unknown> = {}) { const entry = { level, event, panelId: this.panelId, version: this.version, traceId: this.traceId, timestamp: new Date().toISOString(), ...data }; this._buffer.push(entry); if (this._buffer.length > this._maxBuffer) this._buffer.shift(); if (level === 'debug' && !this._isDebugEnabled()) return; const globalLogger = _getPort('logger'); if (globalLogger?.[level]) globalLogger[level](`[${this.panelId}]`, event, data); };

Logger.prototype.debug = function(event: string, data?: Record<string, unknown>) { this._log('debug', event, data); };
Logger.prototype.info = function(event: string, data?: Record<string, unknown>) { this._log('info', event, data); };
Logger.prototype.warn = function(event: string, data?: Record<string, unknown>) { this._log('warn', event, data); };
Logger.prototype.error = function(event: string, data?: Record<string, unknown>) { this._log('error', event, data); };
Logger.prototype.getBuffer = function() { return this._buffer.slice(); };
Logger.prototype.clearBuffer = function() { this._buffer = []; };
Logger.prototype.getLastEntries = function(count: number) { return this._buffer.slice(-(count || 10)); };
Logger.prototype.setTraceId = function(traceId: string) { this.traceId = traceId; };
Logger.prototype.getTraceId = function() { return this.traceId; };

export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });
export const info = () => ({ moduleId: MODULE_ID, version: VERSION });

export { Logger };
export default Logger;
