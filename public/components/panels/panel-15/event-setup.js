import { PANEL_INTENTS, createPanelHandler } from "/core/runtime/events/catalog/panels.events.js";
import { getErrorMessage } from "./core/config.js";
import { updateRefreshBtn, updateTimestamp, updateCountdown } from "./core/template.js";
import { REFRESH_INTERVAL } from "./countdown.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-15:event-setup";
function setupStateSubscription(panel) {
  const unsubscribe = panel.store.subscribe((state) => {
    if (state.loading) {
      if (!panel.initialLoadDone && panel.uiComponent) panel.uiComponent.showLoading();
      updateRefreshBtn(panel.container, "Atualizando...", true);
    } else if (state.error) {
      if (!state.data && panel.uiComponent) panel.uiComponent.showError(getErrorMessage(state.error));
      updateRefreshBtn(panel.container, "Erro", false);
    } else if (state.data) {
      if (panel.uiComponent) panel.uiComponent.update(state.data);
      updateRefreshBtn(panel.container, "Atualizado", false);
      updateTimestamp(panel.container, state.lastUpdate);
      panel.countdownValue = REFRESH_INTERVAL;
      updateCountdown(panel.container, panel.countdownValue);
    }
  });
  panel.unsubscribers.push(unsubscribe);
}
function setupEventListeners(panel, PAINEL_ID) {
  const abortController = panel.abortController;
  document.addEventListener("visibilitychange", panel._handleVisibilityChange, { signal: abortController.signal });
  if (!panel._filteredRefreshHandler) {
    panel._filteredRefreshHandler = createPanelHandler(PAINEL_ID, panel._handleRefreshEvent);
  }
  if (panel.eventBus && panel.eventBus.on) {
    panel.eventBus.on(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
  }
  const container = panel.container;
  const refreshBtn = container.querySelector('[data-action="refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      if (panel.dataLoader) panel.dataLoader.loadData();
      panel.countdownValue = REFRESH_INTERVAL;
    }, { signal: abortController.signal });
  }
  const autoRefreshToggle = container.querySelector('[data-action="toggle-auto-refresh"]');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener("click", panel._handleAutoRefreshToggle, { signal: abortController.signal });
  }
}
function cleanupEventListeners(panel, PAINEL_ID) {
  if (panel.abortController) {
    panel.abortController.abort();
    panel.abortController = null;
  }
  const unsubscribers = panel.unsubscribers;
  for (let i = 0; i < unsubscribers.length; i++) {
    try {
      unsubscribers[i]();
    } catch (e) {
    }
  }
  panel.unsubscribers = [];
  if (panel.eventBus && panel.eventBus.off && panel._filteredRefreshHandler) {
    panel.eventBus.off(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var event_setup_default = { setupStateSubscription, setupEventListeners, cleanupEventListeners };
export {
  MODULE_ID,
  VERSION,
  cleanupEventListeners,
  event_setup_default as default,
  info,
  setupEventListeners,
  setupStateSubscription
};
