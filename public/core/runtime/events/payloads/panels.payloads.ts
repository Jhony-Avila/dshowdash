// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.PANELS
// PURPOSE: P18 Event Payload Schemas - PANELS Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - PANELS Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.panels.payloads';

export const PANEL_PAYLOADS = { MOUNT_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', panelId: 'string', config: 'object?' }, MOUNTED: { timestamp: 'number', source: 'string', moduleId: 'string', panelId: 'string', mountTime: 'number?' }, UNMOUNTED: { timestamp: 'number', source: 'string', moduleId: 'string', panelId: 'string' }, LOADED: { timestamp: 'number', source: 'string', moduleId: 'string', panelId: 'string', dataSize: 'number?', loadTime: 'number?' }, LOAD_FAILED: { timestamp: 'number', source: 'string', moduleId: 'string', panelId: 'string', error: 'string', code: 'string?' }, REFRESH_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', panelId: 'string', force: 'boolean?' }, ERROR: { timestamp: 'number', source: 'string', moduleId: 'string', panelId: 'string', error: 'string', stack: 'string?', recoverable: 'boolean?' } } as const;

/** Derived type: keys of PANEL_PAYLOADS */
export type PanelPayloadKey = keyof typeof PANEL_PAYLOADS;
