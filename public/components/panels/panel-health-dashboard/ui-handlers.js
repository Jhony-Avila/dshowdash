import { showModuleDetails } from "./modal.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-health-dashboard:ui-handlers";
const SVGS = {
  lock: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  warning: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};
function bindUIEvents(panel) {
  if (!panel.container) return;
  const refreshBtn = panel.container.querySelector('[data-action="refresh"]');
  if (refreshBtn) refreshBtn.addEventListener("click", () => panel.refresh());
  const autoRefreshToggle = panel.container.querySelector('[data-action="toggle-auto-refresh"]');
  if (autoRefreshToggle) {
    autoRefreshToggle.checked = panel.autoRefreshEnabled;
    autoRefreshToggle.addEventListener("change", (e) => {
      panel.autoRefreshEnabled = e.target.checked;
      if (panel.autoRefreshEnabled) panel._startAutoRefresh();
      else panel._stopAutoRefresh();
    });
  }
  const catToggles = panel.container.querySelectorAll('[data-action="toggle-category"]');
  catToggles.forEach((el) => {
    el.addEventListener("click", () => {
      const cat = el.dataset.category;
      if (panel.expandedCategories.has(cat)) panel.expandedCategories.delete(cat);
      else panel.expandedCategories.add(cat);
      panel._render();
    });
  });
  const moduleViewBtns = panel.container.querySelectorAll('[data-action="view-module"]');
  moduleViewBtns.forEach((el) => {
    el.addEventListener("click", () => showModuleDetails(el.dataset.module));
  });
}
function updateCountdownDisplay(panel) {
  const el = panel.container?.querySelector(".phd-countdown");
  if (el && panel.autoRefreshEnabled) {
    el.textContent = `${panel.countdownValue}s`;
    el.style.display = "inline";
  } else if (el) {
    el.style.display = "none";
  }
}
function renderAuthBlockedView(container) {
  if (!container) return;
  container.innerHTML = `<div class="phd-auth-blocked"><div class="phd-auth-blocked__icon">${SVGS.lock}</div><h3>Acesso Restrito</h3><p>Fa\xE7a login para acessar o Health Dashboard</p></div>`;
}
function renderErrorView(container, message, onRetry) {
  if (!container) return;
  container.innerHTML = `<div class="phd-error-view"><div class="phd-error-view__icon">${SVGS.warning}</div><h3>Erro ao carregar dados</h3><p>${message || "Erro desconhecido"}</p><button class="phd-btn phd-btn--retry" data-action="retry">Tentar Novamente</button></div>`;
  const retryBtn = container.querySelector('[data-action="retry"]');
  if (retryBtn && onRetry) retryBtn.addEventListener("click", onRetry);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var ui_handlers_default = { bindUIEvents, updateCountdownDisplay, renderAuthBlockedView, renderErrorView };
export {
  MODULE_ID,
  VERSION,
  bindUIEvents,
  ui_handlers_default as default,
  info,
  renderAuthBlockedView,
  renderErrorView,
  updateCountdownDisplay
};
