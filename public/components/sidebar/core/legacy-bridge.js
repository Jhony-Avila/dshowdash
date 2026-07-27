import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "sidebar:legacy-bridge";
const VERSION = "2.4.0-P2-ENTERPRISE";
const _Ports = createUiPorts({ moduleId: MODULE_ID });
const _getPort = (name) => _Ports.get(name);
const injectPorts = (p) => _Ports.inject(p);
const getPortsSnapshot = () => _Ports.snapshot();
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return null;
}
const _log = (level, ...args) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) {
    logger[level](prefix, ...args);
  } else if (!isStrict() && (level === "error" || level === "warn" || level === "info")) {
    console.debug(prefix, ...args);
  }
};
const _config = { enabled: false, showWarnings: true, logDeprecations: true };
const _deprecationLog = /* @__PURE__ */ new Map();
const LEGACY_MAPPINGS = {
  setBadge: { feature: "badges", method: "set", removeIn: "v6.0.0" },
  getBadge: { feature: "badges", method: "get", removeIn: "v6.0.0" },
  removeBadge: { feature: "badges", method: "remove", removeIn: "v6.0.0" }
};
function _emitDeprecationWarning(legacyMethod, mapping) {
  if (!_config.showWarnings) return;
  const newUsage = `Sidebar.feature('${mapping.feature}').${mapping.method}()`;
  const message = `DEPRECATED: ${legacyMethod}() \u2192 Use: ${newUsage} (removing in ${mapping.removeIn})`;
  _log("warn", message);
  if (_config.logDeprecations) {
    const count = _deprecationLog.get(legacyMethod) || 0;
    _deprecationLog.set(legacyMethod, count + 1);
  }
}
function createLegacyWrapper(legacyMethod, mapping, featureAccessor) {
  return (...args) => {
    _emitDeprecationWarning(legacyMethod, mapping);
    const featureProxy = featureAccessor(mapping.feature);
    if (!featureProxy) {
      _log("error", `Feature not found: ${mapping.feature}`);
      return void 0;
    }
    const finalArgs = mapping.args ? [...mapping.args, ...args] : args;
    const method = featureProxy[mapping.method];
    if (typeof method === "function") {
      return method.apply(featureProxy, finalArgs);
    }
    _log("warn", `Method not found: ${mapping.feature}.${mapping.method}`);
    return void 0;
  };
}
function applyLegacyBridge(target, featureAccessor) {
  if (!target || !_config.enabled) {
    _log("info", `Legacy bridge DISABLED - use Sidebar.feature('x').method() API`);
    return target;
  }
  Object.keys(LEGACY_MAPPINGS).forEach((legacyMethod) => {
    if (target[legacyMethod] && !target[legacyMethod]._isLegacyBridge) return;
    const mapping = LEGACY_MAPPINGS[legacyMethod];
    const wrapper = createLegacyWrapper(legacyMethod, mapping, featureAccessor);
    wrapper._isLegacyBridge = true;
    wrapper._mapping = mapping;
    target[legacyMethod] = wrapper;
  });
  return target;
}
function removeLegacyBridge(target) {
  if (!target) return target;
  Object.keys(LEGACY_MAPPINGS).forEach((legacyMethod) => {
    if (target[legacyMethod]?._isLegacyBridge) delete target[legacyMethod];
  });
  return target;
}
function configure(options = {}) {
  if (typeof options.enabled === "boolean") _config.enabled = options.enabled;
  if (typeof options.showWarnings === "boolean") _config.showWarnings = options.showWarnings;
  if (typeof options.logDeprecations === "boolean") _config.logDeprecations = options.logDeprecations;
  return { ..._config };
}
function getConfig() {
  return { ..._config };
}
function getDeprecationReport() {
  const entries = Array.from(_deprecationLog.entries()).map(([method, count]) => ({ method, count, mapping: LEGACY_MAPPINGS[method] })).sort((a, b) => b.count - a.count);
  return { totalCalls: entries.reduce((sum, e) => sum + e.count, 0), uniqueMethods: entries.length, methods: entries };
}
function clearDeprecationLog() {
  _deprecationLog.clear();
}
function getLegacyMethods() {
  return Object.keys(LEGACY_MAPPINGS);
}
function getMappingFor(legacyMethod) {
  return LEGACY_MAPPINGS[legacyMethod] || null;
}
function healthCheck() {
  const report = getDeprecationReport();
  const totalMappings = Object.keys(LEGACY_MAPPINGS).length;
  const checks = { bridgeDisabled: !_config.enabled, minimalMappings: totalMappings <= 10, noDeprecationCalls: report.totalCalls === 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    checks,
    issues: report.totalCalls > 0 ? [{ code: "LEGACY_USAGE", severity: "warn", message: `${report.totalCalls} legacy method call(s) detected` }] : [],
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    config: { ..._config },
    stats: { totalLegacyMethods: totalMappings, deprecationCalls: report.totalCalls, uniqueMethodsCalled: report.uniqueMethods },
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _config.enabled,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    totalMappings: Object.keys(LEGACY_MAPPINGS).length,
    message: "Legacy bridge is DISABLED by default. Use Sidebar.feature(x).method() API.",
    deprecationReport: getDeprecationReport()
  };
}
var legacy_bridge_default = { LEGACY_MAPPINGS, applyLegacyBridge, removeLegacyBridge, createLegacyWrapper, configure, getConfig, getDeprecationReport, clearDeprecationLog, getLegacyMethods, getMappingFor, healthCheck, info, injectPorts, getPorts: getPortsSnapshot, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  applyLegacyBridge,
  clearDeprecationLog,
  configure,
  legacy_bridge_default as default,
  getConfig,
  getDeprecationReport,
  getLegacyMethods,
  getMappingFor,
  getPortsSnapshot,
  healthCheck,
  info,
  injectPorts,
  removeLegacyBridge
};
