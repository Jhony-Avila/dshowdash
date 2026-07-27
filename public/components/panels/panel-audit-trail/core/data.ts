// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-audit-trail-core-data
// PURPOSE: Panel Audit Trail - Data Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABS from ./contracts.js
//   log, getPresetDays, buildInlineFilters from ./helpers.js
//
// PROVIDES:
//   updateHealthStats() — exported function
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

import { TABS } from './contracts.js';
import * as BackendAPI from '../adapters/backend-api.js';
import * as Store from '../state/store.js';
import * as Renderer from '../ui/renderer.js';
import { log, getPresetDays, buildInlineFilters } from './helpers.js';

export async function loadData() {
  const state = Store.getState();
  Store.dispatch({ type: 'SET_LOADING', payload: true });
  
  try {
    const pagination = state.pagination as { limit: number; offset: number } | undefined;
    const stateFilters = state.filters as Record<string, unknown> | undefined;
    const filters = {
      limit: pagination?.limit || 20,
      offset: pagination?.offset || 0,
      search: (stateFilters?.search as string) || '',
      days: getPresetDays((stateFilters?.timePreset as string) || ''),
      userId: (stateFilters?.userId as string) || '',
      actionType: (stateFilters?.actionType as string) || '',
      severity: (stateFilters?.severity as string) || '',
      module: (stateFilters?.module as string) || '',
      ...buildInlineFilters(stateFilters || {})
    };
    
    let result;
    
    switch (state.activeTab as string) {
      case TABS.AUDIT:
        result = await BackendAPI.fetchAuditLogs(filters);
        Store.dispatch({ type: 'SET_AUDIT_LOGS', payload: result.logs || [] });
        break;
      case TABS.PERMISSIONS:
        result = await BackendAPI.fetchPermissionLogs(filters);
        Store.dispatch({ type: 'SET_PERMISSION_LOGS', payload: result.logs || [] });
        break;
      case TABS.FRONTEND:
        result = await BackendAPI.fetchFrontendLogs({ ...filters, level: filters.severity });
        Store.dispatch({ type: 'SET_FRONTEND_LOGS', payload: result.logs || [] });
        break;
      case TABS.SECURITY:
        result = await BackendAPI.fetchSecurityLogs(filters);
        Store.dispatch({ type: 'SET_SECURITY_LOGS', payload: result.logs || [] });
        break;
      default:
        result = await BackendAPI.fetchAuditLogs(filters);
        Store.dispatch({ type: 'SET_AUDIT_LOGS', payload: result.logs || [] });
    }
    
    Store.dispatch({ type: 'SET_PAGINATION', payload: { total: result.total || 0 } });
    Store.dispatch({ type: 'SET_LAST_FETCH', payload: Date.now() });
    Store.dispatch({ type: 'SET_ERROR', payload: null });
    updateHealthStats();
    
  } catch (err: any) {
    log('error', 'Load data error:', err);
    Store.dispatch({ type: 'SET_ERROR', payload: err.message });
    Renderer.toast('Erro ao carregar dados', 'error');
  } finally {
    Store.dispatch({ type: 'SET_LOADING', payload: false });
  }
}

export function updateHealthStats() {
  const state = Store.getState();
  const frontendLogs = (state.frontendLogs as Record<string, unknown>[]) || [];
  const securityLogs = (state.securityLogs as unknown[]) || [];
  const stats = {
    error: frontendLogs.filter((l: Record<string, unknown>) => (l.log_level as string)?.toLowerCase() === 'error').length,
    warning: frontendLogs.filter((l: Record<string, unknown>) => ['warning', 'warn'].includes((l.log_level as string)?.toLowerCase())).length,
    info: frontendLogs.filter((l: Record<string, unknown>) => (l.log_level as string)?.toLowerCase() === 'info').length,
    security: securityLogs.length
  };
  Store.dispatch({ type: 'SET_HEALTH_STATS', payload: stats });
  Renderer.updateHealthStats(stats);
}

export default { loadData, updateHealthStats };

export const MODULE_ID = 'panels-panel-audit-trail-core-data';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { dataReady: true } }; }
