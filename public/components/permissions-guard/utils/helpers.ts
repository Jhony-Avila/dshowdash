// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: permissions-helpers
// PURPOSE: Permissions Guard - Helpers v4.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LEVELS, ROLES from ../core/contract.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ROLE_LEVELS — exported value
//   ROLE_HIERARCHY — exported value
//   deepClone() — exported function
//   normalizeRoles() — exported function
//   normalizeCapabilities() — exported function
//   calculateUserLevel() — exported function
//   expandRolesWithInheritance() — exported function
//   matchWildcard() — exported function
//   normalizeUserFromSession() — exported function
//   validatePolicyShape() — exported function
//   generateId() — exported function
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '4.1.0-ENTERPRISE';
export const MODULE_ID = 'permissions-helpers';

import { LEVELS, ROLES } from '../core/contract.js';

export const ROLE_LEVELS = { ...LEVELS };

export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.SUPER_ADMIN]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EDITOR, ROLES.VIEWER, ROLES.GUEST],
  [ROLES.ADMIN]: [ROLES.MANAGER, ROLES.EDITOR, ROLES.VIEWER, ROLES.GUEST],
  [ROLES.MANAGER]: [ROLES.EDITOR, ROLES.VIEWER, ROLES.GUEST],
  [ROLES.EDITOR]: [ROLES.VIEWER, ROLES.GUEST],
  [ROLES.VIEWER]: [ROLES.GUEST],
  [ROLES.GUEST]: []
});

const _metrics = { normalizations: 0, levelCalculations: 0, roleExpansions: 0, wildcardMatches: 0, sessionNormalizations: 0, policyValidations: 0 };

export function deepClone(obj: unknown) { if (obj === null || typeof obj !== 'object') return obj; try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; } }

export function normalizeRoles(roles: string[]) { _metrics.normalizations++; if (!Array.isArray(roles)) return [] as string[]; const normalized = new Set<string>(); roles.forEach(role => { if (typeof role === 'string' && role.trim()) { normalized.add(role.trim().toLowerCase()); } }); return Array.from(normalized); }

export function normalizeCapabilities(capabilities: string[]) { _metrics.normalizations++; if (!Array.isArray(capabilities)) return [] as string[]; const normalized = new Set<string>(); capabilities.forEach(cap => { if (typeof cap === 'string' && cap.trim()) { normalized.add(cap.trim().toLowerCase()); } }); return Array.from(normalized); }

export function calculateUserLevel(roles: string[]) { _metrics.levelCalculations++; if (!Array.isArray(roles) || roles.length === 0) return 0; let maxLevel = 0; roles.forEach((role: string) => { const normalizedRole = (role || '').toLowerCase().trim(); const level = (ROLE_LEVELS as Record<string, number>)[normalizedRole] || 0; if (level > maxLevel) { maxLevel = level; } }); return maxLevel; }

export function expandRolesWithInheritance(roles: string[]) { _metrics.roleExpansions++; if (!Array.isArray(roles)) return []; const expanded = new Set(roles); roles.forEach((role: string) => { const normalizedRole = (role || '').toLowerCase().trim(); const inherited = (ROLE_HIERARCHY as Record<string, string[]>)[normalizedRole]; if (inherited) { inherited.forEach((r: string) => expanded.add(r)); } }); return Array.from(expanded); }

export function matchWildcard(pattern: string, value: string) { _metrics.wildcardMatches++; if (!pattern || !value) return false; if (pattern === value) return true; if (pattern.endsWith('*')) { const prefix = pattern.slice(0, -1); return value.startsWith(prefix); } if (pattern.startsWith('*')) { const suffix = pattern.slice(1); return value.endsWith(suffix); } return false; }

export function normalizeUserFromSession(user: Record<string, unknown> & { id?: string; userId?: string; roles?: string[]; role?: string; capabilities?: string[]; permissions?: string[]; scopes?: string[]; level?: number }) { _metrics.sessionNormalizations++; if (!user) return null; return { id: user.id || user.userId || null, roles: normalizeRoles(user.roles || (user.role ? [user.role] : [])), capabilities: normalizeCapabilities(user.capabilities || user.permissions || []), scopes: user.scopes || [], level: user.level || calculateUserLevel(user.roles || []) }; }

export function validatePolicyShape(policy: Record<string, unknown>) { _metrics.policyValidations++; if (!policy || typeof policy !== 'object') { return { valid: false, error: 'Policy must be an object' }; } if (!Array.isArray(policy.roles)) { return { valid: false, error: 'Policy.roles must be an array' }; } if (typeof policy.minLevel !== 'number') { return { valid: false, error: 'Policy.minLevel must be a number' }; } return { valid: true }; }

export function generateId(prefix = 'perm') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

export function getVersion() { return VERSION; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, roleLevelsSource: 'contract.js (LEVELS)', roleLevelsCount: Object.keys(ROLE_LEVELS).length, roleHierarchyCount: Object.keys(ROLE_HIERARCHY).length, metrics: { ..._metrics }, availableFunctions: ['deepClone', 'normalizeRoles', 'normalizeCapabilities', 'calculateUserLevel', 'expandRolesWithInheritance', 'matchWildcard', 'normalizeUserFromSession', 'validatePolicyShape', 'generateId'], timestamp: Date.now() }; }

export function healthCheck() { const checks = { roleLevelsAvailable: Object.keys(ROLE_LEVELS).length > 0, roleHierarchyAvailable: Object.keys(ROLE_HIERARCHY).length > 0, levelsMatchContract: ROLE_LEVELS === LEVELS || JSON.stringify(ROLE_LEVELS) === JSON.stringify(LEVELS), functionsAvailable: typeof normalizeRoles === 'function' && typeof calculateUserLevel === 'function' }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed === total, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export default { ROLE_LEVELS, ROLE_HIERARCHY, deepClone, normalizeRoles, normalizeCapabilities, calculateUserLevel, expandRolesWithInheritance, matchWildcard, normalizeUserFromSession, validatePolicyShape, generateId, getVersion, info, healthCheck, VERSION, MODULE_ID };
