import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.analytics.audit";
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
const CONFIG = { enabled: true, maxEntries: 1e3, persist: false, storageKey: "router_audit_trail" };
let _trail = [];
let _sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
function _getClientInfo() {
  if (!hasWindow) return {};
  return { userAgent: navigator.userAgent || "unknown", language: navigator.language || "unknown", platform: navigator.platform || "unknown", screenWidth: window.screen ? window.screen.width : null, screenHeight: window.screen ? window.screen.height : null, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, referrer: document.referrer || null };
}
const RouterAudit = {
  log(entry) {
    if (!CONFIG.enabled) return;
    const auditEntry = { id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, timestamp: Date.now(), isoTime: (/* @__PURE__ */ new Date()).toISOString(), sessionId: _sessionId, fromPath: entry.from || null, toPath: entry.to, routeId: entry.routeId || null, matchType: entry.matchType || null, success: entry.success !== false, blocked: entry.blocked || false, blockedBy: entry.blockedBy || null, redirect: entry.redirect || null, resolveTime: entry.resolveTime || null, guardTime: entry.guardTime || null, totalTime: entry.totalTime || null, client: _getClientInfo(), userId: entry.userId || null, userLevel: entry.userLevel || null, action: entry.action || "navigate", metadata: entry.metadata || null };
    _trail.push(auditEntry);
    if (_trail.length > CONFIG.maxEntries) {
      _trail = _trail.slice(-CONFIG.maxEntries);
    }
    if (CONFIG.persist) {
      this._persist();
    }
    _log("info", "Navigation audited", { path: auditEntry.toPath, success: auditEntry.success, time: auditEntry.totalTime });
    return auditEntry;
  },
  logSuccess(from, to, options) {
    if (!options) options = {};
    return this.log(Object.assign({ from, to, success: true }, options));
  },
  logBlock(from, to, blockedBy, options) {
    if (!options) options = {};
    return this.log(Object.assign({ from, to, success: false, blocked: true, blockedBy }, options));
  },
  logRedirect(from, to, redirect, options) {
    if (!options) options = {};
    return this.log(Object.assign({ from, to, redirect, action: "redirect" }, options));
  },
  logError(from, to, error, options) {
    if (!options) options = {};
    return this.log(Object.assign({ from, to, success: false, action: "error", metadata: { error } }, options));
  },
  getTrail(options) {
    if (!options) options = {};
    let result = _trail.slice();
    if (options.from) {
      const fromTime = new Date(String(options.from)).getTime();
      result = result.filter((e) => e.timestamp >= fromTime);
    }
    if (options.to) {
      const toTime = new Date(String(options.to)).getTime();
      result = result.filter((e) => e.timestamp <= toTime);
    }
    if (options.path) {
      result = result.filter((e) => e.toPath && e.toPath.indexOf(options.path) !== -1);
    }
    if (options.success !== void 0) {
      result = result.filter((e) => e.success === options.success);
    }
    if (options.blocked !== void 0) {
      result = result.filter((e) => e.blocked === options.blocked);
    }
    if (options.userId) {
      result = result.filter((e) => e.userId === options.userId);
    }
    if (options.sessionId) {
      result = result.filter((e) => e.sessionId === options.sessionId);
    }
    if (options.limit) {
      result = result.slice(-options.limit);
    }
    if (options.order === "asc") {
      result.sort((a, b) => a.timestamp - b.timestamp);
    } else {
      result.sort((a, b) => b.timestamp - a.timestamp);
    }
    return result;
  },
  getLast(n) {
    if (!n) n = 10;
    return this.getTrail({ limit: n, order: "desc" });
  },
  getStats() {
    const total = _trail.length;
    const successful = _trail.filter((e) => e.success).length;
    const blocked = _trail.filter((e) => e.blocked).length;
    const redirects = _trail.filter((e) => e.redirect).length;
    const pathCounts = {};
    _trail.forEach((e) => {
      if (e.toPath) {
        pathCounts[e.toPath] = (pathCounts[e.toPath] || 0) + 1;
      }
    });
    const topPaths = Object.keys(pathCounts).map((path) => ({
      path,
      count: pathCounts[path]
    })).sort((a, b) => b.count - a.count).slice(0, 10);
    const times = _trail.filter((e) => e.totalTime).map((e) => e.totalTime);
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const sessions = {};
    _trail.forEach((e) => {
      sessions[e.sessionId] = true;
    });
    return { total, successful, blocked, redirects, successRate: total > 0 ? `${(successful / total * 100).toFixed(2)}%` : "0%", avgNavigationTime: `${avgTime.toFixed(2)}ms`, topPaths, uniqueSessions: Object.keys(sessions).length, timeRange: { first: _trail[0] ? _trail[0].isoTime : null, last: _trail[_trail.length - 1] ? _trail[_trail.length - 1].isoTime : null } };
  },
  export(format) {
    if (!format) format = "json";
    if (format === "csv") {
      const headers = ["timestamp", "sessionId", "fromPath", "toPath", "success", "blocked", "totalTime"];
      const rows = _trail.map((e) => headers.map((h) => e[h] !== void 0 ? e[h] : "").join(","));
      return [headers.join(",")].concat(rows).join("\n");
    }
    return JSON.stringify(_trail, null, 2);
  },
  clear() {
    const count = _trail.length;
    _trail = [];
    if (CONFIG.persist) {
      try {
        localStorage.removeItem(CONFIG.storageKey);
      } catch (e) {
      }
    }
    return count;
  },
  getSessionId() {
    return _sessionId;
  },
  newSession() {
    _sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return _sessionId;
  },
  configure(options) {
    Object.assign(CONFIG, options);
  },
  enable() {
    CONFIG.enabled = true;
  },
  disable() {
    CONFIG.enabled = false;
  },
  isEnabled() {
    return CONFIG.enabled;
  },
  _persist() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(_trail.slice(-100)));
    } catch (e) {
    }
  },
  _restore() {
    try {
      const saved = localStorage.getItem(CONFIG.storageKey);
      if (saved) _trail = JSON.parse(saved);
    } catch (e) {
    }
  },
  getStatus() {
    return { version: VERSION, moduleId: MODULE_ID, enabled: CONFIG.enabled, sessionId: _sessionId, entryCount: _trail.length, maxEntries: CONFIG.maxEntries, stats: this.getStats(), portsInitialized: Ports.isInitialized() };
  },
  healthCheck() {
    return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { enabled: CONFIG.enabled, hasCapacity: _trail.length < CONFIG.maxEntries, entryCount: _trail.length } };
  }
};
var audit_default = RouterAudit;
export {
  MODULE_ID,
  RouterAudit,
  VERSION,
  audit_default as default,
  getPorts,
  injectPorts
};
