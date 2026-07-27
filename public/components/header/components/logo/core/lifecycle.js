const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "header/components/logo/core/lifecycle";
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
        _log("error", `Hook ${name} error:`, e);
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
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
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
