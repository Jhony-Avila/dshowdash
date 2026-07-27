import { API_ENDPOINTS } from "./constants.js";
import { getMockSessions, getMockActivity } from "./state.js";
const MODULE_ID = "panels-panel-account-security-api";
const VERSION = "9.3.0-P2-ENTERPRISE";
function fetchSecurityInfo({ signal } = {}) {
  return fetch(API_ENDPOINTS.SECURITY, { credentials: "include", signal }).then((res) => {
    if (res.ok) {
      return res.json().then((data) => {
        if (data.success) {
          return {
            success: true,
            securityInfo: data.data,
            twoFactorEnabled: data.data && data.data.twoFactorEnabled || false,
            sessions: data.data && data.data.sessions || getMockSessions(),
            activityLog: data.data && data.data.activityLog || getMockActivity()
          };
        }
        throw new Error("Failed to fetch security info");
      });
    }
    throw new Error("Failed to fetch security info");
  }).catch((error) => ({
    success: false,
    error: error.message,
    sessions: getMockSessions(),
    activityLog: getMockActivity()
  }));
}
function changePassword(currentPassword, newPassword, { signal } = {}) {
  return fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
    signal,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
  }).then((res) => res.json().then((data) => {
    if (!data.success) throw new Error(data.error || "Erro ao alterar senha");
    return data;
  }));
}
function revokeSession(sessionId) {
  return Promise.resolve({ success: true });
}
var api_default = { fetchSecurityInfo, changePassword, revokeSession };
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { apiReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  changePassword,
  api_default as default,
  fetchSecurityInfo,
  healthCheck,
  info,
  revokeSession
};
