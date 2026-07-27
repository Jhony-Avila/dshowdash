import { VERSION, MODULE_ID, loadedModules, mountedInstances, componentState, metrics } from "./constants.js";
import { getAvailableComponentIds } from "./dynamic-loader.js";
import { getFailedComponents } from "./retry-manager.js";
import { LazyLoader } from "./lazy-loader.js";
import { getEagerItemIds } from "../../registry/items.js";
let _portsInitialized = () => false;
function setPortsCheck(fn) {
  _portsInitialized = fn;
}
function healthCheck() {
  const mounted = Array.from(mountedInstances.keys());
  const loaded = Array.from(loadedModules.keys());
  const failed = Array.from(componentState.failed.keys());
  const pending = LazyLoader._pendingHosts ? LazyLoader._pendingHosts.size : 0;
  let status = "HEALTHY";
  if (failed.length > 0 && mounted.length === 0) status = "UNHEALTHY";
  else if (failed.length > 0) status = "DEGRADED";
  else if (mounted.length === 0) status = "IDLE";
  return {
    status,
    mountedCount: mounted.length,
    loadedCount: loaded.length,
    failedCount: failed.length,
    pendingLazy: pending,
    mounted,
    loaded,
    failed,
    metrics: Object.assign({}, metrics),
    lazyLoaderActive: LazyLoader._initialized,
    queueLength: LazyLoader._loadQueue ? LazyLoader._loadQueue.length : 0,
    portsInitialized: _portsInitialized(),
    version: VERSION,
    moduleId: MODULE_ID
  };
}
function info() {
  const eagerIds = getEagerItemIds();
  const availableIds = getAvailableComponentIds();
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    availableComponents: availableIds,
    eagerComponents: eagerIds,
    lazyComponents: availableIds.filter((id) => eagerIds.indexOf(id) === -1),
    mountedComponents: Array.from(mountedInstances.keys()),
    loadedModules: Array.from(loadedModules.keys()),
    failedComponents: Array.from(componentState.failed.keys()),
    componentState: {
      mounted: componentState.mounted.size,
      failed: componentState.failed.size,
      pending: componentState.pending.size,
      loading: componentState.loading.size
    },
    metrics: Object.assign({}, metrics),
    lazyLoader: {
      initialized: LazyLoader._initialized,
      pendingCount: LazyLoader._pendingHosts ? LazyLoader._pendingHosts.size : 0,
      queueLength: LazyLoader._loadQueue ? LazyLoader._loadQueue.length : 0
    },
    portsInitialized: _portsInitialized(),
    source: "registry-ssot",
    features: ["lazy-loading", "error-boundary", "retry-individual", "retry-all", "visibility-check", "host-clear", "dynamic-loaders", "registry-ssot"]
  };
}
function getComponentState() {
  return {
    mounted: Array.from(componentState.mounted),
    failed: getFailedComponents(),
    pending: Array.from(componentState.pending),
    loading: Array.from(componentState.loading)
  };
}
var health_default = {
  healthCheck,
  info,
  getComponentState,
  setPortsCheck
};
export {
  health_default as default,
  getComponentState,
  healthCheck,
  info,
  setPortsCheck
};
