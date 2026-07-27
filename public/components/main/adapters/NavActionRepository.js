const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "nav-action-repository";
let _actions = /* @__PURE__ */ new Map();
let _metrics = { registered: 0, executions: 0, errors: 0 };
function register(id, action) {
  try {
    _actions.set(id, { handler: action, registeredAt: Date.now() });
    _metrics.registered++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function execute(id, payload = {}) {
  _metrics.executions++;
  try {
    const action = _actions.get(id);
    if (action?.handler) {
      return action.handler(payload);
    }
    return null;
  } catch (error) {
    _metrics.errors++;
    return null;
  }
}
function get(id) {
  return _actions.get(id) || null;
}
function getAll() {
  return Object.fromEntries(_actions);
}
function has(id) {
  return _actions.has(id);
}
function remove(id) {
  return _actions.delete(id);
}
function clear() {
  _actions.clear();
}
function getMetrics() {
  return { ..._metrics, count: _actions.size };
}
function healthCheck() {
  return {
    status: _metrics.errors === 0 ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { actionCount: _actions.size, noErrors: _metrics.errors === 0 },
    metrics: getMetrics()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    actionCount: _actions.size,
    registeredActions: Array.from(_actions.keys()),
    metrics: getMetrics()
  };
}
var NavActionRepository_default = { register, execute, get, getAll, has, remove, clear, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clear,
  NavActionRepository_default as default,
  execute,
  get,
  getAll,
  getMetrics,
  has,
  healthCheck,
  info,
  register,
  remove
};
