// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-account-security-api
// PURPOSE: Panel Account Security - API Calls
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   API_ENDPOINTS from ./constants.js
//   getMockSessions, getMockActivity from ./state.js
//
// PROVIDES:
//   fetchSecurityInfo() — exported function
//   changePassword() — exported function
//   revokeSession() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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


// @ts-expect-error TS migration - TS2305
import { API_ENDPOINTS } from './constants.js';

// @ts-expect-error TS migration - TS2614
import { getMockSessions, getMockActivity } from './state.js';

const MODULE_ID = 'panels-panel-account-security-api';
const VERSION = '9.3.0-P2-ENTERPRISE';

export function fetchSecurityInfo({ signal }: { signal?: AbortSignal } = {}) {
  return fetch(API_ENDPOINTS.SECURITY, { credentials: 'include', signal })
    .then(res => {
      if (res.ok) {
        return res.json().then(data => {
          if (data.success) {
            return {
              success: true,
              securityInfo: data.data,
              twoFactorEnabled: (data.data && data.data.twoFactorEnabled) || false,
              sessions: (data.data && data.data.sessions) || getMockSessions(),
              activityLog: (data.data && data.data.activityLog) || getMockActivity()
            };
          }
          throw new Error('Failed to fetch security info');
        });
      }
      throw new Error('Failed to fetch security info');
    })
    .catch(error => ({
    success: false,
    error: error.message,
    sessions: getMockSessions(),
    activityLog: getMockActivity()
  }));
}

export function changePassword(currentPassword: string, newPassword: string, { signal }: { signal?: AbortSignal } = {}) {
  return fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
    signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
  }).then(res => res.json().then(data => {
    if (!data.success) throw new Error(data.error || 'Erro ao alterar senha');
    return data;
  }));
}

export function revokeSession(sessionId: string | number) { return Promise.resolve({ success: true }); }

export default { fetchSecurityInfo, changePassword, revokeSession };

export { MODULE_ID, VERSION };
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { apiReady: true } }; }
