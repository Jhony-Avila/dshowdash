// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin:lifecycle
// PURPOSE: Panel Feature Flags Admin - Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_INTENTS, createPanelHandler from /core/runtime/events/catalog/panels.events.js
//   REFRESH_INTERVAL, PANEL_ID from ./core/constants.js
//   getErrorMessage from ./core/config.js
//   updateRefreshBtn, updateTimestamp, updateStatusBadges, updateCountdown, setAu...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   startCountdown() — exported function
//   stopCountdown() — exported function
//   toggleAutoRefresh() — exported function
//   setupStateSubscription() — exported function
//   setupEventListeners() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'input'
//   'visibilitychange'
//   PANEL_INTENTS.REFRESH
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PANEL_INTENTS, createPanelHandler } from '/core/runtime/events/catalog/panels.events.js';
import { REFRESH_INTERVAL, PANEL_ID } from './core/constants.js';
import { getErrorMessage } from './core/config.js';
import { updateRefreshBtn, updateTimestamp, updateStatusBadges, updateCountdown, setAutoRefreshState } from './core/template.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-feature-flags-admin:lifecycle';

interface PanelContext {
  container: HTMLElement | null;
  store: { subscribe: (cb: (state: Record<string, unknown>) => void) => () => void; getFilteredFlags: () => Record<string, unknown>[]; setFilter: (term: string) => void; };
  uiComponent: { showLoading: () => void; showError: (msg: string) => void; update: (flags: Record<string, unknown>[]) => void; } | null;
  dataLoader: { loadData: () => Promise<void>; } | null;
  eventBus: { on: (event: string, handler: unknown) => unknown; off: (event: string, handler: unknown) => void; } | null;
  abortController: AbortController | null;
  logger: { info: (...args: unknown[]) => void; };
  _handleVisibilityChange: () => void;
  _handleRefreshEvent: (payload: unknown) => void;
  _handleAutoRefreshToggle: () => void;
  _filteredRefreshHandler: unknown;
  showCreateModal: () => void;
  countdownInterval: ReturnType<typeof setInterval> | null;
  countdownValue: number;
  autoRefreshEnabled: boolean;
  initialLoadDone: boolean;
  unsubscribers: Array<() => void>;
  [key: string]: unknown;
}

// P21: _cleanups delegated to panel.unsubscribers (host component manages lifecycle)
const _cleanups: null = null; // Reference: actual cleanups stored in panel.unsubscribers

export function startCountdown(panel: PanelContext) {
  stopCountdown(panel);
  panel.countdownValue = REFRESH_INTERVAL;
  updateCountdown(panel.container, panel.countdownValue);

  panel.countdownInterval = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;  // aba oculta: nao conta nem busca
    if (!panel.autoRefreshEnabled) return;
    panel.countdownValue--;
    updateCountdown(panel.container, panel.countdownValue);
    if (panel.countdownValue <= 0) {
      panel.countdownValue = REFRESH_INTERVAL;
      if (panel.dataLoader) panel.dataLoader.loadData();
    }
  }, 1000);
}

export function stopCountdown(panel: PanelContext) {
  if (panel.countdownInterval) {
    clearInterval(panel.countdownInterval);
    panel.countdownInterval = null;
  }
}

export function toggleAutoRefresh(panel: PanelContext) {
  panel.autoRefreshEnabled = !panel.autoRefreshEnabled;
  setAutoRefreshState(panel.container, panel.autoRefreshEnabled);
  if (panel.autoRefreshEnabled) {
    panel.countdownValue = REFRESH_INTERVAL;
    updateCountdown(panel.container, panel.countdownValue);
  }
  panel.logger.info('auto-refresh.toggled', { enabled: panel.autoRefreshEnabled });
}

export function setupStateSubscription(panel: PanelContext) {
  const unsubscribe = panel.store.subscribe((state: Record<string, unknown>) => {
    const flags = state.flags as Record<string, unknown>[] | undefined;
    const error = state.error as string | undefined;
    const lastUpdate = state.lastUpdate as number | string | null | undefined;
    if (state.loading) {
      if (!panel.initialLoadDone && panel.uiComponent) panel.uiComponent.showLoading();
      updateRefreshBtn(panel.container, 'Atualizando...', true);
    } else if (error) {
      if (!flags || flags.length === 0) {
        if (panel.uiComponent) panel.uiComponent.showError(getErrorMessage(error));
      }
      updateRefreshBtn(panel.container, 'Erro', false);
    } else if (flags) {
      const filteredFlags = panel.store.getFilteredFlags();
      if (panel.uiComponent) panel.uiComponent.update(filteredFlags);
      updateRefreshBtn(panel.container, 'Atualizado', false);
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

export function setupEventListeners(panel: PanelContext) {
  document.addEventListener('visibilitychange', panel._handleVisibilityChange, { signal: panel.abortController!.signal });

  // P21: Create filtered handler and store cleanup in panel.unsubscribers
  if (!panel._filteredRefreshHandler) {
    panel._filteredRefreshHandler = createPanelHandler(PANEL_ID, panel._handleRefreshEvent);
  }

  if (panel.eventBus && panel.eventBus.on) {
    const cleanup = panel.eventBus.on(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
    if (typeof cleanup === 'function') {
      panel.unsubscribers.push(cleanup as () => void);
    } else {
      panel.unsubscribers.push(() => {
        // @ts-expect-error strict migration — TS2774
        if (panel.eventBus!.off) panel.eventBus!.off(PANEL_INTENTS.REFRESH, panel._filteredRefreshHandler);
      });
    }
  }

  const refreshBtn = panel.container!.querySelector('[data-action="refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (panel.dataLoader) panel.dataLoader.loadData();
      panel.countdownValue = REFRESH_INTERVAL;
    }, { signal: panel.abortController!.signal });
  }

  const autoRefreshToggle = panel.container!.querySelector('[data-action="toggle-auto-refresh"]');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('click', panel._handleAutoRefreshToggle, { signal: panel.abortController!.signal });
  }

  const createBtn = panel.container!.querySelector('[data-action="create"]');
  if (createBtn) {
    createBtn.addEventListener('click', () => { panel.showCreateModal(); }, { signal: panel.abortController!.signal });
  }

  const searchInput = panel.container!.querySelector('[data-filter="search"]');
  if (searchInput) {
    searchInput.addEventListener('input', (e: Event) => {
      panel.store.setFilter((e.target as HTMLInputElement).value);
      const filteredFlags = panel.store.getFilteredFlags();
      if (panel.uiComponent) panel.uiComponent.update(filteredFlags);
    }, { signal: panel.abortController!.signal });
  }
}

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, p21Compliant: true, cleanupsDelegated: 'panel.unsubscribers' }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, p21Compliant: true, cleanupsDelegated: 'panel.unsubscribers' }; }
export default { startCountdown, stopCountdown, toggleAutoRefresh, setupStateSubscription, setupEventListeners, healthCheck, info };
