import { NavRailTemplate } from "../ui/template.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isEager } from "../registry/items.js";
import { VERSION as MOUNTER_VERSION, MODULE_ID as MOUNTER_MODULE_ID, MOUNTER_EVENTS, mountedInstances, componentState, metrics } from "./component-mounter/constants.js";
import { setLogger as setDynamicLogger, loadModule } from "./component-mounter/dynamic-loader.js";
import { setDependencies as setLazyDeps, LazyLoader } from "./component-mounter/lazy-loader.js";
import { setDependencies as setErrorDeps, renderErrorButton, track } from "./component-mounter/error-boundary.js";
import { setDependencies as setRetryDeps, retryComponent, retryFailed, getFailedComponents } from "./component-mounter/retry-manager.js";
import { healthCheck, info, getComponentState, setPortsCheck } from "./component-mounter/health.js";
const Ports = createUiPorts({ moduleId: MOUNTER_MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, msg, data) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MOUNTER_MODULE_ID}]`, msg, data || "");
};
setDynamicLogger(_log);
setErrorDeps(_getPort, retryComponent);
setPortsCheck(() => Ports.isInitialized());
function mountComponentWithBoundary(id, hostEl, props) {
  if (!props) props = {};
  if (!hostEl) return Promise.resolve(null);
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  return new Promise((resolve) => {
    if (mountedInstances.has(id)) {
      const existing = mountedInstances.get(id);
      if (existing.host === hostEl && existing.instance && typeof existing.instance.isMounted === "function" && existing.instance.isMounted()) {
        resolve(existing.instance);
        return;
      }
    }
    loadModule(id).then((module) => {
      if (!module) throw new Error(`Module not found: ${id}`);
      hostEl.innerHTML = "";
      let instance;
      if (module.default && module.default.prototype && typeof module.default.prototype.mount === "function") {
        instance = new module.default();
      } else if (typeof module.getInstance === "function") {
        instance = module.getInstance();
      } else if (typeof module.mount === "function") {
        if (module.init) module.init({});
        module.mount(hostEl, props);
        mountedInstances.set(id, { instance: module, host: hostEl });
        componentState.mounted.add(id);
        componentState.failed.delete(id);
        metrics.totalMounts++;
        const duration2 = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
        track("component:mounted", { id, duration: Math.round(duration2) });
        _log("debug", "Component mounted", { id, duration: `${duration2.toFixed(0)}ms` });
        resolve(module);
        return;
      } else {
        throw new Error(`Invalid module structure: ${id}`);
      }
      if (instance.init) instance.init({});
      instance.mount(hostEl, props);
      mountedInstances.set(id, { instance, host: hostEl });
      componentState.mounted.add(id);
      componentState.failed.delete(id);
      metrics.totalMounts++;
      const duration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
      track("component:mounted", { id, duration: Math.round(duration) });
      _log("debug", "Component mounted", { id, duration: `${duration.toFixed(0)}ms` });
      resolve(instance);
    }).catch((error) => {
      metrics.totalFails++;
      componentState.failed.set(id, {
        error: error.message || String(error),
        attempts: (componentState.failed.get(id)?.attempts || 0) + 1,
        lastAttempt: Date.now(),
        host: hostEl,
        props
      });
      renderErrorButton(hostEl, id, error.message);
      track(MOUNTER_EVENTS.COMPONENT_ERROR, { id, error: error.message });
      _log("error", "Component mount failed", { id, error: error.message });
      resolve(null);
    });
  });
}
setLazyDeps(_log, _getPort, mountComponentWithBoundary);
setRetryDeps(_log, mountComponentWithBoundary);
function unmountComponent(id) {
  const entry = mountedInstances.get(id);
  if (!entry) return Promise.resolve(false);
  try {
    if (entry.instance && typeof entry.instance.unmount === "function") entry.instance.unmount();
    mountedInstances.delete(id);
    componentState.mounted.delete(id);
    return Promise.resolve(true);
  } catch (err) {
    _log("warn", "Unmount error", { id, error: err.message });
    return Promise.resolve(false);
  }
}
function mountAll(root, items) {
  if (!items) items = [];
  const hosts = NavRailTemplate.getHosts(root);
  const results = { mounted: [], failed: [], lazy: [] };
  const promises = [];
  LazyLoader.init();
  hosts.forEach((host) => {
    const id = host.dataset.hostId;
    if (!id) return;
    const item = items.find((i) => i.id === id);
    const props = item ? {
      label: item.label,
      icon: item.icon,
      group: item.group,
      panelId: item.panelId || (item.intentId ? item.intentId.split(".").pop() : void 0),
      route: item.route || `#/${id}`
    } : {};
    if (isEager(id)) {
      metrics.eagerLoaded++;
      const p = mountComponentWithBoundary(id, host, props).then((instance) => {
        if (instance) {
          results.mounted.push(id);
        } else {
          results.failed.push(id);
        }
      });
      promises.push(p);
    } else {
      LazyLoader.observe(host, id, props);
      results.lazy.push(id);
    }
  });
  return Promise.all(promises).then(() => {
    const eb = _getPort("eventBus");
    if (eb && eb.emit) {
      eb.emit(MOUNTER_EVENTS.COMPONENTS_MOUNTED, {
        source: MOUNTER_MODULE_ID,
        mounted: results.mounted,
        failed: results.failed,
        lazy: results.lazy,
        timestamp: Date.now()
      });
    }
    _log("info", "Initial mount complete", {
      eager: results.mounted.length,
      failed: results.failed.length,
      lazy: results.lazy.length
    });
    return results;
  });
}
function unmountAll() {
  LazyLoader.disconnect();
  const ids = Array.from(mountedInstances.keys());
  const promises = ids.map((id) => unmountComponent(id));
  return Promise.all(promises).then(() => {
    componentState.mounted.clear();
    componentState.failed.clear();
    componentState.pending.clear();
    componentState.loading.clear();
    return ids;
  });
}
const NavRailComponentMounter = {
  loadModule,
  mountComponent: mountComponentWithBoundary,
  unmountComponent,
  mountAll,
  unmountAll,
  retryComponent,
  retryFailed,
  getFailedComponents,
  getComponentState,
  healthCheck,
  info,
  MOUNTER_EVENTS,
  LazyLoader,
  VERSION: MOUNTER_VERSION,
  MODULE_ID: MOUNTER_MODULE_ID,
  injectPorts,
  getPorts
};
var component_mounter_default = NavRailComponentMounter;
export {
  MOUNTER_EVENTS,
  NavRailComponentMounter,
  component_mounter_default as default,
  getPorts,
  injectPorts
};
