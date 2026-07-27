import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { CSS_PREFIX } from "./template-constants.js";
import { escapeHtml } from "./template-utils.js";
import * as ModalAdapter from "/components/overlay-layer/adapters/modal-adapter.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail.ui.template-ui";
const hasWindow = typeof window !== "undefined";
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
function updateTimestamp(container, timestamp) {
  const el = container?.querySelector("[data-last-update] span");
  if (el && timestamp) el.textContent = new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function updateRefreshBtn(container, loading) {
  const btn = container?.querySelector('[data-action="refresh"]');
  if (btn) {
    btn.classList.toggle(`${CSS_PREFIX}-action-btn--loading`, loading);
    btn.disabled = loading;
  }
}
function updateHealthSummary(container, stats) {
  if (!container || !stats) return;
  ["error", "warning", "info", "security"].forEach((k) => {
    const el = container.querySelector(`[data-count="${k}"]`);
    if (el) el.textContent = String(stats[k] || 0);
  });
}
function updateCountdown(container, seconds) {
  const el = container?.querySelector("[data-countdown]");
  if (el) el.textContent = String(seconds);
}
function setAutoRefreshState(container, active) {
  const toggle = container?.querySelector('[data-action="toggle-auto-refresh"]');
  const countdown = container?.querySelector("[data-countdown]");
  const status = container?.querySelector("[data-auto-refresh-status]");
  toggle?.classList.toggle("active", active);
  countdown?.classList.toggle("active", active);
  if (status) status.textContent = active ? "Auto-refresh: 30s" : "Auto-refresh: OFF";
}
function setDensity(container, density) {
  const table = container?.querySelector(`.${CSS_PREFIX}-table`);
  const btns = container?.querySelectorAll("[data-density]");
  if (table) table.dataset.density = density;
  btns?.forEach((btn) => btn.classList.toggle("active", btn.dataset.density === density));
}
function updateBulkActions(container, count) {
  const bar = container?.querySelector("[data-bulk-actions]");
  const countEl = container?.querySelector("[data-selected-count]");
  if (bar) bar.classList.toggle("visible", count > 0);
  if (countEl) countEl.textContent = String(count);
}
function toggleExportMenu(container) {
  const menu = container?.querySelector("[data-export-menu]");
  const btn = container?.querySelector('[data-action="toggle-export-menu"]');
  if (menu) {
    const isOpen = menu.classList.toggle("open");
    btn?.classList.toggle("active", isOpen);
  }
}
function toggleFullscreen(container) {
  container?.classList.toggle("fullscreen");
  const isFs = container?.classList.contains("fullscreen");
  const btn = container?.querySelector('[data-action="fullscreen"]');
  if (btn) btn.innerHTML = isFs ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>';
  return isFs;
}
function showToast(container, message, type = "info") {
  const toast = _getPort("toast");
  if (toast?.show) return toast.show(message, type);
  _log("warn", "Toast Service not available");
  return null;
}
async function showDetailModal(log) {
  const jsonContent = JSON.stringify(log, null, 2);
  const bodyHTML = `<pre style="background: rgba(0,0,0,0.4);padding: 1rem;border-radius: 0.5rem;overflow: auto;max-height: 400px;font-size: 0.75rem;font-family: var(--pat-font-mono, monospace);color: rgba(255,255,255,0.9);border: 1px solid rgba(255,255,255,0.1);">${escapeHtml(jsonContent)}</pre><div style="display:flex;justify-content:flex-end;margin-top:1rem;"><button onclick="this.closest('[data-overlay-id]')?.remove()" style="padding: 0.5rem 1rem;background: linear-gradient(135deg, #8B5CF6, #7C3AED);color: white;border: none;border-radius: 0.5rem;cursor: pointer;font-weight: 500;">Fechar</button></div>`;
  try {
    await ModalAdapter.open("pat-detail-modal", bodyHTML, { title: "Detalhes do Evento", scope: "panel-audit-trail" });
  } catch (e) {
    _log("warn", "Modal open failed:", e);
  }
}
function buildDetailModal(log) {
  return "";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function healthCheck() {
  const toast = _getPort("toast");
  const logger = _getPort("logger");
  return { status: toast ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { templateUiReady: true, toastAvailable: !!toast, modalAdapterAvailable: !!ModalAdapter, loggerReady: !!logger }, timestamp: Date.now() };
}
var template_ui_default = { VERSION, MODULE_ID, updateTimestamp, updateRefreshBtn, updateHealthSummary, updateCountdown, setAutoRefreshState, setDensity, updateBulkActions, toggleExportMenu, toggleFullscreen, showToast, showDetailModal, buildDetailModal, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  buildDetailModal,
  template_ui_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  setAutoRefreshState,
  setDensity,
  showDetailModal,
  showToast,
  toggleExportMenu,
  toggleFullscreen,
  updateBulkActions,
  updateCountdown,
  updateHealthSummary,
  updateRefreshBtn,
  updateTimestamp
};
