// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.SYSTEM
// PURPOSE: P18 Event Payload Schemas - SYSTEM Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - SYSTEM Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.system.payloads';

export const SYSTEM_PAYLOADS = { BOOT_START: { timestamp: 'number', source: 'string', moduleId: 'string', version: 'string?', environment: 'string?' }, BOOT_PROGRESS: { timestamp: 'number', source: 'string', moduleId: 'string', step: 'string', progress: 'number', total: 'number?' }, BOOT_READY: { timestamp: 'number', source: 'string', moduleId: 'string', bootTime: 'number', components: 'array?' }, CONFIG_LOADED: { timestamp: 'number', source: 'string', moduleId: 'string', configKeys: 'array?', environment: 'string?' }, FEATURE_ENABLED: { timestamp: 'number', source: 'string', moduleId: 'string', featureId: 'string', metadata: 'object?' }, ERROR_OCCURRED: { timestamp: 'number', source: 'string', moduleId: 'string', error: 'string', code: 'string?', stack: 'string?', recoverable: 'boolean?' }, HEALTH_DEGRADED: { timestamp: 'number', source: 'string', moduleId: 'string', reason: 'string', affectedComponents: 'array?' } } as const;

/** Derived type: keys of SYSTEM_PAYLOADS */
export type SystemPayloadKey = keyof typeof SYSTEM_PAYLOADS;
