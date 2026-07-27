// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin-mappers
// PURPOSE: Panel Session Admin - Mappers Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SESSION_STATUS, getDeviceType from ../core/contracts.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   mapSession() — exported function
//   mapSessions() — exported function
//   mapApiResponse() — exported function
//   mapFiltersToQuery() — exported function
//   mapSessionForExport() — exported function
//   mapSessionsForCSV() — exported function
//   mapSessionsForJSON() — exported function
//   mapSessionsSummary() — exported function
//   getVersion() — exported function
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

import { SESSION_STATUS, getDeviceType } from '../core/contracts.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-session-admin-mappers';

export function mapSession(raw: Record<string, unknown>) {
  if (!raw) return null;
  return {
    id: raw.id || raw.session_id || null,
    sessionToken: raw.session_token || raw.token || null,
    userId: raw.user_id || raw.userId || null,
    username: raw.username || raw.user_name || raw.email || null,
    deviceType: getDeviceType(String(raw.device_type || raw.deviceType || '')),
    browser: raw.browser || raw.user_agent_browser || null,
    browserVersion: raw.browser_version || null,
    os: raw.os || raw.user_agent_os || null,
    osVersion: raw.os_version || null,
    originIp: raw.origin_ip || raw.ip_address || raw.ip || null,
    lastIp: raw.last_ip || raw.origin_ip || null,
    isActive: Boolean(raw.is_active !== undefined ? raw.is_active : (raw.active !== undefined ? raw.active : true)),
    isCurrent: Boolean(raw.is_current !== undefined ? raw.is_current : (raw.current !== undefined ? raw.current : false)),
    status: _deriveStatus(raw),
    createdAt: raw.created_at || raw.createdAt || null,
    lastActivityAt: raw.last_activity_at || raw.lastActivityAt || raw.updated_at || null,
    expiresAt: raw.expires_at || raw.expiresAt || null,
    raw
  };
}

export function mapSessions(rawArray: Record<string, unknown>[]) { if (!Array.isArray(rawArray)) return []; const result: ReturnType<typeof mapSession>[] = []; for (let i = 0; i < rawArray.length; i++) { const mapped = mapSession(rawArray[i]); if (mapped) result.push(mapped); } return result; }

function _deriveStatus(raw: Record<string, unknown>) {
  if (raw.is_current || raw.current) return SESSION_STATUS.ACTIVE;
  if (raw.revoked_at || raw.revokedAt) return SESSION_STATUS.REVOKED;
  if (raw.expires_at || raw.expiresAt) { const expires = new Date(String(raw.expires_at || raw.expiresAt)); if (expires < new Date()) return SESSION_STATUS.EXPIRED; }
  if (raw.is_active === false || raw.active === false) return SESSION_STATUS.INACTIVE;
  return SESSION_STATUS.ACTIVE;
}

export function mapApiResponse(response: Record<string, unknown>) {
  if (!response) return { sessions: [] as ReturnType<typeof mapSession>[], total: 0, error: null as string | null };
  if (response.ok === false || response.error) return { sessions: [] as ReturnType<typeof mapSession>[], total: 0, error: (response.error || response.message || 'Unknown error') as string };
  const rawSessions = (response.sessions || response.data || response.items || []) as Record<string, unknown>[];
  return { sessions: mapSessions(rawSessions), total: response.total || response.count || rawSessions.length, page: response.page || 1, hasMore: response.hasMore || response.has_more || false, error: null as string | null };
}

export function mapFiltersToQuery(filters: Record<string, unknown>) {
  const query = {};

  // @ts-expect-error TS migration - TS2339
  if (filters.status && filters.status !== 'all') { if (filters.status === 'active') query.is_active = true; if (filters.status === 'inactive') query.is_active = false; if (filters.status === 'current') query.is_current = true; }
  if (filters.search) (query as Record<string, unknown>).search = (filters.search as string).trim();

  // @ts-expect-error TS migration - TS2339
  if (filters.userId) query.user_id = filters.userId;
  return query;
}

export function mapSessionForExport(session: Record<string, unknown>): Record<string, unknown> { return { 'ID': session.id, 'Usuário': session.username || '-', 'Dispositivo': session.deviceType, 'Browser': session.browser || '-', 'SO': session.os || '-', 'IP': session.originIp || '-', 'Status': session.isActive ? 'Ativa' : 'Inativa', 'Atual': session.isCurrent ? 'Sim' : 'Não', 'Última Atividade': session.lastActivityAt || '-', 'Expira': session.expiresAt || '-', 'Criada': session.createdAt || '-' }; }

export function mapSessionsForCSV(sessions: Record<string, unknown>[]) {
  if (!sessions || !sessions.length) return '';
  const mapped: Record<string, unknown>[] = []; for (let i = 0; i < sessions.length; i++) mapped.push(mapSessionForExport(sessions[i]));
  const headers = Object.keys(mapped[0]);
  const rows: string[] = []; for (let j = 0; j < mapped.length; j++) { const row = mapped[j]; const cols: string[] = []; for (let h = 0; h < headers.length; h++) cols.push(`"${row[headers[h]] || ''}"`); rows.push(cols.join(',')); }
  return [headers.join(',')].concat(rows).join('\n');
}

export function mapSessionsForJSON(sessions: Record<string, unknown>[]) { if (!sessions || !sessions.length) return '[]'; const mapped: Record<string, unknown>[] = []; for (let i = 0; i < sessions.length; i++) mapped.push(mapSessionForExport(sessions[i])); return JSON.stringify(mapped, null, 2); }

export function mapSessionsSummary(sessions: Record<string, unknown>[]) {
  if (!Array.isArray(sessions)) return { total: 0, active: 0, inactive: 0, current: 0 };
  let active = 0, inactive = 0, current = 0;
  for (let i = 0; i < sessions.length; i++) { if (sessions[i].isActive || sessions[i].is_active) active++; else inactive++; if (sessions[i].isCurrent || sessions[i].is_current) current++; }
  return { total: sessions.length, active, inactive, current };
}

export function getVersion() { return VERSION; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { mapSessionReady: typeof mapSession === 'function', mapApiResponseReady: typeof mapApiResponse === 'function' } }; }

export default { VERSION, MODULE_ID, mapSession, mapSessions, mapApiResponse, mapFiltersToQuery, mapSessionForExport, mapSessionsForCSV, mapSessionsForJSON, mapSessionsSummary, getVersion, info, healthCheck };
