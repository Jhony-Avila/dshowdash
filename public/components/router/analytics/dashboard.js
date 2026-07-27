import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { RouterMetrics } from "./metrics.js";
import { RouterAudit } from "./audit.js";
import { DeadRouteDetector } from "./dead-routes.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.analytics.dashboard";
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
const RouterAnalytics = {
  getDashboard() {
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: VERSION,
      performance: { global: RouterMetrics.getGlobal(), byType: RouterMetrics.getAll(), percentiles: RouterMetrics.getPercentiles(), histogram: RouterMetrics.getHistogram(), slowestRoutes: RouterMetrics.getSlowestRoutes(5) },
      audit: { stats: RouterAudit.getStats(), recentNavigations: RouterAudit.getLast(10) },
      coverage: { summary: DeadRouteDetector.analyze().summary, deadRoutes: DeadRouteDetector.getDeadRoutes().slice(0, 10), topRoutes: DeadRouteDetector.getTopRoutes(10) },
      health: { metrics: RouterMetrics.healthCheck(), audit: RouterAudit.healthCheck(), deadRoutes: DeadRouteDetector.healthCheck() },
      portsInitialized: Ports.isInitialized()
    };
  },
  getSummary() {
    const metrics = RouterMetrics.getGlobal();
    const audit = RouterAudit.getStats();
    const coverage = DeadRouteDetector.analyze().summary;
    return { totalNavigations: metrics.totalResolves, avgResolveTime: metrics.avgTime, successRate: audit.successRate, routeCoverage: coverage.coveragePercent, deadRoutes: coverage.deadRoutes, slowResolves: metrics.slowPercentage };
  },
  getTopRoutes(n) {
    if (!n) n = 20;
    return DeadRouteDetector.getTopRoutes(n);
  },
  getProblemRoutes() {
    return { dead: DeadRouteDetector.getDeadRoutes(), slow: RouterMetrics.getSlowestRoutes(10), stale: DeadRouteDetector.getStaleRoutes(7), lowAccess: DeadRouteDetector.getLowAccessRoutes(3) };
  },
  getTimeline(minutes) {
    if (!minutes) minutes = 60;
    const since = Date.now() - minutes * 60 * 1e3;
    return RouterAudit.getTrail({ from: since, order: "asc" });
  },
  exportReport(format) {
    if (!format) format = "json";
    const data = { generatedAt: (/* @__PURE__ */ new Date()).toISOString(), dashboard: this.getDashboard(), problemRoutes: this.getProblemRoutes(), deadRouteReport: DeadRouteDetector.generateReport() };
    if (format === "text") {
      return ["\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550", "              ROUTER ANALYTICS REPORT", "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550", `Generated: ${data.generatedAt}`, "", "SUMMARY:", JSON.stringify(this.getSummary(), null, 2), "", data.deadRouteReport].join("\n");
    }
    return JSON.stringify(data, null, 2);
  },
  resetAll() {
    RouterMetrics.reset();
    RouterAudit.clear();
    DeadRouteDetector.clear();
    _log("info", "All analytics reset");
  },
  getStatus() {
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), modules: { metrics: RouterMetrics.getStatus(), audit: RouterAudit.getStatus(), deadRoutes: DeadRouteDetector.getStatus() } };
  },
  healthCheck() {
    const metricsHealth = RouterMetrics.healthCheck();
    const auditHealth = RouterAudit.healthCheck();
    const deadHealth = DeadRouteDetector.healthCheck();
    const statuses = [metricsHealth.status, auditHealth.status, deadHealth.status];
    let overall = "HEALTHY";
    if (statuses.indexOf("CRITICAL") !== -1 || statuses.indexOf("UNHEALTHY") !== -1) overall = "UNHEALTHY";
    else if (statuses.indexOf("DEGRADED") !== -1 || statuses.indexOf("WARNING") !== -1) overall = "DEGRADED";
    return { status: overall, moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), modules: { metrics: metricsHealth, audit: auditHealth, deadRoutes: deadHealth } };
  }
};
var dashboard_default = RouterAnalytics;
export {
  MODULE_ID,
  RouterAnalytics,
  VERSION,
  dashboard_default as default,
  getPorts,
  injectPorts
};
