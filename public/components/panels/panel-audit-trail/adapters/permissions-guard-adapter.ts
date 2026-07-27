// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail:permissions-guard-adapter
// PURPOSE: Panel Audit Trail - Permissions Guard Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   injectPorts() — exported function
//   isAuthenticated() — exported function
//   getUserLevel() — exported function
//   getRoles() — exported function
//   checkPermission() — exported function
//   canAccessPanel() — exported function
//   canExportAudit() — exported function
//   canFilterByUser() — exported function
//   getPermissionContext() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
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
export const MODULE_ID = 'panel-audit-trail:permissions-guard-adapter';

// P3.2: Triggers UARPS
const UARPS_TRIGGERS = {
    VIEW: 'trigger:panel:audit-trail:view',
    ADMIN: 'trigger:panel:audit-trail:admin'
};

// P3.2: DEPRECATED - Nível mínimo fallback
const MIN_ACCESS_LEVEL = 80;

// Portas injetadas
let _ports: Record<string, unknown> = {};

function _getPort(name: string): Record<string, unknown> | null {
    return (_ports[name] as Record<string, unknown>) || null;
}

export function injectPorts(ports: Record<string, unknown>) {
    _ports = ports || {};
}

export function isAuthenticated() {
    const auth = _getPort('auth') as { isAuthenticated?: () => boolean; getUser?: () => unknown } | null;
    if (auth?.isAuthenticated) return auth.isAuthenticated();
    if (auth?.getUser) return !!auth.getUser();
    return false;
}

export function getUserLevel() {
    const auth = _getPort('auth') as { getLevel?: () => number; getUser?: () => Record<string, unknown> } | null;
    if (auth?.getLevel) return auth.getLevel();
    const user = auth?.getUser?.();
    return (user?.level as number) || 0;
}

export function getRoles() {
    const auth = _getPort('auth') as { getRoles?: () => string[]; getUser?: () => Record<string, unknown> } | null;
    if (auth?.getRoles) return auth.getRoles();
    const user = auth?.getUser?.();
    return (user?.roles as string[]) || [];
}

export function checkPermission(permission: string) {
    const auth = _getPort('auth') as { can?: (p: string) => boolean } | null;
    if (auth?.can) return auth.can(permission);
    return false;
}

// P3.2: Verifica via UARPS primeiro, fallback para level
export const canAccessPanel = () => {
    if (!isAuthenticated()) return false;
    
    // Tenta via porta auth (que pode usar UARPS internamente)
    if (checkPermission('audit:view')) return true;
    
    // Verifica roles admin
    const roles = getRoles();
    if (roles.includes('super_admin') || roles.includes('admin')) return true;
    
    // P3.2: Fallback por nível (DEPRECATED)
    const level = getUserLevel();
    return level >= MIN_ACCESS_LEVEL;
};

export function canExportAudit() {
    if (!isAuthenticated()) return false;
    if (checkPermission('audit:export')) return true;
    return getUserLevel() >= 90;
}

export function canFilterByUser() {
    if (!isAuthenticated()) return false;
    if (checkPermission('audit:filter:user')) return true;
    return getUserLevel() >= MIN_ACCESS_LEVEL;
}

export function getPermissionContext() {
    return {
        isAuthenticated: isAuthenticated(),
        level: getUserLevel(),
        roles: getRoles(),
        canAccess: canAccessPanel(),
        canExport: canExportAudit(),
        canFilterByUser: canFilterByUser(),
        uarps_mode: 'hybrid'
    };
}

export function healthCheck() {
    return {
        status: 'healthy',
        authenticated: isAuthenticated(),
        canAccess: canAccessPanel(),
        portsInjected: Object.keys(_ports).length > 0,
        version: VERSION
    };
}

export function getVersion() {
    return VERSION;
}

export default {
    VERSION,
    MODULE_ID,
    UARPS_TRIGGERS,
    injectPorts,
    isAuthenticated,
    getUserLevel,
    getRoles,
    checkPermission,
    canAccessPanel,
    canExportAudit,
    canFilterByUser,
    getPermissionContext,
    healthCheck,
    getVersion
};
