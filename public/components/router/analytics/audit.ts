// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.analytics.audit
// PURPOSE: Router Audit Trail v1.2.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   RouterAudit — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.2.0-P17WI';
const MODULE_ID = 'router.analytics.audit';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown>) {
  if (!ctx) ctx = {};
  const logger = _getPort('logger');
  if (!logger || typeof logger[level] !== 'function') return;
  ctx.component = MODULE_ID;
  logger[level](msg, ctx);
}

const CONFIG = { enabled: true, maxEntries: 1000, persist: false, storageKey: 'router_audit_trail' };
let _trail: Record<string, unknown>[] = [];
let _sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

function _getClientInfo() {
  if (!hasWindow) return {};
  return { userAgent: navigator.userAgent || 'unknown', language: navigator.language || 'unknown', platform: navigator.platform || 'unknown', screenWidth: window.screen ? window.screen.width : null, screenHeight: window.screen ? window.screen.height : null, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, referrer: document.referrer || null };
}

const RouterAudit = {
  log(entry: Record<string, unknown>) {
    if (!CONFIG.enabled) return;
    const auditEntry = { id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, timestamp: Date.now(), isoTime: new Date().toISOString(), sessionId: _sessionId, fromPath: entry.from || null, toPath: entry.to, routeId: entry.routeId || null, matchType: entry.matchType || null, success: entry.success !== false, blocked: entry.blocked || false, blockedBy: entry.blockedBy || null, redirect: entry.redirect || null, resolveTime: entry.resolveTime || null, guardTime: entry.guardTime || null, totalTime: entry.totalTime || null, client: _getClientInfo(), userId: entry.userId || null, userLevel: entry.userLevel || null, action: entry.action || 'navigate', metadata: entry.metadata || null };
    _trail.push(auditEntry);
    if (_trail.length > CONFIG.maxEntries) { _trail = _trail.slice(-CONFIG.maxEntries); }
    if (CONFIG.persist) { this._persist(); }
    _log('info', 'Navigation audited', { path: auditEntry.toPath, success: auditEntry.success, time: auditEntry.totalTime });
    return auditEntry;
  },
  logSuccess(from: string, to: string, options: Record<string, unknown>) { if (!options) options = {}; return this.log(Object.assign({ from, to, success: true }, options)); },
  logBlock(from: string, to: string, blockedBy: string, options: Record<string, unknown>) { if (!options) options = {}; return this.log(Object.assign({ from, to, success: false, blocked: true, blockedBy }, options)); },
  logRedirect(from: string, to: string, redirect: string, options: Record<string, unknown>) { if (!options) options = {}; return this.log(Object.assign({ from, to, redirect, action: 'redirect' }, options)); },
  logError(from: string, to: string, error: unknown, options: Record<string, unknown>) { if (!options) options = {}; return this.log(Object.assign({ from, to, success: false, action: 'error', metadata: { error } }, options)); },
  getTrail(options: Record<string, unknown>) {
    if (!options) options = {};
    let result = _trail.slice();
    if (options.from) { const fromTime = new Date(String(options.from)).getTime(); result = result.filter(e => (e.timestamp as number) >= fromTime); }
    if (options.to) { const toTime = new Date(String(options.to)).getTime(); result = result.filter(e => (e.timestamp as number) <= toTime); }
    if (options.path) { result = result.filter(e => e.toPath && (e.toPath as string).indexOf(options.path as string) !== -1); }
    if (options.success !== undefined) { result = result.filter(e => e.success === options.success); }
    if (options.blocked !== undefined) { result = result.filter(e => e.blocked === options.blocked); }
    if (options.userId) { result = result.filter(e => e.userId === options.userId); }
    if (options.sessionId) { result = result.filter(e => e.sessionId === options.sessionId); }
    if (options.limit) { result = result.slice(-options.limit); }
    if (options.order === 'asc') { result.sort((a, b) => (a.timestamp as number) - (b.timestamp as number)); } else { result.sort((a, b) => (b.timestamp as number) - (a.timestamp as number)); }
    return result;
  },
  getLast(n: number) { if (!n) n = 10; return this.getTrail({ limit: n, order: 'desc' }); },
  getStats() {
    const total = _trail.length;
    const successful = _trail.filter(e => e.success).length;
    const blocked = _trail.filter(e => e.blocked).length;
    const redirects = _trail.filter(e => e.redirect).length;
    const pathCounts: Record<string, number> = {};
    _trail.forEach(e => { if (e.toPath) { pathCounts[e.toPath as string] = (pathCounts[e.toPath as string] || 0) + 1; } });
    const topPaths = Object.keys(pathCounts).map(path => ({
      path,
      count: pathCounts[path]
    })).sort((a, b) => (b.count as number) - (a.count as number)).slice(0, 10);
    const times = _trail.filter(e => e.totalTime).map(e => e.totalTime as number);
    const avgTime = times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0;
    const sessions: Record<string, boolean> = {};
    _trail.forEach(e => { sessions[e.sessionId as string] = true; });
    return { total, successful, blocked, redirects, successRate: total > 0 ? `${((successful / total) * 100).toFixed(2)}%` : '0%', avgNavigationTime: `${avgTime.toFixed(2)}ms`, topPaths, uniqueSessions: Object.keys(sessions).length, timeRange: { first: _trail[0] ? _trail[0].isoTime : null, last: _trail[_trail.length - 1] ? _trail[_trail.length - 1].isoTime : null } };
  },
  export(format: string) { if (!format) format = 'json'; if (format === 'csv') { const headers = ['timestamp', 'sessionId', 'fromPath', 'toPath', 'success', 'blocked', 'totalTime']; const rows = _trail.map(e => headers.map(h => (e as Record<string, unknown>)[h] !== undefined ? (e as Record<string, unknown>)[h] : '').join(',')); return [headers.join(',')].concat(rows).join('\n'); } return JSON.stringify(_trail, null, 2); },
  clear() { const count = _trail.length; _trail = []; if (CONFIG.persist) { try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {} } return count; },
  getSessionId() { return _sessionId; },
  newSession() { _sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; return _sessionId; },
  configure(options: Record<string, unknown>) { Object.assign(CONFIG, options); },
  enable() { CONFIG.enabled = true; },
  disable() { CONFIG.enabled = false; },
  isEnabled() { return CONFIG.enabled; },
  _persist() { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(_trail.slice(-100))); } catch (e) {} },
  _restore() { try { const saved = localStorage.getItem(CONFIG.storageKey); if (saved) _trail = JSON.parse(saved); } catch (e) {} },
  getStatus() { return { version: VERSION, moduleId: MODULE_ID, enabled: CONFIG.enabled, sessionId: _sessionId, entryCount: _trail.length, maxEntries: CONFIG.maxEntries, stats: this.getStats(), portsInitialized: Ports.isInitialized() }; },
  healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { enabled: CONFIG.enabled, hasCapacity: _trail.length < CONFIG.maxEntries, entryCount: _trail.length } }; }
};

export { RouterAudit, VERSION, MODULE_ID, injectPorts, getPorts };
export default RouterAudit;
