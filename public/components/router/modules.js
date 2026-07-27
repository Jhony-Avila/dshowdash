import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "router.modules";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
import { RouteCache } from "./cache/index.js";
import { ResolutionDebounce } from "./cache/debounce.js";
import { RouterHooks, HOOK_TYPES } from "./hooks/index.js";
import { RouterMiddleware } from "./middleware/index.js";
import { RouterMetrics } from "./analytics/metrics.js";
import { RouterAudit } from "./analytics/audit.js";
import { DeadRouteDetector } from "./analytics/dead-routes.js";
import { RouterAnalytics } from "./analytics/dashboard.js";
import { NavigationHistory } from "./navigation/history.js";
import { BreadcrumbGenerator } from "./navigation/breadcrumb.js";
import { DeepLinkResolver } from "./navigation/deep-link.js";
import { ScrollRestoration } from "./navigation/scroll.js";
import { RoutePreloader } from "./navigation/preload.js";
import { RouteTransitions, TRANSITION_TYPES } from "./navigation/transitions.js";
import { RouterCSRF } from "./security/csrf.js";
import { CircularCheck } from "./security/circular-check.js";
import { RouteSchemaValidator } from "./security/schema.js";
import { RouterErrorTracker, ERROR_TYPES, SEVERITY } from "./monitoring/error-tracker.js";
import { RealtimeMonitor } from "./monitoring/realtime.js";
import { MockRouterMode } from "./monitoring/mock-mode.js";
const RouterModules = { VERSION, async getStatus() {
  const modules = await Promise.all([import("./cache/index.js").then((m) => m.RouteCache.getStatus()).catch(() => null), import("./cache/debounce.js").then((m) => m.ResolutionDebounce.getStatus()).catch(() => null), import("./hooks/index.js").then((m) => m.RouterHooks.getStatus()).catch(() => null), import("./middleware/index.js").then((m) => m.RouterMiddleware.getStatus()).catch(() => null), import("./analytics/metrics.js").then((m) => m.RouterMetrics.getStatus()).catch(() => null), import("./analytics/audit.js").then((m) => m.RouterAudit.getStatus()).catch(() => null), import("./analytics/dead-routes.js").then((m) => m.DeadRouteDetector.getStatus()).catch(() => null), import("./analytics/dashboard.js").then((m) => m.RouterAnalytics.getStatus()).catch(() => null), import("./navigation/history.js").then((m) => m.NavigationHistory.getStatus()).catch(() => null), import("./navigation/breadcrumb.js").then((m) => m.BreadcrumbGenerator.getStatus()).catch(() => null), import("./navigation/deep-link.js").then((m) => m.DeepLinkResolver.getStatus()).catch(() => null), import("./navigation/scroll.js").then((m) => m.ScrollRestoration.getStatus()).catch(() => null), import("./navigation/preload.js").then((m) => m.RoutePreloader.getStatus()).catch(() => null), import("./navigation/transitions.js").then((m) => m.RouteTransitions.getStatus()).catch(() => null), import("./security/csrf.js").then((m) => m.RouterCSRF.getStatus()).catch(() => null), import("./security/circular-check.js").then((m) => m.CircularCheck.getStatus()).catch(() => null), import("./security/schema.js").then((m) => m.RouteSchemaValidator.getStatus()).catch(() => null), import("./monitoring/error-tracker.js").then((m) => m.RouterErrorTracker.getStatus()).catch(() => null), import("./monitoring/realtime.js").then((m) => m.RealtimeMonitor.getStatus()).catch(() => null), import("./monitoring/mock-mode.js").then((m) => m.MockRouterMode.getStatus()).catch(() => null)]);
  return { version: VERSION, timestamp: (/* @__PURE__ */ new Date()).toISOString(), modules: modules.filter(Boolean), portsInitialized: Ports.isInitialized() };
}, async healthCheck() {
  const checks = await Promise.all([import("./cache/index.js").then((m) => m.RouteCache.healthCheck()).catch(() => ({ status: "ERROR" })), import("./hooks/index.js").then((m) => m.RouterHooks.healthCheck()).catch(() => ({ status: "ERROR" })), import("./middleware/index.js").then((m) => m.RouterMiddleware.healthCheck()).catch(() => ({ status: "ERROR" })), import("./analytics/dashboard.js").then((m) => m.RouterAnalytics.healthCheck()).catch(() => ({ status: "ERROR" })), import("./security/csrf.js").then((m) => m.RouterCSRF.healthCheck()).catch(() => ({ status: "ERROR" })), import("./monitoring/error-tracker.js").then((m) => m.RouterErrorTracker.healthCheck()).catch(() => ({ status: "ERROR" }))]);
  const statuses = checks.map((c) => c.status);
  let overall = "HEALTHY";
  if (statuses.includes("ERROR") || statuses.includes("UNHEALTHY")) overall = "UNHEALTHY";
  else if (statuses.includes("DEGRADED") || statuses.includes("WARNING")) overall = "DEGRADED";
  return { status: overall, version: VERSION, timestamp: (/* @__PURE__ */ new Date()).toISOString(), checks, portsInitialized: Ports.isInitialized() };
}, list() {
  return [{ name: "RouteCache", path: "./cache/index.js", category: "cache" }, { name: "ResolutionDebounce", path: "./cache/debounce.js", category: "cache" }, { name: "RouterHooks", path: "./hooks/index.js", category: "hooks" }, { name: "RouterMiddleware", path: "./middleware/index.js", category: "middleware" }, { name: "RouterMetrics", path: "./analytics/metrics.js", category: "analytics" }, { name: "RouterAudit", path: "./analytics/audit.js", category: "analytics" }, { name: "DeadRouteDetector", path: "./analytics/dead-routes.js", category: "analytics" }, { name: "RouterAnalytics", path: "./analytics/dashboard.js", category: "analytics" }, { name: "NavigationHistory", path: "./navigation/history.js", category: "navigation" }, { name: "BreadcrumbGenerator", path: "./navigation/breadcrumb.js", category: "navigation" }, { name: "DeepLinkResolver", path: "./navigation/deep-link.js", category: "navigation" }, { name: "ScrollRestoration", path: "./navigation/scroll.js", category: "navigation" }, { name: "RoutePreloader", path: "./navigation/preload.js", category: "navigation" }, { name: "RouteTransitions", path: "./navigation/transitions.js", category: "navigation" }, { name: "RouterCSRF", path: "./security/csrf.js", category: "security" }, { name: "CircularCheck", path: "./security/circular-check.js", category: "security" }, { name: "RouteSchemaValidator", path: "./security/schema.js", category: "security" }, { name: "RouterErrorTracker", path: "./monitoring/error-tracker.js", category: "monitoring" }, { name: "RealtimeMonitor", path: "./monitoring/realtime.js", category: "monitoring" }, { name: "MockRouterMode", path: "./monitoring/mock-mode.js", category: "monitoring" }];
} };
var modules_default = RouterModules;
export {
  BreadcrumbGenerator,
  CircularCheck,
  DeadRouteDetector,
  DeepLinkResolver,
  ERROR_TYPES,
  HOOK_TYPES,
  MODULE_ID,
  MockRouterMode,
  NavigationHistory,
  RealtimeMonitor,
  ResolutionDebounce,
  RouteCache,
  RoutePreloader,
  RouteSchemaValidator,
  RouteTransitions,
  RouterAnalytics,
  RouterAudit,
  RouterCSRF,
  RouterErrorTracker,
  RouterHooks,
  RouterMetrics,
  RouterMiddleware,
  RouterModules,
  SEVERITY,
  ScrollRestoration,
  TRANSITION_TYPES,
  VERSION,
  modules_default as default,
  getPorts,
  injectPorts
};
