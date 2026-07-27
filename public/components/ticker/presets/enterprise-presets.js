import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.4.0-P17WI";
const MODULE_ID = "ticker.presets.enterprise-presets";
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ?? false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
const TICKER_PRESETS = { "enterprise-default": { name: "Padrao Enterprise", description: "Configuracao balanceada para uso corporativo", config: { behavior: { mode: "ticker", direction: "left", speed: "medium", pauseOnHover: true }, visual: { height: "default", fontSize: "medium", showTag: true, showIcon: true, showTime: true, separatorStyle: "bullet" }, theme: { background: "darkA", accent: "purple", text: "light", tagStyle: "category", shadow: "soft" } } }, "reading-comfort": { name: "Leitura Confortavel", description: "Otimizado para leitura prolongada", config: { behavior: { mode: "ticker", direction: "left", speed: "slow", pauseOnHover: true }, visual: { height: "tall", fontSize: "large", showTag: true, showIcon: false, showTime: true, separatorStyle: "bar" }, theme: { background: "darkA", accent: "blue", text: "light", tagStyle: "mono", shadow: "soft" }, accessibility: { respectReducedMotion: true, highContrast: false } } }, "colorful-soft": { name: "Colorido Suave", description: "Visual vibrante com cores por categoria", config: { behavior: { mode: "ticker", direction: "left", speed: "medium", pauseOnHover: true }, visual: { height: "default", fontSize: "medium", showTag: true, showIcon: true, showTime: true, separatorStyle: "chevron" }, theme: { background: "darkB", accent: "purple", text: "light", tagStyle: "category", shadow: "medium" } } } };
function getPreset(name) {
  const preset = TICKER_PRESETS[name] || TICKER_PRESETS["enterprise-default"];
  _log("debug", `Preset loaded: ${name}`);
  return preset;
}
function getAllPresets() {
  return Object.keys(TICKER_PRESETS).map((key) => ({ id: key, ...TICKER_PRESETS[key] }));
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { presetsLoaded: !!TICKER_PRESETS, hasDefault: !!TICKER_PRESETS["enterprise-default"], loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, presetCount: Object.keys(TICKER_PRESETS).length, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
var enterprise_presets_default = TICKER_PRESETS;
export {
  MODULE_ID,
  TICKER_PRESETS,
  VERSION,
  enterprise_presets_default as default,
  getAllPresets,
  getPorts,
  getPreset,
  getVersion,
  healthCheck,
  info,
  injectPorts
};
