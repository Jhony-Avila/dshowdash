// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-core-data
// PURPOSE: Panel Session Admin - Data Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LOCAL_EVENTS from ./contracts.js
//   emit, showToast, log from ./helpers.js
//   localState from ./state.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
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

import { LOCAL_EVENTS } from './contracts.js';
import * as BackendAPI from '../adapters/backend-api.js';
import * as Store from '../state/store.js';
import * as Renderer from '../ui/renderer.js';
import tracker from '../telemetry/tracker.js';
import { emit, showToast, log } from './helpers.js';
import { localState } from './state.js';

export async function refresh() {
  if (Store.isRefreshInProgress()) return { ok: false, warning: 'already_in_progress' };
  
  const authResult = Store.ensureAuth();
  if (!authResult.ok) {
    // @ts-expect-error strict migration — TS2345
    Renderer.renderAuthRequired(localState.container, localState.config);
    return { ok: false, error: 'AUTH_REQUIRED' };
  }
  
  emit(LOCAL_EVENTS.REFRESH_START);
  Store.dispatch({ type: 'SET_LOADING', payload: true });
  (Store as any).dispatch({ type: 'SET_REFRESH_IN_PROGRESS', payload: true });

  tracker.refreshStart();
  
  const startTime = Date.now();
  
  try {
    const mySessions = await BackendAPI.loadMySessions();
    Store.dispatch({ type: 'SET_MY_SESSIONS', payload: mySessions });
    
    if (authResult.context.isAdmin) {
      const allSessions = await BackendAPI.loadAllSessions();
      Store.dispatch({ type: 'SET_SESSIONS', payload: allSessions });
    }
    
    Store.dispatch({ type: 'SET_ERROR', payload: null });
    Store.dispatch({ type: 'SET_LOADING', payload: false });
    Store.dispatch({ type: 'SET_REFRESH_IN_PROGRESS', payload: false });
    Store.dispatch({ type: 'SET_LAST_REFRESH', payload: Date.now() });
    
    const duration = Date.now() - startTime;
    const sessions = Store.getSessions();

    tracker.refreshSuccess(duration, sessions.length, sessions.filter(s => s.is_active).length);
    
    return { ok: true, duration };
  } catch (error: any) {
    (Store as any).dispatch({ type: 'SET_ERROR', payload: error.message });
    Store.dispatch({ type: 'SET_LOADING', payload: false });
    Store.dispatch({ type: 'SET_REFRESH_IN_PROGRESS', payload: false });

    tracker.refreshError(error, Date.now() - startTime);
    return { ok: false, error: error.message };
  }
}

export async function terminateSession(sessionToken: string) {
  if (!sessionToken) return { ok: false, error: 'SESSION_TOKEN_REQUIRED' };
  
  try {
    await BackendAPI.terminateSession(sessionToken);
    Store.dispatch({ type: 'INCREMENT_TERMINATE' });

    tracker.terminateOne(sessionToken);

    showToast('Sessão encerrada com sucesso');
    localState.expandedIds.delete(sessionToken);
    await refresh();
    return { ok: true };
  } catch (error: any) {
    tracker.terminateError(error, 'single');
    showToast('Erro ao encerrar sessão', 'error');
    return { ok: false, error: error.message };
  }
}

export async function terminateAllOthers() {
  try {
    await BackendAPI.terminateAllOthers();
    Store.dispatch({ type: 'INCREMENT_TERMINATE' });

    tracker.terminateAllOthers();
    showToast('Outras sessões encerradas');
    localState.expandedIds.clear();
    await refresh();
    return { ok: true };
  } catch (error: any) {
    tracker.terminateError(error, 'all-others');
    showToast('Erro ao encerrar sessões', 'error');
    return { ok: false, error: error.message };
  }
}

export async function terminateSelected() {
  if (localState.selectedIds.size === 0) return { ok: false, error: 'NO_SELECTION' };
  
  const tokens = Array.from(localState.selectedIds);
  let successCount = 0;
  
  for (const token of tokens) {
    try {
      await BackendAPI.terminateSession(token);
      successCount++;
      localState.expandedIds.delete(token);
    } catch (e) {

      (log as (...args: unknown[]) => void)('warn', `Failed to terminate ${token}:`, e);
    }
  }
  
  localState.selectedIds.clear();
  Store.dispatch({ type: 'INCREMENT_TERMINATE' });
  tracker.terminateSelected(successCount);

  showToast(`${successCount} sessão(ões) encerrada(s)`);
  await refresh();
  
  return { ok: true, count: successCount };
}

export async function retry() {
  Store.dispatch({ type: 'SET_ERROR', payload: null });
  return refresh();
}

export const MODULE_ID = 'panels-panel-session-admin-core-data';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { dataReady: true } });

export default { refresh, terminateSession, terminateAllOthers, terminateSelected, retry, MODULE_ID, VERSION, info, healthCheck };
