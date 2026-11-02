// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.AUTH
// PURPOSE: P18 Event Payload Schemas - AUTH Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - AUTH Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.auth.payloads';

/** Schema field type string literal */
type SchemaField = 'number' | 'string' | 'boolean' | 'object' | 'array' | 'number?' | 'string?' | 'boolean?' | 'object?' | 'array?';

/** Payload schema record type */
type PayloadSchema = Record<string, SchemaField>;

export const AUTH_PAYLOADS = { SESSION_START_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', userId: 'string?', metadata: 'object?' }, SESSION_STARTED: { timestamp: 'number', source: 'string', moduleId: 'string', sessionId: 'string', userId: 'string', expiresAt: 'number?' }, LOGIN_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', username: 'string', method: 'string?' }, LOGIN_SUCCEEDED: { timestamp: 'number', source: 'string', moduleId: 'string', userId: 'string', sessionId: 'string', roles: 'array?' }, LOGIN_FAILED: { timestamp: 'number', source: 'string', moduleId: 'string', reason: 'string', code: 'string?' }, PERMISSIONS_LOADED: { timestamp: 'number', source: 'string', moduleId: 'string', permissions: 'array', roles: 'array?' } } as const;

/** Derived type: keys of AUTH_PAYLOADS */
export type AuthPayloadKey = keyof typeof AUTH_PAYLOADS;
