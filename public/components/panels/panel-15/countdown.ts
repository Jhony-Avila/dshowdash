// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15:countdown
// PURPOSE: Panel-15 - Countdown
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   updateCountdown, setAutoRefreshState from ./core/template.js
//   log from ./ports.js
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

// @ts-expect-error TS migration - TS2614
import { log } from './ports.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-15:countdown';
export const REFRESH_INTERVAL = 30;

export function startCountdown(panel: Record<string, unknown>) {
  stopCountdown(panel);
  panel.countdownValue = REFRESH_INTERVAL;
  updateCountdown(panel.container as HTMLElement, panel.countdownValue as number);

  panel.countdownInterval = setInterval(() => {
    if (!panel.autoRefreshEnabled) return;

    (panel.countdownValue as number);
    panel.countdownValue = (panel.countdownValue as number) - 1;
    updateCountdown(panel.container as HTMLElement, panel.countdownValue as number);

    if ((panel.countdownValue as number) <= 0) {
      panel.countdownValue = REFRESH_INTERVAL;
      if (panel.dataLoader) (panel.dataLoader as Record<string, () => void>).loadData();
    }
  }, 1000);
}

export function stopCountdown(panel: Record<string, unknown>) {
  if (panel.countdownInterval) {
    clearInterval(panel.countdownInterval as ReturnType<typeof setInterval>);
    panel.countdownInterval = null;
  }
}

export function toggleAutoRefresh(panel: Record<string, unknown>) {
  panel.autoRefreshEnabled = !panel.autoRefreshEnabled;
  setAutoRefreshState(panel.container as HTMLElement, panel.autoRefreshEnabled as boolean);

  if (panel.autoRefreshEnabled) {
    panel.countdownValue = REFRESH_INTERVAL;
    updateCountdown(panel.container as HTMLElement, panel.countdownValue as number);
  }

  log('info', 'auto-refresh.toggled', { enabled: panel.autoRefreshEnabled });
}

export function pause(panel: Record<string, unknown>) {
  panel.autoRefreshEnabled = false;
  setAutoRefreshState(panel.container as HTMLElement, false);
}

export function resume(panel: Record<string, unknown>) {
  panel.autoRefreshEnabled = true;
  setAutoRefreshState(panel.container as HTMLElement, true);
  panel.countdownValue = REFRESH_INTERVAL;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, refreshInterval: REFRESH_INTERVAL }; }
export default { startCountdown, stopCountdown, toggleAutoRefresh, pause, resume, REFRESH_INTERVAL };
