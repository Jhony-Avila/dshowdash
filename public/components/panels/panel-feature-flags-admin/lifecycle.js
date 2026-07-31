import { PANEL_INTENTS, createPanelHandler } from "/core/runtime/events/catalog/panels.events.js";
import { REFRESH_INTERVAL, PANEL_ID } from "./core/constants.js";
import { getErrorMessage } from "./core/config.js";
import { updateRefreshBtn, updateTimestamp, updateStatusBadges, updateCountdown, setAutoRefreshState } from "./core/template.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-feature-flags-admin:lifecycle";
const _cleanups = null;
function startCountdown(panel) {
  stopCountdown(panel);
  panel.countdownValue = REFRESH_INTERVAL;
  updateCountdown(panel.container, panel.countdownValue);
  panel.countdownInterval = setInterval(() => {
    if (typeof document !== "undefined" && document.hidden) return;  // aba oculta: nao conta nem busca
    if (!panel.autoRefreshEnabled) return;
    panel.countdownValue--;
    updateCountdown(panel.container, panel.countdownValue);
    if (panel.countdownValue <= 0) {
      panel.countdownValue = REFRESH_INTERVAL;
      if (panel.dataLoader) panel.dataLoader.loadData();
    }
  }, 1e3);
}
function stopCountdown(panel) {
  if (panel.countdownInterval) {
    clearInterval(panel.countdownInterval);
    panel.countdownInterval = null;
  }
}
function toggleAutoRefresh(panel) {
  panel.autoRefreshEnabled = !panel.autoRefreshEnabled;
  setAutoRefreshState(panel.container, panel.autoRefreshEnabled);
  if (panel.autoRefreshEnabled) {
    panel.countdownValue = REFRESH_INTERVAL;
    updateCountdown(panel.container, panel.countdownValue);
  }
  panel.logger.info("auto-refresh.toggled", { enabled: panel.autoRefreshEnabled });
}
function setupStateSubscription(panel) {
  const unsubscribe = panel.store.subscribe((state) => {
    const flags = state.flags;
    const error = state.error;
    const lastUpdate = state.lastUpdate;
    if (state.loading) {
      if (!panel.initialLoadDone && panel.uiComponent) panel.uiComponent.showLoading();
      updateRefreshBtn(panel.container, "Atualizando...", true);
    } else if (error) {
      if (!flags || flags.length === 0) {
        if (panel.uiComponent) panel.uiComponent.showError(getErrorMessage(error));
      }
      updateRefreshBtn(panel.container, "Erro", false);
    } else if (flags) {
      const filteredFlags = panel.store.getFilteredFlags();
      if (panel.uiComponent) panel.uiComponent.update(filteredFlags);
      updateRefreshBtn(panel.container, "Atualizado", false);
      updateTimestamp(panel.container, lastUpdate ?? null);
      let activeCount = 0;
      for (let i = 0; i < flags.length; i++) {
        if (flags[i].is_enabled) activeCount++;
      }
      updateStatusBadges(panel.container, { total: flags.length, active: activeCount });
      panel.countdownValue = REFRESH_INTERVAL;
      updateCountdown(panel.container, panel.countdownValue);
    }
  });
  panel.unsubscribers.push(unsubscribe);
}
function setupEventListeners(panel) {
  document.addEventListener("visibilitychange", panel._handleVisibilityChange, { signal: panel.abortController.signal });
  if (!panel._filteredRefreshHandler) {
    panel._filteredRefreshHandler = createPanelHandler(PANEL_ID, panel._handleRefreshEvent);
  }
  if (panel.eventBus && panel.eventBus.on) {
    const cleanup = panel.eventBus.on(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
    if (typeof cleanup === "function") {
      panel.unsubscribers.push(cleanup);
    } else {
      panel.unsubscribers.push(() => {
        if (panel.eventBus.off) panel.eventBus.off(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
      });
    }
  }
  const refreshBtn = panel.container.querySelector('[data-action="refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      if (panel.dataLoader) panel.dataLoader.loadData();
      panel.countdownValue = REFRESH_INTERVAL;
    }, { signal: panel.abortController.signal });
  }
  const autoRefreshToggle = panel.container.querySelector('[data-action="toggle-auto-refresh"]');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener("click", panel._handleAutoRefreshToggle, { signal: panel.abortController.signal });
  }
  const createBtn = panel.container.querySelector('[data-action="create"]');
  if (createBtn) {
    createBtn.addEventListener("click", () => {
      panel.showCreateModal();
    }, { signal: panel.abortController.signal });
  }
  const searchInput = panel.container.querySelector('[data-filter="search"]');
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      panel.store.setFilter(e.target.value);
      const filteredFlags = panel.store.getFilteredFlags();
      if (panel.uiComponent) panel.uiComponent.update(filteredFlags);
    }, { signal: panel.abortController.signal });
  }
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, p21Compliant: true, cleanupsDelegated: "panel.unsubscribers" };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p21Compliant: true, cleanupsDelegated: "panel.unsubscribers" };
}
var lifecycle_default = { startCountdown, stopCountdown, toggleAutoRefresh, setupStateSubscription, setupEventListeners, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  healthCheck,
  info,
  setupEventListeners,
  setupStateSubscription,
  startCountdown,
  stopCountdown,
  toggleAutoRefresh
};
