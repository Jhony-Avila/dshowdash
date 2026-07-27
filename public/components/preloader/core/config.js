import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { PreloaderPolicy } from "./policy.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "preloader-config";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const DEFAULT_CONFIG = {
  timeoutVideo: 5e3,
  timeoutGlobal: 3e4,
  timeoutComponentsReady: 1e4,
  timeoutComponentsReadyBackoff: 5e3,
  timeoutComponentsReadyMax: 3,
  timeoutLogin: 15e3,
  pollInterval: 200,
  hideDelayMs: 300,
  progressDebounceMs: 32,
  maxTraceEntries: 100,
  telemetrySchema: "preloader-v8-aaa",
  useShadowRoot: false,
  orchestrator: { notifyOnBoot: true, trackStatus: true },
  debug: false,
  useAAAMode: true
};
function createConfig(userConfig) {
  if (!userConfig) userConfig = {};
  const CFG = _getPort("config") || {};
  if (userConfig.profile) {
    PreloaderPolicy.applyProfile(userConfig.profile);
  }
  const policyConfig = PreloaderPolicy.get();
  const policyTimeouts = policyConfig.timeouts || {};
  const policyRetries = policyConfig.retries || {};
  const policyProgress = policyConfig.progress || {};
  const cfgTimeouts = CFG.timeouts || {};
  const cfgFeatures = CFG.features || {};
  const cfgApp = CFG.app || {};
  return Object.assign({}, DEFAULT_CONFIG, {
    timeoutVideo: policyTimeouts.video || cfgTimeouts.preloaderVideoMs || DEFAULT_CONFIG.timeoutVideo,
    timeoutGlobal: policyTimeouts.global || cfgTimeouts.bootMaxMs || DEFAULT_CONFIG.timeoutGlobal,
    timeoutComponentsReady: policyTimeouts.components || cfgTimeouts.componentsReadyMs || DEFAULT_CONFIG.timeoutComponentsReady,
    timeoutComponentsReadyBackoff: policyRetries.backoffMs || cfgTimeouts.componentsReadyBackoffMs || DEFAULT_CONFIG.timeoutComponentsReadyBackoff,
    timeoutComponentsReadyMax: policyRetries.componentsMax || cfgTimeouts.componentsReadyMaxRetries || DEFAULT_CONFIG.timeoutComponentsReadyMax,
    timeoutLogin: cfgTimeouts.loginWaitMs || DEFAULT_CONFIG.timeoutLogin,
    pollInterval: policyProgress.pollInterval || cfgTimeouts.mfContainerPollMs || DEFAULT_CONFIG.pollInterval,
    hideDelayMs: policyTimeouts.hide || DEFAULT_CONFIG.hideDelayMs,
    progressDebounceMs: policyProgress.debounceMs || DEFAULT_CONFIG.progressDebounceMs,
    useShadowRoot: cfgFeatures.preloaderShadowRoot !== void 0 ? cfgFeatures.preloaderShadowRoot : DEFAULT_CONFIG.useShadowRoot,
    debug: cfgApp.debug !== void 0 ? cfgApp.debug : DEFAULT_CONFIG.debug,
    useAAAMode: userConfig.useAAAMode !== void 0 ? userConfig.useAAAMode : DEFAULT_CONFIG.useAAAMode
  }, userConfig);
}
function getDefaultConfig() {
  return Object.assign({}, DEFAULT_CONFIG);
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { defaultsValid: Object.keys(DEFAULT_CONFIG).length > 0, portsInitialized: Ports.isInitialized(), loggerAvailable: !!logger };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, version: VERSION, moduleId: MODULE_ID, defaults: Object.keys(DEFAULT_CONFIG).length, checks, portsInitialized: Ports.isInitialized() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
var config_default = { VERSION, MODULE_ID, createConfig, getDefaultConfig, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createConfig,
  config_default as default,
  getDefaultConfig,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
