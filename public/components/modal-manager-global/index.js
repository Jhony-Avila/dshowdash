import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "1.5.0-P2-ENTERPRISE";
const MODULE_ID = "modal-manager-global";
import Store from "./state/store.js";
import * as Contracts from "./utils/contracts.js";
import * as Helpers from "./utils/helpers.js";
import * as Engine from "./core/engine.js";
import * as Accessibility from "./core/accessibility.js";
import * as _Keyboard from "./core/keyboard.js";
import * as _Lifecycle from "./core/lifecycle.js";
import * as Container from "./ui/container.js";
import * as Renderer from "./ui/renderer.js";
import * as _Tracker from "./telemetry/tracker.js";
import * as _ConfirmAPI from "./api/confirm.js";
import * as _LegacyAdapter from "./shim/legacy-adapter.js";
const Keyboard = _Keyboard;
const Lifecycle = _Lifecycle;
const Tracker = _Tracker;
const ConfirmAPI = _ConfirmAPI;
const LegacyAdapter = _LegacyAdapter;
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const init = (options = {}) => {
  _initPorts();
  return Lifecycle.init(options).then((result) => {
    if (result.ok && options.legacyAdapter !== false) {
      try {
        LegacyAdapter.init({ registerCallback: (modalInfo) => Tracker.trackEvent("legacy:registered", modalInfo) });
      } catch (err) {
        Tracker.trackEvent("legacy:init-error", { error: err.message });
      }
    }
    return result;
  });
};
const isInitialized = () => Lifecycle.isInitialized();
const shutdown = () => {
  try {
    LegacyAdapter.shutdown();
  } catch (err) {
  }
  return Lifecycle.shutdown();
};
const reset = () => Lifecycle.reset();
const open = (descriptor) => {
  const result = Engine.open(descriptor);
  if (result.ok) Tracker.trackOpen(result.id, descriptor.type || "dialog", descriptor.owner || "unknown");
  return result;
};
const update = (id, patch) => Engine.update(id, patch);
const close = (id, reason = "manual") => {
  const result = Engine.close(id, reason);
  if (result.ok && result.wasOpen) Tracker.trackClose(id, reason);
  return result;
};
const confirmModal = (id, result = true) => Engine.confirm(id, result);
const cancel = (id) => Engine.cancel(id);
const closeAll = (options = {}) => Engine.closeAll(options);
const confirm = (title, message, options = {}) => ConfirmAPI.confirm(title, message, options);
const alert = (title, message, options = {}) => ConfirmAPI.alert(title, message, options);
const danger = (title, message, options = {}) => ConfirmAPI.danger(title, message, options);
const getStack = (filter = null) => Engine.getStack(filter);
const getModal = (id) => Engine.getModal(id);
const getTop = () => Engine.getTop();
const isOpen = (id) => Engine.isOpen(id);
const hasBlocking = () => Engine.hasBlocking();
const getLegacyModals = () => LegacyAdapter.info().legacyModals || [];
const detectLegacyModals = () => LegacyAdapter.detectLegacyModals();
const onChange = (handler) => Store.subscribe(handler);
const status = () => {
  const lifecycle = Lifecycle.getLifecycleInfo();
  const metrics = Store.getMetrics();
  const legacyInfo = LegacyAdapter.info();
  return { initialized: lifecycle.initialized, activeCount: metrics.activeCount, hasBlocking: metrics.hasBlocking, bodyScrollLocked: metrics.bodyScrollLocked, topModal: Engine.getTop()?.id || null, legacyModalsDetected: legacyInfo.legacyModals?.length || 0 };
};
const groupStackByType = () => {
  const stack = Engine.getStack();
  const byType = {};
  stack.forEach((modal) => {
    const type = modal.type;
    if (!byType[type]) byType[type] = [];
    byType[type].push(modal.id);
  });
  return byType;
};
const info = () => {
  const lifecycle = Lifecycle.getLifecycleInfo();
  const metrics = Store.getMetrics();
  const trackerStats = Tracker.getStats();
  const legacyInfo = LegacyAdapter.info();
  return { name: MODULE_ID, version: VERSION, status: lifecycle.initialized ? "READY" : "NOT_INITIALIZED", initialized: lifecycle.initialized, portsInitialized: Ports.isInitialized(), stack: { count: metrics.activeCount, hasBlocking: metrics.hasBlocking, top: Engine.getTop(), byType: groupStackByType() }, metrics, lifecycle, telemetry: trackerStats, legacy: legacyInfo, components: { store: Store.getVersion(), contracts: Contracts.getVersion(), helpers: Helpers.getVersion(), engine: Engine.getVersion(), accessibility: Accessibility.getVersion(), keyboard: Keyboard.getVersion(), lifecycle: Lifecycle.getVersion(), container: Container.getVersion(), renderer: Renderer.getVersion(), tracker: Tracker.getVersion(), confirmAPI: ConfirmAPI.getVersion(), legacyAdapter: LegacyAdapter.getVersion() } };
};
const healthCheck = () => {
  const lifecycle = Lifecycle.getLifecycleInfo();
  const containerState = Container.getState();
  const legacyInfo = LegacyAdapter.info();
  const issues = [];
  if (!lifecycle.initialized) issues.push("Not initialized");
  if (!containerState.mounted) issues.push("Container not mounted");
  if (lifecycle.lastError) issues.push(`Last error: ${lifecycle.lastError}`);
  const checks = { initialized: lifecycle.initialized, containerMounted: containerState.mounted, storeAvailable: !!Store, engineAvailable: !!Engine, keyboardEnabled: Keyboard.getState().enabled, accessibilityReady: Accessibility.getState().hasFocusTrap !== void 0, confirmAPIReady: !!ConfirmAPI, legacyAdapterReady: legacyInfo.initialized, portsInitialized: Ports.isInitialized() };
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  let healthStatus = "UNHEALTHY";
  if (passedChecks === totalChecks) healthStatus = "HEALTHY";
  else if (passedChecks >= totalChecks * 0.7) healthStatus = "DEGRADED";
  return { status: healthStatus, score: `${passedChecks}/${totalChecks}`, healthy: healthStatus === "HEALTHY", version: VERSION, moduleId: MODULE_ID, initialized: lifecycle.initialized, portsInitialized: Ports.isInitialized(), issues: issues.length > 0 ? issues : null, checks, legacy: { detected: legacyInfo.legacyModals?.length || 0, observing: legacyInfo.observing }, timestamp: (/* @__PURE__ */ new Date()).toISOString(), p24Instrumented: true };
};
const getVersion = () => VERSION;
const debug = {
  getStore: () => Store.getState(),
  getEventLog: () => Tracker.getEvents(),
  getTrackerStats: () => Tracker.getStats(),
  getContainerState: () => Container.getState(),
  getKeyboardState: () => Keyboard.getState(),
  getAccessibilityState: () => Accessibility.getState(),
  getLifecycleInfo: () => Lifecycle.getLifecycleInfo(),
  getLegacyInfo: () => LegacyAdapter.info(),
  MODAL_TYPES: Contracts.MODAL_TYPES,
  MODAL_SIZES: Contracts.MODAL_SIZES,
  // @ts-expect-error TS migration - TS2551
  versions: { main: VERSION, store: Store.getVersion(), contracts: Contracts.getVersion(), helpers: Helpers.getVersion(), engine: Engine.getVersion(), accessibility: Accessibility.getVersion(), keyboard: Keyboard.getVersion(), lifecycle: Lifecycle.getVersion(), container: Container.getVersion(), renderer: Renderer.getVersion(), tracker: Tracker.getVersion(), confirmAPI: ConfirmAPI.getVersion(), legacyAdapter: LegacyAdapter.getVersion() }
};
const ModalManager = { init, isInitialized, shutdown, reset, open, update, close, confirmModal, cancel, closeAll, confirm, alert, danger, getLegacyModals, detectLegacyModals, getStack, getModal, getTop, isOpen, hasBlocking, onChange, status, info, healthCheck, getVersion, injectPorts, getPorts, debug };
if (typeof window !== "undefined") {
  const strictMode = isStrict();
  if (!strictMode) {
    window.ModalManager = ModalManager;
    window.ModalManagerVersion = VERSION;
    Tracker.trackEvent("global:exposed", { version: VERSION });
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.ModalManager" });
    Tracker.trackEvent("global:strict-mode-blocked", { version: VERSION });
  }
  if (window.__DSHOW_DEVTOOLS__) {
    window.__DSHOW_DEVTOOLS__.ModalManager = ModalManager;
  }
}
var modal_manager_global_default = ModalManager;
export {
  MODULE_ID,
  ModalManager,
  VERSION,
  modal_manager_global_default as default,
  getPorts,
  injectPorts
};
