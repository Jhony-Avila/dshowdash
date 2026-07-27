const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.feature-flags.utils.helpers";
function parseFlag(value) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return !!value;
}
function isEnabled(flags, key) {
  return parseFlag(flags?.[key]);
}
function healthCheck() {
  const checks = {
    available: true,
    functionsValid: typeof parseFlag === "function" && typeof isEnabled === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    helpers: ["parseFlag", "isEnabled"],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var helpers_default = {
  parseFlag,
  isEnabled,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  healthCheck,
  info,
  isEnabled,
  parseFlag
};
