// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.ORCHESTRATOR
// PURPOSE: P18 Event Payload Schemas - ORCHESTRATOR Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - ORCHESTRATOR Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.orchestrator.payloads';

export const ORCHESTRATOR_PAYLOADS = { LAYOUT_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', layout: 'string', options: 'object?' }, LAYOUT_CHANGED: { timestamp: 'number', source: 'string', moduleId: 'string', layout: 'string', previousLayout: 'string?' }, COMPONENT_REGISTERED: { timestamp: 'number', source: 'string', moduleId: 'string', componentId: 'string', type: 'string?' }, BROADCAST_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', channel: 'string', message: 'string', targets: 'array?' }, STATE_CHANGED: { timestamp: 'number', source: 'string', moduleId: 'string', key: 'string', value: 'string', previousValue: 'string?' } } as const;

/** Derived type: keys of ORCHESTRATOR_PAYLOADS */
export type OrchestratorPayloadKey = keyof typeof ORCHESTRATOR_PAYLOADS;
