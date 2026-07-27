// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-18:event-setup
// PURPOSE: Panel-18 - Event Setup
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_INTENTS, createPanelHandler from /core/runtime/events/catalog/panels.events.js
//   updateRefreshBtn, updateTimestamp, updateCountdown from ./core/template.js
//   getErrorMessage from ./core/config.js
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
import { updateRefreshBtn, updateTimestamp, updateCountdown } from './core/template.js';
import { getErrorMessage } from './core/config.js';
import { REFRESH_INTERVAL } from './countdown.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-18:event-setup';

interface UiComponent {
  showLoading: () => void;
  showError: (msg: string) => void;
  update: (data: unknown) => void;
}

interface StoreContext {
  subscribe: (listener: (state: Record<string, unknown>) => void) => () => void;
}

interface EventBusContext {
  on?: (event: string, handler: unknown) => void;
  off?: (event: string, handler: unknown) => void;
}

interface AbortControllerContext {
  signal: AbortSignal;
  abort: () => void;
}

interface DataLoaderContext {
  loadData: () => void;
}

interface PanelContext {
  store: StoreContext;
  container: HTMLElement;
  uiComponent: UiComponent | null;
  initialLoadDone: boolean;
  countdownValue: number;
  unsubscribers: Array<() => void>;
  abortController: AbortControllerContext | null;
  eventBus: EventBusContext | null;
  dataLoader: DataLoaderContext | null;
  _handleVisibilityChange: EventListener;
  _handleRefreshEvent: (...args: unknown[]) => void;
  _handleAutoRefreshToggle: EventListener;
  _filteredRefreshHandler: unknown;
}

export function setupStateSubscription(panel: PanelContext) {
  const unsubscribe = panel.store.subscribe((state: Record<string, unknown>) => {
    if (state.loading) {
      if (!panel.initialLoadDone && panel.uiComponent) {
        panel.uiComponent.showLoading();
      }
      updateRefreshBtn(panel.container, 'Atualizando...', true);
    } else if (state.error) {
      if (!state.data && panel.uiComponent) {
        panel.uiComponent.showError(getErrorMessage(state.error as string));
      }
      updateRefreshBtn(panel.container, 'Erro', false);
    } else if (state.data) {
      if (panel.uiComponent) panel.uiComponent.update(state.data);
      updateRefreshBtn(panel.container, 'Atualizado', false);
      updateTimestamp(panel.container, state.lastUpdate as number);
      panel.countdownValue = REFRESH_INTERVAL;
      updateCountdown(panel.container, panel.countdownValue);
    }
  });
  panel.unsubscribers.push(unsubscribe);
}

export function setupEventListeners(panel: PanelContext, PAINEL_ID: string) {
  document.addEventListener('visibilitychange', panel._handleVisibilityChange, {
    signal: panel.abortController!.signal
  });

  // Enterprise: create filtered handler if not exists (lazy initialization)
  if (!panel._filteredRefreshHandler) {
    panel._filteredRefreshHandler = createPanelHandler(PAINEL_ID, panel._handleRefreshEvent);
  }

  if (panel.eventBus && panel.eventBus.on) {
    panel.eventBus.on(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
  }

  const refreshBtn = panel.container.querySelector('[data-action="refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (panel.dataLoader) panel.dataLoader.loadData();
      panel.countdownValue = REFRESH_INTERVAL;
    }, { signal: panel.abortController!.signal });
  }

  const autoRefreshToggle = panel.container.querySelector('[data-action="toggle-auto-refresh"]');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('click', panel._handleAutoRefreshToggle, {
      signal: panel.abortController!.signal
    });
  }
}

export function cleanupEventListeners(panel: PanelContext, PAINEL_ID: string) {
  if (panel.abortController) {
    panel.abortController.abort();
    panel.abortController = null;
  }

  for (let i = 0; i < panel.unsubscribers.length; i++) {
    try { panel.unsubscribers[i](); } catch (e) {}
  }
  panel.unsubscribers = [];

  if (panel.eventBus && panel.eventBus.off && panel._filteredRefreshHandler) {
    panel.eventBus.off(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { setupStateSubscription, setupEventListeners, cleanupEventListeners };
