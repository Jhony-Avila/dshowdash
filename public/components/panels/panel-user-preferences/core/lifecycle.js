const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-user-preferences/core/lifecycle";
class LifecycleManager {
  constructor(component) {
    this.component = component;
    this.state = "idle";
    this._mountedAt = null;
    this._unmountedAt = null;
  }
  mount() {
    this.state = "mounting";
    this._mountedAt = Date.now();
    return Promise.resolve().then(() => {
      this.state = "mounted";
      return this;
    });
  }
  unmount() {
    this.state = "unmounting";
    this._unmountedAt = Date.now();
    return Promise.resolve().then(() => {
      this.state = "unmounted";
      return this;
    });
  }
  getState() {
    return this.state;
  }
  healthCheck() {
    return {
      status: this.state === "mounted" ? "HEALTHY" : "IDLE",
      state: this.state,
      mountedAt: this._mountedAt,
      version: VERSION,
      moduleId: MODULE_ID
    };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, state: this.state };
  }
}
var lifecycle_default = LifecycleManager;
export {
  LifecycleManager,
  MODULE_ID,
  VERSION,
  lifecycle_default as default
};
