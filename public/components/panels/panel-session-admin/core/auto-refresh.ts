// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-core-auto-refresh
// PURPOSE: Panel Session Admin - Auto Refresh
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   showToast from ./helpers.js
//   localState from ./state.js
//   AUTO_REFRESH_SECONDS from ./constants.js
//   refresh from ./data.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   startAutoRefresh() — exported function
//   stopAutoRefresh() — exported function
//   toggleAutoRefresh() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

import * as States from '../ui/states.js';
import tracker from '../telemetry/tracker.js';
import { showToast } from './helpers.js';
import { localState } from './state.js';
import { AUTO_REFRESH_SECONDS } from './constants.js';
import { refresh } from './data.js';

export function startAutoRefresh() {
  if (localState.autoRefreshInterval) return;
  localState.autoRefreshEnabled = true;
  localState.countdown = AUTO_REFRESH_SECONDS;
  
  localState.autoRefreshInterval = setInterval(() => {
    if (document.hidden) return;
    localState.countdown--;
    if (States.setCountdown) States.setCountdown(localState.countdown);
    if (localState.countdown <= 0) {
      refresh();
      localState.countdown = AUTO_REFRESH_SECONDS;
    }
  }, 1000);
  
  if (States.setAutoRefresh) States.setAutoRefresh(true);
  tracker.autoRefreshToggle(true);
}

export function stopAutoRefresh() {
  if (localState.autoRefreshInterval) {
    clearInterval(localState.autoRefreshInterval);
    localState.autoRefreshInterval = null;
  }
  localState.autoRefreshEnabled = false;
  if (States.setAutoRefresh) States.setAutoRefresh(false);
}

export function toggleAutoRefresh(onStateChange?: () => void) {
  if (localState.autoRefreshEnabled) {
    stopAutoRefresh();
    showToast('Auto-refresh desativado', 'info');
    tracker.autoRefreshToggle(false);
  } else {
    startAutoRefresh();
    showToast('Auto-refresh ativado', 'success');
  }
  if (onStateChange) onStateChange();
  return localState.autoRefreshEnabled;
}

export default { startAutoRefresh, stopAutoRefresh, toggleAutoRefresh };

export const MODULE_ID = 'panels-panel-session-admin-core-auto-refresh';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { const running = !!localState.autoRefreshInterval; return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { autoRefreshReady: true, autoRefreshEnabled: localState.autoRefreshEnabled, running, visibilityGated: true } }; }
