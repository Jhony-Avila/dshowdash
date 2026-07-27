import { SESSION_STATUS, getDeviceType } from "../core/contracts.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin-mappers";
function mapSession(raw) {
  if (!raw) return null;
  return {
    id: raw.id || raw.session_id || null,
    sessionToken: raw.session_token || raw.token || null,
    userId: raw.user_id || raw.userId || null,
    username: raw.username || raw.user_name || raw.email || null,
    deviceType: getDeviceType(String(raw.device_type || raw.deviceType || "")),
    browser: raw.browser || raw.user_agent_browser || null,
    browserVersion: raw.browser_version || null,
    os: raw.os || raw.user_agent_os || null,
    osVersion: raw.os_version || null,
    originIp: raw.origin_ip || raw.ip_address || raw.ip || null,
    lastIp: raw.last_ip || raw.origin_ip || null,
    isActive: Boolean(raw.is_active !== void 0 ? raw.is_active : raw.active !== void 0 ? raw.active : true),
    isCurrent: Boolean(raw.is_current !== void 0 ? raw.is_current : raw.current !== void 0 ? raw.current : false),
    status: _deriveStatus(raw),
    createdAt: raw.created_at || raw.createdAt || null,
    lastActivityAt: raw.last_activity_at || raw.lastActivityAt || raw.updated_at || null,
    expiresAt: raw.expires_at || raw.expiresAt || null,
    raw
  };
}
function mapSessions(rawArray) {
  if (!Array.isArray(rawArray)) return [];
  const result = [];
  for (let i = 0; i < rawArray.length; i++) {
    const mapped = mapSession(rawArray[i]);
    if (mapped) result.push(mapped);
  }
  return result;
}
function _deriveStatus(raw) {
  if (raw.is_current || raw.current) return SESSION_STATUS.ACTIVE;
  if (raw.revoked_at || raw.revokedAt) return SESSION_STATUS.REVOKED;
  if (raw.expires_at || raw.expiresAt) {
    const expires = new Date(String(raw.expires_at || raw.expiresAt));
    if (expires < /* @__PURE__ */ new Date()) return SESSION_STATUS.EXPIRED;
  }
  if (raw.is_active === false || raw.active === false) return SESSION_STATUS.INACTIVE;
  return SESSION_STATUS.ACTIVE;
}
function mapApiResponse(response) {
  if (!response) return { sessions: [], total: 0, error: null };
  if (response.ok === false || response.error) return { sessions: [], total: 0, error: response.error || response.message || "Unknown error" };
  const rawSessions = response.sessions || response.data || response.items || [];
  return { sessions: mapSessions(rawSessions), total: response.total || response.count || rawSessions.length, page: response.page || 1, hasMore: response.hasMore || response.has_more || false, error: null };
}
function mapFiltersToQuery(filters) {
  const query = {};
  if (filters.status && filters.status !== "all") {
    if (filters.status === "active") query.is_active = true;
    if (filters.status === "inactive") query.is_active = false;
    if (filters.status === "current") query.is_current = true;
  }
  if (filters.search) query.search = filters.search.trim();
  if (filters.userId) query.user_id = filters.userId;
  return query;
}
function mapSessionForExport(session) {
  return { "ID": session.id, "Usu\xE1rio": session.username || "-", "Dispositivo": session.deviceType, "Browser": session.browser || "-", "SO": session.os || "-", "IP": session.originIp || "-", "Status": session.isActive ? "Ativa" : "Inativa", "Atual": session.isCurrent ? "Sim" : "N\xE3o", "\xDAltima Atividade": session.lastActivityAt || "-", "Expira": session.expiresAt || "-", "Criada": session.createdAt || "-" };
}
function mapSessionsForCSV(sessions) {
  if (!sessions || !sessions.length) return "";
  const mapped = [];
  for (let i = 0; i < sessions.length; i++) mapped.push(mapSessionForExport(sessions[i]));
  const headers = Object.keys(mapped[0]);
  const rows = [];
  for (let j = 0; j < mapped.length; j++) {
    const row = mapped[j];
    const cols = [];
    for (let h = 0; h < headers.length; h++) cols.push(`"${row[headers[h]] || ""}"`);
    rows.push(cols.join(","));
  }
  return [headers.join(",")].concat(rows).join("\n");
}
function mapSessionsForJSON(sessions) {
  if (!sessions || !sessions.length) return "[]";
  const mapped = [];
  for (let i = 0; i < sessions.length; i++) mapped.push(mapSessionForExport(sessions[i]));
  return JSON.stringify(mapped, null, 2);
}
function mapSessionsSummary(sessions) {
  if (!Array.isArray(sessions)) return { total: 0, active: 0, inactive: 0, current: 0 };
  let active = 0, inactive = 0, current = 0;
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].isActive || sessions[i].is_active) active++;
    else inactive++;
    if (sessions[i].isCurrent || sessions[i].is_current) current++;
  }
  return { total: sessions.length, active, inactive, current };
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { mapSessionReady: typeof mapSession === "function", mapApiResponseReady: typeof mapApiResponse === "function" } };
}
var mappers_default = { VERSION, MODULE_ID, mapSession, mapSessions, mapApiResponse, mapFiltersToQuery, mapSessionForExport, mapSessionsForCSV, mapSessionsForJSON, mapSessionsSummary, getVersion, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  mappers_default as default,
  getVersion,
  healthCheck,
  info,
  mapApiResponse,
  mapFiltersToQuery,
  mapSession,
  mapSessionForExport,
  mapSessions,
  mapSessionsForCSV,
  mapSessionsForJSON,
  mapSessionsSummary
};
