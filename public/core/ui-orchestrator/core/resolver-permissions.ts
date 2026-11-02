// UI Orchestrator - Resolver Permissions
// DEPENDENCY CONTRACT — UI Orchestrator module
// Controle de permissões do resolver

'use strict';

const MODULE_ID = 'resolver-permissions';
const VERSION = '1.0.1-P2-ENTERPRISE';

let permissions = new Map<string, { roles: string[]; requireAuth: boolean; custom: ((...args: unknown[]) => unknown) | null }>();
let defaultPolicy = 'allow';

const setPermission = (pattern: string, config: Record<string, unknown>) => {
    permissions.set(pattern, {
        roles: (config.roles as string[]) || [],
        requireAuth: config.requireAuth !== false,
        custom: (config.custom as ((...args: unknown[]) => unknown)) || null
    });
    return true;
};

const removePermission = (pattern: string) => permissions.delete(pattern);

const check = async (pattern: string, context: Record<string, unknown> = {}) => {
    const config = permissions.get(pattern);

    if (!config) {
        return defaultPolicy === 'allow';
    }

    if (config.requireAuth && !context.authenticated) {
        return false;
    }

    if (config.roles.length > 0) {
        const userRoles = (context.roles as string[]) || [];
        const hasRole = config.roles.some((role: string) => userRoles.includes(role));
        if (!hasRole) return false;
    }

    if (typeof config.custom === 'function') {
        return await config.custom(pattern, context);
    }

    return true;
};

const setDefaultPolicy = (policy: string) => {
    if (policy === 'allow' || policy === 'deny') {
        defaultPolicy = policy;
        return true;
    }
    return false;
};

const getDefaultPolicy = () => defaultPolicy;

const clear = () => {
    permissions.clear();
    defaultPolicy = 'allow';
};

const healthCheck = () => ({
    healthy: true,
    permissionsCount: permissions.size,
    defaultPolicy
});

const info = () => ({
    moduleId: MODULE_ID,
    version: VERSION,
    permissionsCount: permissions.size,
    defaultPolicy
});

export {
    setPermission,
    removePermission,
    check,
    setDefaultPolicy,
    getDefaultPolicy,
    clear,
    healthCheck,
    info,
    MODULE_ID,
    VERSION
};
