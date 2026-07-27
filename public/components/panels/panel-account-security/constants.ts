// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: constants
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   SECURITY_LEVELS — exported value
//   AUTH_METHODS — exported value
//   SESSION_TIMEOUT — exported value
//   MAX_LOGIN_ATTEMPTS — exported value
//   LOCKOUT_DURATION — exported value
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

export const MODULE_ID = 'panel-account-security.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Account Security - Constants
 * @module panel-account-security/constants
 * @version 1.1.0-AAA
 */

export const SECURITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

export const AUTH_METHODS = {
    PASSWORD: 'password',
    TWO_FACTOR: '2fa',
    BIOMETRIC: 'biometric',
    SSO: 'sso'
};

export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Alias exports — compatibility shim
export const API_ENDPOINTS = {
    SECURITY_STATUS: '/api/security/status',
    SESSIONS: '/api/security/sessions',
    ACTIVITY: '/api/security/activity',
    PASSWORD_CHANGE: '/api/security/password',
    TWO_FACTOR: '/api/security/2fa'
};
