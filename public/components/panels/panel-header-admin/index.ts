// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-INLINE-EDIT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel Header Admin - Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state from ./state/store.js
//   tracker from ./telemetry/tracker.js
//   ui from ./ui/renderer.js
//   MODULE_ID, metrics, loadCSS, ensureAuth, checkPanelAccess, healthCheck as bui...
//   initDragDrop, enableDragOnCards from ./handlers/drag-drop.js
//   initPreview, updatePreview, togglePreviewExpand from ./handlers/preview.js
//   initSync, triggerSync, refreshLiveHeader from ./handlers/sync.js
//   createInlineEditHandlers from ./handlers/inline-edit.js
//
// PROVIDES:
//   VERSION — module constant
//   getVersion() — exported function
//   MODULE_ID — module constant
//   PanelHeaderAdmin() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
//   'submit'
// WINDOW ACCESS:
//   (window as any).PanelHeaderAdmin
//   window.__dev
//
// @changelog
//   9.4.0-INLINE-EDIT: Added inline editing for label and order_index
//     via createInlineEditHandlers. Single-click on card name/order triggers
//     inline edit. Follows panel-nav-admin pattern.
//   9.3.0-P2-ENTERPRISE: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { state } from './state/store.js';
import { tracker } from './telemetry/tracker.js';

// @ts-expect-error TS migration - TS2614
import { ui } from './ui/renderer.js';
import * as headerAdapter from './core/header-adapter.js';
import { MODULE_ID, metrics, loadCSS, ensureAuth, checkPanelAccess, healthCheck as buildHealthCheck, info as buildInfo } from './core/lifecycle.js';
import * as crud from './handlers/crud.js';
import * as uiActions from './handlers/ui-actions.js';
import { initDragDrop, enableDragOnCards } from './handlers/drag-drop.js';
import { initPreview, updatePreview, togglePreviewExpand } from './handlers/preview.js';
import { initSync, triggerSync, refreshLiveHeader } from './handlers/sync.js';
import { createInlineEditHandlers, clearEditState } from './handlers/inline-edit.js';

export const VERSION = '9.4.0-INLINE-EDIT';
export { MODULE_ID };
export const getVersion = () => VERSION;

