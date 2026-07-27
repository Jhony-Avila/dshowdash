import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01.core.lifecycle";
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
const _emitMetrics = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName) {
  _emitMetrics.total++;
  _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1;
  _emitMetrics.lastEmitAt = Date.now();
}
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (logger.info) logger.info(prefix, args.join(" "));
};
const LIFECYCLE_EVENTS = { BEFORE_MOUNT: "lifecycle:beforeMount", MOUNTED: "lifecycle:mounted", BEFORE_UPDATE: "lifecycle:beforeUpdate", UPDATED: "lifecycle:updated", BEFORE_UNMOUNT: "lifecycle:beforeUnmount", UNMOUNTED: "lifecycle:unmounted", ERROR: "lifecycle:error" };
function LifecycleManager(panelId) {
  this.panelId = panelId;
  this.state = "idle";
  this.hooks = /* @__PURE__ */ new Map();
  this.mountTime = null;
  _initPorts();
}
LifecycleManager.prototype.on = function(event, callback) {
  if (!this.hooks.has(event)) {
    this.hooks.set(event, /* @__PURE__ */ new Set());
  }
  this.hooks.get(event).add(callback);
  const self = this;
  return () => {
    self.hooks.get(event).delete(callback);
  };
};
LifecycleManager.prototype.emit = function(event, data) {
  data = data || {};
  _trackEmit(event);
  const callbacks = this.hooks.get(event);
  if (!callbacks) return Promise.resolve();
  const self = this;
  const promises = [];
  callbacks.forEach((callback) => {
    promises.push(Promise.resolve().then(() => callback(Object.assign({ event, panelId: self.panelId, source: MODULE_ID, timestamp: Date.now() }, data))).catch((error) => {
      _log("error", "Hook error:", error.message || error);
    }));
  });
  return Promise.all(promises);
};
LifecycleManager.prototype.beforeMount = function() {
  this.state = "mounting";
  return this.emit(LIFECYCLE_EVENTS.BEFORE_MOUNT, {});
};
LifecycleManager.prototype.mounted = function() {
  this.state = "mounted";
  this.mountTime = Date.now();
  return this.emit(LIFECYCLE_EVENTS.MOUNTED, { mountTime: this.mountTime });
};
LifecycleManager.prototype.beforeUpdate = function(changes) {
  return this.emit(LIFECYCLE_EVENTS.BEFORE_UPDATE, { changes });
};
LifecycleManager.prototype.updated = function(changes) {
  return this.emit(LIFECYCLE_EVENTS.UPDATED, { changes });
};
LifecycleManager.prototype.beforeUnmount = function() {
  this.state = "unmounting";
  return this.emit(LIFECYCLE_EVENTS.BEFORE_UNMOUNT, {});
};
LifecycleManager.prototype.unmounted = function() {
  this.state = "unmounted";
  const uptime = this.mountTime ? Date.now() - this.mountTime : 0;
  const result = this.emit(LIFECYCLE_EVENTS.UNMOUNTED, { uptime });
  this.mountTime = null;
  return result;
};
LifecycleManager.prototype.error = function(error) {
  this.state = "error";
  return this.emit(LIFECYCLE_EVENTS.ERROR, { error: error?.message || error });
};
LifecycleManager.prototype.getState = function() {
  return this.state;
};
LifecycleManager.prototype.getUptime = function() {
  return this.mountTime ? Date.now() - this.mountTime : 0;
};
LifecycleManager.prototype.destroy = function() {
  this.hooks.clear();
  this.state = "destroyed";
};
function getEmitMetrics() {
  return Object.assign({}, _emitMetrics);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), emitMetrics: getEmitMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { lifecycleReady: true, portsInitialized: Ports.isInitialized() }, emitMetrics: getEmitMetrics(), p24Instrumented: true, timestamp: Date.now() };
}
var lifecycle_default = { LIFECYCLE_EVENTS, LifecycleManager, info, healthCheck, getEmitMetrics, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  LIFECYCLE_EVENTS,
  LifecycleManager,
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getEmitMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
