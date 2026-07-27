// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/handlers/visibility
// PURPOSE: Handles document visibility changes to pause/resume polling
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log from ../helpers/logger.js
// PROVIDES:
//   setupVisibilityChange(headerEvents) — registers visibilitychange listener
// LISTENS (eventos):
//   document:visibilitychange — pauses polling when hidden, resumes when visible
// ═══════════════════════════════════════════════════════════════
// Header Events - Visibility Handler
// @version 6.1.0-ES6
// @changelog v6.1.0-ES6 - Task 10.1 B02: var → const
'use strict';

import { log } from '../helpers/logger.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header.core.header-events.handlers.visibility';

export function setupVisibilityChange(headerEvents: unknown) {
  // @ts-expect-error TS migration - TS2339
  const header = headerEvents.header;
  // @ts-expect-error TS migration - TS2339
  const metrics = headerEvents._metrics;
  
  document.addEventListener('visibilitychange', () => {
    metrics.visibilityChangeCount++;
    metrics.lastEventAt = Date.now();
    if (document.hidden) {
      log('info', 'Documento oculto');
      if (header && header.polling && typeof header.polling.pause === 'function') {
        header.polling.pause();
      }
      header.pollingRestored = false;
    } else {
      if (!header.pollingRestored) {
        log('info', 'Documento visível');
        if (header && header.polling && typeof header.polling.resume === 'function') {
          header.polling.resume();
        }
        header.pollingRestored = true;
      }
    }
  }, { signal: header.abortControllers.visibility.signal });
}
