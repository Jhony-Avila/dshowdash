import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { PANEL_ID, REFRESH_INTERVAL } from "./core/constants.js";
import { mount as bootstrapMount, unmount as bootstrapUnmount } from "./bootstrap/mount.js";
import { store } from "./state/store.js";
import { apiClient } from "./services/api.js";
import { updateCountdown } from "./renderer/status.js";
import { clear as clearTable } from "./renderer/table.js";
// `start` faltava no import: o mount chamava startScheduler(...) -> ReferenceError
// -> painel 100% morto. scheduler/refresh.js exporta start(options) e stop().
import { start as startScheduler, stop as stopScheduler } from "./scheduler/refresh.js";
import * as Telemetry from "./telemetry/tracker.js";
import { toastManager } from "./ui/toast.js";
import { chartsRenderer } from "./ui/charts.js";
import { insightsRenderer } from "./ui/insights.js";
import { funilRenderer } from "./ui/funil.js";
import { advancedRenderer } from "./ui/advanced.js";
import { modalsManager } from "./ui/modals.js";
import { exportManager } from "./utils/export-manager.js";
import * as Favoritos from "./managers/favoritos.js";
import * as ModalController from "./managers/modal-controller.js";
import * as Cliente360View from "./managers/cliente360-view.js";
import { loadAllData, loadClientes } from "./handlers/data.js";
import { handleClick, handleChange, handleInput, handleKeyboard, clearSearchTimeout } from "./handlers/events.js";
import * as Subscriptions from "./handlers/subscriptions.js";
import * as SectionRenderers from "./render/sections.js";
const MODULE_ID = "panel-05";
const VERSION = "9.3.0-P2-ENTERPRISE";
const getVersion = () => VERSION;
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  return auth?.isAuthenticated?.() ?? false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _getEventBus = () => {
  const eb = _getPort("eventBus");
  if (eb) return eb;
  if (window.Core?.windowAdapter?.get) {
    const web = window.Core.windowAdapter.get("EventBus");
    if (web) return web;
  }
  return null;
};
const _getLogger = () => {
  const logger = _getPort("logger");
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get("Logger");
    if (wl) return wl;
  }
  return null;
};
const _emitLifecycle = (event, data = {}) => {
  const eb = _getEventBus();
  if (eb?.emit) eb.emit(event, { ...data || {}, source: MODULE_ID, timestamp: Date.now() });
};
const _log = (level, msg, data = {}) => {
  const logger = _getLogger();
  if (logger?.[level]) logger[level](`[${MODULE_ID}] ${msg}`, data || "");
};
let _refs = null;
let _initialized = false;
const _selectedIds = /* @__PURE__ */ new Set();
let _mountedAt = null;
let _abortController = null;
const _getContext = () => ({ refs: _refs, moduleId: MODULE_ID, version: VERSION, renderKPIs: (data) => SectionRenderers.renderKPIs(_refs, data), renderCharts: (data) => SectionRenderers.renderCharts(_refs, data), renderInsights: (data) => SectionRenderers.renderInsights(_refs, data), renderComparativo: (data) => SectionRenderers.renderComparativo(_refs, data), renderFunil: (data) => SectionRenderers.renderFunil(_refs, data), renderChurn: (data) => SectionRenderers.renderChurn(_refs, data) });
const _initToast = () => {
  toastManager.init(_refs?.container ?? document.body);
  if (hasWindow) {
    window.Toast = { show: (opts) => {
      const type = opts.type || "info";
      const message = opts.message || "";
      return toastManager[type] ? toastManager[type](message, opts) : toastManager.info(message, opts);
    }, success: (msg, opts) => toastManager.success(msg, opts), error: (msg, opts) => toastManager.error(msg, opts), warning: (msg, opts) => toastManager.warning(msg, opts), info: (msg, opts) => toastManager.info(msg, opts) };
  }
};
const mount = (container, config = {}) => {
  _initPorts();
  if (!_isAuthenticated()) {
    return { success: false, moduleId: MODULE_ID, error: "not-authenticated" };
  }
  const doMount = async () => {
    _emitLifecycle(PANEL_EVENTS.MOUNTING);
    Telemetry.startTimer("mount");
    _abortController = new AbortController();
    const cssPath = "/components/panels/panel-05/styles/main.css";
    if (hasDocument && !document.querySelector(`link[href*="${cssPath}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssPath;
      document.head.appendChild(link);
    }
    Favoritos.load();
    const refs = await bootstrapMount(container);
    if (!refs) {
      _log("error", "Bootstrap failed");
      _emitLifecycle(PANEL_EVENTS.ERROR, { error: "bootstrap-failed" });
      return false;
    }
    _refs = refs;
    _initToast();
    Cliente360View.init(_refs.cliente360, _refs, MODULE_ID, VERSION);
    Subscriptions.setup(_getContext());
    const ctx = _getContext();
    _refs.container.addEventListener("click", (e) => handleClick(e, ctx), { signal: _abortController.signal });
    _refs.container.addEventListener("change", (e) => handleChange(e, ctx), { signal: _abortController.signal });
    _refs.container.addEventListener("input", handleInput, { signal: _abortController.signal });
    document.addEventListener("click", (e) => {
      if (e.target.closest('[data-action="close-modal"]')) ModalController.close();
    }, { signal: _abortController.signal });
    document.addEventListener("keydown", (e) => handleKeyboard(e, ctx), { signal: _abortController.signal });
    try {
      await loadAllData(MODULE_ID, VERSION);
      // O scheduler so arranca DEPOIS da carga inicial dar certo. Se loadAllData lanca
      // (hoje a API responde 500), o mount retorna false e o unmount NAO roda — um
      // setInterval orfao ficaria disparando onTick/onRefresh num painel que nunca
      // montou, estourando na rota SEGUINTE como "Mount failed {Maximum call stack}"
      // atribuido a panel-05.
      startScheduler({ interval: config.refreshInterval || REFRESH_INTERVAL || 6e4, onTick: (seconds) => updateCountdown(_refs, seconds), onRefresh: () => loadClientes() });
      _initialized = true;
      _mountedAt = Date.now();
      const duration = Telemetry.endTimer("mount");
      Telemetry.track("mount", { duration });
      _emitLifecycle(PANEL_EVENTS.MOUNTED, { duration });
      _emitLifecycle(PANEL_EVENTS.READY);
      _log("info", `Mounted v${VERSION}`);
      toastManager.success("Painel carregado");
      return true;
    } catch (err) {
      stopScheduler();   // rede de seguranca: nada de timer sobrevivendo a um mount falho
      _log("error", "Mount failed", { error: err?.message });
      _emitLifecycle(PANEL_EVENTS.ERROR, { error: err?.message });
      return false;
    }
  };
  if (_initialized) return unmount().then(doMount);
  return doMount();
};
const unmount = () => {
  _emitLifecycle(PANEL_EVENTS.UNMOUNTING);
  Telemetry.track("unmount", { uptime: _mountedAt ? Date.now() - _mountedAt : 0 });
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  stopScheduler();
  Subscriptions.clear();
  clearSearchTimeout();
  ModalController.close();
  Cliente360View.destroy();
  clearTable();
  store.reset();
  bootstrapUnmount();
  _refs = null;
  _initialized = false;
  Favoritos.clear();
  _selectedIds.clear();
  _mountedAt = null;
  _emitLifecycle(PANEL_EVENTS.UNMOUNTED);
  _log("info", "Unmounted");
  return Promise.resolve();
};
const refresh = () => {
  if (!_isDocumentVisible()) return Promise.resolve();
  _emitLifecycle(PANEL_EVENTS.REFRESH_START);
  Telemetry.startTimer("refresh");
  return loadAllData(MODULE_ID, VERSION).then(() => {
    const duration = Telemetry.endTimer("refresh");
    _emitLifecycle(PANEL_EVENTS.REFRESH_DONE, { duration });
    toastManager.success("Dados atualizados");
  });
};
const getState = () => store.getState();
const getView = () => Cliente360View.getCurrentView();
const getFavoritos = () => Favoritos.getAll();
const getSelectedIds = () => Array.from(_selectedIds);
const info = () => ({ moduleId: MODULE_ID, version: VERSION, mounted: _initialized, mountedAt: _mountedAt, uptime: _mountedAt ? Date.now() - _mountedAt : 0, view: Cliente360View.getCurrentView(), favoritos: Favoritos.count(), selected: _selectedIds.size, storeStatus: store.get("status"), cliente360: Cliente360View.info(), charts: chartsRenderer.info?.() ?? null, insights: insightsRenderer.info?.() ?? null, funil: funilRenderer.info?.() ?? null, advanced: advancedRenderer.info?.() ?? null, modals: modalsManager.info?.() ?? null, export: exportManager.info?.() ?? null, telemetry: Telemetry.getMetrics(), api: apiClient.getMetrics(), p22Compliant: true, timestamp: Date.now() });
const healthCheck = () => {
  const checks = { initialized: _initialized, refsValid: !!(_refs?.container && _refs?.tbody), storeReady: store.get("status") !== "error", cliente360Ready: !!Cliente360View.getInstance(), chartsReady: !!chartsRenderer, insightsReady: !!insightsRenderer, funilReady: !!funilRenderer, advancedReady: !!advancedRenderer, modalsReady: !!modalsManager, exportReady: !!exportManager, toastReady: !!toastManager, apiHealthy: apiClient.healthCheck().status === "HEALTHY", telemetryOk: Telemetry.healthCheck().status !== "UNHEALTHY", abortControllerActive: !!_abortController && !_abortController.signal.aborted };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 10 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, moduleId: MODULE_ID, version: VERSION, p22Compliant: true, isDocumentVisible: _isDocumentVisible(), timestamp: Date.now() };
};
const destroy = () => unmount();
var panel_05_default = { mount, unmount, destroy, refresh, info, healthCheck, getVersion, getState, getView, VERSION, MODULE_ID, PANEL_ID, injectPorts, getPorts };
if (hasWindow && !isStrict()) {
  window.Panel05 = { mount, unmount, refresh, info, healthCheck, getVersion, getState, getView };
}
export {
  MODULE_ID,
  PANEL_ID,
  VERSION,
  panel_05_default as default,
  destroy,
  getFavoritos,
  getPorts,
  getSelectedIds,
  getState,
  getVersion,
  getView,
  healthCheck,
  info,
  injectPorts,
  mount,
  refresh,
  unmount
};
