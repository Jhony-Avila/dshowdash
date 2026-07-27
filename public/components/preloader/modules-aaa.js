import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "preloader-modules-aaa";
import { BOOT_RESULTS, EXIT_CODES, PRELOADER_BOOT_EVENTS, createBootOutput, validateBootOutput } from "./core/contracts.js";
import { PreloaderPolicy, POLICY_PROFILES, shouldLoadVideo, shouldDegradeOnAuthTimeout, shouldDegradeOnComponentsTimeout, shouldForceFinalizeOnTimeout, shouldRetry, getRetryBackoff } from "./core/policy.js";
import { PreloaderDOMManager, SELECTORS, createDOMManager } from "./core/dom-manager.js";
import { getPreloaderTemplate, getMinimalTemplate, getFastTemplate, getCorporateTemplate, getKioskTemplate, getRecoveryTemplate, getTemplateForProfile } from "./template-aaa.js";
import { MODES, STATES, MODE_CONFIGS, PreloaderModeManager, createModeManager } from "./core/modes.js";
import { BootExecutor, createBootExecutor } from "./core/boot-executor.js";
import { destroy, quickDestroy, verifyDestruction, resetRegistry, registerTimer, registerInterval, registerObserver, registerListener, registerAnimation, registerPromise } from "./core/destroyer.js";
import { PreloaderPolicy as PreloaderPolicy2 } from "./core/policy.js";
import { createModeManager as createModeManager2 } from "./core/modes.js";
import { createDOMManager as createDOMManager2 } from "./core/dom-manager.js";
import { getTemplateForProfile as getTemplateForProfile2 } from "./template-aaa.js";
import { createBootExecutor as createBootExecutor2 } from "./core/boot-executor.js";
import { quickDestroy as quickDestroy2, verifyDestruction as verifyDestruction2 } from "./core/destroyer.js";
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
const PreloaderAAA = function(config) {
  if (config === void 0) config = {};
  this.version = VERSION;
  this.instanceId = `preloader_aaa_${Date.now()}`;
  if (config.profile) PreloaderPolicy2.applyProfile(config.profile);
  this.modeManager = createModeManager2();
  this.domManager = createDOMManager2({ container: config.container || null, useShadowDOM: config.useShadowDOM || false });
  this.bootExecutor = null;
  if (config.eventBus) Ports.inject({ eventBus: config.eventBus });
  else _initPorts();
  this.eventBus = _getPort("eventBus");
  this._mounted = false;
  this._booted = false;
  this._destroyed = false;
};
PreloaderAAA.prototype.mount = function(options) {
  if (options === void 0) options = {};
  if (this._mounted) return false;
  const profile = options.profile || "standard";
  const templateFn = getTemplateForProfile2(profile, options);
  this.domManager.mount(templateFn);
  this._mounted = true;
  return true;
};
PreloaderAAA.prototype.boot = function() {
  const self = this;
  if (!self._mounted) self.mount();
  if (self._booted) return Promise.resolve(null);
  self.bootExecutor = createBootExecutor2({ domManager: self.domManager, modeManager: self.modeManager, eventBus: self.eventBus });
  return self.bootExecutor.execute().then((result) => {
    self._booted = true;
    return result;
  });
};
PreloaderAAA.prototype.hide = function(duration) {
  const self = this;
  if (duration === void 0) duration = 300;
  if (!self._mounted) return Promise.resolve();
  return self.domManager.fadeOut(duration).then(() => {
    self.domManager.setVisible(false);
  });
};
PreloaderAAA.prototype.destroy = function() {
  if (this._destroyed) return;
  if (this.bootExecutor) this.bootExecutor.destroy();
  this.domManager.unmount();
  quickDestroy2();
  this._destroyed = true;
  this._mounted = false;
  this._booted = false;
  return verifyDestruction2();
};
PreloaderAAA.prototype.isMounted = function() {
  return this._mounted;
};
PreloaderAAA.prototype.isBooted = function() {
  return this._booted;
};
PreloaderAAA.prototype.isDestroyed = function() {
  return this._destroyed;
};
PreloaderAAA.prototype.getStatus = function() {
  const ps = Ports.snapshot();
  return { version: VERSION, instanceId: this.instanceId, mounted: this._mounted, booted: this._booted, destroyed: this._destroyed, mode: this.modeManager ? this.modeManager.getStatus() : null, dom: this.domManager ? this.domManager.getStatus() : null, boot: this.bootExecutor ? this.bootExecutor.getStatus() : null, policy: PreloaderPolicy2.getStatus(), portsInitialized: ps._initialized };
};
PreloaderAAA.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  const checks = { modeManager: this.modeManager ? this.modeManager.healthCheck().status === "HEALTHY" : false, domManager: !this._mounted || (this.domManager ? this.domManager.healthCheck().status === "HEALTHY" : false), notDestroyed: !this._destroyed, portsInitialized: ps._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, instanceId: this.instanceId, checks, portsInitialized: ps._initialized, timestamp: Date.now() };
};
PreloaderAAA.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, architecture: "AAA", principles: ["Preloader prepara, n\xE3o governa", "Policy-driven, n\xE3o decision-heavy", "Destrui\xE7\xE3o 100% completa", "DOM isolado com data-attributes", "Modos declarativos"], status: this.getStatus(), healthCheck: this.healthCheck() };
};
PreloaderAAA.prototype.injectPorts = function(ports) {
  Ports.inject(ports);
  this.eventBus = _getPort("eventBus");
};
PreloaderAAA.prototype.getPorts = () => getPorts();
function createPreloaderAAA(config) {
  if (config === void 0) config = {};
  return new PreloaderAAA(config);
}
function getModuleList() {
  return [{ name: "contracts", path: "./core/contracts.js", category: "core" }, { name: "policy", path: "./core/policy.js", category: "core" }, { name: "dom-manager", path: "./core/dom-manager.js", category: "ui" }, { name: "template-aaa", path: "./template-aaa.js", category: "ui" }, { name: "modes", path: "./core/modes.js", category: "state" }, { name: "boot-executor", path: "./core/boot-executor.js", category: "execution" }, { name: "destroyer", path: "./core/destroyer.js", category: "execution" }];
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, modules: getModuleList().length, portsInitialized: ps._initialized, timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, modules: getModuleList(), exports: ["BOOT_RESULTS", "EXIT_CODES", "PRELOADER_BOOT_EVENTS", "PreloaderPolicy", "POLICY_PROFILES", "PreloaderDOMManager", "SELECTORS", "MODES", "STATES", "PreloaderModeManager", "BootExecutor", "destroy", "quickDestroy", "PreloaderAAA", "createPreloaderAAA"] };
}
var modules_aaa_default = { VERSION, MODULE_ID, PreloaderAAA, createPreloaderAAA, getModuleList, healthCheck, info, injectPorts, getPorts };
export {
  BOOT_RESULTS,
  BootExecutor,
  EXIT_CODES,
  MODES,
  MODE_CONFIGS,
  MODULE_ID,
  POLICY_PROFILES,
  PRELOADER_BOOT_EVENTS,
  PreloaderAAA,
  PreloaderDOMManager,
  PreloaderModeManager,
  PreloaderPolicy,
  SELECTORS,
  STATES,
  VERSION,
  createBootExecutor,
  createBootOutput,
  createDOMManager,
  createModeManager,
  createPreloaderAAA,
  modules_aaa_default as default,
  destroy,
  getCorporateTemplate,
  getFastTemplate,
  getKioskTemplate,
  getMinimalTemplate,
  getModuleList,
  getPorts,
  getPreloaderTemplate,
  getRecoveryTemplate,
  getRetryBackoff,
  getTemplateForProfile,
  healthCheck,
  info,
  injectPorts,
  quickDestroy,
  registerAnimation,
  registerInterval,
  registerListener,
  registerObserver,
  registerPromise,
  registerTimer,
  resetRegistry,
  shouldDegradeOnAuthTimeout,
  shouldDegradeOnComponentsTimeout,
  shouldForceFinalizeOnTimeout,
  shouldLoadVideo,
  shouldRetry,
  validateBootOutput,
  verifyDestruction
};
