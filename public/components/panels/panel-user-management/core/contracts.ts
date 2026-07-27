// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: contracts
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   UserSchema — exported value
//   validateUser() — exported function
//   normalizeUser() — exported function
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

export const MODULE_ID = 'panel-user-management.core.contracts';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel User Management - Contracts
 * @module panel-user-management/core/contracts
 * @version 1.1.0-AAA
 */

export const UserSchema = {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    role: { type: 'string', required: true },
    status: { type: 'string', default: 'active' },
    createdAt: { type: 'date', required: true },
    updatedAt: { type: 'date' }
};

export function validateUser(user: Record<string, unknown>) {
    const errors: string[] = [];
    if (!user.name) errors.push('Nome é obrigatório');
    if (!user.email) errors.push('Email é obrigatório');
    if (!(user.email as string)?.includes('@')) errors.push('Email inválido');
    if (!user.role) errors.push('Perfil é obrigatório');
    return { valid: errors.length === 0, errors };
}

export function normalizeUser(user: Record<string, unknown>) {
    return {
        ...user,
        name: (user.name as string)?.trim(),
        email: (user.email as string)?.toLowerCase().trim(),
        updatedAt: new Date().toISOString()
    };
}

export default { UserSchema, validateUser, normalizeUser };

// Alias export: consumers import { PERMISSION_ACTIONS } from this module
export const PERMISSION_ACTIONS = {
    VIEW: 'user-management:view',
    CREATE: 'user-management:create',
    UPDATE: 'user-management:update',
    DELETE: 'user-management:delete',
    ADMIN: 'user-management:admin'
};
