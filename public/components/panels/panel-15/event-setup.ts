// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15:event-setup
// PURPOSE: Panel-15 - Event Setup
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_INTENTS, createPanelHandler from /core/runtime/events/catalog/panels.events.js
//   getErrorMessage from ./core/config.js
//   updateRefreshBtn, updateTimestamp, updateCountdown from ./core/template.js
//   REFRESH_INTERVAL from ./countdown.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setupStateSubscription() — exported function
//   setupEventListeners() — exported function
//   cleanupEventListeners() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'visibilitychange'
//   PANEL_INTENTS.REFRESH
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PANEL_INTENTS, createPanelHandler } from '/core/runtime/events/catalog/panels.events.js';
import { getErrorMessage } from './core/config.js';
import { updateRefreshBtn, updateTimestamp, updateCountdown } from './core/template.js';
import { REFRESH_INTERVAL } from './countdown.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-15:event-setup';

type PanelCtx = Record<string, unknown>;
type PanelStore = { subscribe: (fn: (state: Record<string, unknown>) => void) => () => void };
type UiComp = { showLoading: () => void; showError: (msg: string) => void; update: (data: unknown) => void };
type EventBus = { on: (event: string, handler: unknown) => void; off: (event: string, handler: unknown) => void };

export function setupStateSubscription(panel: PanelCtx) {
  const unsubscribe = (panel.store as PanelStore).subscribe((state: Record<string, unknown>) => {
    if (state.loading) {
      if (!panel.initialLoadDone && panel.uiComponent) (panel.uiComponent as UiComp).showLoading();
      updateRefreshBtn(panel.container as HTMLElement, 'Atualizando...', true);
    } else if (state.error) {
      if (!state.data && panel.uiComponent) (panel.uiComponent as UiComp).showError(getErrorMessage(state.error as string));
      updateRefreshBtn(panel.container as HTMLElement, 'Erro', false);
    } else if (state.data) {
      if (panel.uiComponent) (panel.uiComponent as UiComp).update(state.data);
      updateRefreshBtn(panel.container as HTMLElement, 'Atualizado', false);
      updateTimestamp(panel.container as HTMLElement, state.lastUpdate as number);
      panel.countdownValue = REFRESH_INTERVAL;
      updateCountdown(panel.container as HTMLElement, panel.countdownValue as number);
    }
  });
  (panel.unsubscribers as Array<() => void>).push(unsubscribe);
}

export function setupEventListeners(panel: PanelCtx, PAINEL_ID: string) {
  const abortController = panel.abortController as AbortController;
  document.addEventListener('visibilitychange', panel._handleVisibilityChange as EventListener, { signal: abortController.signal });

  // Enterprise: create filtered handler if not exists (lazy initialization)
  if (!panel._filteredRefreshHandler) {
    panel._filteredRefreshHandler = createPanelHandler(PAINEL_ID, panel._handleRefreshEvent as (...args: unknown[]) => void);
  }

  if (panel.eventBus && (panel.eventBus as EventBus).on) {
    (panel.eventBus as EventBus).on(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
  }

  const container = panel.container as HTMLElement;
  const refreshBtn = container.querySelector('[data-action="refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (panel.dataLoader) (panel.dataLoader as Record<string, () => void>).loadData();
      panel.countdownValue = REFRESH_INTERVAL;
    }, { signal: abortController.signal });
  }

  const autoRefreshToggle = container.querySelector('[data-action="toggle-auto-refresh"]');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('click', panel._handleAutoRefreshToggle as EventListener, { signal: abortController.signal });
  }
}

export function cleanupEventListeners(panel: PanelCtx, PAINEL_ID: string) {
  if (panel.abortController) {
    (panel.abortController as AbortController).abort();
    panel.abortController = null;
  }

  const unsubscribers = panel.unsubscribers as Array<() => void>;
  for (let i = 0; i < unsubscribers.length; i++) {
    try { unsubscribers[i](); } catch (e) {}
  }
  panel.unsubscribers = [];

  if (panel.eventBus && (panel.eventBus as EventBus).off && panel._filteredRefreshHandler) {
    (panel.eventBus as EventBus).off(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { setupStateSubscription, setupEventListeners, cleanupEventListeners };
