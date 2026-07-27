const MODULE_ID = "header-panel-adwords-core-lifecycle";
import { VERSION } from "/core/version.js";
let _metrics = { mounts: 0, unmounts: 0 };
class LifecycleManager {
  constructor(component) {
    this.component = component;
    this.state = "created";
    this._mountedAt = null;
  }
  async mount() {
    _metrics.mounts++;
    this.state = "mounting";
    this._mountedAt = Date.now();
    this.state = "mounted";
  }
  async unmount() {
    _metrics.unmounts++;
    this.state = "unmounting";
    this.state = "unmounted";
  }
  getState() {
    return this.state;
  }
  getUptime() {
    return this._mountedAt ? Date.now() - this._mountedAt : 0;
  }
  getMetrics() {
    return { ..._metrics, state: this.state, uptime: this.getUptime() };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, state: this.state, metrics: this.getMetrics() };
  }
  healthCheck() {
    return { status: this.state === "mounted" ? "HEALTHY" : "IDLE", version: VERSION, moduleId: MODULE_ID, checks: { lifecycleReady: true }, metrics: this.getMetrics() };
  }
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { lifecycleReady: true } };
}
export {
  LifecycleManager,
  MODULE_ID,
  VERSION,
  getMetrics,
  healthCheck,
  info
};
