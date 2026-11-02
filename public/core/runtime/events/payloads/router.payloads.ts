// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.ROUTER
// PURPOSE: P18 Event Payload Schemas - ROUTER Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - ROUTER Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.router.payloads';

export const ROUTER_PAYLOADS = { NAVIGATE_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', path: 'string', params: 'object?', query: 'object?', replace: 'boolean?' }, NAVIGATED: { timestamp: 'number', source: 'string', moduleId: 'string', path: 'string', params: 'object?', query: 'object?', previousPath: 'string?' }, NAVIGATION_FAILED: { timestamp: 'number', source: 'string', moduleId: 'string', path: 'string', reason: 'string', code: 'string?' }, ROUTE_CHANGED: { timestamp: 'number', source: 'string', moduleId: 'string', from: 'string', to: 'string', params: 'object?' }, GUARD_BLOCKED: { timestamp: 'number', source: 'string', moduleId: 'string', guardName: 'string', path: 'string', reason: 'string?' } } as const;

/** Derived type: keys of ROUTER_PAYLOADS */
export type RouterPayloadKey = keyof typeof ROUTER_PAYLOADS;
