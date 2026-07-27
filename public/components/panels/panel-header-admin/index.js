import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { state } from "./state/store.js";
import { tracker } from "./telemetry/tracker.js";
import { ui } from "./ui/renderer.js";
import * as headerAdapter from "./core/header-adapter.js";
import { MODULE_ID, metrics, loadCSS, ensureAuth, checkPanelAccess, healthCheck as buildHealthCheck, info as buildInfo } from "./core/lifecycle.js";
import * as crud from "./handlers/crud.js";
import * as uiActions from "./handlers/ui-actions.js";
import { initDragDrop, enableDragOnCards } from "./handlers/drag-drop.js";
import { initPreview, updatePreview, togglePreviewExpand } from "./handlers/preview.js";
import { initSync, triggerSync, refreshLiveHeader } from "./handlers/sync.js";
import { createInlineEditHandlers, clearEditState } from "./handlers/inline-edit.js";
const VERSION = "9.4.0-INLINE-EDIT";
const getVersion = () => VERSION;
const PanelHeaderAdmin = (() => {
  "use strict";
  let isInitialized = false;
  let container = null;
  let abortController = null;
  let unsubscribeState = null;
  let inlineEditHandlers = null;
  const callbacks = {
    showToast: (msg, type) => uiActions.showToast(container, msg, type),
    showLoading: (show) => uiActions.showLoading(container, show),
    closeAllModals: () => uiActions.closeAllModals(container),
    loadData: () => _loadData(),
    triggerSync: () => {
      triggerSync("update");
      updatePreview();
    }
  };
  const init = () => {
    if (isInitialized) return Promise.resolve({ success: true, alreadyInitialized: true });
    tracker.trackInit();
    loadCSS();
    state.init();
    initSync();
    isInitialized = true;
    tracker.trackInitComplete();
    return Promise.resolve({ success: true });
  };
  const mount = (targetContainer) => {
    if (!targetContainer) return Promise.resolve({ success: false, error: "Container is required" });
    if (!ensureAuth("mount")) return Promise.resolve({ success: false, error: "Authentication required" });
    if (!checkPanelAccess()) {
      tracker.trackAccessDenied("mount");
      targetContainer.innerHTML = '<div class="pha-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Acesso negado. N\xEDvel de acesso insuficiente.</p></div>';
      return Promise.resolve({ success: false, error: "Access denied" });
    }
    container = targetContainer;
    abortController = new AbortController();
    return init().then(() => {
      _render();
      _setupEventListeners();
      _subscribeToState();
      initDragDrop(container, callbacks);
      metrics.mountCount++;
      metrics.lastActivity = Date.now();
      tracker.trackMounted();
      return _loadData();
    }).then(() => {
      initPreview(container);
      return { success: true };
    });
  };
  const unmount = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (unsubscribeState) {
      unsubscribeState();
      unsubscribeState = null;
    }
    clearEditState();
    inlineEditHandlers = null;
    if (container) {
      container.innerHTML = "";
      container = null;
    }
    state.clearEditingComponent();
    state.clearPendingDelete();
    metrics.unmountCount++;
    tracker.trackUnmounted();
    return { success: true };
  };
  const _loadData = () => {
    state.markLoading();
    tracker.trackLoadStart();
    return Promise.all([headerAdapter.getGroups(), headerAdapter.getComponents(true)]).then(([groups, components]) => {
      state.setGroups(groups);
      state.setComponents(components);
      state.markReady();
      metrics.loadCount++;
      tracker.trackLoadSuccess({ groupCount: groups.length, componentCount: components.length });
      _render();
      enableDragOnCards(container);
      updatePreview();
    }).catch((error) => {
      metrics.errorCount++;
      state.setError(error.message);
      tracker.trackLoadError(error);
      _render();
    });
  };
  const _render = () => {
    if (!container) return;
    const currentState = state.getState();
    currentState.getFilteredComponents = () => state.getFilteredComponents();
    container.innerHTML = ui.renderPanel(currentState);
    enableDragOnCards(container);
    initPreview(container);
  };
  const _subscribeToState = () => {
    unsubscribeState = state.subscribe(() => {
      updatePreview();
    });
  };
  const _setupEventListeners = () => {
    if (!container || !abortController) return;
    const signal = abortController.signal;
    inlineEditHandlers = createInlineEditHandlers({
      container,
      api: { updateComponent: (payload) => headerAdapter.updateComponent(payload.id, payload) },
      showToast: callbacks.showToast,
      loadData: () => _loadData()
    });
    container.addEventListener("click", _handleClick, { signal });
    container.addEventListener("change", _handleChange, { signal });
    container.addEventListener("input", _handleInput, { signal });
    container.addEventListener("submit", _handleSubmit, { signal });
  };
  const _handleClick = (e) => {
    const target = e.target;
    if (inlineEditHandlers && !target.closest("[data-action]") && !target.closest(".pha-card__drag-handle")) {
      if (target.closest(".pha-card__name") || target.closest(".pha-card__order")) {
        inlineEditHandlers.handleClick(e);
        return;
      }
    }
    const actionEl = target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const componentId = actionEl.dataset.componentId || target.closest("[data-component-id]")?.dataset.componentId;
    switch (action) {
      case "refresh":
        _loadData();
        break;
      case "create-component":
        crud.openComponentForm(container);
        _render();
        break;
      case "edit-component":
        crud.openComponentForm(container, componentId);
        _render();
        break;
      case "delete-component":
        crud.confirmDeleteComponent(container, componentId);
        _render();
        break;
      case "toggle":
        _handleToggle(componentId);
        break;
      case "close-modal":
        state.clearEditingComponent();
        state.clearPendingDelete();
        _render();
        break;
      case "confirm-delete":
        _handleConfirmDelete(componentId);
        break;
      case "dismiss-error":
        state.clearError();
        _render();
        break;
      case "preview-refresh":
        updatePreview();
        break;
      case "preview-toggle":
        togglePreviewExpand(container);
        break;
      case "sync-now":
        refreshLiveHeader();
        callbacks.showToast("Header atualizado!", "success");
        break;
    }
  };
  const _handleToggle = (componentId) => crud.toggleComponent(componentId, callbacks).then(() => {
    triggerSync("toggle", { componentId });
    updatePreview();
  });
  const _handleConfirmDelete = (componentId) => crud.executeDeleteComponent(componentId, callbacks).then(() => {
    triggerSync("delete", { componentId });
    updatePreview();
  });
  const _handleChange = (e) => {
    const filter = e.target.dataset.filter;
    if (filter) {
      state.setFilter(filter, e.target.value);
      _render();
    }
  };
  const _handleInput = (e) => {
    const filter = e.target.dataset.filter;
    if (filter === "search") {
      state.setFilter("search", e.target.value);
      _render();
    }
  };
  const _handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target.closest("[data-form]");
    if (!form) return;
    const formType = form.dataset.form;
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    data.show_on_mobile = form.querySelector('[name="show_on_mobile"]')?.checked ?? false;
    data.show_on_tablet = form.querySelector('[name="show_on_tablet"]')?.checked ?? false;
    data.show_on_desktop = form.querySelector('[name="show_on_desktop"]')?.checked ?? false;
    data.is_active = form.querySelector('[name="is_active"]')?.checked ?? false;
    if (formType === "component") return crud.saveComponent(data, callbacks).then(() => {
      triggerSync("save", { componentKey: data.component_key });
      updatePreview();
    });
  };
  const healthCheck2 = () => {
    const stateHealth = state.healthCheck();
    const adapterHealth = headerAdapter.healthCheck();
    return buildHealthCheck(isInitialized, container, stateHealth, adapterHealth);
  };
  const info = () => buildInfo(isInitialized, container, healthCheck2());
  return {
    init,
    mount,
    unmount,
    healthCheck: healthCheck2,
    info,
    refreshPreview: updatePreview,
    syncHeader: refreshLiveHeader,
    getVersion: () => VERSION,
    get version() {
      return VERSION;
    },
    get moduleId() {
      return MODULE_ID;
    }
  };
})();
if (typeof window !== "undefined" && !isStrict()) {
  window.PanelHeaderAdmin = PanelHeaderAdmin;
  window.__dev = window.__dev || {};
  window.__dev.panels = window.__dev.panels || {};
  window.__dev.panels.headerAdmin = PanelHeaderAdmin;
}
const healthCheck = PanelHeaderAdmin.healthCheck;
const destroy = () => PanelHeaderAdmin.unmount();
var panel_header_admin_default = { PanelHeaderAdmin, mount: PanelHeaderAdmin.mount, unmount: PanelHeaderAdmin.unmount, destroy, healthCheck, getVersion, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PanelHeaderAdmin,
  VERSION,
  panel_header_admin_default as default,
  destroy,
  getVersion,
  healthCheck
};
