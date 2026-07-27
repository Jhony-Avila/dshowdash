const VERSION = "1.1.0-P0-GOVERNANCE";
const MODULE_ID = "container-main:contracts:utils";
const UTIL_CATEGORIES = Object.freeze({
  CORE: "core",
  ASYNC: "async",
  DOM: "dom",
  PERFORMANCE: "performance",
  STORAGE: "storage",
  UI: "ui",
  HELPER: "helper"
});
const UTIL_CRITICALITY = Object.freeze({
  ESSENTIAL: "essential",
  IMPORTANT: "important",
  OPTIONAL: "optional"
});
const UTIL_INTERFACE = Object.freeze({
  required: [
    "VERSION",
    "MODULE_ID",
    "info",
    "healthCheck"
  ],
  recommended: [
    "init",
    "destroy",
    "reset"
  ],
  optional: [
    "configure",
    "getMetrics",
    "resetMetrics",
    "subscribe",
    "unsubscribe"
  ]
});
const INFO_SCHEMA = Object.freeze({
  moduleId: { type: "string", required: true },
  version: { type: "string", required: true }
});
const HEALTH_SCHEMA = Object.freeze({
  status: { type: "enum", values: ["HEALTHY", "DEGRADED", "UNHEALTHY", "ERROR", "NOT_INITIALIZED"], required: true },
  version: { type: "string", required: true },
  moduleId: { type: "string", required: true }
});
const KNOWN_UTILS = Object.freeze({
  "logger": { category: UTIL_CATEGORIES.CORE, criticality: UTIL_CRITICALITY.ESSENTIAL },
  "error-handler": { category: UTIL_CATEGORIES.CORE, criticality: UTIL_CRITICALITY.ESSENTIAL },
  "events": { category: UTIL_CATEGORIES.CORE, criticality: UTIL_CRITICALITY.ESSENTIAL },
  "request-queue": { category: UTIL_CATEGORIES.ASYNC, criticality: UTIL_CRITICALITY.ESSENTIAL },
  "responsive-manager": { category: UTIL_CATEGORIES.UI, criticality: UTIL_CRITICALITY.IMPORTANT },
  "telemetry": { category: UTIL_CATEGORIES.PERFORMANCE, criticality: UTIL_CRITICALITY.IMPORTANT },
  "memory-monitor": { category: UTIL_CATEGORIES.PERFORMANCE, criticality: UTIL_CRITICALITY.OPTIONAL },
  "fps-monitor": { category: UTIL_CATEGORIES.PERFORMANCE, criticality: UTIL_CRITICALITY.OPTIONAL },
  "theme-manager": { category: UTIL_CATEGORIES.UI, criticality: UTIL_CRITICALITY.OPTIONAL },
  "animation-manager": { category: UTIL_CATEGORIES.UI, criticality: UTIL_CRITICALITY.OPTIONAL },
  "shortcuts-manager": { category: UTIL_CATEGORIES.UI, criticality: UTIL_CRITICALITY.OPTIONAL },
  "debounce": { category: UTIL_CATEGORIES.HELPER, criticality: UTIL_CRITICALITY.IMPORTANT },
  "idle-scheduler": { category: UTIL_CATEGORIES.ASYNC, criticality: UTIL_CRITICALITY.OPTIONAL },
  "dom-batch": { category: UTIL_CATEGORIES.DOM, criticality: UTIL_CRITICALITY.OPTIONAL },
  "lazy-loader": { category: UTIL_CATEGORIES.ASYNC, criticality: UTIL_CRITICALITY.IMPORTANT },
  "virtual-scroller": { category: UTIL_CATEGORIES.UI, criticality: UTIL_CRITICALITY.OPTIONAL },
  "indexed-db": { category: UTIL_CATEGORIES.STORAGE, criticality: UTIL_CRITICALITY.OPTIONAL },
  "config-cache": { category: UTIL_CATEGORIES.STORAGE, criticality: UTIL_CRITICALITY.OPTIONAL },
  "object-pool": { category: UTIL_CATEGORIES.PERFORMANCE, criticality: UTIL_CRITICALITY.OPTIONAL },
  "worker-pool": { category: UTIL_CATEGORIES.ASYNC, criticality: UTIL_CRITICALITY.OPTIONAL }
});
function validateUtilInterface(module, options = {}) {
  const { strict = false } = options;
  const result = { valid: true, errors: [], warnings: [], implemented: [], missing: [] };
  for (const method of UTIL_INTERFACE.required) {
    if (typeof module[method] === "function" || module[method] !== void 0) {
      result.implemented.push(method);
    } else {
      result.missing.push(method);
      result.errors.push(`Missing required: ${method}`);
      result.valid = false;
    }
  }
  for (const method of UTIL_INTERFACE.recommended) {
    if (typeof module[method] === "function") {
      result.implemented.push(method);
    } else {
      result.warnings.push(`Missing recommended: ${method}`);
    }
  }
  for (const method of UTIL_INTERFACE.optional) {
    if (typeof module[method] === "function") {
      result.implemented.push(method);
    }
  }
  if (typeof module.info === "function") {
    try {
      const infoResult = module.info();
      if (!infoResult.moduleId) result.warnings.push("info() missing moduleId");
      if (!infoResult.version) result.warnings.push("info() missing version");
    } catch (e) {
      result.errors.push(`info() threw error: ${e.message}`);
      result.valid = false;
    }
  }
  if (typeof module.healthCheck === "function") {
    try {
      const health = module.healthCheck();
      if (!health.status) result.warnings.push("healthCheck() missing status");
      if (!HEALTH_SCHEMA.status.values.includes(health.status)) {
        result.warnings.push(`healthCheck() invalid status: ${health.status}`);
      }
    } catch (e) {
      result.errors.push(`healthCheck() threw error: ${e.message}`);
      if (strict) result.valid = false;
    }
  }
  result.score = result.implemented.length;
  result.maxScore = UTIL_INTERFACE.required.length + UTIL_INTERFACE.recommended.length;
  result.compliance = Math.round(result.score / result.maxScore * 100);
  return result;
}
function createUtilWrapper(module, metadata = {}) {
  const { moduleId = "unknown", version = "0.0.0", category = UTIL_CATEGORIES.HELPER } = metadata;
  return {
    // Spread do módulo original
    ...module,
    // Garante VERSION e MODULE_ID
    VERSION: module.VERSION || version,
    MODULE_ID: module.MODULE_ID || moduleId,
    // Garante info()
    info: module.info || (() => ({
      moduleId: module.MODULE_ID || moduleId,
      version: module.VERSION || version,
      category,
      wrapped: true
    })),
    // Garante healthCheck()
    healthCheck: module.healthCheck || (() => ({
      status: "HEALTHY",
      version: module.VERSION || version,
      moduleId: module.MODULE_ID || moduleId,
      wrapped: true
    })),
    // Metadata
    __metadata: { moduleId, version, category, wrapped: true }
  };
}
async function validateUtilsBundle(utils) {
  const results = {};
  for (const [name, module] of Object.entries(utils)) {
    results[name] = validateUtilInterface(module);
  }
  const total = Object.keys(results).length;
  const valid = Object.values(results).filter((r) => r.valid).length;
  return {
    summary: { total, valid, invalid: total - valid, compliance: Math.round(valid / total * 100) },
    results
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    categories: Object.keys(UTIL_CATEGORIES),
    criticalities: Object.keys(UTIL_CRITICALITY),
    knownUtils: Object.keys(KNOWN_UTILS).length,
    interface: UTIL_INTERFACE
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    knownUtils: Object.keys(KNOWN_UTILS).length
  };
}
var utils_contract_default = {
  VERSION,
  MODULE_ID,
  UTIL_CATEGORIES,
  UTIL_CRITICALITY,
  UTIL_INTERFACE,
  INFO_SCHEMA,
  HEALTH_SCHEMA,
  KNOWN_UTILS,
  validateUtilInterface,
  createUtilWrapper,
  validateUtilsBundle,
  info,
  healthCheck
};
export {
  HEALTH_SCHEMA,
  INFO_SCHEMA,
  KNOWN_UTILS,
  MODULE_ID,
  UTIL_CATEGORIES,
  UTIL_CRITICALITY,
  UTIL_INTERFACE,
  VERSION,
  createUtilWrapper,
  utils_contract_default as default,
  healthCheck,
  info,
  validateUtilInterface,
  validateUtilsBundle
};
