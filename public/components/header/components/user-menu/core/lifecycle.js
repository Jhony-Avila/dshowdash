const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/user-menu/core/lifecycle";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class LifecycleManager {
  constructor(component) {
    this.component = component;
    this.state = "unmounted";
    this.hooks = { beforeMount: [], mounted: [], beforeUpdate: [], updated: [], beforeUnmount: [], unmounted: [] };
    this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  async mount() {
    if (this.state !== "unmounted") throw new Error(`Cannot mount: component is ${this.state}`);
    this.state = "mounting";
    await this._runHooks("beforeMount");
    this.state = "mounted";
    await this._runHooks("mounted");
    this._metrics.mountCount++;
    this._metrics.lastTransitionAt = Date.now();
  }
  async update() {
    if (this.state !== "mounted") throw new Error(`Cannot update: component is ${this.state}`);
    await this._runHooks("beforeUpdate");
    await this._runHooks("updated");
    this._metrics.updateCount++;
  }
  async unmount() {
    if (this.state === "unmounted") return;
    this.state = "unmounting";
    await this._runHooks("beforeUnmount");
    this.state = "unmounted";
    await this._runHooks("unmounted");
    this._metrics.unmountCount++;
    this._metrics.lastTransitionAt = Date.now();
  }
  async _runHooks(hookName) {
    const hooks = this.hooks[hookName] || [];
    for (const hook of hooks) {
      try {
        await hook(this.component);
      } catch (error) {
        this._metrics.errorCount++;
        _log("error", `Error in ${hookName}:`, error);
      }
    }
  }
  onBeforeMount(hook) {
    this.hooks.beforeMount.push(hook);
  }
  onMounted(hook) {
    this.hooks.mounted.push(hook);
  }
  onBeforeUpdate(hook) {
    this.hooks.beforeUpdate.push(hook);
  }
  onUpdated(hook) {
    this.hooks.updated.push(hook);
  }
  onBeforeUnmount(hook) {
    this.hooks.beforeUnmount.push(hook);
  }
  onUnmounted(hook) {
    this.hooks.unmounted.push(hook);
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    const checks = { validState: ["unmounted", "mounting", "mounted", "unmounting"].includes(this.state), hasComponent: !!this.component };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    _debug = !!enabled;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { mountCount: 0, unmountCount: 0, updateCount: 0, errorCount: 0, lastTransitionAt: null };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._logBuffer];
  }
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
var lifecycle_default = LifecycleManager;
export {
  LifecycleManager,
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getLogs,
  setDebug
};
