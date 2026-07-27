import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels._shared.core.lifecycle";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
function LifecycleManager(component, options) {
  options = options || {};
  _initPorts();
  this.component = component;
  this.moduleId = options.moduleId || "unknown";
  this.state = "unmounted";
  this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [], error: [] };
  this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  this._initialized = false;
}
LifecycleManager.prototype.mount = function() {
  const self = this;
  if (this.state === "mounted" || this.state === "mounting") return Promise.resolve(this);
  this.state = "mounting";
  return this._runHooks("beforeMount").then(() => {
    self.state = "mounted";
    return self._runHooks("mounted");
  }).then(() => {
    self._metrics.mountCount++;
    self._metrics.lastTransitionAt = Date.now();
    return self;
  }).catch((error) => {
    self._metrics.errorCount++;
    self.state = "error";
    return self._runHooks("error", error).then(() => {
      throw error;
    });
  });
};
LifecycleManager.prototype.unmount = function() {
  const self = this;
  if (this.state === "unmounted" || this.state === "unmounting") return Promise.resolve(this);
  this.state = "unmounting";
  return this._runHooks("beforeUnmount").then(() => {
    self.state = "unmounted";
    return self._runHooks("unmounted");
  }).then(() => {
    self._metrics.unmountCount++;
    self._metrics.lastTransitionAt = Date.now();
    return self;
  }).catch((error) => {
    self._metrics.errorCount++;
    return self._runHooks("error", error);
  });
};
LifecycleManager.prototype._runHooks = function(name, payload) {
  const self = this;
  const hooks = this.hooks[name] || [];
  let chain = Promise.resolve();
  for (let i = 0; i < hooks.length; i++) {
    ((hook) => {
      chain = chain.then(() => Promise.resolve(hook(self.component, payload))).catch((e) => {
        self._metrics.errorCount++;
        const logger = _getPort("logger");
        if (logger && logger.error) logger.error(`[${self.moduleId}] Hook ${name} error:`, e);
      });
    })(hooks[i]);
  }
  return chain;
};
LifecycleManager.prototype.on = function(event, handler) {
  const self = this;
  if (this.hooks[event]) this.hooks[event].push(handler);
  return () => {
    self.off(event, handler);
  };
};
LifecycleManager.prototype.off = function(event, handler) {
  if (this.hooks[event]) {
    const idx = this.hooks[event].indexOf(handler);
    if (idx > -1) this.hooks[event].splice(idx, 1);
  }
};
LifecycleManager.prototype.onBeforeMount = function(h) {
  return this.on("beforeMount", h);
};
LifecycleManager.prototype.onMounted = function(h) {
  return this.on("mounted", h);
};
LifecycleManager.prototype.onBeforeUnmount = function(h) {
  return this.on("beforeUnmount", h);
};
LifecycleManager.prototype.onUnmounted = function(h) {
  return this.on("unmounted", h);
};
LifecycleManager.prototype.onError = function(h) {
  return this.on("error", h);
};
LifecycleManager.prototype.getState = function() {
  return this.state;
};
LifecycleManager.prototype.isMounted = function() {
  return this.state === "mounted";
};
LifecycleManager.prototype.reset = function() {
  this.state = "unmounted";
  const self = this;
  Object.keys(this.hooks).forEach((k) => {
    self.hooks[k] = [];
  });
  return this;
};
LifecycleManager.prototype.healthCheck = function() {
  const validStates = ["unmounted", "mounting", "mounted", "unmounting", "error"];
  const checks = { validState: validStates.indexOf(this.state) !== -1, hasComponent: !!this.component, noRecentErrors: this._metrics.errorCount === 0 || Date.now() - this._metrics.lastTransitionAt > 6e4, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  let total = 0;
  for (const k in checks) {
    if (checks.hasOwnProperty(k)) {
      total++;
      if (checks[k]) passed++;
    }
  }
  let status = "HEALTHY";
  if (passed < total) status = "DEGRADED";
  if (this.state === "error") status = "UNHEALTHY";
  return { status, score: `${passed}/${total}`, checks, state: this.state, version: VERSION, moduleId: this.moduleId };
};
LifecycleManager.prototype.info = function() {
  const hookCounts = {};
  for (const k in this.hooks) {
    if (this.hooks.hasOwnProperty(k)) hookCounts[k] = this.hooks[k].length;
  }
  return { version: VERSION, moduleId: this.moduleId, state: this.state, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), hookCounts, healthCheck: this.healthCheck() };
};
LifecycleManager.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
LifecycleManager.prototype.resetMetrics = function() {
  this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
};
function createLifecycleManager(component, options) {
  return new LifecycleManager(component, options);
}
var lifecycle_default = LifecycleManager;
export {
  LifecycleManager,
  MODULE_ID,
  VERSION,
  createLifecycleManager,
  lifecycle_default as default,
  getPorts,
  injectPorts
};
