// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator:permissions-guard-adapter
// PURPOSE: Panel Orchestrator - Permissions Guard Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   injectPorts() — exported function
//   isReady() — exported function
//   isAuthenticated() — exported function
//   getLevel() — exported function
//   getRoles() — exported function
//   getUser() — exported function
//   canAccessPanel() — exported function
//   can() — exported function
//   guard() — exported function
//   getPermissions() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//   info() — exported function
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
export const MODULE_ID = 'panel-orchestrator:permissions-guard-adapter';

// P3.2: Triggers UARPS
const UARPS_TRIGGERS = {
    VIEW: 'trigger:panel:orchestrator:view',
    EXECUTE: 'trigger:panel:orchestrator:execute',
    ADMIN: 'trigger:panel:orchestrator:admin'
};

// P3.2: DEPRECATED - Nível mínimo fallback
const REQUIRED_LEVEL = 80;

// Estado interno
const _state: { initialized: boolean; lastCheck: Record<string, unknown> | null } = {
    initialized: false,
    lastCheck: null
};

type AuthPort = { isAuthenticated?: () => boolean; getUser?: () => Record<string, unknown>; getLevel?: () => number; getRoles?: () => string[]; can?: (action: string) => boolean; [key: string]: unknown };

// Portas injetadas
let _ports: Record<string, AuthPort> = {};

function _getPort(name: string): AuthPort | null {
    return _ports[name] || null;
}

export function injectPorts(ports: Record<string, unknown>) {
    _ports = (ports || {}) as Record<string, AuthPort>;
    _state.initialized = true;
}

export function isReady() {
    return _state.initialized && Object.keys(_ports).length > 0;
}

export function isAuthenticated() {
    const auth = _getPort('auth');
    if (auth?.isAuthenticated) return auth.isAuthenticated();
    if (auth?.getUser) return !!auth.getUser();
    return false;
}

export function getLevel(): number {
    const auth = _getPort('auth');
    if (auth?.getLevel) return auth.getLevel();
    const user = auth?.getUser?.();
    return (user?.level as number) || 0;
}

export function getRoles(): string[] {
    const auth = _getPort('auth');
    if (auth?.getRoles) return auth.getRoles();
    const user = auth?.getUser?.();
    return (user?.roles as string[]) || [];
}

export function getUser() {
    const auth = _getPort('auth');
    return auth?.getUser?.() || null;
}

// P3.2: canAccessPanel com UARPS + fallback
export function canAccessPanel() {
    if (!isAuthenticated()) {
        return { allowed: false, reason: 'NOT_AUTHENTICATED' };
    }
    
    const auth = _getPort('auth');
    
    // Tenta via porta auth (que pode usar UARPS internamente)
    if (auth?.can?.('orchestrator:view')) {
        return { allowed: true, method: 'uarps' };
    }
    
    // Verifica roles admin
    const roles = getRoles();
    if (roles.includes('super_admin') || roles.includes('admin')) {
        return { allowed: true, method: 'role' };
    }
    
    // P3.2: Fallback por nível (DEPRECATED)
    const level = getLevel();
    if (level >= REQUIRED_LEVEL) {
        return { allowed: true, method: 'level_fallback' };
    }
    
    return { allowed: false, reason: 'INSUFFICIENT_PERMISSIONS' };
}

export function can(action: string) {
    if (!isAuthenticated()) return false;
    
    const auth = _getPort('auth');
    
    // Tenta via porta auth
    if (auth?.can?.(action)) return true;
    
    // Admin pode tudo
    const roles = getRoles();
    if (roles.includes('super_admin') || roles.includes('admin')) return true;
    
    // Fallback por nível
    const level = getLevel();
    return level >= REQUIRED_LEVEL;
}

export function guard(action: string) {
    const result = can(action);
    _state.lastCheck = { action, result, timestamp: Date.now() };
    return result;
}

export function getPermissions() {
    return {
        canView: can('orchestrator:view'),
        canExecute: can('orchestrator:execute'),
        canAdmin: can('orchestrator:admin'),
        canSync: can('orchestrator:sync'),
        canBroadcast: can('orchestrator:broadcast')
    };
}

export function healthCheck() {
    return {
        status: 'healthy',
        initialized: _state.initialized,
        authenticated: isAuthenticated(),
        canAccess: canAccessPanel().allowed,
        portsInjected: Object.keys(_ports).length > 0,
        lastCheck: _state.lastCheck,
        version: VERSION
    };
}

export function getVersion() {
    return VERSION;
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        state: { ..._state },
        ports: Object.keys(_ports),
        permissions: getPermissions(),
        uarps_triggers: UARPS_TRIGGERS
    };
}

export default {
    VERSION,
    MODULE_ID,
    UARPS_TRIGGERS,
    REQUIRED_LEVEL,
    injectPorts,
    isReady,
    isAuthenticated,
    getLevel,
    getRoles,
    getUser,
    canAccessPanel,
    can,
    guard,
    getPermissions,
    healthCheck,
    getVersion,
    info
};
