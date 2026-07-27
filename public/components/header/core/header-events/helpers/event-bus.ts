// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.0.0-P0-AUTH-OWNERSHIP)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/helpers/event-bus
// PURPOSE: Safe wrapper for EventBus.on() with validation and error handling
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log from ./logger.js
// PROVIDES:
//   safeOn(eb, eventName, handler) — safely registers event listener with validation
// ═══════════════════════════════════════════════════════════════
// Header Events - Event Bus Helper
// @version 6.0.0-P0-AUTH-OWNERSHIP
'use strict';

import { log } from './logger.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header.core.header-events.helpers.event-bus';

export function safeOn(eb: unknown, eventName: string, handler: Function) {
  // @ts-expect-error TS migration - TS2339
  if (!eb || typeof eb.on !== 'function') return null;
  if (!eventName || typeof eventName !== 'string') {
    log('warn', 'Skipping EventBus.on - invalid eventName', { eventName });
    return null;
  }
  try {
    // @ts-expect-error TS migration - TS2339
    return eb.on(eventName, handler);
  } catch (e: any) {
    log('warn', 'EventBus.on failed', { eventName, error: e.message });
    return null;
  }
}
