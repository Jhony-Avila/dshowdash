// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.integration.api-backend
// PURPOSE: API Backend communication for UARPS permissions
// ───────────────────────────────────────────────────────────────
// @contract LOAD_USER_PERMISSIONS - loadUserPermissions(userId, state, log) fetches permissions
// @contract CHECK_TRIGGER_API - checkTriggerAPI(triggerId, state) checks trigger via API
// @contract API_BASE - Base URL for permissions API
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: loadUserPermissions, checkTriggerAPI, API_BASE, VERSION, MODULE_ID
// @changelog v1.0.1-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.1-P20: MODULE_ID + VERSION exports
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'components._shared.permissions.integration.api-backend';
export const VERSION = '1.0.1-P2-ENTERPRISE';

const API_BASE = '/api/permissions/uarps.php';

export async function loadUserPermissions(currentUserId: string, state: Record<string, any>, log: ((event: string, data?: unknown) => void) | null) {
  if (!currentUserId || currentUserId === 'anonymous') return;

  try {
    state.stats.apiCalls++;
    const response = await fetch(`${API_BASE}?action=my-permissions`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      state.stats.apiFails++;
      if (log) log('api-error', { status: response.status });
      return;
    }

    const data = await response.json();
    if (!data.ok) {
      if (log) log('api-response-error', data.error);
      return;
    }

    state.userPermissions.triggers = {};
    state.userPermissions.regions = {};

    for (let i = 0; i < (data.triggers || []).length; i++) {
      const t = data.triggers[i];
      state.userPermissions.triggers[t.trigger_id] = t.state;
    }

    for (let j = 0; j < (data.regions || []).length; j++) {
      const r = data.regions[j];
      state.userPermissions.regions[r.region_id] = r.state;
    }

    state.apiConnected = true;
    if (log) log('permissions-loaded', {
      triggers: Object.keys(state.userPermissions.triggers).length,
      regions: Object.keys(state.userPermissions.regions).length
    });

  } catch (error: any) {
    state.stats.apiFails++;
    if (log) log('api-fetch-error', error.message);
  }
}

export async function checkTriggerAPI(triggerId: string, state: Record<string, any>) {
  try {
    state.stats.apiCalls++;
    const response = await fetch(`${API_BASE}?action=check-trigger&trigger_id=${encodeURIComponent(triggerId)}`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      state.stats.apiFails++;
      return null;
    }

    const data = await response.json();
    return data.ok ? data.allowed : null;

  } catch (error: any) {
    state.stats.apiFails++;
    return null;
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, apiBase: API_BASE, timestamp: Date.now() };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, apiBase: API_BASE, timestamp: Date.now() };
}

export default { MODULE_ID, VERSION, loadUserPermissions, checkTriggerAPI, API_BASE, info, healthCheck };
