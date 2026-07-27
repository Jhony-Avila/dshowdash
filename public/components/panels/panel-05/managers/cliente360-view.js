import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { Cliente360 } from "../cliente360/index.js";
import { pause as pauseScheduler, resume as resumeScheduler } from "../scheduler/refresh.js";
import { emitLifecycle } from "../utils/lifecycle.js";
import * as Favoritos from "./favoritos.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:managers:cliente360-view";
let _instance = null;
let _currentView = "list";
const REGIONS_TO_HIDE = ["kpis", "filters", "table-wrapper", "pagination", "charts"];
const _hideRegions = (panel) => {
  REGIONS_TO_HIDE.forEach((region) => {
    const el = panel ? panel.querySelector(`[data-region="${region}"]`) : null;
    if (el) el.style.setProperty("display", "none");
  });
};
const _showRegions = (panel) => {
  ["kpis", "filters", "table-wrapper", "pagination"].forEach((region) => {
    const el = panel ? panel.querySelector(`[data-region="${region}"]`) : null;
    if (el) el.style.setProperty("display", "");
  });
};
const init = (container, refs, moduleId, version) => {
  if (!container) return null;
  _instance = new Cliente360(container, { onBack: () => {
    hide(refs, moduleId, version);
  }, onFavorito: (id) => {
    Favoritos.toggle(id, moduleId, version);
  } });
  return _instance;
};
const show = (refs, data, moduleId, version) => {
  if (!refs || !refs.cliente360 || !_instance) return;
  pauseScheduler();
  _hideRegions(refs.panel);
  _instance.show(data);
  _currentView = "detail";
  const c = data?.cliente || data;
  emitLifecycle(moduleId, version, PANEL_EVENTS.VIEW_CHANGED, { view: "detail", clienteId: c ? c.Id_Organizacao || c.id : null });
};
const hide = (refs, moduleId, version) => {
  if (!refs || !refs.cliente360) return;
  if (_instance) {
    _instance.hide();
  } else if (refs.cliente360) {
    refs.cliente360.style.display = "none";
  }
  _showRegions(refs.panel);
  _currentView = "list";
  resumeScheduler();
  emitLifecycle(moduleId, version, PANEL_EVENTS.VIEW_CHANGED, { view: "list" });
};
const destroy = () => {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
  _currentView = "list";
};
const getInstance = () => _instance;
const getCurrentView = () => _currentView;
const setCurrentView = (view) => {
  _currentView = view;
};
const healthCheck = () => {
  const checks = { panelEventsAvailable: !!PANEL_EVENTS, favoritosAvailable: !!Favoritos };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, currentView: _currentView, instanceReady: !!_instance, p25Compliant: true, timestamp: Date.now() };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, view: _currentView, instanceReady: !!_instance, p25Compliant: true });
var cliente360_view_default = { init, show, hide, destroy, getInstance, getCurrentView, setCurrentView, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  cliente360_view_default as default,
  destroy,
  getCurrentView,
  getInstance,
  healthCheck,
  hide,
  info,
  init,
  setCurrentView,
  show
};
