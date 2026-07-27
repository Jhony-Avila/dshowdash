// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-CRUD-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-user-management-api-client
// PURPOSE: Panel User Management - API Client
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//
// PROVIDES:
//   api — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   AUTH_EVENTS.SESSION_EXPIRED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panels-panel-user-management-api-client';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const api = {
  baseUrl: '/api/admin/users/index.php',
  avatarsPath: '/assets/avatars',
  request(url: string, options: RequestInit & Record<string, unknown>) {
    options = options || {}; _initPorts();
    return fetch(url, Object.assign({ credentials: 'include', headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}) }, options)).then(response => {
      if (response.status === 401) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(AUTH_EVENTS.SESSION_EXPIRED, { source: 'panel-user-management' }); throw { status: 401, message: 'Sessão expirada' }; }
      if (response.status === 403) throw { status: 403, message: 'Sem permissão de administrador' };
      if (response.status === 405) throw { status: 405, message: 'Método não permitido' };
      return response.json().then((data: Record<string, unknown>) => { if (!data.ok && !response.ok) throw new Error(String(data.error) || 'REQUEST_ERROR'); return data; });
    });
  },
  getUsers(params: Record<string, string>) { params = params || {}; const query = new URLSearchParams(params).toString(); const url = `${this.baseUrl}?action=list${query ? `&${query}` : ''}`; return this.request(url, {}).then((data: Record<string, unknown>) => (data.users as unknown[]) || []); },
  searchUsers(filters: Record<string, string | number>) { filters = filters || {}; const params = new URLSearchParams(); if (filters.search) params.append('search', String(filters.search)); if (filters.status) params.append('status', String(filters.status)); if (filters.role) params.append('role', String(filters.role)); if (filters.limit) params.append('limit', String(filters.limit)); if (filters.offset !== undefined && filters.offset !== null) params.append('offset', String(filters.offset)); const obj: Record<string, string> = {}; params.forEach((v, k) => { obj[k] = v; }); return this.getUsers(obj); },
  getUser(userId: string | number) { const url = `${this.baseUrl}?action=get&id=${userId}`; return this.request(url, {}).then((data: Record<string, unknown>) => data.user); },
  createUser(userData: Record<string, unknown>) { const url = `${this.baseUrl}?action=create`; return this.request(url, { method: 'POST', body: JSON.stringify(userData) }).then((data: Record<string, unknown>) => data.user || data); },
  updateUser(userId: string | number, userData: Record<string, unknown>) { const url = `${this.baseUrl}?action=update`; return this.request(url, { method: 'PATCH', body: JSON.stringify(Object.assign({ id: userId }, userData)) }); },
  deleteUser(userId: string | number) { const url = `${this.baseUrl}?action=delete`; return this.request(url, { method: 'DELETE', body: JSON.stringify({ id: userId }) }); },
  bulkUpdateStatus(userIds: (string | number)[], newStatus: string) { const url = `${this.baseUrl}?action=bulk-update-status`; return this.request(url, { method: 'POST', body: JSON.stringify({ user_ids: userIds, status: newStatus }) }); },

  // @ts-expect-error TS migration - TS2339
  exportUsers(filters, format, { signal } = {}) { filters = filters || {}; format = format || 'csv'; const params = new URLSearchParams(); params.append('action', 'export'); params.append('format', format); if (filters.search) params.append('search', filters.search); if (filters.status) params.append('status', filters.status); if (filters.role) params.append('role', filters.role); const url = `${this.baseUrl}?${params.toString()}`; return fetch(url, { credentials: 'include', signal }).then(response => { if (!response.ok) throw new Error(`Export failed: ${response.status}`); return response.blob(); }).then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `users-export-${new Date().toISOString().slice(0, 10)}.${format}`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href); return true; }); },
  resetPassword(userId: string | number) { const url = `${this.baseUrl}?action=reset-password`; return this.request(url, { method: 'POST', body: JSON.stringify({ user_id: userId }) }); },
  getRoles() { const url = `${this.baseUrl}?action=roles`; return this.request(url, {}).then((data: Record<string, unknown>) => (data.roles as unknown[]) || []); },
  assignRole(userId: string | number, roleId: string | number) { const url = `${this.baseUrl}?action=assign-role`; return this.request(url, { method: 'POST', body: JSON.stringify({ user_id: userId, role_id: roleId }) }); },
  getUserSessions(userId: string | number) { const url = `${this.baseUrl}?action=user-sessions&user_id=${userId}`; return this.request(url, {}).then((data: Record<string, unknown>) => (data.sessions as unknown[]) || []); },
  terminateSession(sessionId: string | number) { const url = `${this.baseUrl}?action=terminate-session&session_id=${sessionId}`; return this.request(url, { method: 'POST' }); },
  terminateUserSessions(userId: string | number) { const url = `${this.baseUrl}?action=terminate-user-sessions&user_id=${userId}`; return this.request(url, { method: 'POST' }); },
  getUserPreferences(userId: string | number) { const url = `${this.baseUrl}?action=user-preferences&user_id=${userId}`; return this.request(url, {}).then((data: Record<string, unknown>) => data.preferences || {}); },

  // @ts-expect-error TS migration - TS2339
  getAvailableAvatars({ signal } = {}) { const url = '/api/avatars/list.php'; return fetch(url, { signal }).then(r => r.json()).then(d => d.avatars || []).catch(() => []); },
  getAvatarUrl(filename: string) { if (!filename) return null; if (filename.indexOf('/') === 0 || filename.indexOf('http') === 0) return filename; return `${this.avatarsPath}/${filename}`; }
};

function info() { const portsSnapshot = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized }; }
function healthCheck() { const portsSnapshot = Ports.snapshot(); return { status: portsSnapshot._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized, checks: { ready: true } }; }

export { api, MODULE_ID, VERSION, info, healthCheck, injectPorts, getPorts };
export default api;
