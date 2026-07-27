// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-health-dashboard:auto-refresh
// PURPOSE: Panel Health Dashboard - Auto Refresh
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_INTENTS from /core/runtime/events/catalog/panels.events.js
//   REFRESH_INTERVAL from ./core/config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   startAutoRefresh() — exported function
//   stopAutoRefresh() — exported function
//   setupEventListeners() — exported function
//   cleanupEventListeners() — exported function
//   updatePerformanceMetrics() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'visibilitychange'
//   PANEL_INTENTS.REFRESH
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PANEL_INTENTS } from '/core/runtime/events/catalog/panels.events.js';

import { REFRESH_INTERVAL } from './core/config.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-health-dashboard:auto-refresh';

export function startAutoRefresh(panel: Record<string, any>) {
  stopAutoRefresh(panel);
  panel.countdownValue = REFRESH_INTERVAL / 1000;

  panel.countdownInterval = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    panel.countdownValue--;
    panel._updateCountdownDisplay();
    if (panel.countdownValue <= 0) {
      panel.countdownValue = REFRESH_INTERVAL / 1000;
      panel.refresh();
    }
  }, 1000);
}

export function stopAutoRefresh(panel: Record<string, any>) {
  if (panel.countdownInterval) {
    clearInterval(panel.countdownInterval);
    panel.countdownInterval = null;
  }
}

export function setupEventListeners(panel: Record<string, any>) {
  if (!panel._abortController) {
    panel._abortController = new AbortController();
  }
  document.addEventListener('visibilitychange', panel._handleVisibilityChange, { signal: panel._abortController.signal });
  if (panel.eventBus && panel.eventBus.on) {
    panel.eventBus.on(PANEL_INTENTS.REFRESH, panel._handleRefreshEvent);
  }
}

export function cleanupEventListeners(panel: Record<string, any>) {
  if (panel._abortController) {
    panel._abortController.abort();
    panel._abortController = null;
  }
  if (panel.eventBus && panel.eventBus.off) {
    panel.eventBus.off(PANEL_INTENTS.REFRESH, panel._handleRefreshEvent);
  }
  for (let i = 0; i < panel.unsubscribers.length; i++) {
    if (panel.unsubscribers[i]) panel.unsubscribers[i]();
  }
  panel.unsubscribers = [];
}

export function updatePerformanceMetrics(panel: Record<string, any>, loadTime: number, success: boolean) {
  const m = panel.performanceMetrics;
  m.totalRequests++;
  if (!success) m.failedRequests++;
  if (success && loadTime > 0) {
    m.avgLoadTime = Math.round((m.avgLoadTime * (m.totalRequests - 1) + loadTime) / m.totalRequests);
  }
  m.successRate = Math.round(((m.totalRequests - m.failedRequests) / m.totalRequests) * 100);
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { startAutoRefresh, stopAutoRefresh, setupEventListeners, cleanupEventListeners, updatePerformanceMetrics };
