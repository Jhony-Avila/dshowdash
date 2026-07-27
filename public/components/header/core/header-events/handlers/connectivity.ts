// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/handlers/connectivity
// PURPOSE: Handles browser online/offline events for connectivity state management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log from ../helpers/logger.js
// PROVIDES:
//   setupConnectivityHandlers(headerEvents) — registers online/offline window listeners
// LISTENS (eventos):
//   window:online — restores connectivity, resumes polling, hides fallback
//   window:offline — sets offline state, shows fallback
// WINDOW ACCESS:
//   window.addEventListener(online/offline) — monitors network connectivity
// ═══════════════════════════════════════════════════════════════
// Header Events - Connectivity Handler
// @version 6.1.0-ES6
// @changelog v6.1.0-ES6 - Task 10.1 B03: var → const
'use strict';

import { log } from '../helpers/logger.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header.core.header-events.handlers.connectivity';

export function setupConnectivityHandlers(headerEvents: unknown) {
  // @ts-expect-error TS migration - TS2339
  const header = headerEvents.header;
  // @ts-expect-error TS migration - TS2339
  const metrics = headerEvents._metrics;
  
  window.addEventListener('online', () => {
    metrics.connectivityChangeCount++;
    metrics.lastEventAt = Date.now();
    log('info', 'Navigator online');
    if (header && header.store) {
      header.store.updateConnectivity({ online: true, timeoutCount: 0 });
    }
    if (header && header.polling) {
      if (typeof header.polling.resume === 'function') header.polling.resume();
    }
    if (header && header.announceManager && typeof header.announceManager.announce === 'function') {
      header.announceManager.announce('Conexão restaurada');
    }
    if (header && typeof header.hideFallback === 'function') {
      header.hideFallback();
    }
  }, { signal: header.abortControllers.connectivity.signal });

  window.addEventListener('offline', () => {
    metrics.connectivityChangeCount++;
    metrics.lastEventAt = Date.now();
    log('info', 'Navigator offline');
    if (header && header.store) {
      header.store.updateConnectivity({ online: false });
    }
    if (header && header.announceManager && typeof header.announceManager.announce === 'function') {
      header.announceManager.announce('Sem conexão');
    }
    if (header && typeof header.showFallback === 'function') {
      header.showFallback('network', 'Sem conexão com a internet');
    }
  }, { signal: header.abortControllers.connectivity.signal });
}
