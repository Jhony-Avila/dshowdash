// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-header-admin-adapter
// PURPOSE: Panel Header Admin - API Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   getGroups() — exported function
//   getComponents() — exported function
//   getConfig() — exported function
//   getLayouts() — exported function
//   createComponent() — exported function
//   updateComponent() — exported function
//   deleteComponent() — exported function
//   toggleComponent() — exported function
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

export const MODULE_ID = 'panel-header-admin-adapter';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const API_BASE = '/api/ui/header/';

function fetchAPI(action: string, options: Record<string, unknown> = {}) {
  const url = `${API_BASE}?action=${action}`;
  const fetchOpts: Record<string, unknown> = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
  for (const k in options) { if (options.hasOwnProperty(k)) fetchOpts[k] = options[k]; }

  return fetch(url, fetchOpts as RequestInit).then(response => {
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  });
}

export function getGroups() {
  return fetchAPI('groups').then((result: Record<string, unknown>) => result.success ? (result.data as Record<string, unknown>).groups : []);
}

export function getComponents(includeInactive: boolean) {
  const url = includeInactive ? 'components&include_inactive=1' : 'components';
  return fetchAPI(url).then((result: Record<string, unknown>) => result.success ? (result.data as Record<string, unknown>).components : []);
}

export function getConfig() {
  return fetchAPI('config').then((result: Record<string, unknown>) => result.success ? result.data : {});
}

export function getLayouts() {
  return fetchAPI('layouts').then((result: Record<string, unknown>) => result.success ? (result.data as Record<string, unknown>).layouts : []);
}

export function createComponent(data: Record<string, unknown>) {
  return fetchAPI('component', { method: 'POST', body: JSON.stringify(data) });
}

export function updateComponent(id: string | number, data: Record<string, unknown>) {
  return fetch(`${API_BASE}?action=component&id=${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export function deleteComponent(id: string | number) {
  return fetch(`${API_BASE}?action=component&id=${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(r => r.json());
}

export function toggleComponent(id: string | number) {
  return fetch(`${API_BASE}?action=toggle&id=${id}`, {
    method: 'POST',
    credentials: 'include'
  }).then(r => r.json());
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, apiBase: API_BASE }; }

export default { MODULE_ID, VERSION, getGroups, getComponents, getConfig, getLayouts, createComponent, updateComponent, deleteComponent, toggleComponent, info, healthCheck };
