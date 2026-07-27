import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { store } from "../state/store.js";
import { toastManager } from "../ui/toast.js";
import * as Telemetry from "../telemetry/tracker.js";
import { emitLifecycle } from "../utils/lifecycle.js";
import { loadClientes, loadCliente360, loadAllData } from "./data.js";
import * as Favoritos from "../managers/favoritos.js";
import * as ModalController from "../managers/modal-controller.js";
import * as ExportController from "../managers/export-controller.js";
import * as Cliente360View from "../managers/cliente360-view.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:handlers:events";
let _searchTimeout = null;
function handleClick(e, ctx) {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  Telemetry.trackAction(action, { target: target.tagName });
  if (action === "refresh") {
    loadClientes();
    toastManager.info("Atualizando...");
  } else if (action === "back") {
    Cliente360View.hide(ctx.refs, ctx.moduleId, ctx.version);
    if (store.clearCliente360) store.clearCliente360();
  } else if (action === "view-change") {
    const view = target.dataset.view;
    Cliente360View.setCurrentView(view);
    emitLifecycle(ctx.moduleId, ctx.version, PANEL_EVENTS.VIEW_CHANGED, { view });
  } else if (action === "toggle-charts") {
    toggleChartsView(ctx.refs);
  } else if (action === "cliente360" || action === "view") {
    const id = target.dataset.id;
    if (id) loadCliente360(id);
  } else if (action === "sort") {
    const field = target.dataset.sort;
    if (field) {
      store.setSort(field);
      loadClientes();
    }
  } else if (action === "page") {
    const page = parseInt(target.dataset.page);
    if (page) {
      store.setPage(page);
      loadClientes();
    }
  } else if (action === "favorito" || action === "toggle-fav") {
    Favoritos.toggle(target.dataset.id, ctx.moduleId, ctx.version);
  } else if (action === "export" || action === "export-csv") {
    ExportController.exportData("csv");
  } else if (action === "export-excel") {
    ExportController.exportData("excel");
  } else if (action === "export-pdf") {
    ExportController.exportData("pdf");
  } else if (action === "show-keyboard-help") {
    ModalController.show("keyboard-help");
  } else if (action === "show-settings") {
    ModalController.show("settings");
  } else if (action === "show-date-picker") {
    ModalController.show("date-picker");
  } else if (action === "close-modal") {
    ModalController.close();
  } else if (action === "retry") {
    loadAllData(ctx.moduleId, ctx.version);
  }
}
function handleChange(e, ctx) {
  const target = e.target;
  if (!target.dataset.filter) return;
  const filter = target.dataset.filter;
  const value = target.value;
  Telemetry.trackAction("filter-change", { filter, value });
  const filters = {};
  filters[filter] = value;
  store.setFilters(filters);
  loadClientes();
  emitLifecycle(ctx.moduleId, ctx.version, PANEL_EVENTS.FILTER_CHANGED, { filter, value });
}
function handleInput(e) {
  const target = e.target;
  if (target.dataset.action !== "search") return;
  clearTimeout(_searchTimeout);
  _searchTimeout = setTimeout(() => {
    store.setFilters({ search: target.value });
    loadClientes();
  }, 300);
}
function handleKeyboard(e, ctx) {
  const activeEl = document.activeElement;
  const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
  if (e.key === "Escape") {
    if (ModalController.isOpen()) {
      ModalController.close();
      return;
    }
    if (Cliente360View.getCurrentView() === "detail") {
      Cliente360View.hide(ctx.refs, ctx.moduleId, ctx.version);
      if (store.clearCliente360) store.clearCliente360();
      return;
    }
  }
  if (isInput) return;
  if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    loadClientes();
  } else if (e.key === "c" && !e.ctrlKey && !e.metaKey) {
    toggleChartsView(ctx.refs);
  } else if (e.key === "?") {
    ModalController.show("keyboard-help");
  } else if (e.key === "s" && !e.ctrlKey && !e.metaKey) {
    ModalController.show("settings");
  } else if (e.key === "e" && !e.ctrlKey && !e.metaKey) {
    ExportController.exportData("csv");
  }
}
function toggleChartsView(refs) {
  if (!refs || !refs.chartsArea) return;
  const chartsArea = refs.chartsArea;
  const isVisible = chartsArea.style.display !== "none";
  chartsArea.style.display = isVisible ? "none" : "";
  if (!isVisible) {
    const charts = store.get("charts");
    if (charts && refs.renderCharts) refs.renderCharts(charts);
  }
}
function clearSearchTimeout() {
  clearTimeout(_searchTimeout);
}
function healthCheck() {
  const checks = { storeAvailable: !!store, toastAvailable: !!toastManager, telemetryAvailable: !!Telemetry, panelEventsAvailable: !!PANEL_EVENTS };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}
var events_default = { handleClick, handleChange, handleInput, handleKeyboard, toggleChartsView, clearSearchTimeout, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearSearchTimeout,
  events_default as default,
  handleChange,
  handleClick,
  handleInput,
  handleKeyboard,
  healthCheck,
  info,
  toggleChartsView
};
