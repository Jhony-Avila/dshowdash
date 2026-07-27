// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-audit-trail-core-auto-refresh
// PURPOSE: Panel Audit Trail - Auto Refresh
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   localState from ./state.js
//   AUTO_REFRESH_SECONDS from ./constants.js
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

import * as Renderer from '../ui/renderer.js';
import { localState as _localState } from './state.js';
import { AUTO_REFRESH_SECONDS } from './constants.js';

const localState = _localState as any;

export function startAutoRefresh(onRefresh?: (silent?: boolean) => void) {
  if (!localState.autoRefreshEnabled) return;
  localState.countdown = AUTO_REFRESH_SECONDS;
  
  localState.countdownInterval = setInterval(() => {
    if (document.hidden) return;
    localState.countdown--;
    Renderer.setAutoRefreshState(true, localState.countdown);
    if (localState.countdown <= 0) {
      localState.countdown = AUTO_REFRESH_SECONDS;
      onRefresh?.(true);
    }
  }, 1000);
  
  Renderer.setAutoRefreshState(true, localState.countdown);
}

export function stopAutoRefresh() {
  if (localState.countdownInterval) {
    clearInterval(localState.countdownInterval);
    localState.countdownInterval = null;
  }
  Renderer.setAutoRefreshState(false, 0);
}

export function toggleAutoRefresh(onRefresh?: (silent?: boolean) => void) {
  localState.autoRefreshEnabled = !localState.autoRefreshEnabled;
  if (localState.autoRefreshEnabled) {
    startAutoRefresh(onRefresh);
    Renderer.toast('Auto-refresh ativado', 'success');
  } else {
    stopAutoRefresh();
    Renderer.toast('Auto-refresh desativado', 'info');
  }
}

export default { startAutoRefresh, stopAutoRefresh, toggleAutoRefresh };

export const MODULE_ID = 'panels-panel-audit-trail-core-auto-refresh';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { autoRefreshReady: true } }; }
