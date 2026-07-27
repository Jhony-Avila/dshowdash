import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import { PERMISSIONS_EVENTS } from "/core/runtime/events/catalog/permissions.events.js";
import { UARPS_EVENTS } from "/core/runtime/events/catalog/uarps.events.js";
import { Store } from "./state/store.js";
import { Renderer } from "./ui/renderer.js";
import { Controller } from "./core/controller.js";
import { Telemetry } from "./telemetry/tracker.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-permissions-admin";
const PANEL_ID = MODULE_ID;
const MIN_ACCESS_LEVEL = 100;
const getVersion = () => VERSION;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let _container = null;
let _mounted = false;
let _controller = null;
let _renderer = null;
let _cleanups = [];
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  return auth?.isAuthenticated?.() ?? false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const _canRefresh = () => _mounted && _isDocumentVisible() && _isAuthenticated();
const _checkAccess = () => {
  if (!_isAuthenticated()) return false;
  const auth = _getPort("auth");
  if (auth?.canAccessPanel) return auth.canAccessPanel(MODULE_ID);
  if (auth?.can) return auth.can("permissions:admin") || auth.can("admin:full");
  return (auth?.getLevel?.() ?? 0) >= MIN_ACCESS_LEVEL;
};
const _renderAuthBlocked = (container) => {
  container.innerHTML = '<div class="panel-auth-blocked" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:200px;color:#64748b;text-align:center;padding:2rem;"><div style="margin-bottom:1rem;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h3 style="margin:0 0 0.5rem;color:#334155;">Acesso Restrito</h3><p style="margin:0;font-size:0.875rem;">Fa\xE7a login para visualizar este conte\xFAdo</p></div>';
};
const _emit = (event, data = {}) => {
  try {
    const eventBus = _getPort("eventBus");
    eventBus?.emit?.(event, data);
  } catch (e) {
  }
};
const _loadStyles = () => new Promise((resolve) => {
  const styleId = "uarps-admin-styles";
  if (document.getElementById(styleId)) {
    resolve();
    return;
  }
  try {
    const link = document.createElement("link");
    link.id = styleId;
    link.rel = "stylesheet";
    link.href = "/components/panels/panel-permissions-admin/styles/main.css";
    document.head.appendChild(link);
    link.onload = resolve;
    link.onerror = resolve;
    setTimeout(resolve, 1e3);
  } catch (e) {
    resolve();
  }
});
const _setupEventListeners = () => {
  const bus = _getPort("eventBus");
  if (!bus?.on) return;
  const onPermissionsChanged = () => {
    if (_canRefresh()) _controller?.refresh?.();
  };
  bus.on(PERMISSIONS_EVENTS.CHANGED, onPermissionsChanged);
  _cleanups.push(() => bus.off(PERMISSIONS_EVENTS.CHANGED, onPermissionsChanged));
  const onUserSelected = (data) => {
    if (_canRefresh() && _controller?.selectUser && data) _controller.selectUser(data.userId);
  };
  bus.on(UARPS_EVENTS.USER_SELECTED, onUserSelected);
  _cleanups.push(() => bus.off(UARPS_EVENTS.USER_SELECTED, onUserSelected));
};
const mount = (container, options = {}) => {
  _initPorts();
  if (_mounted) return Promise.resolve({ success: true, cached: true });
  if (!container) return Promise.resolve({ success: false, error: "Container required" });
  if (!_isAuthenticated()) {
    Telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { reason: "auth-blocked", panelId: PANEL_ID });
    _renderAuthBlocked(container);
    return Promise.resolve({ success: false, error: "AUTH_REQUIRED" });
  }
  if (!_checkAccess()) {
    Telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { reason: "access-denied", panelId: PANEL_ID });
    container.innerHTML = '<div class="panel-access-denied" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:200px;color:#f87171;text-align:center;padding:2rem;"><div style="font-size:3rem;margin-bottom:1rem;">\u26D4</div><h3 style="margin:0 0 0.5rem;color:#ef4444;">Acesso Negado</h3><p style="margin:0;font-size:0.875rem;">Voc\xEA n\xE3o tem permiss\xE3o para acessar este painel</p></div>';
    return Promise.resolve({ success: false, error: "ACCESS_DENIED" });
  }
  _container = container;
  const startTime = performance.now();
  return _loadStyles().then(() => {
    Store.init(true);
    _controller = Controller.create({ store: Store });
    _controller.init();
    _renderer = Renderer.create({ container: _container, store: Store, controller: _controller });
    return _renderer.render();
  }).then(() => _controller.loadInitialData()).then(() => {
    _setupEventListeners();
    _mounted = true;
    const duration = Math.round(performance.now() - startTime);
    _emit(PANEL_EVENTS.MOUNTED, { panelId: PANEL_ID, version: VERSION, duration, timestamp: Date.now(), source: MODULE_ID });
    return { success: true, duration };
  }).catch((error) => {
    Telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { panelId: PANEL_ID, error: error.message });
    _emit(PANEL_EVENTS.ERROR, { panelId: PANEL_ID, version: VERSION, error: error.message, timestamp: Date.now(), source: MODULE_ID });
    return { success: false, error: error.message };
  });
};
const unmount = () => {
  if (!_mounted) return Promise.resolve(
    { success: true }
  );
  return Promise.resolve().then(() => {
    _cleanups.forEach((fn) => {
      try {
        fn();
      } catch (e) {
      }
    });
    _cleanups = [];
    _renderer?.destroy?.();
    _renderer = null;
    _controller?.destroy?.();
    _controller = null;
    Store.saveToCache();
    Store.reset();
    if (_container) _container.innerHTML = "";
    _container = null;
    _mounted = false;
    _emit(PANEL_EVENTS.UNMOUNTED, { panelId: PANEL_ID, timestamp: Date.now(), source: MODULE_ID });
    return { success: true };
  }).catch((error) => ({ success: false, error: error.message }));
};
const getController = () => _controller;
const getStore = () => Store;
const healthCheck = () => {
  const auth = _getPort("auth");
  return { status: _mounted ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, mounted: _mounted, authenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), hasAccess: _checkAccess(), storeHealth: Store.healthCheck(), portsInitialized: Ports.isInitialized(), authPortAvailable: !!auth, p22Compliant: true, timestamp: Date.now() };
};
const info = () => ({ version: VERSION, moduleId: MODULE_ID, mounted: _mounted, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), portsInitialized: Ports.isInitialized(), store: Store.info(), controller: _controller?.info?.() ?? null, p22Compliant: true });
const destroy = () => unmount();
var panel_permissions_admin_default = { mount, unmount, destroy, healthCheck, info, getController, getStore, getVersion, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MIN_ACCESS_LEVEL,
  MODULE_ID,
  VERSION,
  panel_permissions_admin_default as default,
  destroy,
  getController,
  getPorts,
  getStore,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  unmount
};
