// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-header-admin/api/client
// PURPOSE: Panel Header Admin - API Client (CRUD operations)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createComponent() — exported function
//   updateComponent() — exported function
//   deleteComponent() — exported function
//   fetchComponents() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-header-admin/api/client';

const BASE = '/api/ui/header';
const TIMEOUT = 10000;

async function _fetch(url: string, options: Record<string, unknown> = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', ...((options.headers || {}) as Record<string, string>) }
        });
        const data = await response.json();
        return data;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function fetchComponents(forceRefresh = false) {
    const url = forceRefresh ? `${BASE}/components?t=${Date.now()}` : `${BASE}/components`;
    const result = await _fetch(url);
    return { success: !!result.success, data: result.data || result.components || [] };
}

export async function createComponent(payload: Record<string, unknown>) {
    return _fetch(`${BASE}/components`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateComponent(payload: Record<string, unknown>) {
    return _fetch(`${BASE}/components/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteComponent(componentId: string | number) {
    return _fetch(`${BASE}/components/${componentId}`, { method: 'DELETE' });
}

export function healthCheck() {
    const checks = { endpointConfigured: !!BASE };
    return { status: 'HEALTHY', score: '1/1', checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, endpoint: BASE, healthCheck: healthCheck() };
}
