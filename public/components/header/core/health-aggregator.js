import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-FIX-RECURSION";
const MODULE_ID = "header/core/health-aggregator";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _initialized = false;
function _initPorts() {
  if (_initialized) return;
  Ports.init();
  _initialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function _log(level, msg, data) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[" + MODULE_ID + "]";
  if (level === "error") {
    logger.error && logger.error(prefix, msg, data || "");
  } else if (level === "warn") {
    logger.warn && logger.warn(prefix, msg, data || "");
  } else if (level === "info") {
    logger.info && logger.info(prefix, msg, data || "");
  } else {
    const config = _getPort("config");
    if (config && config.app && config.app.debug) {
      logger.debug && logger.debug(prefix, msg, data || "");
    }
  }
}
const _metrics = {
  aggregationCount: 0,
  lastAggregationAt: null,
  totalComponentsChecked: 0,
  healthyCount: 0,
  degradedCount: 0,
  unhealthyCount: 0
};
let _lastResult = null;
const STATUS_WEIGHTS = {
  "HEALTHY": 1,
  "MOUNTED": 1,
  "DEGRADED": 0.5,
  "UNHEALTHY": 0,
  "FAILED": 0,
  "TIMEOUT": 0,
  "ERROR": 0,
  "NO_HEALTHCHECK": 0.7,
  "UNKNOWN": 0.3
};
function normalizeStatus(status) {
  if (!status) return "UNKNOWN";
  return String(status).toUpperCase();
}
function calculateComponentScore(healthResult) {
  if (!healthResult) return 0;
  const status = normalizeStatus(healthResult.status);
  let baseScore = STATUS_WEIGHTS[status] !== void 0 ? STATUS_WEIGHTS[status] : 0.3;
  if (healthResult.score !== void 0 && healthResult.maxScore) {
    const componentScore = healthResult.score / healthResult.maxScore;
    baseScore = (baseScore + componentScore) / 2;
  }
  return baseScore;
}
function aggregate(sources) {
  _initPorts();
  _metrics.aggregationCount++;
  _metrics.lastAggregationAt = Date.now();
  const results = {
    timestamp: Date.now(),
    components: {},
    summary: {
      total: 0,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      noHealthCheck: 0
    },
    overallScore: 0,
    overallStatus: "UNKNOWN"
  };
  let totalScore = 0;
  let componentCount = 0;
  Object.keys(sources).forEach(function(sourceName) {
    const source = sources[sourceName];
    if (!source) return;
    if (typeof source === "object" && !source.status) {
      Object.keys(source).forEach(function(componentName) {
        const health = source[componentName];
        processComponent(componentName, health, results, sourceName);
        componentCount++;
        totalScore += calculateComponentScore(health);
      });
    } else if (source.status) {
      processComponent(sourceName, source, results, "direct");
      componentCount++;
      totalScore += calculateComponentScore(source);
    }
  });
  results.summary.total = componentCount;
  results.overallScore = componentCount > 0 ? Math.round(totalScore / componentCount * 100) : 0;
  if (results.overallScore >= 90) {
    results.overallStatus = "HEALTHY";
  } else if (results.overallScore >= 60) {
    results.overallStatus = "DEGRADED";
  } else {
    results.overallStatus = "UNHEALTHY";
  }
  _metrics.totalComponentsChecked = componentCount;
  _metrics.healthyCount = results.summary.healthy;
  _metrics.degradedCount = results.summary.degraded;
  _metrics.unhealthyCount = results.summary.unhealthy;
  _lastResult = results;
  _log("info", "Health aggregation complete", {
    total: componentCount,
    score: results.overallScore,
    status: results.overallStatus
  });
  return results;
}
function processComponent(name, health, results, source) {
  const status = normalizeStatus(health ? health.status : "UNKNOWN");
  results.components[name] = {
    status,
    score: calculateComponentScore(health),
    source,
    details: health,
    checkedAt: Date.now()
  };
  if (status === "HEALTHY" || status === "MOUNTED") {
    results.summary.healthy++;
  } else if (status === "DEGRADED") {
    results.summary.degraded++;
  } else if (status === "NO_HEALTHCHECK") {
    results.summary.noHealthCheck++;
  } else {
    results.summary.unhealthy++;
  }
}
function aggregateHeader(headerInstance) {
  if (!headerInstance) {
    _log("warn", "Header instance not provided");
    return null;
  }
  const sources = {};
  sources["header-core"] = {
    status: headerInstance._mounted ? "HEALTHY" : "UNHEALTHY",
    mounted: !!headerInstance._mounted,
    version: headerInstance.VERSION || "unknown"
  };
  if (headerInstance.componentsLoader) {
    if (headerInstance.componentsLoader.getSubcomponentsHealth) {
      sources["subcomponents"] = headerInstance.componentsLoader.getSubcomponentsHealth();
    }
    if (headerInstance.componentsLoader.healthCheck) {
      sources["components-loader"] = headerInstance.componentsLoader.healthCheck();
    }
  }
  if (headerInstance.routerIntegration && headerInstance.routerIntegration.healthCheck) {
    sources["router-integration"] = headerInstance.routerIntegration.healthCheck();
  }
  if (headerInstance.fallbackManager && headerInstance.fallbackManager.healthCheck) {
    sources["fallback-manager"] = headerInstance.fallbackManager.healthCheck();
  }
  if (headerInstance.events && headerInstance.events.healthCheck) {
    sources["events"] = headerInstance.events.healthCheck();
  }
  return aggregate(sources);
}
function getLastResult() {
  return _lastResult;
}
function getProblematicComponents() {
  if (!_lastResult) return [];
  const problematic = [];
  Object.keys(_lastResult.components).forEach(function(name) {
    const comp = _lastResult.components[name];
    if (comp.status !== "HEALTHY" && comp.status !== "MOUNTED") {
      problematic.push({
        name,
        status: comp.status,
        score: comp.score,
        source: comp.source
      });
    }
  });
  return problematic;
}
function getQuickSummary() {
  if (!_lastResult) {
    return {
      status: "UNKNOWN",
      score: 0,
      message: "No aggregation performed yet"
    };
  }
  const summary = _lastResult.summary;
  let message = summary.healthy + " healthy";
  if (summary.degraded > 0) {
    message += ", " + summary.degraded + " degraded";
  }
  if (summary.unhealthy > 0) {
    message += ", " + summary.unhealthy + " unhealthy";
  }
  return {
    // @ts-expect-error TS migration - TS2339
    status: _lastResult.overallStatus,
    // @ts-expect-error TS migration - TS2339
    score: _lastResult.overallScore,
    message,
    total: summary.total
  };
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics(),
    lastResult: _lastResult ? {
      // @ts-expect-error TS migration - TS2339
      status: _lastResult.overallStatus,
      // @ts-expect-error TS migration - TS2339
      score: _lastResult.overallScore,
      // @ts-expect-error TS migration - TS2339
      componentsCount: _lastResult.summary.total,
      // @ts-expect-error TS migration - TS2339
      timestamp: _lastResult.timestamp
    } : null,
    problematicComponents: getProblematicComponents()
  };
}
function healthCheck() {
  const checks = {
    initialized: _initialized,
    hasLastResult: !!_lastResult,
    // @ts-expect-error TS migration - TS2363
    recentAggregation: _metrics.lastAggregationAt && Date.now() - _metrics.lastAggregationAt < 3e5,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: passed + "/" + total,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized()
  };
}
var health_aggregator_default = {
  VERSION,
  MODULE_ID,
  aggregate,
  aggregateHeader,
  getLastResult,
  getProblematicComponents,
  getQuickSummary,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  aggregate,
  aggregateHeader,
  health_aggregator_default as default,
  getLastResult,
  getMetrics,
  getPorts,
  getProblematicComponents,
  getQuickSummary,
  healthCheck,
  info,
  injectPorts
};
