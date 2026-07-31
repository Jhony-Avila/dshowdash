// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-19:countdown
// PURPOSE: Panel-19 - Countdown
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   updateCountdown, setAutoRefreshState from ./core/template.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   REFRESH_INTERVAL — exported value
//   startCountdown() — exported function
//   stopCountdown() — exported function
//   toggleAutoRefresh() — exported function
//   pause() — exported function
//   resume() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { updateCountdown, setAutoRefreshState } from './core/template.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-19:countdown';
export const REFRESH_INTERVAL = 30;

interface PanelCtx { [key: string]: unknown; container: HTMLElement; countdownValue: number; countdownInterval: ReturnType<typeof setInterval> | null; autoRefreshEnabled: boolean; dataLoader: { loadData(): void } | null; logger: { info(event: string, data?: Record<string, unknown>): void }; }

export function startCountdown(panel: PanelCtx) {
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

export function stopCountdown(panel: PanelCtx) {
  if (panel.countdownInterval) {
    clearInterval(panel.countdownInterval);
    panel.countdownInterval = null;
  }
}

export function toggleAutoRefresh(panel: PanelCtx) {
  panel.autoRefreshEnabled = !panel.autoRefreshEnabled;
  setAutoRefreshState(panel.container, panel.autoRefreshEnabled);

  if (panel.autoRefreshEnabled) {
    panel.countdownValue = REFRESH_INTERVAL;
    updateCountdown(panel.container, panel.countdownValue);
  }

  panel.logger.info('auto-refresh.toggled', { enabled: panel.autoRefreshEnabled });
}

export function pause(panel: PanelCtx) {
  panel.autoRefreshEnabled = false;
  setAutoRefreshState(panel.container, false);
}

export function resume(panel: PanelCtx) {
  panel.autoRefreshEnabled = true;
  setAutoRefreshState(panel.container, true);
  panel.countdownValue = REFRESH_INTERVAL;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { startCountdown, stopCountdown, toggleAutoRefresh, pause, resume, REFRESH_INTERVAL };
