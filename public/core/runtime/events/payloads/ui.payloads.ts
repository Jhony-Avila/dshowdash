// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.UI
// PURPOSE: P18 Event Payload Schemas - UI Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - UI Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.ui.payloads';

export const UI_PAYLOADS = { TOAST_SHOW_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', message: 'string', type: 'string?', duration: 'number?', action: 'object?' }, MODAL_OPEN_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', modalId: 'string', title: 'string?', content: 'string?', options: 'object?' }, MODAL_CLOSED: { timestamp: 'number', source: 'string', moduleId: 'string', modalId: 'string', result: 'string?' }, SIDEBAR_TOGGLED: { timestamp: 'number', source: 'string', moduleId: 'string', expanded: 'boolean', width: 'number?' }, SIDEBAR_RESIZE: { timestamp: 'number', source: 'string', moduleId: 'string', width: 'number', previousWidth: 'number?' }, ACTION: { timestamp: 'number', source: 'string', moduleId: 'string', action: 'string', target: 'string?', data: 'object?' }, THEME_CHANGED: { timestamp: 'number', source: 'string', moduleId: 'string', theme: 'string', previousTheme: 'string?' } } as const;

/** Derived type: keys of UI_PAYLOADS */
export type UiPayloadKey = keyof typeof UI_PAYLOADS;
