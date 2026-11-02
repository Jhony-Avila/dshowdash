// Bootstrap-V2 Loader - Events
// @version 6.3.0-DOMAIN-PURE
// @changelog v6.3.0-DOMAIN-PURE - setEventBus() para injeção + fallback window.EventBus (loader roda pós phase-0)
// @changelog v6.2.1 - Initial implementation
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.3.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: MODULE_ID, hasWindow from ../constants.js
// PROVIDES: setEventBus(eb), emitBootEvent(name, detail)
// BROWSER-APIS: window.EventBus (fallback)
'use strict';

import { MODULE_ID, hasWindow } from '../constants.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';

interface EventBusLike {
  emit?: (name: string, detail: Record<string, unknown>) => void;
  [key: string]: unknown;
}

// v6.3.0: injected EventBus reference
let _eventBus: EventBusLike | null = null;

export function setEventBus(eventBus: EventBusLike | null) {
  _eventBus = eventBus || null;
}

export function emitBootEvent(eventName: string, detail: Record<string, unknown>) {
  try {
    const eb = _eventBus || (hasWindow ? window.EventBus : null);
    if (eb && eb.emit) {
      eb.emit(eventName, Object.assign({}, detail, { source: MODULE_ID, timestamp: Date.now() }));
    }
  } catch (e) {}
}
