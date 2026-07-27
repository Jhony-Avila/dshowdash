import { ICONS } from "../../../_shared/icons.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-12/ui/header";
const renderHeader = (options = {}) => {
  const { title = "Cron Jobs", subtitle = "Monitoramento de Jobs", onRefresh, onToggleAutoRefresh, autoRefreshEnabled = true, countdown = 0 } = options;
  return `<div class="painel-12-header"><div class="painel-12-header__title-group"><h2 class="painel-12-header__title">${ICONS.clock || ""} ${title}</h2><span class="painel-12-header__subtitle">${subtitle}</span></div><div class="painel-12-header__actions"><div class="painel-12-header__auto-refresh"><label class="painel-12-toggle"><input type="checkbox" ${autoRefreshEnabled ? "checked" : ""} data-action="toggle-auto-refresh"><span class="painel-12-toggle__slider"></span></label><span class="painel-12-header__countdown" data-countdown>${countdown}s</span></div><button class="painel-12-btn painel-12-btn--icon" data-action="refresh" title="Atualizar agora">${ICONS.refresh || "\u21BB"}</button></div></div>`;
};
const updateCountdown = (container, value) => {
  const el = container?.querySelector("[data-countdown]");
  if (el) el.textContent = `${value}s`;
};
const bindHeaderEvents = (container, callbacks = {}) => {
  if (!container) return;
  const refreshBtn = container.querySelector('[data-action="refresh"]');
  if (refreshBtn && callbacks.onRefresh) {
    refreshBtn.addEventListener("click", callbacks.onRefresh);
  }
  const autoRefreshToggle = container.querySelector('[data-action="toggle-auto-refresh"]');
  if (autoRefreshToggle && callbacks.onToggleAutoRefresh) {
    autoRefreshToggle.addEventListener("change", (e) => callbacks.onToggleAutoRefresh(e.target.checked));
  }
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
var header_default = { renderHeader, updateCountdown, bindHeaderEvents, info, healthCheck };
const showRefreshIndicator = (container) => {
};
const hideRefreshIndicator = (container) => {
};
const updateFilterCounts = (container) => {
};
const applyDensity = (container) => {
};
export {
  MODULE_ID,
  VERSION,
  applyDensity,
  bindHeaderEvents,
  header_default as default,
  healthCheck,
  hideRefreshIndicator,
  info,
  renderHeader,
  showRefreshIndicator,
  updateCountdown,
  updateFilterCounts
};
