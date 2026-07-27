import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-navrail-admin/handlers/ui-actions";
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
class UIActionsHandler {
  constructor(options = {}) {
    this.options = options;
    this._actions = /* @__PURE__ */ new Map();
    this._metrics = { actionCount: 0, errorCount: 0, lastActionAt: null };
  }
  register(name, handler) {
    this._actions.set(name, handler);
  }
  unregister(name) {
    this._actions.delete(name);
  }
  async execute(name, payload) {
    const handler = this._actions.get(name);
    if (!handler) {
      _getPort("logger")?.warn(`[${MODULE_ID}] Action not found: ${name}`);
      return { ok: false, reason: "not_found" };
    }
    this._metrics.actionCount++;
    this._metrics.lastActionAt = Date.now();
    try {
      const result = await handler(payload);
      return { ok: true, result };
    } catch (e) {
      this._metrics.errorCount++;
      _getPort("logger")?.error(`[${MODULE_ID}] Action error:`, e);
      return { ok: false, error: e.message };
    }
  }
  healthCheck() {
    return { status: "healthy", actionCount: this._actions.size, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, registeredActions: Array.from(this._actions.keys()), metrics: this._metrics, portsInitialized: Ports.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
}
var ui_actions_default = UIActionsHandler;
export {
  MODULE_ID,
  UIActionsHandler,
  VERSION,
  ui_actions_default as default,
  getPorts,
  injectPorts
};
