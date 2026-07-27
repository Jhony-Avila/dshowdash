// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin-contracts
// PURPOSE: Panel Session Admin - Contracts Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SESSION_STATUS — exported value
//   SESSION_STATUS_CONFIG — exported value
//   DEVICE_TYPES — exported value
//   DEVICE_CONFIG — exported value
//   FILTER_OPTIONS — exported value
//   LOCAL_EVENTS — exported value
//   API_CONFIG — exported value
//   KEYBOARD_SHORTCUTS — exported value
//   validateSession() — exported function
//   isCurrentSession() — exported function
//   isActiveSession() — exported function
//   getDeviceType() — exported function
//   getStatusColor() — exported function
//   ... and 3 more exports
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
export const MODULE_ID = 'panel-session-admin-contracts';

export const SESSION_STATUS = Object.freeze({ ACTIVE: 'active', INACTIVE: 'inactive', EXPIRED: 'expired', REVOKED: 'revoked' });

export const SESSION_STATUS_CONFIG = Object.freeze({
  [SESSION_STATUS.ACTIVE]: { label: 'Ativa', color: '#22C55E', icon: 'check-circle' },
  [SESSION_STATUS.INACTIVE]: { label: 'Inativa', color: '#64748B', icon: 'circle' },
  [SESSION_STATUS.EXPIRED]: { label: 'Expirada', color: '#EAB308', icon: 'clock' },
  [SESSION_STATUS.REVOKED]: { label: 'Revogada', color: '#EF4444', icon: 'x-circle' }
});

export const DEVICE_TYPES = Object.freeze({ DESKTOP: 'desktop', MOBILE: 'mobile', TABLET: 'tablet', UNKNOWN: 'unknown' });

export const DEVICE_CONFIG = Object.freeze({
  [DEVICE_TYPES.DESKTOP]: { label: 'Desktop', icon: 'monitor' },
  [DEVICE_TYPES.MOBILE]: { label: 'Mobile', icon: 'smartphone' },
  [DEVICE_TYPES.TABLET]: { label: 'Tablet', icon: 'tablet' },
  [DEVICE_TYPES.UNKNOWN]: { label: 'Desconhecido', icon: 'help-circle' }
});

export const FILTER_OPTIONS = Object.freeze({ STATUS: [{ value: 'all', label: 'Todas' }, { value: 'active', label: 'Ativas' }, { value: 'inactive', label: 'Inativas' }, { value: 'current', label: 'Sessão atual' }] });

export const LOCAL_EVENTS = Object.freeze({ MOUNTED: 'session-admin:mounted', UNMOUNTED: 'session-admin:unmounted', REFRESH_START: 'session-admin:refresh:start', REFRESH_SUCCESS: 'session-admin:refresh:success', REFRESH_ERROR: 'session-admin:refresh:error', SESSION_TERMINATED: 'session-admin:session:terminated', SESSION_TERMINATE_ALL: 'session-admin:session:terminate-all', FILTER_CHANGED: 'session-admin:filter:changed', AUTH_REQUIRED: 'session-admin:auth:required' });

export const API_CONFIG = Object.freeze({ BASE_URL: '/api/sessions', ENDPOINTS: { LIST: '/?action=list', REVOKE: '/?action=revoke', REVOKE_ALL: '/?action=revoke-all' }, TIMEOUT: 15000 });

export const KEYBOARD_SHORTCUTS = Object.freeze({ 'r': 'Atualizar', 'Escape': 'Fechar modais', '/': 'Focar busca' });

export const validateSession = (session: Record<string, unknown>) => { const errors: string[] = []; if (!session) { errors.push('Session is required'); return { valid: false, errors }; } if (!session.session_token && !session.id) errors.push('session_token or id is required'); return { valid: errors.length === 0, errors }; };

export const isCurrentSession = (session: Record<string, unknown>, currentToken: string) => { if (!session || !currentToken) return false; return session.session_token === currentToken || session.is_current === true; };

export const isActiveSession = (session: Record<string, unknown>) => { if (!session) return false; return session.is_active === true || session.is_active === 1; };

export const getDeviceType = (deviceType: string) => { const type = (deviceType || '').toLowerCase(); if (type.includes('mobile') || type.includes('phone')) return DEVICE_TYPES.MOBILE; if (type.includes('tablet')) return DEVICE_TYPES.TABLET; if (type.includes('desktop')) return DEVICE_TYPES.DESKTOP; return DEVICE_TYPES.UNKNOWN; };

export const getStatusColor = (isActive: boolean, isCurrent: boolean) => { if (isCurrent) return '#3B82F6'; if (isActive) return '#22C55E'; return '#64748B'; };

export const getVersion = () => VERSION;
export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { validateSessionReady: typeof validateSession === 'function', getDeviceTypeReady: typeof getDeviceType === 'function' } });

export default { VERSION, MODULE_ID, SESSION_STATUS, SESSION_STATUS_CONFIG, DEVICE_TYPES, DEVICE_CONFIG, FILTER_OPTIONS, LOCAL_EVENTS, API_CONFIG, KEYBOARD_SHORTCUTS, validateSession, isCurrentSession, isActiveSession, getDeviceType, getStatusColor, getVersion, info, healthCheck };
