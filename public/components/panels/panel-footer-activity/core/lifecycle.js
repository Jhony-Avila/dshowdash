import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-footer-activity.core.lifecycle";
const VERSION = "9.3.0-P2-ENTERPRISE";
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
class LifecycleManager {
  constructor(component) {
    this.component = component;
    this.state = "unmounted";
    this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [] };
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    this.state = "mounting";
    await this._runHooks("beforeMount");
    this.state = "mounted";
    await this._runHooks("mounted");
    this._metrics.mountCount++;
    this._metrics.lastTransitionAt = Date.now();
  }
  async unmount() {
    this.state = "unmounting";
    await this._runHooks("beforeUnmount");
    this.state = "unmounted";
    await this._runHooks("unmounted");
    this._metrics.unmountCount++;
    this._metrics.lastTransitionAt = Date.now();
  }
  async _runHooks(name) {
    for (const hook of this.hooks[name] || []) {
      try {
        await hook(this.component);
      } catch (e) {
        this._metrics.errorCount++;
        _getPort("logger")?.error(`[${MODULE_ID}] Hook ${name} error:`, e);
      }
    }
  }
  onBeforeMount(h) {
    this.hooks.beforeMount.push(h);
  }
  onMounted(h) {
    this.hooks.mounted.push(h);
  }
  onBeforeUnmount(h) {
    this.hooks.beforeUnmount.push(h);
  }
  onUnmounted(h) {
    this.hooks.unmounted.push(h);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const checks = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? "healthy" : "degraded", score: passed, maxScore: 3, checks, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: this.state, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }
}
var lifecycle_default = LifecycleManager;
export {
  LifecycleManager,
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getPorts,
  injectPorts
};
