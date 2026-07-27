import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { PANEL_INTENTS, emitPanelIntent } from "/core/runtime/events/catalog/panels.events.js";
import { exportCSV, exportJSON } from "./export.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-11-ui-events";
const PANEL_ID = "panel-11";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
let _abortController = null;
let _listenerCount = 0;
function bindEvents(container, state, handlers) {
  unbindEvents();
  _abortController = new AbortController();
  const signal = _abortController.signal;
  _listenerCount = 0;
  _initPorts();
  const data = state.data;
  const filters = state.filters;
  const toast = state.toast;
  const drawer = state.drawer;
  const eventBus = _getPort("eventBus");
  const refreshBtn = container.querySelector('[data-action="refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      emitPanelIntent("REFRESH", PANEL_ID);
      if (toast && toast["info"]) toast["info"]("Atualizando dados...");
    }, { signal });
    _listenerCount++;
  }
  const retryBtn = container.querySelector('[data-action="retry"]');
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      emitPanelIntent("REFRESH", PANEL_ID);
    }, { signal });
    _listenerCount++;
  }
  const exportToggle = container.querySelector('[data-action="export-toggle"]');
  if (exportToggle) {
    exportToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const dropdown = container.querySelector('[data-dropdown="export"]');
      if (dropdown) {
        state.exportMenuOpen = !state.exportMenuOpen;
        dropdown.style.display = state.exportMenuOpen ? "block" : "none";
      }
    }, { signal });
    _listenerCount++;
  }
  const csvExport = container.querySelector('[data-export="csv"]');
  if (csvExport) {
    csvExport.addEventListener("click", () => {
      exportCSV(data);
      if (toast && toast["success"]) toast["success"]("CSV exportado");
      handlers.closeExportMenu();
    }, { signal });
    _listenerCount++;
  }
  const jsonExport = container.querySelector('[data-export="json"]');
  if (jsonExport) {
    jsonExport.addEventListener("click", () => {
      exportJSON(data);
      if (toast && toast["success"]) toast["success"]("JSON exportado");
      handlers.closeExportMenu();
    }, { signal });
    _listenerCount++;
  }
  const autoRefreshToggle = container.querySelector('[data-action="toggle-auto-refresh"]');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener("click", () => {
      state.autoRefreshEnabled = !state.autoRefreshEnabled;
      const toggle = container.querySelector('[data-action="toggle-auto-refresh"]');
      const countdown = container.querySelector("[data-countdown]");
      if (toggle) toggle.classList.toggle("active", !!state.autoRefreshEnabled);
      if (countdown) countdown.classList.toggle("active", !!state.autoRefreshEnabled);
      if (toast && toast["info"]) toast["info"](state.autoRefreshEnabled ? "Auto-refresh ativado" : "Auto-refresh desativado");
    }, { signal });
    _listenerCount++;
  }
  const periodBtns = container.querySelectorAll("[data-period]");
  const eventBusTyped = eventBus;
  periodBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.period = btn.dataset.period;
      container.querySelectorAll("[data-period]").forEach((b) => {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      if (toast && toast["info"]) toast["info"](`Per\xEDodo alterado para ${btn.textContent}`);
      if (eventBusTyped?.emit) eventBusTyped.emit(PANEL_INTENTS.FILTER_CHANGE, { panelId: PANEL_ID, period: filters.period });
    }, { signal });
    _listenerCount++;
  });
  const statusFilters = container.querySelectorAll('[data-filter="status"]');
  statusFilters.forEach((chip) => {
    chip.addEventListener("click", () => {
      filters.status = chip.dataset.value || null;
      container.querySelectorAll('[data-filter="status"]').forEach((c) => {
        c.classList.remove("active");
      });
      chip.classList.add("active");
      if (eventBusTyped?.emit) eventBusTyped.emit(PANEL_INTENTS.FILTER_CHANGE, { panelId: PANEL_ID, status: filters.status });
    }, { signal });
    _listenerCount++;
  });
  const viewAlerts = container.querySelector('[data-action="view-alerts"]');
  if (viewAlerts) {
    viewAlerts.addEventListener("click", () => {
      const topErrors = data.top_errors || [];
      if (drawer && drawer["open"]) drawer["open"]({ type: "errors", errors: topErrors });
    }, { signal });
    _listenerCount++;
  }
  const errorRows = container.querySelectorAll("[data-error-job]");
  errorRows.forEach((row) => {
    row.addEventListener("click", () => {
      const jobName = row.dataset.errorJob;
      const topErrors = data.top_errors || [];
      const errors = topErrors.filter((e) => (e.job_name || "") === jobName);
      if (drawer && drawer["open"]) drawer["open"]({ type: "errors", errors: errors.length ? errors : topErrors });
    }, { signal });
    _listenerCount++;
  });
  document.addEventListener("click", () => {
    handlers.closeExportMenu();
  }, { once: true, signal });
  _listenerCount++;
}
function unbindEvents() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized, listenersBound: _listenerCount, hasAbortController: _abortController !== null };
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      eventsReady: true,
      portsInitialized: portsSnapshot._initialized,
      cleanupAvailable: typeof unbindEvents === "function",
      listenersTracked: _abortController !== null || _listenerCount === 0
    }
  };
}
var events_default = { bindEvents, unbindEvents };
export {
  MODULE_ID,
  VERSION,
  bindEvents,
  events_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  unbindEvents
};
