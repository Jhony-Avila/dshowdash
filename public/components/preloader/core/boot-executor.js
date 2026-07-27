import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { BOOT_EVENTS } from "/core/runtime/events/catalog/boot.events.js";
import { PreloaderPolicy, shouldLoadVideo, shouldDegradeOnAuthTimeout, shouldDegradeOnComponentsTimeout, shouldForceFinalizeOnTimeout, getRetryBackoff } from "./policy.js";
import { BOOT_RESULTS, EXIT_CODES, PRELOADER_BOOT_EVENTS, createBootOutput } from "./contracts.js";
import { registerTimer, registerListener, destroy } from "./destroyer.js";
const VERSION = "1.5.0-P22";
const MODULE_ID = "preloader-boot-executor";
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
function _log(level, msg, ctx) {
  const logger = _getPort("logger");
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (level === "error") {
    if (logger.error) logger.error(msg, ctx);
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(msg, ctx);
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(msg, ctx);
    return;
  }
  if (logger.debug) logger.debug(msg, ctx);
}
function BootExecutor(dependencies = {}) {
  this.bootId = `boot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  this.startTime = null;
  this.endTime = null;
  this.domManager = dependencies.domManager || null;
  this.modeManager = dependencies.modeManager || null;
  this.eventBus = dependencies.eventBus || null;
  this.telemetry = dependencies.telemetry || null;
  this._phase = "idle";
  this._progress = 0;
  this._authResult = null;
  this._videoResult = null;
  this._componentsResult = null;
  this._errors = [];
  this._trace = [];
  this._aborted = false;
  this._retryCount = 0;
  this._eventBusSubscriptions = [];
  this._metrics = { phaseChanges: 0, progressUpdates: 0, eventsEmitted: 0 };
  _initPorts();
  _log("debug", "Boot executor created", { bootId: this.bootId });
}
BootExecutor.prototype.execute = function() {
  const self = this;
  if (self._aborted) {
    return Promise.resolve(self._createOutput(BOOT_RESULTS.CANCELLED, EXIT_CODES.BOOT_CANCELLED_USER));
  }
  self.startTime = Date.now();
  self._setPhase("initializing");
  self._addTrace("boot:start");
  self._emit(PRELOADER_BOOT_EVENTS.BOOT_START, { bootId: self.bootId });
  const globalTimeout = PreloaderPolicy.getTimeout("global");
  const globalTimeoutId = registerTimer(setTimeout(() => {
    self._handleGlobalTimeout();
  }, globalTimeout));
  let videoPromise;
  if (shouldLoadVideo()) {
    self._setPhase("loading-video");
    videoPromise = self._executeVideoLoad();
  } else {
    videoPromise = Promise.resolve({ loaded: false, reason: "disabled-by-policy" });
  }
  return videoPromise.then((videoResult) => {
    self._videoResult = videoResult;
    self._setPhase("waiting-auth");
    return self._executeAuthWait();
  }).then((authResult) => {
    self._authResult = authResult;
    self._setPhase("loading-components");
    return self._executeComponentsWait();
  }).then((componentsResult) => {
    self._componentsResult = componentsResult;
    self._setPhase("finalizing");
    clearTimeout(globalTimeoutId);
    return self._finalize();
  }).catch((error) => {
    self._errors.push({ error: error.message, timestamp: Date.now() });
    _log("error", "Boot execution error", { error: error.message, bootId: self.bootId });
    return self._createOutput(BOOT_RESULTS.FAILED, EXIT_CODES.BOOT_FAILED_CRITICAL);
  });
};
BootExecutor.prototype._executeVideoLoad = function() {
  const self = this;
  const timeout = PreloaderPolicy.getTimeout("video");
  self._addTrace("video:start");
  return new Promise((resolve) => {
    const timeoutId = registerTimer(setTimeout(() => {
      self._addTrace("video:timeout");
      resolve({ loaded: false, reason: "timeout" });
    }, timeout));
    if (self.domManager) {
      const video = self.domManager.getVideo();
      if (video) {
        const onLoaded = () => {
          clearTimeout(timeoutId);
          self._addTrace("video:loaded");
          resolve({ loaded: true });
        };
        const onError = () => {
          clearTimeout(timeoutId);
          self._addTrace("video:error");
          resolve({ loaded: false, reason: "load-error" });
        };
        registerListener(video, "canplaythrough", onLoaded, { once: true });
        registerListener(video, "error", onError, { once: true });
        self.domManager.playVideo().catch(() => {
        });
      } else {
        clearTimeout(timeoutId);
        resolve({ loaded: false, reason: "no-video-element" });
      }
    } else {
      clearTimeout(timeoutId);
      resolve({ loaded: false, reason: "no-dom-manager" });
    }
  });
};
BootExecutor.prototype._executeAuthWait = function() {
  const self = this;
  const timeout = PreloaderPolicy.getTimeout("auth");
  self._addTrace("auth:start");
  self._setProgress(20);
  return new Promise((resolve) => {
    const timeoutId = registerTimer(setTimeout(() => {
      self._addTrace("auth:timeout");
      if (shouldDegradeOnAuthTimeout({ progress: self._progress })) {
        resolve({ authenticated: null, source: "timeout-degraded", timedOut: true });
      } else {
        resolve({ authenticated: false, source: "timeout-failed", timedOut: true });
      }
    }, timeout));
    if (self.eventBus) {
      const handler = (data) => {
        clearTimeout(timeoutId);
        self._addTrace("auth:received", { authenticated: data ? data.authenticated : null });
        resolve({ authenticated: data ? data.authenticated : false, source: data && data.source || "event", user: data && data.user || null });
      };
      self.eventBus.once(AUTH_EVENTS.READY, handler);
      self._eventBusSubscriptions.push({ event: AUTH_EVENTS.READY, handler });
      const gs = _getPort("globalState");
      if (gs && gs.isAuthenticated && gs.isAuthenticated()) {
        clearTimeout(timeoutId);
        self._addTrace("auth:already-authenticated");
        resolve({ authenticated: true, source: "GlobalState" });
      }
    } else {
      clearTimeout(timeoutId);
      resolve({ authenticated: null, source: "no-eventbus" });
    }
  });
};
BootExecutor.prototype._executeComponentsWait = function() {
  const self = this;
  const timeout = PreloaderPolicy.getTimeout("components");
  self._addTrace("components:start");
  self._setProgress(50);
  return new Promise((resolve) => {
    const timeoutId = registerTimer(setTimeout(() => {
      self._addTrace("components:timeout");
      if (shouldDegradeOnComponentsTimeout({ progress: self._progress })) {
        resolve({ ready: false, reason: "timeout-degraded", count: 0 });
      } else {
        if (self._retryCount < PreloaderPolicy.get("retries.componentsMax")) {
          self._retryCount++;
          self._addTrace("components:retry", { attempt: self._retryCount });
          registerTimer(setTimeout(() => {
            self._executeComponentsWait().then(resolve);
          }, getRetryBackoff()));
          return;
        }
        resolve({ ready: false, reason: "timeout-failed", count: 0 });
      }
    }, timeout));
    if (self.eventBus) {
      const handler = (data) => {
        clearTimeout(timeoutId);
        self._setProgress(100);
        self._addTrace("components:ready", { count: data ? data.count : 0 });
        resolve({ ready: true, count: data && data.count || 0, components: data && data.components || [] });
      };
      self.eventBus.once(BOOT_EVENTS.COMPONENTS_READY, handler);
      self._eventBusSubscriptions.push({ event: BOOT_EVENTS.COMPONENTS_READY, handler });
    } else {
      registerTimer(setTimeout(() => {
        clearTimeout(timeoutId);
        self._setProgress(100);
        resolve({ ready: true, reason: "simulated", count: 0 });
      }, 1e3));
    }
  });
};
BootExecutor.prototype._finalize = function() {
  const self = this;
  self.endTime = Date.now();
  self._addTrace("boot:finalize");
  const authOk = self._authResult ? self._authResult.authenticated !== false : false;
  const componentsOk = self._componentsResult ? self._componentsResult.ready !== false : false;
  const videoOk = self._videoResult ? self._videoResult.loaded !== false : false;
  let result, exitCode;
  if (authOk && componentsOk) {
    if (videoOk) {
      result = BOOT_RESULTS.SUCCESS;
      exitCode = EXIT_CODES.BOOT_COMPLETE;
    } else {
      result = BOOT_RESULTS.SUCCESS;
      exitCode = EXIT_CODES.BOOT_COMPLETE_NO_VIDEO;
    }
  } else if (self._authResult && self._authResult.timedOut || self._componentsResult && self._componentsResult.reason && self._componentsResult.reason.indexOf("timeout") !== -1) {
    result = BOOT_RESULTS.DEGRADED;
    exitCode = self._authResult && self._authResult.timedOut ? EXIT_CODES.BOOT_DEGRADED_AUTH : EXIT_CODES.BOOT_DEGRADED_COMPONENTS;
  } else {
    result = BOOT_RESULTS.FAILED;
    exitCode = self._authResult && self._authResult.authenticated === false ? EXIT_CODES.BOOT_FAILED_AUTH : EXIT_CODES.BOOT_FAILED_CRITICAL;
  }
  const output = self._createOutput(result, exitCode);
  const eventMap = {};
  eventMap[BOOT_RESULTS.SUCCESS] = PRELOADER_BOOT_EVENTS.BOOT_COMPLETE;
  eventMap[BOOT_RESULTS.DEGRADED] = PRELOADER_BOOT_EVENTS.BOOT_DEGRADED;
  eventMap[BOOT_RESULTS.FAILED] = PRELOADER_BOOT_EVENTS.BOOT_FAILED;
  eventMap[BOOT_RESULTS.TIMEOUT] = PRELOADER_BOOT_EVENTS.BOOT_TIMEOUT;
  eventMap[BOOT_RESULTS.CANCELLED] = PRELOADER_BOOT_EVENTS.BOOT_CANCELLED;
  self._emit(eventMap[result] || PRELOADER_BOOT_EVENTS.BOOT_COMPLETE, output);
  _log("info", "Boot finalized", { result, exitCode, duration: output.duration, bootId: self.bootId });
  return output;
};
BootExecutor.prototype._handleGlobalTimeout = function() {
  const self = this;
  self._addTrace("timeout:global");
  if (shouldForceFinalizeOnTimeout({ progress: self._progress })) {
    _log("warn", "Global timeout - forcing finalization", { progress: self._progress });
    self._emit(PRELOADER_BOOT_EVENTS.BOOT_TIMEOUT, self._createOutput(BOOT_RESULTS.TIMEOUT, EXIT_CODES.BOOT_TIMEOUT_GLOBAL));
  }
};
BootExecutor.prototype._setPhase = function(phase) {
  const prev = this._phase;
  this._phase = phase;
  this._metrics.phaseChanges++;
  this._emit(PRELOADER_BOOT_EVENTS.BOOT_PHASE_CHANGE, { from: prev, to: phase });
  if (this.modeManager) {
    this.modeManager.setState(phase);
  }
  _log("debug", "Phase changed", { from: prev, to: phase, bootId: this.bootId });
};
BootExecutor.prototype._setProgress = function(progress) {
  this._progress = Math.min(100, Math.max(0, progress));
  this._metrics.progressUpdates++;
  this._emit(PRELOADER_BOOT_EVENTS.BOOT_PROGRESS, { progress: this._progress });
  if (this.domManager) {
    this.domManager.setProgress(this._progress);
  }
};
BootExecutor.prototype._addTrace = function(action, data) {
  this._trace.push({ action, data: data || null, timestamp: Date.now(), elapsed: this.startTime ? Date.now() - this.startTime : 0 });
};
BootExecutor.prototype._emit = function(event, data) {
  this._metrics.eventsEmitted++;
  const payload = Object.assign({}, data, { bootId: this.bootId, source: MODULE_ID, timestamp: Date.now() });
  if (this.eventBus) {
    this.eventBus.emit(event, payload);
  }
};
BootExecutor.prototype._createOutput = function(result, exitCode) {
  return createBootOutput(result, exitCode, { bootId: this.bootId, startTime: this.startTime, phase: this._phase, progress: this._progress, authChecked: !!this._authResult, authenticated: this._authResult ? this._authResult.authenticated : null, authSource: this._authResult ? this._authResult.source : null, componentsReady: this._componentsResult ? this._componentsResult.ready : null, componentCount: this._componentsResult ? this._componentsResult.count : null, videoLoaded: this._videoResult ? this._videoResult.loaded : null, videoError: this._videoResult ? this._videoResult.reason : null, forceMode: false, retries: this._retryCount, errors: this._errors, trace: this._trace });
};
BootExecutor.prototype.abort = function() {
  this._aborted = true;
  this._addTrace("boot:aborted");
  _log("info", "Boot aborted", { bootId: this.bootId });
};
BootExecutor.prototype.destroy = function() {
  return destroy({ instanceId: this.bootId, eventBus: this.eventBus, eventBusSubscriptions: this._eventBusSubscriptions });
};
BootExecutor.prototype.getStatus = function() {
  return { version: VERSION, moduleId: MODULE_ID, bootId: this.bootId, phase: this._phase, progress: this._progress, aborted: this._aborted, retryCount: this._retryCount, traceLength: this._trace.length, errorCount: this._errors.length, portsInitialized: Ports.isInitialized(), metrics: this._metrics, p22Compliant: true };
};
BootExecutor.prototype.healthCheck = function() {
  const checks = { notAborted: !this._aborted, noErrors: this._errors.length === 0, hasDOMManager: !!this.domManager, hasLogger: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/5`, moduleId: MODULE_ID, version: VERSION, bootId: this.bootId, checks, portsInitialized: Ports.isInitialized(), p22Compliant: true, timestamp: Date.now() };
};
BootExecutor.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, bootId: this.bootId, portsInitialized: Ports.isInitialized(), p22Compliant: true, status: this.getStatus(), healthCheck: this.healthCheck() };
};
function createBootExecutor(dependencies) {
  return new BootExecutor(dependencies);
}
function healthCheck() {
  const checks = { executorReady: true, hasLogger: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, moduleId: MODULE_ID, version: VERSION, checks, portsInitialized: Ports.isInitialized(), p22Compliant: true, timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, description: "Pure executor for preloader boot - executes based on policy, does not decide", portsInitialized: Ports.isInitialized(), p22Compliant: true };
}
var boot_executor_default = { VERSION, MODULE_ID, BootExecutor, createBootExecutor, healthCheck, info, injectPorts, getPorts };
export {
  BootExecutor,
  MODULE_ID,
  VERSION,
  createBootExecutor,
  boot_executor_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
