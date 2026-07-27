import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { validateContract } from "../components/_base/contract.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/contract-audit";
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
  const prefix = `[${MODULE_ID}]`;
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
function _emitTelemetry(action, data) {
  const telemetry = _getPort("telemetry");
  if (telemetry && telemetry.track) {
    telemetry.track(`${MODULE_ID}:${action}`, data);
  }
}
const _auditResults = /* @__PURE__ */ new Map();
const _metrics = {
  totalAudited: 0,
  totalValid: 0,
  totalInvalid: 0,
  totalWarnings: 0,
  lastAuditAt: null
};
function auditComponent(instance, componentName) {
  if (!instance) {
    _log("warn", "auditComponent called with null instance", { componentName });
    return { valid: false, issues: ["Instance is null"], warnings: [], componentName };
  }
  const result = validateContract(instance, componentName);
  result.governanceScore = 0;
  const maxGovernanceScore = 5;
  if (result.governance.hasId) result.governanceScore++;
  if (result.governance.hasVersion) result.governanceScore++;
  if (result.governance.hasCapabilities) result.governanceScore++;
  if (typeof instance.healthCheck === "function") result.governanceScore++;
  if (typeof instance.info === "function") result.governanceScore++;
  result.governanceScoreDisplay = `${result.governanceScore}/${maxGovernanceScore}`;
  result.governanceCompliant = result.governanceScore >= 3;
  result.auditedAt = Date.now();
  _auditResults.set(componentName, result);
  _metrics.totalAudited++;
  if (result.valid) {
    _metrics.totalValid++;
  } else {
    _metrics.totalInvalid++;
  }
  if (result.warnings.length > 0) {
    _metrics.totalWarnings += result.warnings.length;
  }
  _metrics.lastAuditAt = Date.now();
  if (!result.valid) {
    _log("error", `Contract INVALID: ${componentName}`, { issues: result.issues });
    _emitTelemetry("contract-invalid", { componentName, issues: result.issues });
  } else if (result.warnings.length > 0) {
    _log("warn", `Contract valid with warnings: ${componentName}`, { warnings: result.warnings });
  } else {
    _log("debug", `Contract valid: ${componentName}`, { governanceScore: result.governanceScoreDisplay });
  }
  return result;
}
function auditComponents(componentsMap) {
  const results = {};
  if (componentsMap instanceof Map) {
    componentsMap.forEach((data, name) => {
      const instance = data.instance || data;
      results[name] = auditComponent(instance, name);
    });
  } else if (typeof componentsMap === "object") {
    Object.keys(componentsMap).forEach((name) => {
      const data = componentsMap[name];
      const instance = data.instance || data;
      results[name] = auditComponent(instance, name);
    });
  }
  return results;
}
function getAuditResult(componentName) {
  return _auditResults.get(componentName) || null;
}
function getAllAuditResults() {
  const results = {};
  _auditResults.forEach((result, name) => {
    results[name] = result;
  });
  return results;
}
function getInvalidComponents() {
  const invalid = [];
  _auditResults.forEach((result, name) => {
    if (!result.valid) {
      invalid.push({ name, issues: result.issues });
    }
  });
  return invalid;
}
function getComponentsWithWarnings() {
  const withWarnings = [];
  _auditResults.forEach((result, name) => {
    if (result.warnings.length > 0) {
      withWarnings.push({ name, warnings: result.warnings });
    }
  });
  return withWarnings;
}
function getGovernanceScore() {
  if (_auditResults.size === 0) return { score: 0, maxScore: 0, percentage: "0%" };
  let totalScore = 0;
  const maxPossible = _auditResults.size * 5;
  _auditResults.forEach((result) => {
    totalScore += result.governanceScore || 0;
  });
  const percentage = maxPossible > 0 ? Math.round(totalScore / maxPossible * 100) : 0;
  return {
    score: totalScore,
    maxScore: maxPossible,
    percentage: `${percentage}%`,
    componentsAudited: _auditResults.size
  };
}
function clearAuditResults() {
  _auditResults.clear();
  _metrics.totalAudited = 0;
  _metrics.totalValid = 0;
  _metrics.totalInvalid = 0;
  _metrics.totalWarnings = 0;
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    resultsCount: _auditResults.size
  });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics(),
    governanceScore: getGovernanceScore(),
    invalidComponents: getInvalidComponents(),
    componentsWithWarnings: getComponentsWithWarnings()
  };
}
function healthCheck() {
  const governanceScore = getGovernanceScore();
  const invalidCount = getInvalidComponents().length;
  const checks = {
    hasResults: _auditResults.size > 0,
    noInvalidCritical: invalidCount === 0,
    goodGovernanceScore: parseInt(governanceScore.percentage) >= 60,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= total - 1 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    governanceScore,
    portsInitialized: Ports.isInitialized()
  };
}
var contract_audit_default = {
  VERSION,
  MODULE_ID,
  auditComponent,
  auditComponents,
  getAuditResult,
  getAllAuditResults,
  getInvalidComponents,
  getComponentsWithWarnings,
  getGovernanceScore,
  clearAuditResults,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  auditComponent,
  auditComponents,
  clearAuditResults,
  contract_audit_default as default,
  getAllAuditResults,
  getAuditResult,
  getComponentsWithWarnings,
  getGovernanceScore,
  getInvalidComponents,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
