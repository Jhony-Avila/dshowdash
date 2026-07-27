import FlagRegistry from "./registry.js";
const VERSION = "2.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.feature-flags.core.evaluator";
let _context = {};
let _metrics = {
  evaluations: 0,
  isEnabledCalls: 0,
  getVariantCalls: 0,
  getValueCalls: 0
};
function setContext(context) {
  _context = { ..._context, ...context };
}
function getContext() {
  return { ..._context };
}
function evaluate(flag, context = null) {
  _metrics.evaluations++;
  const evalContext = context || _context;
  if (typeof flag === "boolean") return flag;
  if (typeof flag === "function") return !!flag(evalContext);
  return !!flag;
}
function evaluateAll(flags, context = null) {
  const evalContext = context || _context;
  return Object.fromEntries(
    Object.entries(flags).map(([key, val]) => [key, evaluate(val, evalContext)])
  );
}
function _hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
function isEnabled(flagName) {
  _metrics.isEnabledCalls++;
  const flag = FlagRegistry.get(flagName);
  if (!flag) return false;
  if (!flag.enabled) return false;
  if (flag.percentage !== void 0 && flag.percentage < 100) {
    const hash = _hashString(flagName + JSON.stringify(_context));
    const bucket = hash % 100;
    return bucket < flag.percentage;
  }
  return true;
}
function getVariant(flagName) {
  _metrics.getVariantCalls++;
  const flag = FlagRegistry.get(flagName);
  if (!flag) return null;
  return flag.variant ?? null;
}
function getValue(flagName, defaultValue = null) {
  _metrics.getValueCalls++;
  const flag = FlagRegistry.get(flagName);
  if (!flag) return defaultValue;
  if (flag.value !== void 0 && flag.value !== null) {
    return flag.value;
  }
  return flag.enabled ?? defaultValue;
}
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics = {
    evaluations: 0,
    isEnabledCalls: 0,
    getVariantCalls: 0,
    getValueCalls: 0
  };
}
function healthCheck() {
  const checks = {
    available: true,
    registryConnected: typeof FlagRegistry.get === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    contextKeys: Object.keys(_context),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getMetrics(),
    contextKeys: Object.keys(_context),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
const FlagEvaluator = {
  evaluate,
  evaluateAll,
  isEnabled,
  getVariant,
  getValue,
  setContext,
  getContext,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
var evaluator_default = FlagEvaluator;
export {
  FlagEvaluator,
  MODULE_ID,
  VERSION,
  evaluator_default as default,
  evaluate,
  evaluateAll,
  getContext,
  getMetrics,
  getValue,
  getVariant,
  healthCheck,
  info,
  isEnabled,
  resetMetrics,
  setContext
};
