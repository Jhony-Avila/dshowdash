// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.auth.contracts
// PURPOSE: Auth contracts, schemas and constants
// ───────────────────────────────────────────────────────────────
// PROVIDES: AUTH_CONTEXT_SCHEMA, SESSION_STATES, ORCHESTRATOR_EVENTS
// PROVIDES: SYSTEM_ROLES, ACCESS_LEVELS, SYSTEM_CAPABILITIES
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.1.0-ENTERPRISE - Initial contracts
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID: string = 'core.auth.contracts';
export const VERSION: string = '1.2.0-P2-ENTERPRISE';

export interface AuthContextSchema {
  userId: string | number | null;
  username: string | null;
  email: string | null;
  roles: string[];
  capabilities: string[];
  level: number;
  isAuthenticated: boolean;
  sessionId: string | null;
  token: string | null;
  expiresAt: number | null;
  lastActivity: number | null;
  metadata: Record<string, unknown>;
}

export const AUTH_CONTEXT_SCHEMA: AuthContextSchema = { userId: null, username: null, email: null, roles: [], capabilities: [], level: 0, isAuthenticated: false, sessionId: null, token: null, expiresAt: null, lastActivity: null, metadata: {} };

export const SESSION_STATES = {
  IDLE: 'IDLE',
  INITIALIZING: 'INITIALIZING',
  AUTHENTICATED: 'AUTHENTICATED',
  EXPIRED: 'EXPIRED',
  LOGGED_OUT: 'LOGGED_OUT',
  ERROR: 'ERROR'
} as const;

export const ORCHESTRATOR_EVENTS = {
  SESSION_INIT: 'auth:session:init',
  SESSION_READY: 'auth:session:ready',
  SESSION_LOGIN: 'auth:session:login',
  SESSION_LOGOUT: 'auth:session:logout',
  SESSION_EXPIRED: 'auth:session:expired',
  SESSION_RENEWED: 'auth:session:renewed',
  SESSION_CHANGED: 'auth:session:changed',
  SESSION_ERROR: 'auth:session:error',
  AUTH_INIT: 'auth:init',
  AUTH_READY: 'auth:ready',
  AUTH_GRANTED: 'auth:granted',
  AUTH_DENIED: 'auth:denied',
  AUTH_REFRESH: 'auth:refresh',
  AUTH_ERROR: 'auth:error',
  PERMISSION_CHECK: 'auth:permission:check',
  PERMISSION_GRANTED: 'auth:permission:granted',
  PERMISSION_DENIED: 'auth:permission:denied',
  POLICY_EVALUATE: 'auth:policy:evaluate',
  POLICY_ALLOWED: 'auth:policy:allowed',
  POLICY_DENIED: 'auth:policy:denied'
} as const;

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest'
} as const;

export const ACCESS_LEVELS = {
  NONE: 0,
  GUEST: 1,
  USER: 2,
  MANAGER: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5
} as const;

export const SYSTEM_CAPABILITIES = {
  VIEW_PANELS: 'panels:view',
  MANAGE_PANELS: 'panels:manage',
  VIEW_USERS: 'users:view',
  CREATE_USERS: 'users:create',
  EDIT_USERS: 'users:edit',
  DELETE_USERS: 'users:delete',
  ACCESS_ADMIN: 'admin:access',
  MANAGE_PERMISSIONS: 'admin:permissions',
  MANAGE_POLICIES: 'admin:policies',
  VIEW_AUDIT: 'admin:audit',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs'
} as const;

export const POLICY_RESULTS = {
  ALLOW: 'ALLOW',
  DENY: 'DENY',
  NOT_APPLICABLE: 'NOT_APPLICABLE'
} as const;

export function createEmptyAuthContext(): AuthContextSchema { return Object.assign({}, AUTH_CONTEXT_SCHEMA); }

export function validateAuthContext(context: unknown): boolean { if (!context || typeof context !== 'object') return false; const ctx = context as Record<string, unknown>; if (typeof ctx.isAuthenticated !== 'boolean') return false; if (!Array.isArray(ctx.roles)) return false; if (!Array.isArray(ctx.capabilities)) return false; return true; }

export function info(): { moduleId: string; version: string; timestamp: number } { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export function healthCheck(): { status: string; score: number; maxScore: number; moduleId: string; version: string } { return { status: 'HEALTHY', score: 1, maxScore: 1, moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID, VERSION, AUTH_CONTEXT_SCHEMA, SESSION_STATES, ORCHESTRATOR_EVENTS, SYSTEM_ROLES, ACCESS_LEVELS, SYSTEM_CAPABILITIES, POLICY_RESULTS, createEmptyAuthContext, validateAuthContext, info, healthCheck };
