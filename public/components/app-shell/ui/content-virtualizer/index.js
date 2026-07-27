const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-content-virtualizer";
const SCROLL_DIRECTION = Object.freeze({
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal"
});
import { Virtualizer } from "./virtualizer.js";
const _instances = /* @__PURE__ */ new Map();
let _instanceId = 0;
const _metrics = {
  instancesCreated: 0,
  itemsRendered: 0,
  recycledItems: 0
};
function create(container, options) {
  options = options || {};
  const id = `virt-${++_instanceId}`;
  const virtualizer = new Virtualizer(container, options, _metrics);
  virtualizer.id = id;
  _instances.set(id, virtualizer);
  return virtualizer;
}
function get(id) {
  return _instances.get(id) || null;
}
function destroy(id) {
  const instance = _instances.get(id);
  if (instance) {
    instance.destroy();
    _instances.delete(id);
    return true;
  }
  return false;
}
function destroyAll() {
  let count = 0;
  _instances.forEach((instance) => {
    instance.destroy();
    count++;
  });
  _instances.clear();
  return count;
}
function listInstances() {
  const list = [];
  _instances.forEach((instance, id) => {
    list.push({
      id,
      itemCount: instance.items.length,
      visibleRange: instance.getVisibleRange()
    });
  });
  return list;
}
function getMetrics() {
  return {
    instancesCreated: _metrics.instancesCreated,
    activeInstances: _instances.size,
    itemsRendered: _metrics.itemsRendered,
    recycledItems: _metrics.recycledItems
  };
}
function healthCheck() {
  const checks = {
    noExcessiveInstances: _instances.size < 10,
    poolEfficiency: _metrics.itemsRendered === 0 || _metrics.recycledItems / _metrics.itemsRendered > 0.1
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    activeInstances: _instances.size,
    instances: listInstances(),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var content_virtualizer_default = {
  VERSION,
  MODULE_ID,
  SCROLL_DIRECTION,
  create,
  get,
  destroy,
  destroyAll,
  listInstances,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  SCROLL_DIRECTION,
  VERSION,
  create,
  content_virtualizer_default as default,
  destroy,
  destroyAll,
  get,
  getMetrics,
  healthCheck,
  info,
  listInstances
};
