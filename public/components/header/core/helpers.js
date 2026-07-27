import { log } from "./logger.js";
const VERSION = "6.4.0-ES6";
const MODULE_ID = "header/core/helpers";
let _metrics = { getErrorMessageCalls: 0, ensureUARPSCalls: 0, lastCallAt: null };
function getErrorMessage(error) {
  _metrics.getErrorMessageCalls++;
  _metrics.lastCallAt = Date.now();
  if (!error) return "Erro desconhecido (undefined)";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || error.name || "Error sem mensagem";
  if (typeof error.message === "string") return error.message;
  if (typeof error.toString === "function") {
    const str = error.toString();
    if (str !== "[object Object]") return str;
  }
  try {
    return JSON.stringify(error);
  } catch (e) {
    return "Erro nao serializavel";
  }
}
function ensureUARPSRegion(container) {
  _metrics.ensureUARPSCalls++;
  _metrics.lastCallAt = Date.now();
  if (!container) return;
  const region = container.closest("#shell-header-region") || container;
  if (!region.hasAttribute("data-uarps-region")) {
    region.setAttribute("data-uarps-region", "region:app:header");
    log("info", "P0: data-uarps-region aplicado ao header");
  }
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics.getErrorMessageCalls = 0;
  _metrics.ensureUARPSCalls = 0;
  _metrics.lastCallAt = null;
}
function healthCheck() {
  const checks = { getErrorMessageAvailable: typeof getErrorMessage === "function", ensureUARPSAvailable: typeof ensureUARPSRegion === "function" };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), healthCheck: healthCheck() };
}
var helpers_default = { VERSION, MODULE_ID, getErrorMessage, ensureUARPSRegion, getMetrics, resetMetrics, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  ensureUARPSRegion,
  getErrorMessage,
  getMetrics,
  healthCheck,
  info,
  resetMetrics
};
