// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-06-utils-logger
// PURPOSE: Panel-06 - Logger Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setDebug() — exported function
//   getLogs() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
export const MODULE_ID = 'panels-panel-06-utils-logger';
export const VERSION = '9.3.0-P2-ENTERPRISE';
let _debug = false; let _logBuffer: Record<string, unknown>[] = [];
export class Logger {
  [key: string]: any;
  constructor(panelId: string, version: string) { this.panelId = panelId; this.version = version; this.traceId = `${panelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
  log(level: string, event: string, data: Record<string, unknown>) { data = data || {}; const entry: Record<string, unknown> = { level, event, panelId: this.panelId, version: this.version, traceId: this.traceId, timestamp: new Date().toISOString() }; Object.keys(data).forEach(k => { entry[k] = data[k]; }); _logBuffer.push(entry); if (_logBuffer.length > 50) _logBuffer.shift(); if (_debug || level === 'error' || level === 'warn') { const msg = `[${this.panelId}] ${event}`; if (level === 'error') console.log(`%c[ERROR]%c ${msg}`, 'color:#ef4444;font-weight:bold', 'color:inherit', entry); else if (level === 'warn') console.log(`%c[WARN]%c ${msg}`, 'color:#f59e0b;font-weight:bold', 'color:inherit', entry); } }
  debug(event: string, data?: Record<string, unknown>) { this.log('debug', event, data || {}); }
  info(event: string, data?: Record<string, unknown>) { this.log('info', event, data || {}); }
  warn(event: string, data?: Record<string, unknown>) { this.log('warn', event, data || {}); }
  error(event: string, data?: Record<string, unknown>) { this.log('error', event, data || {}); }
}
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getLogs() { return [..._logBuffer]; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { loggerReady: true }, timestamp: new Date().toISOString() }; }
export default Logger;
