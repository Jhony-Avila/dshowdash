import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "header.core.environment";
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
function _debugEnabled() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug || false;
}
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error" && logger.error) {
    logger.error.apply(logger, [`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "warn" && logger.warn) {
    logger.warn.apply(logger, [`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "info" && logger.info) {
    logger.info.apply(logger, [`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [`[${MODULE_ID}]`].concat(args));
}
function _getLocationInfo() {
  if (!hasWindow || !window.location) return { hostname: "", protocol: "https:", port: "" };
  return { hostname: window.location.hostname, protocol: window.location.protocol, port: window.location.port };
}
const ENVIRONMENTS = Object.freeze({ SANDBOX: "SANDBOX", TEST: "TEST", PROD: "PROD", UNKNOWN: "UNKNOWN" });
const METADATA = Object.freeze({ SANDBOX: { name: "Sandbox", color: "#FFA500", icon: "\u{1F527}", description: "Ambiente de desenvolvimento", safety: "high" }, TEST: { name: "Test/Staging", color: "#FFC107", icon: "\u26A0\uFE0F", description: "Ambiente de testes", safety: "medium" }, PROD: { name: "Production", color: "#4CAF50", icon: "\u2705", description: "Ambiente de producao", safety: "low" }, UNKNOWN: { name: "Unknown", color: "#9E9E9E", icon: "\u2753", description: "Ambiente nao identificado", safety: "unknown" } });
let _cache = null;
let _metrics = { detectCount: 0, cacheHitCount: 0, lastDetectAt: null };
function _mapFromEnvManager(envManagerEnv) {
  const mapping = { "SANDBOX": ENVIRONMENTS.SANDBOX, "DEV": ENVIRONMENTS.SANDBOX, "TEST": ENVIRONMENTS.TEST, "STAGE": ENVIRONMENTS.TEST, "PROD": ENVIRONMENTS.PROD, "UNKNOWN": ENVIRONMENTS.UNKNOWN };
  return mapping[envManagerEnv] || ENVIRONMENTS.UNKNOWN;
}
function detect(options) {
  if (!options) options = {};
  const forceRefresh = options.forceRefresh || false;
  _metrics.detectCount++;
  _metrics.lastDetectAt = Date.now();
  if (!forceRefresh && _cache) {
    _metrics.cacheHitCount++;
    return _cache;
  }
  const loc = _getLocationInfo();
  const hostname = loc.hostname;
  const protocol = loc.protocol;
  const port = loc.port;
  const envManager = hasWindow ? window.Environment : null;
  if (envManager) {
    const envManagerEnv = envManager.get("environment");
    const mappedEnv = _mapFromEnvManager(envManagerEnv);
    const detection2 = { environment: mappedEnv, hostname, protocol, port, metadata: METADATA[mappedEnv], isLocal: mappedEnv === ENVIRONMENTS.SANDBOX, isTest: mappedEnv === ENVIRONMENTS.TEST, isProd: mappedEnv === ENVIRONMENTS.PROD, isSecure: protocol === "https:", detectedAt: Date.now(), detectionMethod: "environment-manager" };
    _cache = detection2;
    _log("debug", "Environment detected via EnvManager:", mappedEnv);
    return detection2;
  }
  _log("info", "Environment Manager nao disponivel - usando fallback");
  const fallbackEnv = ENVIRONMENTS.UNKNOWN;
  const detection = { environment: fallbackEnv, hostname, protocol, port, metadata: METADATA[fallbackEnv], isLocal: false, isTest: false, isProd: false, isSecure: protocol === "https:", detectedAt: Date.now(), detectionMethod: "fallback-no-env-manager" };
  _cache = detection;
  return detection;
}
function detectSimple() {
  return detect().environment;
}
function isLocal() {
  return detect().isLocal;
}
function isTest() {
  return detect().isTest;
}
function isProd() {
  return detect().isProd;
}
function isSecure() {
  return detect().isSecure;
}
function getMetadata() {
  return detect().metadata;
}
function invalidateCache() {
  _cache = null;
}
function matches(expectedEnvironment) {
  return detect().environment === expectedEnvironment;
}
function getEnvMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics.detectCount = 0;
  _metrics.cacheHitCount = 0;
  _metrics.lastDetectAt = null;
}
function healthCheck() {
  const checks = { cacheReady: true, environmentsConfigured: Object.keys(ENVIRONMENTS).length > 0, metadataConfigured: Object.keys(METADATA).length > 0, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= total - 1 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, cached: !!_cache, currentEnvironment: _cache ? _cache.environment : "not-detected", metrics: getEnvMetrics(), portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
const EnvironmentDetector = { ENVIRONMENTS, METADATA, detect, detectSimple, isLocal, isTest, isProd, isSecure, getMetadata, invalidateCache, matches, getMetrics: getEnvMetrics, resetMetrics, healthCheck, info, getVersion };
var environment_default = EnvironmentDetector;
export {
  ENVIRONMENTS,
  EnvironmentDetector,
  METADATA,
  MODULE_ID,
  VERSION,
  environment_default as default,
  detect,
  detectSimple,
  getMetadata,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  invalidateCache,
  isLocal,
  isProd,
  isSecure,
  isTest,
  matches
};
