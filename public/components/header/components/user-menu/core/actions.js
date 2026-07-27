import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { navigateToRoute as navAdapterNavigate } from "../../_base/navigation-helper.js";
const MODULE_ID = "header.user-menu.core.actions";
const VERSION = "3.4.0-P2-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function _getEventBus() {
  _initPorts();
  const portEventBus = _getPort("eventBus");
  if (portEventBus) return portEventBus;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get("EventBus");
    if (waEventBus) return waEventBus;
  }
  return null;
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _metrics = { actions: 0, navigations: 0 };
const ACTION_CONFIG = { id: "user-menu", area: "header", label: "Menu do Usu\xE1rio", icon: "user", kind: "ui" };
const ACTION_ROUTES = {
  "profile": "#/meu-perfil",
  "preferences": "#/preferencias",
  "security": "#/seguranca-conta",
  "notifications": "#/notificacoes",
  "sessions": "#/sessoes-ativas"
};
function navigateToRoute(route, source) {
  _metrics.navigations++;
  return navAdapterNavigate(route, source || MODULE_ID);
}
function emitUIAction(actionSuffix, data) {
  if (!data) data = {};
  _metrics.actions++;
  const eventBus = _getEventBus();
  if (!eventBus || !eventBus.emit) return;
  eventBus.emit(UI_EVENTS.ACTION, { actionId: `header:${ACTION_CONFIG.id}:${actionSuffix}`, source: MODULE_ID, timestamp: Date.now(), meta: Object.assign({ label: ACTION_CONFIG.label, icon: ACTION_CONFIG.icon, kind: ACTION_CONFIG.kind }, data) });
}
function handleMenuAction(action, context) {
  const logger = context.logger;
  const store = context.store;
  const onLogout = context.onLogout;
  store.setState({ isOpen: false });
  emitUIAction(action, { action });
  if (logger && logger.debug) logger.debug(`Action: ${action}`);
  if (action === "logout" && onLogout) {
    onLogout();
    return;
  }
  const route = ACTION_ROUTES[action];
  if (route) {
    navigateToRoute(route, MODULE_ID);
  }
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p03PortsOnly: true,
    strictMode: isStrict(),
    metrics: getMetrics(),
    routes: ACTION_ROUTES,
    portsInitialized: ps._initialized
  };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const hasEventBus = !!_getEventBus();
  return {
    status: hasEventBus ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    p03PortsOnly: true,
    strictMode: isStrict(),
    checks: { actionsReady: true, hasEventBus, portsInitialized: ps._initialized },
    metrics: getMetrics(),
    portsInitialized: ps._initialized
  };
}
export {
  ACTION_CONFIG,
  ACTION_ROUTES,
  MODULE_ID,
  VERSION,
  emitUIAction,
  getMetrics,
  getPorts,
  handleMenuAction,
  healthCheck,
  info,
  injectPorts,
  navigateToRoute
};
