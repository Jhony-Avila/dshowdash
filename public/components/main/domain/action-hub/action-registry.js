const VERSION = "2.0.0-AAA-P4";
const MODULE_ID = "action-registry";
class ActionRegistry {
  constructor() {
    this._actions = /* @__PURE__ */ new Map();
    this._initialized = false;
    this._metrics = { registered: 0, queries: 0, hits: 0, misses: 0 };
  }
  init() {
    if (this._initialized) return this;
    this._initialized = true;
    return this;
  }
  registerAction(def) {
    if (!def || !def.actionId) return { success: false, error: "actionId required" };
    const entry = {
      actionId: def.actionId,
      kind: def.kind || "ui",
      area: def.area || "unknown",
      label: def.label || null,
      icon: def.icon || null,
      status: def.status || "enabled",
      registeredAt: Date.now()
    };
    this._actions.set(def.actionId, entry);
    this._metrics.registered++;
    return { success: true, actionId: def.actionId };
  }
  registerMany(defs = []) {
    return defs.map((def) => this.registerAction(def));
  }
  has(actionId) {
    this._metrics.queries++;
    const exists = this._actions.has(actionId);
    exists ? this._metrics.hits++ : this._metrics.misses++;
    return exists;
  }
  get(actionId) {
    this._metrics.queries++;
    const entry = this._actions.get(actionId);
    entry ? this._metrics.hits++ : this._metrics.misses++;
    return entry || null;
  }
  list() {
    return Array.from(this._actions.values());
  }
  listByArea(area) {
    return this.list().filter((a) => a.area === area);
  }
  listByKind(kind) {
    return this.list().filter((a) => a.kind === kind);
  }
  unregister(actionId) {
    return this._actions.delete(actionId);
  }
  clear() {
    this._actions.clear();
    this._metrics.registered = 0;
  }
  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      initialized: this._initialized,
      totalActions: this._actions.size,
      metrics: { ...this._metrics }
    };
  }
  healthCheck() {
    const checks = { initialized: this._initialized, hasActions: this._actions.size > 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    return {
      status: passed === 2 ? "healthy" : passed >= 1 ? "degraded" : "unhealthy",
      score: `${passed}/2`,
      checks,
      version: VERSION,
      moduleId: MODULE_ID
    };
  }
  destroy() {
    this._actions.clear();
    this._initialized = false;
  }
}
let _instance = null;
function getActionRegistry() {
  if (!_instance) _instance = new ActionRegistry();
  return _instance;
}
function createActionRegistry() {
  return new ActionRegistry();
}
var action_registry_default = { ActionRegistry, getActionRegistry, createActionRegistry, VERSION, MODULE_ID };
export {
  ActionRegistry,
  MODULE_ID,
  VERSION,
  createActionRegistry,
  action_registry_default as default,
  getActionRegistry
};
