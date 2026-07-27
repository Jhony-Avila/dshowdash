import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.4.0-P17WI";
const MODULE_ID = "ticker.config.design-tokens";
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
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
}
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ?? false;
};
const TICKER_TOKENS = { bg: { darkA: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(18, 18, 26, 0.55)", darkB: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%), rgba(18, 18, 26, 0.60)", darkContrast: "rgba(10, 10, 15, 0.85)" }, border: { top: "rgba(255, 255, 255, 0.05)", bottom: "rgba(255, 255, 255, 0.05)", strong: "rgba(255, 255, 255, 0.10)" }, text: { main: "rgba(255, 255, 255, 0.80)", muted: "rgba(255, 255, 255, 0.65)", soft: "rgba(255, 255, 255, 0.50)", hover: "rgba(96, 165, 250, 0.95)" }, tag: { breaking: { bg: "rgba(239, 68, 68, 0.18)", text: "#F87171", icon: "#EF4444" }, economia: { bg: "rgba(34, 197, 94, 0.16)", text: "#86EFAC", icon: "#22C55E" }, politica: { bg: "rgba(59, 130, 246, 0.16)", text: "#93C5FD", icon: "#3B82F6" }, tecnologia: { bg: "rgba(139, 92, 246, 0.16)", text: "#C4B5FD", icon: "#8B5CF6" }, geral: { bg: "rgba(156, 163, 175, 0.16)", text: "#D1D5DB", icon: "#9CA3AF" } }, accent: { purple: "#8B5CF6", blue: "#3B82F6", green: "#22C55E", orange: "#F59E0B" }, height: { compact: "28px", default: "40px", tall: "48px" }, fontSize: { small: "11px", medium: "12px", large: "13px" }, separator: { color: "rgba(255, 255, 255, 0.20)", size: "12px" }, icon: { color: "rgba(255, 255, 255, 0.70)", size: "14px" }, spacing: { horizontal: "16px", betweenItems: "24px", internal: "8px" }, shadow: { soft: "0 1px 3px rgba(0, 0, 0, 0.12)", medium: "0 2px 6px rgba(0, 0, 0, 0.18)", strong: "0 4px 12px rgba(0, 0, 0, 0.25)" }, speed: { slow: 45, medium: 30, fast: 20 } };
function getCategoryColor(category) {
  const normalized = category.toLowerCase();
  return TICKER_TOKENS.tag[normalized] || TICKER_TOKENS.tag.geral;
}
function getSpeedInSeconds(speed) {
  return TICKER_TOKENS.speed[speed] || TICKER_TOKENS.speed.medium;
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { tokensLoaded: !!TICKER_TOKENS, hasCategories: Object.keys(TICKER_TOKENS.tag).length > 0, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, categoryCount: Object.keys(TICKER_TOKENS.tag).length, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
var design_tokens_default = TICKER_TOKENS;
export {
  MODULE_ID,
  TICKER_TOKENS,
  VERSION,
  design_tokens_default as default,
  getCategoryColor,
  getPorts,
  getSpeedInSeconds,
  getVersion,
  healthCheck,
  info,
  injectPorts
};