const PanelHeaderAdmin = (() => {
  'use strict';
  let isInitialized = false;
  let container: HTMLElement | null = null;
  let abortController: AbortController | null = null;
  let unsubscribeState: (() => void) | null = null;
  let inlineEditHandlers: ReturnType<typeof createInlineEditHandlers> | null = null;

  const callbacks = {
    showToast: (msg: string, type: string) => (uiActions as any).showToast(container, msg, type),
    showLoading: (show: boolean) => (uiActions as any).showLoading(container, show),
    closeAllModals: () => (uiActions as any).closeAllModals(container),
    loadData: () => _loadData(),
    triggerSync: () => { triggerSync('update'); updatePreview(); }
  };

  const init = () => {
    if (isInitialized) return Promise.resolve({ success: true, alreadyInitialized: true });
    tracker.trackInit(); (loadCSS as any)(); state.init(); (initSync as any)(); isInitialized = true; tracker.trackInitComplete();
    return Promise.resolve({ success: true });
  };

  const mount = (targetContainer: HTMLElement) => {
    if (!targetContainer) return Promise.resolve({ success: false, error: 'Container is required' });
    if (!ensureAuth('mount')) return Promise.resolve({ success: false, error: 'Authentication required' });
    if (!checkPanelAccess()) {
      tracker.trackAccessDenied('mount');
      targetContainer.innerHTML = '<div class="pha-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Acesso negado. Nível de acesso insuficiente.</p></div>';
      return Promise.resolve({ success: false, error: 'Access denied' });
    }
    container = targetContainer;
    abortController = new AbortController();
    return init().then(() => {
      // @ts-expect-error strict migration — TS2345
      _render(); _setupEventListeners(); _subscribeToState(); initDragDrop(container, callbacks);
      metrics.mountCount++; metrics.lastActivity = Date.now(); tracker.trackMounted();
      return _loadData();
    }).then(() => {
      // @ts-expect-error strict migration — TS2345
      initPreview(container);
      return { success: true };
    });
  };

  const unmount = () => {
    if (abortController) { abortController.abort(); abortController = null; }
    if (unsubscribeState) { unsubscribeState(); unsubscribeState = null; }
    clearEditState();
    inlineEditHandlers = null;
    if (container) { container.innerHTML = ''; container = null; }
    state.clearEditingComponent(); state.clearPendingDelete();
    metrics.unmountCount++; tracker.trackUnmounted();
    return { success: true };
  };

  const _loadData = () => {
    state.markLoading(); tracker.trackLoadStart();
    return Promise.all([headerAdapter.getGroups(), headerAdapter.getComponents(true)]).then(([groups, components]) => {
      state.setGroups(groups as Record<string, unknown>[]); state.setComponents(components as Record<string, unknown>[]); state.markReady();
      metrics.loadCount++; tracker.trackLoadSuccess({ groupCount: (groups as Record<string, unknown>[]).length, componentCount: (components as Record<string, unknown>[]).length });
      // @ts-expect-error strict migration — TS2345
      _render(); enableDragOnCards(container); updatePreview();
    }).catch((error) => {
      metrics.errorCount++; state.setError(error.message); tracker.trackLoadError(error); _render();
    });
  };

  const _render = () => {
    if (!container) return;
    const currentState = state.getState();
    (currentState as any).getFilteredComponents = () => state.getFilteredComponents();
    container.innerHTML = ui.renderPanel(currentState);
    enableDragOnCards(container); initPreview(container);
  };

  const _subscribeToState = () => { unsubscribeState = state.subscribe(() => { updatePreview(); }); };

  const _setupEventListeners = () => {
    if (!container || !abortController) return;
    const signal = abortController.signal;

    // Inline edit handlers (label + order_index)
    inlineEditHandlers = createInlineEditHandlers({
      container: container,
      api: { updateComponent: (payload: Record<string, unknown>) => headerAdapter.updateComponent(payload.id as string | number, payload) },
      showToast: callbacks.showToast,
      loadData: () => _loadData()
    });

    container.addEventListener('click', _handleClick, { signal });
    container.addEventListener('change', _handleChange, { signal });
    container.addEventListener('input', _handleInput, { signal });
    container.addEventListener('submit', _handleSubmit, { signal });
  };

  const _handleClick = (e: Event) => {
    // Inline edit: handle clicks on .pha-card__name and .pha-card__order
    const target = e.target as HTMLElement;
    if (inlineEditHandlers && !target.closest('[data-action]') && !target.closest('.pha-card__drag-handle')) {
      if (target.closest('.pha-card__name') || target.closest('.pha-card__order')) {
        inlineEditHandlers.handleClick(e as MouseEvent);
        return;
      }
    }

    const actionEl = target.closest<HTMLElement>('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const componentId = actionEl.dataset.componentId || target.closest<HTMLElement>('[data-component-id]')?.dataset.componentId;
    switch (action) {
      case 'refresh': _loadData(); break;
      case 'create-component': (crud as any).openComponentForm(container); _render(); break;
      case 'edit-component': (crud as any).openComponentForm(container, componentId); _render(); break;
      case 'delete-component': (crud as any).confirmDeleteComponent(container, componentId); _render(); break;
      // @ts-expect-error strict migration — TS2345
      case 'toggle': _handleToggle(componentId); break;
      case 'close-modal': state.clearEditingComponent(); state.clearPendingDelete(); _render(); break;
      // @ts-expect-error strict migration — TS2345
      case 'confirm-delete': _handleConfirmDelete(componentId); break;
      case 'dismiss-error': state.clearError(); _render(); break;
      case 'preview-refresh': updatePreview(); break;
      // @ts-expect-error strict migration — TS2345
      case 'preview-toggle': togglePreviewExpand(container); break;
      case 'sync-now': refreshLiveHeader(); callbacks.showToast('Header atualizado!', 'success'); break;
    }
  };

  const _handleToggle = (componentId: string | number) => (crud as any).toggleComponent(componentId, callbacks).then(() => { (triggerSync as any)('toggle', { componentId }); updatePreview(); });
  const _handleConfirmDelete = (componentId: string | number) => (crud as any).executeDeleteComponent(componentId, callbacks).then(() => { (triggerSync as any)('delete', { componentId }); updatePreview(); });
  const _handleChange = (e: Event) => { const filter = (e.target as HTMLElement & { dataset: DOMStringMap; value: string }).dataset.filter; if (filter) { state.setFilter(filter as 'search' | 'group' | 'type' | 'status', (e.target as HTMLInputElement).value); _render(); } };
  const _handleInput = (e: Event) => { const filter = (e.target as HTMLElement & { dataset: DOMStringMap }).dataset.filter; if (filter === 'search') { state.setFilter('search', (e.target as HTMLInputElement).value); _render(); } };

  const _handleSubmit = (e: Event) => {
    e.preventDefault();
    const form = (e.target as HTMLElement).closest<HTMLElement>('[data-form]');
    if (!form) return;
    const formType = form.dataset.form;
    const formData = new FormData(form as HTMLFormElement);
    const data: Record<string, unknown> = {};
    formData.forEach((value, key) => { data[key] = value; });
    data.show_on_mobile = (form.querySelector('[name="show_on_mobile"]') as HTMLInputElement)?.checked ?? false;
    data.show_on_tablet = (form.querySelector('[name="show_on_tablet"]') as HTMLInputElement)?.checked ?? false;
    data.show_on_desktop = (form.querySelector('[name="show_on_desktop"]') as HTMLInputElement)?.checked ?? false;
    data.is_active = (form.querySelector('[name="is_active"]') as HTMLInputElement)?.checked ?? false;
    if (formType === 'component') return (crud as any).saveComponent(data, callbacks).then(() => { (triggerSync as any)('save', { componentKey: data.component_key }); updatePreview(); });
  };

  const healthCheck = () => {
    const stateHealth = state.healthCheck();
    const adapterHealth = headerAdapter.healthCheck();
    return buildHealthCheck(isInitialized, container, stateHealth, adapterHealth);
  };

  const info = () => buildInfo(isInitialized, container, healthCheck());

  return {
    init, mount, unmount, healthCheck, info,
    refreshPreview: updatePreview, syncHeader: refreshLiveHeader, getVersion: () => VERSION,
    get version() { return VERSION; }, get moduleId() { return MODULE_ID; }
  };
})();

if (typeof window !== 'undefined' && !isStrict()) {
  (window as any).PanelHeaderAdmin = PanelHeaderAdmin;
  window.__dev = window.__dev || {};
  window.__dev.panels = window.__dev.panels || {};
  (window.__dev as any).panels.headerAdmin = PanelHeaderAdmin;
}

export { PanelHeaderAdmin };
export const healthCheck = PanelHeaderAdmin.healthCheck;
export const destroy = () => PanelHeaderAdmin.unmount();
export default { PanelHeaderAdmin, mount: PanelHeaderAdmin.mount, unmount: PanelHeaderAdmin.unmount, destroy, healthCheck, getVersion, VERSION, MODULE_ID };
