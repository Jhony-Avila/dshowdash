// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: auth.port
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   setAuth() — exported function
//   getAuth() — exported function
//   isAuthenticated() — exported function
//   getCurrentUser() — exported function
//   hasPermission() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).AuthService
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-16.ports.auth.port';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - Auth Port
 * @module panel-16/ports/auth.port
 * @version 1.1.0-AAA
 */

let authInstance: Record<string, unknown> | null = null;

export function setAuth(auth: Record<string, unknown>) {
    authInstance = auth;
}

export function getAuth() {
    return authInstance || (window as any).AuthService;
}

export function isAuthenticated() {
    const auth = getAuth();
    return auth?.isAuthenticated?.() ?? false;
}

export function getCurrentUser() {
    const auth = getAuth();
    return auth?.getCurrentUser?.() ?? null;
}

export function hasPermission(permission: string) {
    const auth = getAuth();
    return auth?.hasPermission?.(permission) ?? false;
}

export default { setAuth, getAuth, isAuthenticated, getCurrentUser, hasPermission };

// Alias export — satisfies: import { AuthPort } from './auth.port'
export const AuthPort = { setAuth, getAuth, isAuthenticated, getCurrentUser, hasPermission };
