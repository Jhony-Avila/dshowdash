// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: pom-api-adapter
// PURPOSE: Panel Orchestrator Manager - API Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   api — exported value
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'pom-api-adapter';

const BASE_URL = '/api/admin/orchestrator';

function request(endpoint: string, options?: Record<string, unknown>) {
    options = options || {};
    const url = endpoint.indexOf('http') === 0 ? endpoint : BASE_URL + endpoint;
    const config: Record<string, unknown> = { headers: Object.assign({ 'Content-Type': 'application/json' }, (options.headers as Record<string, string>) || {}) };
    Object.keys(options).forEach((k) => { if (k !== 'headers' && k !== 'body') config[k] = options![k]; });

    if (options.body && typeof options.body === 'object') config.body = JSON.stringify(options.body);
    return fetch(url, config).then(response => response.json().then((data) => {
        if (!response.ok || data.success === false) throw new Error(data.error || `HTTP ${response.status}`);
        return data;
    }));
}

export const api = {

    getTriggers: (component?: string) => { let url = '/?action=list&type=triggers'; if (component && component !== 'all') url += `&component=${component}`; return request(url).then((res: Record<string, unknown>) => res.data || []); },
    createTrigger: (data: Record<string, unknown>) => request('/?action=create&type=trigger', { method: 'POST', body: data }),
    updateTrigger: (id: string | number, data: Record<string, unknown>) => request(`/?action=update&type=trigger&id=${id}`, { method: 'PUT', body: data }),
    deleteTrigger: (id: string | number) => request(`/?action=delete&type=trigger&id=${id}`, { method: 'DELETE' }),
    toggleTrigger: (id: string | number, currentState: boolean | number) => request(`/?action=toggle&type=trigger&id=${id}`, { method: 'PUT', body: { is_active: currentState ? 0 : 1 } }),

    getRules: () => request('/rules.php').then((res: Record<string, unknown>) => res.data || []),
    createRule: (data: Record<string, unknown>) => request('/rules.php', { method: 'POST', body: data }),
    updateRule: (id: string | number, data: Record<string, unknown>) => request(`/rules.php?id=${id}`, { method: 'PUT', body: data }),
    deleteRule: (id: string | number) => request(`/rules.php?id=${id}`, { method: 'DELETE' }),
    toggleRule: (id: string | number, currentState: boolean | number) => request(`/rules.php?id=${id}`, { method: 'PUT', body: { is_active: currentState ? 0 : 1 } }),

    seedRules: () => request('/rules.php?action=seed'),

    getFlags: () => request('/flags.php').then((res: Record<string, unknown>) => res.data || []),
    createFlag: (data: Record<string, unknown>) => request('/flags.php', { method: 'POST', body: data }),
    updateFlag: (id: string | number, data: Record<string, unknown>) => request(`/flags.php?id=${id}`, { method: 'PUT', body: data }),
    deleteFlag: (id: string | number) => request(`/flags.php?id=${id}`, { method: 'DELETE' }),
    toggleFlag: (id: string | number, currentState: boolean | number) => request(`/flags.php?id=${id}`, { method: 'PUT', body: { is_enabled: currentState ? 0 : 1 } }),

    seedFlags: () => request('/flags.php?action=seed'),

    getStats: () => request('/?action=stats').then((res: Record<string, unknown>) => res.data || {}),
    syncAll: (options?: { dryRun?: boolean; sources?: string[] }) => { options = options || {}; return request('/sync-all.php', { method: 'POST', body: { dry_run: options.dryRun !== undefined ? options.dryRun : false, sources: options.sources || ['sidebar', 'bindings', 'keyboard'] } }); },
    syncPreview() { return this.syncAll({ dryRun: true }); },

    getAuditLog: (limit = 50) => request(`/?action=audit&limit=${limit}`).then((res: Record<string, unknown>) => res.data || [])
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { apiReady: typeof api.getTriggers === 'function' } }; }

export default api;
