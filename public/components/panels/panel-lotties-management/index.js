import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { state } from "./state/store.js";
import { ui } from "./ui/renderer.js";
import { setupEventHandlers, cleanup as cleanupEvents } from "./ui/events.js";
import { carregarCatalogo } from "./core/catalogo.js";
import { tracker } from "./telemetry/tracker.js";
import { MODULE_ID as CONST_MODULE_ID, PANEL_ID, PANEL_NAME, ASSIGNABLE_COMPONENTS, metrics, loadCSS, isAuthenticated, checkPanelAccess, buildHealthCheck, buildInfo } from "./core/lifecycle.js";
const VERSION = "10.0.0";
const MODULE_ID = CONST_MODULE_ID;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const id = PANEL_ID;
const capabilities = { type: "panel", reorderable: true, critical: false };
const PanelLottiesManagement = (() => {
  "use strict";
  let isInitialized = false;
  let container = null;
  let unsubscribeState = null;
  let unsubscribePersist = null;
  let loadToken = 0;
  let observer = null;
  const observarDesmontagem = () => {
    if (observer || typeof MutationObserver === "undefined") return;
    observer = new MutationObserver(() => {
      const root = container ? container.querySelector(".lotties-panel") : null;
      if (isInitialized && (!container || !container.isConnected || !root)) unmount2();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  const render = () => {
    if (!container) return;
    ui.render(container, state.getState());
  };
  const subscribeToState = () => {
    unsubscribeState = state.subscribe(() => {
      render();
    });
    unsubscribePersist = state.subscribe((s) => {
      try {
        localStorage.setItem("lotties-assignments", JSON.stringify(s.assignments));
      } catch (e) {
      }
    });
  };
  const carregar = async () => {
    const token = ++loadToken;
    state.setCatalogo("carregando");
    try {
      const cat = await carregarCatalogo();
      if (token !== loadToken || !isInitialized) return;
      state.setLotties(cat.itens);
      state.setCatalogo(cat.itens.length ? "pronto" : "vazio", cat.origem);
      tracker.trackCatalog(cat.itens.length ? "pronto" : "vazio", { itens: cat.itens.length, origem: cat.origem, versao: cat.versao });
    } catch (e) {
      if (token !== loadToken || !isInitialized) return;
      const msg = e?.message || String(e);
      state.setCatalogo("erro", null, msg);
      tracker.trackCatalog("erro", { erro: msg });
    }
  };
  const mount2 = async (element) => {
    if (!element) throw new Error("panel-lotties-management: mount exige o elemento de conteúdo");
    _initPorts();
    tracker.trackInit("start");
    if (!isAuthenticated()) {
      element.innerHTML = '<div class="panel-error" style="padding:2rem;text-align:center;color:#F59E0B;">Faça login para acessar este painel</div>';
      return false;
    }
    if (!checkPanelAccess()) {
      element.innerHTML = '<div class="panel-error" style="padding:2rem;text-align:center;color:#EF4444;">Sem permissão para acessar este painel</div>';
      return false;
    }
    if (isInitialized) unmount2();
    container = element;
    container.setAttribute("data-panel", PANEL_ID);
    loadCSS();
    ui.renderSkeleton(container);
    state.reset();
    state.setComponents(ASSIGNABLE_COMPONENTS.map((comp) => ({ ...comp })));
    try {
      const saved = localStorage.getItem("lotties-assignments");
      if (saved) state.setAssignments(JSON.parse(saved));
    } catch (e) {
    }
    subscribeToState();
    setupEventHandlers(container, render, () => {
      void carregar();
    });
    isInitialized = true;
    observarDesmontagem();
    metrics.mountCount++;
    metrics.lastActivity = Date.now();
    tracker.trackMount();
    const eventBus = _getPort("eventBus");
    eventBus?.emit?.(PANEL_EVENTS.READY, { panelId: PANEL_ID, version: VERSION, timestamp: Date.now(), source: MODULE_ID });
    await carregar();
    tracker.trackInit("complete");
    return true;
  };
  const unmount2 = () => {
    loadToken++;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    cleanupEvents();
    if (unsubscribeState) {
      unsubscribeState();
      unsubscribeState = null;
    }
    if (unsubscribePersist) {
      unsubscribePersist();
      unsubscribePersist = null;
    }
    if (container) {
      container.innerHTML = "";
      container.removeAttribute("data-panel");
      container = null;
    }
    state.reset();
    isInitialized = false;
    metrics.unmountCount++;
    tracker.trackUnmount();
  };
  const lottiesCount = () => (state.getState().lotties || []).length;
  const healthCheck2 = () => buildHealthCheck(isInitialized, container, lottiesCount());
  const info2 = () => buildInfo(isInitialized, container, state, healthCheck2(), lottiesCount());
  const getStatus2 = () => ({
    version: VERSION,
    moduleId: MODULE_ID,
    panelId: PANEL_ID,
    panelName: PANEL_NAME,
    initialized: isInitialized,
    authenticated: isAuthenticated(),
    hasPermission: checkPanelAccess(),
    portsInitialized: Ports.isInitialized(),
    catalogo: state.getState().catalogo,
    metrics: { ...metrics }
  });
  const getVersion2 = () => VERSION;
  return {
    mount: mount2,
    unmount: unmount2,
    healthCheck: healthCheck2,
    info: info2,
    getStatus: getStatus2,
    getVersion: getVersion2,
    reload: carregar,
    isInitialized: () => isInitialized,
    getPanelId: () => PANEL_ID,
    getPanelName: () => PANEL_NAME
  };
})();
if (typeof window !== "undefined" && !isStrict()) {
  window.PanelLottiesManagement = PanelLottiesManagement;
}
const { mount, unmount, healthCheck: _rawHealthCheck, info, getStatus, getVersion } = PanelLottiesManagement;
const healthCheck = () => {
  const hc = _rawHealthCheck();
  hc.isDocumentVisible = _isDocumentVisible();
  return hc;
};
const destroy = () => unmount();
var index_default = PanelLottiesManagement;
export {
  MODULE_ID,
  VERSION,
  capabilities,
  index_default as default,
  destroy,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  id,
  info,
  injectPorts,
  mount,
  unmount
};
