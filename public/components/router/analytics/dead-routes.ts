// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.analytics.dead-routes
// PURPOSE: Dead Route Detector v1.2.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   DeadRouteDetector — exported value
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
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.2.0-P17WI';
const MODULE_ID = 'router.analytics.dead-routes';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown>) { if (!ctx) ctx = {}; const logger = _getPort('logger'); if (!logger || typeof logger[level] !== 'function') return; ctx.component = MODULE_ID; logger[level](msg, ctx); }

const _accessedRoutes = new Map();
let _declaredRoutes = new Set();
let _startTime = Date.now();

const DeadRouteDetector = {
  recordAccess(path: string, routeId: string) { const existing = _accessedRoutes.get(path); if (existing) { existing.count++; existing.lastAccess = Date.now(); } else { _accessedRoutes.set(path, { path, routeId: routeId || null, count: 1, firstAccess: Date.now(), lastAccess: Date.now() }); } },
  setDeclaredRoutes(routes: Record<string, unknown>) { _declaredRoutes = new Set(Object.keys(routes)); _log('info', 'Declared routes registered', { count: _declaredRoutes.size }); },
  addDeclaredRoute(path: string) { _declaredRoutes.add(path); },
  getDeadRoutes() { const dead: string[] = []; _declaredRoutes.forEach(path => { if (!_accessedRoutes.has(path)) dead.push(path as string); }); return dead.sort(); },
  getLowAccessRoutes(threshold: number) { if (!threshold) threshold = 5; const low: Record<string, unknown>[] = []; _declaredRoutes.forEach(path => { const access = _accessedRoutes.get(path); if (!access || access.count < threshold) { low.push({ path, count: access ? access.count : 0, lastAccess: access ? access.lastAccess : null }); } }); return low.sort((a, b) => (a.count as number) - (b.count as number)); },
  getUndeclaredAccessed() { const undeclared: Record<string, unknown>[] = []; _accessedRoutes.forEach((data, path) => { if (!_declaredRoutes.has(path)) { undeclared.push(Object.assign({ path }, data)); } }); return undeclared.sort((a, b) => (b.count as number) - (a.count as number)); },
  getTopRoutes(n: number) { if (!n) n = 20; return Array.from(_accessedRoutes.values()).sort((a, b) => (b.count as number) - (a.count as number)).slice(0, n); },

  // @ts-expect-error TS migration - TS2362, TS2363
  getStaleRoutes(days: number) { if (!days) days = 30; const threshold = Date.now() - (days * 24 * 60 * 60 * 1000); const stale: Record<string, unknown>[] = []; _accessedRoutes.forEach((data, path) => { if (data.lastAccess < threshold) { stale.push({ path, count: data.count, lastAccess: new Date(data.lastAccess).toISOString(), daysSinceAccess: Math.floor((Date.now() - data.lastAccess) / (24 * 60 * 60 * 1000)) }); } }); return stale.sort((a, b) => new Date(a.lastAccess) - new Date(b.lastAccess)); },
  analyze() { const declared = _declaredRoutes.size; const accessed = _accessedRoutes.size; const dead = this.getDeadRoutes(); const undeclared = this.getUndeclaredAccessed(); const uptimeDays = (Date.now() - _startTime) / (24 * 60 * 60 * 1000); return { summary: { declaredRoutes: declared, accessedRoutes: accessed, deadRoutes: dead.length, undeclaredAccessed: undeclared.length, coveragePercent: declared > 0 ? `${((accessed / declared) * 100).toFixed(2)}%` : '0%', uptimeDays: uptimeDays.toFixed(2) }, deadRoutes: dead, lowAccessRoutes: this.getLowAccessRoutes(3), undeclaredAccessed: undeclared.slice(0, 20), topRoutes: this.getTopRoutes(10), staleRoutes: this.getStaleRoutes(7) }; },
  generateReport() { const analysis = this.analyze(); return ['═══════════════════════════════════════════════════════════════', '           DEAD ROUTE DETECTOR - ANALYSIS REPORT', '═══════════════════════════════════════════════════════════════', '', '📊 SUMMARY', `   Declared Routes: ${analysis.summary.declaredRoutes}`, `   Accessed Routes: ${analysis.summary.accessedRoutes}`, `   Dead Routes: ${analysis.summary.deadRoutes}`, `   Coverage: ${analysis.summary.coveragePercent}`, `   Uptime: ${analysis.summary.uptimeDays} days`, '', '💀 DEAD ROUTES (never accessed):'].concat(analysis.deadRoutes.map((r: string) => `   - ${r}`)).concat(['', '🔥 TOP ROUTES:']).concat(analysis.topRoutes.map((r: Record<string, unknown>) => `   - ${r.path} (${r.count}x)`)).concat(['', '═══════════════════════════════════════════════════════════════']).join('\n'); },
  clear() { _accessedRoutes.clear(); _startTime = Date.now(); },
  getStatus() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), declaredRoutes: _declaredRoutes.size, accessedRoutes: _accessedRoutes.size, deadRoutes: this.getDeadRoutes().length, uptimeHours: ((Date.now() - _startTime) / (60 * 60 * 1000)).toFixed(2) }; },
  healthCheck() { const deadCount = this.getDeadRoutes().length; const total = _declaredRoutes.size; const deadPercent = total > 0 ? (deadCount / total) : 0; return { status: deadPercent < 0.3 ? 'HEALTHY' : (deadPercent < 0.5 ? 'WARNING' : 'CRITICAL'), moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { deadRoutePercent: `${(deadPercent * 100).toFixed(2)}%`, trackingActive: true } }; }
};

export { DeadRouteDetector, VERSION, MODULE_ID, injectPorts, getPorts };
export default DeadRouteDetector;
