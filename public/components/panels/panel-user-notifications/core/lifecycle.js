import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-user-notifications/core/lifecycle";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
class LifecycleManager {
  constructor(component, options = {}) {
    _initPorts();
    this.component = component;
    this.moduleId = options.moduleId || MODULE_ID;
    this.state = "unmounted";
    this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [], error: [] };
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  mount() {
    if (this.state === "mounted" || this.state === "mounting") return Promise.resolve(this);
    this.state = "mounting";
    const self = this;
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
  }
  unmount() {
    if (this.state === "unmounted" || this.state === "unmounting") return Promise.resolve(this);
    this.state = "unmounting";
    const self = this;
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
  }
  _runHooks(name, payload) {
    const hooks = this.hooks[name] || [];
    let chain = Promise.resolve();
    const self = this;
    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      chain = chain.then(() => Promise.resolve(hook(self.component, payload))).catch((e) => {
        self._metrics.errorCount++;
        const logger = _getPort("logger");
        if (logger && logger.error) logger.error(`[${self.moduleId}] Hook ${name} error:`, e);
      });
    }
    return chain;
  }
  on(event, handler) {
    if (this.hooks[event]) this.hooks[event].push(handler);
    return () => this.off(event, handler);
  }
  off(event, handler) {
    if (this.hooks[event]) {
      const idx = this.hooks[event].indexOf(handler);
      if (idx > -1) this.hooks[event].splice(idx, 1);
    }
  }
  onBeforeMount(h) {
    return this.on("beforeMount", h);
  }
  onMounted(h) {
    return this.on("mounted", h);
  }
  onBeforeUnmount(h) {
    return this.on("beforeUnmount", h);
  }
  onUnmounted(h) {
    return this.on("unmounted", h);
  }
  onError(h) {
    return this.on("error", h);
  }
  getState() {
    return this.state;
  }
  isMounted() {
    return this.state === "mounted";
  }
  reset() {
    this.state = "unmounted";
    Object.keys(this.hooks).forEach((k) => {
      this.hooks[k] = [];
    });
    return this;
  }
  healthCheck() {
    const validStates = ["unmounted", "mounting", "mounted", "unmounting", "error"];
    const checks = {
      validState: validStates.indexOf(this.state) !== -1,
      hasComponent: !!this.component,
      noRecentErrors: this._metrics.errorCount === 0 || Date.now() - this._metrics.lastTransitionAt > 6e4,
      portsInitialized: Ports.isInitialized()
    };
    const passed = Object.values(checks).filter(Boolean).length;
    let status = "HEALTHY";
    if (passed < 4) status = "DEGRADED";
    if (this.state === "error") status = "UNHEALTHY";
    return { status, score: `${passed}/4`, checks, state: this.state, version: VERSION, moduleId: this.moduleId };
  }
  info() {
    const hookCounts = {};
    Object.keys(this.hooks).forEach((k) => {
      hookCounts[k] = this.hooks[k].length;
    });
    return { version: VERSION, moduleId: this.moduleId, state: this.state, portsInitialized: Ports.isInitialized(), metrics: { ...this._metrics }, hookCounts, healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
}
function createLifecycleManager(component, options = {}) {
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
