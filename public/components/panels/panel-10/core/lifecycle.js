import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PAINEL_ID, VERSION as PANEL_VERSION, STATES } from "./constants.js";
import { PANEL_EVENTS, PANEL_INTENTS } from "/core/runtime/events/catalog/panels.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-10.core.lifecycle";
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
function _ebEmit(event, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(event, data || {});
}
function _ebOn(event, handler) {
  const eb = _getPort("eventBus");
  if (eb && eb.on) eb.on(event, handler);
}
function _ebOff(event, handler) {
  const eb = _getPort("eventBus");
  if (eb && eb.off) eb.off(event, handler);
}
function createLifecycleManager(context) {
  const logger = context.logger;
  const telemetry = context.telemetry;
  const store = context.store;
  const apiClient = context.apiClient;
  const abortControllerRef = context.abortControllerRef;
  const emit = context.emit;
  return {
    setState(instance, newState) {
      const oldState = instance.state;
      instance.state = newState;
      if (instance.container) instance.container.setAttribute("data-state", newState);
      logger.debug("state.transition", { from: oldState, to: newState });
    },
    performMount(instance, container, deps, callbacks) {
      const self = this;
      const renderStructure = callbacks.renderStructure;
      const setupStateSubscription = callbacks.setupStateSubscription;
      const setupEventListeners = callbacks.setupEventListeners;
      const startAutoRefresh = callbacks.startAutoRefresh;
      const loadData = callbacks.loadData;
      const mountStart = performance.now();
      if (instance.mounted || instance.state !== STATES.IDLE) {
        logger.warn("mount.skipped", { reason: "already-mounted", state: instance.state });
        return Promise.resolve(false);
      }
      if (!container || !(container instanceof HTMLElement)) {
        logger.error("mount.invalid-container");
        return Promise.reject(new Error(`[${PAINEL_ID}] Container inv\xE1lido`));
      }
      _initPorts();
      self.setState(instance, STATES.MOUNTING);
      emit(PANEL_EVENTS.MOUNTING);
      return Promise.resolve().then(() => {
        logger.debug("mount.start", { version: PANEL_VERSION });
        instance.container = container;
        instance.container.setAttribute("data-panel-id", PAINEL_ID);
        instance.container.setAttribute("data-version", PANEL_VERSION);
        instance.container.setAttribute("data-state", instance.state);
        abortControllerRef.current = new AbortController();
        instance.consecutiveErrors = 0;
        instance.isDegraded = false;
        instance.currentRequestId = 0;
        instance.activeLoadRequest = null;
        renderStructure();
        return setupStateSubscription();
      }).then(() => {
        setupEventListeners();
        return loadData();
      }).then(() => {
        startAutoRefresh();
        instance.mounted = true;
        self.setState(instance, STATES.MOUNTED);
        const metrics = instance.performanceMetrics;
        metrics.mountTime = performance.now() - mountStart;
        logger.debug("mount.success", { mountTime: `${metrics.mountTime.toFixed(2)}ms` });
        emit(PANEL_EVENTS.MOUNTED, { panelId: PAINEL_ID, version: PANEL_VERSION, mountTime: metrics.mountTime });
        _ebEmit(PANEL_EVENTS.LOADED, { panelId: PAINEL_ID });
        return true;
      }).catch((error) => {
        self.setState(instance, STATES.ERROR);
        logger.error("mount.failed", { error: error.message });
        telemetry.trackError(error, "mount");
        throw error;
      });
    },
    performUnmount(instance, callbacks) {
      const self = this;
      const stopAutoRefresh = callbacks.stopAutoRefresh;
      const destroyUI = callbacks.destroyUI;
      if (instance.destroyed || instance.state === STATES.DESTROYED) {
        logger.warn("unmount.skipped", { reason: "already-destroyed" });
        return Promise.resolve(false);
      }
      self.setState(instance, STATES.UNMOUNTING);
      emit(PANEL_EVENTS.UNMOUNTING);
      logger.debug("unmount.start");
      return Promise.resolve().then(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        stopAutoRefresh();
        apiClient.cancel();
        const unsubscribers = instance.unsubscribers;
        for (let i = 0; i < unsubscribers.length; i++) {
          try {
            unsubscribers[i]();
          } catch (e) {
          }
        }
        instance.unsubscribers = [];
        if (instance._filteredRefreshHandler) {
          _ebOff(PANEL_INTENTS.REFRESH, instance._filteredRefreshHandler);
        }
        return destroyUI();
      }).then(() => {
        store.reset();
        if (instance.container) {
          instance.container.innerHTML = "";
          instance.container.removeAttribute("data-panel-id");
          instance.container.removeAttribute("data-version");
          instance.container.removeAttribute("data-state");
          instance.container = null;
        }
        instance.mounted = false;
        instance.destroyed = true;
        instance.cssLoaded = false;
        instance.consecutiveErrors = 0;
        instance.isDegraded = false;
        instance.currentRequestId = 0;
        instance.activeLoadRequest = null;
        self.setState(instance, STATES.DESTROYED);
        logger.debug("unmount.success");
        const pm = instance.performanceMetrics;
        emit(PANEL_EVENTS.UNMOUNTED, { panelId: PAINEL_ID, totalRequests: pm.totalRequests, failedRequests: pm.failedRequests });
        _ebEmit(PANEL_EVENTS.UNMOUNTED, { panelId: PAINEL_ID });
        return true;
      }).catch((error) => {
        logger.error("unmount.failed", { error: error.message });
        throw error;
      });
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), p22Compliant: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { lifecycleReady: true }, p22Compliant: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
var lifecycle_default = { createLifecycleManager, MODULE_ID, VERSION, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createLifecycleManager,
  lifecycle_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
