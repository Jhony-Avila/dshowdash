import { AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-lotties-management.core.lifecycle";
const PANEL_ID = "panel-lotties-management";
const PANEL_NAME = "Gerenciamento de Lotties";
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
const LOTTIES_BASE_PATH = "/components/animacoes/";
const AVAILABLE_LOTTIES = Object.freeze({
  "cards": { file: "Lottie_Cards.json", name: "Cards Animation", description: "Animacao de cartoes para footer/brand" },
  "graph-growth": { file: "Lottie_Graph_Growth.json", name: "Graph Growth", description: "Grafico com crescimento animado" },
  "loading": { file: "TAVPl45E1F.json", name: "Loading Spinner", description: "Spinner de carregamento circular" },
  "loader": { file: "Loader.json", name: "Loader", description: "Loader generico para preload" },
  "loading-cube": { file: "Loading_Cube.json", name: "Loading Cube", description: "Cubo 3D animado para loading" }
});
const ASSIGNABLE_COMPONENTS = Object.freeze([
  { id: "footer-brand", name: "Footer Brand", slot: '[data-lottie="cards"]', current: "cards" },
  { id: "preloader", name: "Preloader", slot: "#preloader-animation", current: null },
  { id: "panel-loading", name: "Panel Loading", slot: ".panel-loading-animation", current: null },
  { id: "login-modal", name: "Login Modal", slot: ".login-animation", current: null },
  { id: "data-loading", name: "Data Loading", slot: ".data-loading-animation", current: null }
]);
const metrics = { mountCount: 0, unmountCount: 0, previewCount: 0, assignCount: 0, lastActivity: null };
let _cssLoaded = false;
function loadCSS() {
  if (_cssLoaded) return;
  const cssPath = `/components/panels/${PANEL_ID}/styles/index.css`;
  if (document.querySelector(`link[href*="${PANEL_ID}/styles"]`)) {
    _cssLoaded = true;
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssPath;
  link.setAttribute("data-panel", PANEL_ID);
  document.head.appendChild(link);
  _cssLoaded = true;
}
function isAuthenticated() {
  _initPorts();
  const authManager = _getPort("auth");
  if (authManager && authManager.isAuthenticated) return authManager.isAuthenticated();
  return !!localStorage.getItem("auth_token");
}
function ensureAuth(action) {
  _initPorts();
  if (!isAuthenticated()) {
    const eventBus = _getPort("eventBus");
    if (eventBus && eventBus.emit) {
      eventBus.emit(AUTH_INTENTS.LOGIN, { reason: `panel-${action}`, source: MODULE_ID });
    }
    return false;
  }
  return true;
}
function checkPanelAccess() {
  _initPorts();
  const permissions = _getPort("permissions");
  if (permissions && permissions.canAccess) return permissions.canAccess(PANEL_ID);
  return true;
}
function buildHealthCheck(isInitialized, container) {
  const checks = { initialized: isInitialized, hasContainer: !!container, cssLoaded: _cssLoaded, lottiesAvailable: Object.keys(AVAILABLE_LOTTIES).length > 0, portsInitialized: Ports.isInitialized() };
  const values = Object.values(checks);
  const score = values.filter(Boolean).length;
  return { status: score === 5 ? "HEALTHY" : score >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${score}/5`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function buildInfo(isInitialized, container, state, health) {
  return { moduleId: MODULE_ID, version: VERSION, panelId: PANEL_ID, panelName: PANEL_NAME, initialized: isInitialized, hasContainer: !!container, lottiesCount: Object.keys(AVAILABLE_LOTTIES).length, componentsCount: ASSIGNABLE_COMPONENTS.length, state: state && state.getState ? state.getState() : {}, health, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
var lifecycle_default = { VERSION, MODULE_ID, PANEL_ID, PANEL_NAME, LOTTIES_BASE_PATH, AVAILABLE_LOTTIES, ASSIGNABLE_COMPONENTS, metrics, loadCSS, isAuthenticated, ensureAuth, checkPanelAccess, buildHealthCheck, buildInfo, injectPorts, getPorts };
export {
  ASSIGNABLE_COMPONENTS,
  AVAILABLE_LOTTIES,
  LOTTIES_BASE_PATH,
  MODULE_ID,
  PANEL_ID,
  PANEL_NAME,
  VERSION,
  buildHealthCheck,
  buildInfo,
  checkPanelAccess,
  lifecycle_default as default,
  ensureAuth,
  getPorts,
  injectPorts,
  isAuthenticated,
  loadCSS,
  metrics
};
