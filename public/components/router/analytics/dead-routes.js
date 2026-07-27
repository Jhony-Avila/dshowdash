import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.analytics.dead-routes";
const hasWindow = typeof window !== "undefined";
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
function _log(level, msg, ctx) {
  if (!ctx) ctx = {};
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  ctx.component = MODULE_ID;
  logger[level](msg, ctx);
}
const _accessedRoutes = /* @__PURE__ */ new Map();
let _declaredRoutes = /* @__PURE__ */ new Set();
let _startTime = Date.now();
const DeadRouteDetector = {
  recordAccess(path, routeId) {
    const existing = _accessedRoutes.get(path);
    if (existing) {
      existing.count++;
      existing.lastAccess = Date.now();
    } else {
      _accessedRoutes.set(path, { path, routeId: routeId || null, count: 1, firstAccess: Date.now(), lastAccess: Date.now() });
    }
  },
  setDeclaredRoutes(routes) {
    _declaredRoutes = new Set(Object.keys(routes));
    _log("info", "Declared routes registered", { count: _declaredRoutes.size });
  },
  addDeclaredRoute(path) {
    _declaredRoutes.add(path);
  },
  getDeadRoutes() {
    const dead = [];
    _declaredRoutes.forEach((path) => {
      if (!_accessedRoutes.has(path)) dead.push(path);
    });
    return dead.sort();
  },
  getLowAccessRoutes(threshold) {
    if (!threshold) threshold = 5;
    const low = [];
    _declaredRoutes.forEach((path) => {
      const access = _accessedRoutes.get(path);
      if (!access || access.count < threshold) {
        low.push({ path, count: access ? access.count : 0, lastAccess: access ? access.lastAccess : null });
      }
    });
    return low.sort((a, b) => a.count - b.count);
  },
  getUndeclaredAccessed() {
    const undeclared = [];
    _accessedRoutes.forEach((data, path) => {
      if (!_declaredRoutes.has(path)) {
        undeclared.push(Object.assign({ path }, data));
      }
    });
    return undeclared.sort((a, b) => b.count - a.count);
  },
  getTopRoutes(n) {
    if (!n) n = 20;
    return Array.from(_accessedRoutes.values()).sort((a, b) => b.count - a.count).slice(0, n);
  },
  // @ts-expect-error TS migration - TS2362, TS2363
  getStaleRoutes(days) {
    if (!days) days = 30;
    const threshold = Date.now() - days * 24 * 60 * 60 * 1e3;
    const stale = [];
    _accessedRoutes.forEach((data, path) => {
      if (data.lastAccess < threshold) {
        stale.push({ path, count: data.count, lastAccess: new Date(data.lastAccess).toISOString(), daysSinceAccess: Math.floor((Date.now() - data.lastAccess) / (24 * 60 * 60 * 1e3)) });
      }
    });
    return stale.sort((a, b) => new Date(a.lastAccess) - new Date(b.lastAccess));
  },
  analyze() {
    const declared = _declaredRoutes.size;
    const accessed = _accessedRoutes.size;
    const dead = this.getDeadRoutes();
    const undeclared = this.getUndeclaredAccessed();
    const uptimeDays = (Date.now() - _startTime) / (24 * 60 * 60 * 1e3);
    return { summary: { declaredRoutes: declared, accessedRoutes: accessed, deadRoutes: dead.length, undeclaredAccessed: undeclared.length, coveragePercent: declared > 0 ? `${(accessed / declared * 100).toFixed(2)}%` : "0%", uptimeDays: uptimeDays.toFixed(2) }, deadRoutes: dead, lowAccessRoutes: this.getLowAccessRoutes(3), undeclaredAccessed: undeclared.slice(0, 20), topRoutes: this.getTopRoutes(10), staleRoutes: this.getStaleRoutes(7) };
  },
  generateReport() {
    const analysis = this.analyze();
    return ["\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550", "           DEAD ROUTE DETECTOR - ANALYSIS REPORT", "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550", "", "\u{1F4CA} SUMMARY", `   Declared Routes: ${analysis.summary.declaredRoutes}`, `   Accessed Routes: ${analysis.summary.accessedRoutes}`, `   Dead Routes: ${analysis.summary.deadRoutes}`, `   Coverage: ${analysis.summary.coveragePercent}`, `   Uptime: ${analysis.summary.uptimeDays} days`, "", "\u{1F480} DEAD ROUTES (never accessed):"].concat(analysis.deadRoutes.map((r) => `   - ${r}`)).concat(["", "\u{1F525} TOP ROUTES:"]).concat(analysis.topRoutes.map((r) => `   - ${r.path} (${r.count}x)`)).concat(["", "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550"]).join("\n");
  },
  clear() {
    _accessedRoutes.clear();
    _startTime = Date.now();
  },
  getStatus() {
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), declaredRoutes: _declaredRoutes.size, accessedRoutes: _accessedRoutes.size, deadRoutes: this.getDeadRoutes().length, uptimeHours: ((Date.now() - _startTime) / (60 * 60 * 1e3)).toFixed(2) };
  },
  healthCheck() {
    const deadCount = this.getDeadRoutes().length;
    const total = _declaredRoutes.size;
    const deadPercent = total > 0 ? deadCount / total : 0;
    return { status: deadPercent < 0.3 ? "HEALTHY" : deadPercent < 0.5 ? "WARNING" : "CRITICAL", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { deadRoutePercent: `${(deadPercent * 100).toFixed(2)}%`, trackingActive: true } };
  }
};
var dead_routes_default = DeadRouteDetector;
export {
  DeadRouteDetector,
  MODULE_ID,
  VERSION,
  dead_routes_default as default,
  getPorts,
  injectPorts
};
