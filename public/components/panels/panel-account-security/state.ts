// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getState() — exported function
//   setState() — exported function
//   setLoading() — exported function
//   setError() — exported function
//   updateSecurity() — exported function
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

export const MODULE_ID = 'panel-account-security.state';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Account Security - State Management
 * @module panel-account-security/state
 * @version 1.1.0-AAA
 */

const state: {
    loading: boolean;
    error: string | null;
    securityLevel: string | null;
    twoFactorEnabled: boolean;
    lastPasswordChange: string | null;
    activeSessions: Record<string, unknown>[];
    loginHistory: Record<string, unknown>[];
} = {
    loading: false,
    error: null,
    securityLevel: null,
    twoFactorEnabled: false,
    lastPasswordChange: null,
    activeSessions: [],
    loginHistory: []
};

export function getState() {
    return { ...state };
}

export function setState(updates: Partial<typeof state>) {
    Object.assign(state, updates);
}

export function setLoading(loading: boolean) {
    state.loading = loading;
}

export function setError(error: string | null) {
    state.error = error;
}

export function updateSecurity(data: { securityLevel?: string; twoFactorEnabled?: boolean; lastPasswordChange?: string }) {
    if (data.securityLevel) state.securityLevel = data.securityLevel;
    if (data.twoFactorEnabled !== undefined) state.twoFactorEnabled = data.twoFactorEnabled;
    if (data.lastPasswordChange) state.lastPasswordChange = data.lastPasswordChange;
}

export default { getState, setState, setLoading, setError, updateSecurity };

// Alias exports — compatibility shim
export function getMockSessions(): Record<string, unknown>[] {
    return state.activeSessions;
}

export function getMockActivity(): Record<string, unknown>[] {
    return state.loginHistory;
}

/** @alias — compatibility shim: createInitialState */
export function createInitialState(): typeof state {
    return {
        loading: false,
        error: null,
        securityLevel: null,
        twoFactorEnabled: false,
        lastPasswordChange: null,
        activeSessions: [],
        loginHistory: []
    };
}

/** @alias — compatibility shim: createInitialMetrics */
export function createInitialMetrics(): Record<string, unknown> {
    return {
        passwordStrength: 0,
        sessionCount: 0,
        loginAttempts: 0,
        lastActivity: null
    };
}
