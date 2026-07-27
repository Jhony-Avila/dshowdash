const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-guards";
function getVersion() {
  return VERSION;
}
function isCriticalModule(moduleConfig) {
  return moduleConfig?.critical === true;
}
function canMountModule(moduleId, context = {}) {
  if (!moduleId) return false;
  if (context.authRequired && !context.isAuthenticated) return false;
  if (context.permissions && context.permissions.length > 0) {
    const hasPermission = context.userPermissions?.some((p) => context.permissions.indexOf(p) !== -1);
    if (!hasPermission) return false;
  }
  if (context.featureFlags && context.featureFlags.length > 0) {
    const flagsEnabled = context.featureFlags.every((flag) => context.enabledFlags?.indexOf(flag) !== -1);
    if (!flagsEnabled) return false;
  }
  return true;
}
function shouldDegradeModule(healthState, errorCount = 0, threshold = 3) {
  if (healthState === "ERROR" || healthState === "CRITICAL") return true;
  if (errorCount >= threshold) return true;
  return false;
}
function isTransientError(error) {
  const transientPatterns = ["network", "timeout", "fetch", "ECONNREFUSED", "ETIMEDOUT", "AbortError", "503", "504"];
  const errorMessage = error?.message?.toLowerCase() || "";
  const errorName = error?.name?.toLowerCase() || "";
  return transientPatterns.some((pattern) => errorMessage.indexOf(pattern) !== -1 || errorName.indexOf(pattern) !== -1);
}
function isCircuitBreakerOpen(failures, threshold = 5, windowMs = 6e4) {
  if (!Array.isArray(failures)) return false;
  const now = Date.now();
  const recentFailures = failures.filter((f) => now - f.timestamp < windowMs);
  return recentFailures.length >= threshold;
}
function shouldRetry(attempt, maxRetries, error) {
  if (attempt >= maxRetries) return false;
  if (!isTransientError(error)) return false;
  return true;
}
function isValidModuleId(id) {
  if (!id || typeof id !== "string") return false;
  return /^[a-z0-9-]+$/i.test(id);
}
function isValidPresetId(id) {
  if (!id || typeof id !== "string") return false;
  return /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(id);
}
function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { guardsReady: true } };
}
var guards_default = { VERSION, MODULE_ID, getVersion, isCriticalModule, canMountModule, shouldDegradeModule, isTransientError, isCircuitBreakerOpen, shouldRetry, isValidModuleId, isValidPresetId, isBrowser, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  canMountModule,
  guards_default as default,
  getVersion,
  healthCheck,
  info,
  isBrowser,
  isCircuitBreakerOpen,
  isCriticalModule,
  isTransientError,
  isValidModuleId,
  isValidPresetId,
  shouldDegradeModule,
  shouldRetry
};
