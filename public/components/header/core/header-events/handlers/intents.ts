// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/handlers/intents
// PURPOSE: Handles HEADER_INTENTS (refresh, show, hide) from EventBus
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   HEADER_EVENTS, HEADER_INTENTS from /core/runtime/events/catalog/header.events.js
//   MODULE_ID from ../constants.js
//   getPort from ../ports.js
//   log from ../helpers/logger.js
//   safeOn from ../helpers/event-bus.js
// PROVIDES:
//   handleRefreshIntent(header, data) — triggers refresh via coordinator or direct call
//   handleShowIntent(header, data) — shows header element and emits DATA_UPDATED
//   handleHideIntent(header, data) — hides header element and emits DATA_UPDATED
//   setupIntentsHandlers(headerEvents) — registers intent listeners on EventBus
//   cleanupIntentsHandlers(headerEvents) — removes intent listeners
// EMITS (eventos):
//   HEADER_EVENTS.REFRESH_TRIGGERED — after refresh intent processed
//   HEADER_EVENTS.DATA_UPDATED — after show/hide intent processed
// LISTENS (eventos):
//   HEADER_INTENTS.REFRESH — triggers handleRefreshIntent
//   HEADER_INTENTS.SHOW — triggers handleShowIntent
//   HEADER_INTENTS.HIDE — triggers handleHideIntent
// ═══════════════════════════════════════════════════════════════
// Header Events - Intents Handlers
// @version 6.1.0-ES6
// @changelog v6.1.0-ES6 - Task 10.1 B06: var → const/let
'use strict';

import { HEADER_EVENTS, HEADER_INTENTS } from '/core/runtime/events/catalog/header.events.js';
import { MODULE_ID } from '../constants.js';
import { getPort } from '../ports.js';
import { log } from '../helpers/logger.js';
import { safeOn } from '../helpers/event-bus.js';

export const VERSION = '1.1.0-ES6';

export function handleRefreshIntent(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    // @ts-expect-error TS migration - TS2339
    if (header && header.refreshCoordinator && typeof header.refreshCoordinator.request === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.refreshCoordinator.request();
      log('debug', 'Refresh disparado via RefreshCoordinator');
    } else if (header && typeof header.refresh === 'function') {
      header.refresh();
      log('debug', 'Refresh disparado via header.refresh()');
    } else {
      log('warn', 'Nenhum mecanismo de refresh disponível');
    }
    // @ts-expect-error TS migration - TS2339
    if (header && header.eventBus && typeof header.eventBus.emit === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.eventBus.emit(HEADER_EVENTS.REFRESH_TRIGGERED, {
        reason: data && data.reason ? data.reason : 'intent',
        source: data && data.source ? data.source : 'unknown',
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }
  } catch (e: any) {
    log('error', '_handleRefreshIntent error', e.message);
  }
}

export function handleShowIntent(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    const headerEl = document.querySelector('#shell-header-region') || document.querySelector('.main-header');
    if (headerEl) {
      headerEl.removeAttribute('data-header-hidden');
      (headerEl as HTMLElement).style.display = '';
      headerEl.setAttribute('aria-hidden', 'false');
      log('debug', 'Header mostrado via INTENT');
    }
    // @ts-expect-error TS migration - TS2339
    if (header && header.eventBus && typeof header.eventBus.emit === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.eventBus.emit(HEADER_EVENTS.DATA_UPDATED, {
        action: 'show',
        visible: true,
        source: data && data.source ? data.source : 'intent',
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }
  } catch (e: any) {
    log('error', '_handleShowIntent error', e.message);
  }
}

export function handleHideIntent(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    const headerEl = document.querySelector('#shell-header-region') || document.querySelector('.main-header');
    if (headerEl) {
      headerEl.setAttribute('data-header-hidden', 'true');
      (headerEl as HTMLElement).style.display = 'none';
      headerEl.setAttribute('aria-hidden', 'true');
      log('debug', 'Header ocultado via INTENT');
    }
    // @ts-expect-error TS migration - TS2339
    if (header && header.eventBus && typeof header.eventBus.emit === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.eventBus.emit(HEADER_EVENTS.DATA_UPDATED, {
        action: 'hide',
        visible: false,
        source: data && data.source ? data.source : 'intent',
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }
  } catch (e: any) {
    log('error', '_handleHideIntent error', e.message);
  }
}

export function setupIntentsHandlers(headerEvents: unknown) {
  const eb = getPort('eventBus');
  if (!eb) {
    log('warn', 'EventBus global não disponível - HEADER_INTENTS não configurados');
    return;
  }
  
  // @ts-expect-error TS migration - TS2339
  const header = headerEvents.header;
  // @ts-expect-error TS migration - TS2339
  const metrics = headerEvents._metrics;
  // @ts-expect-error TS migration - TS2339
  const cleanups = headerEvents._intentsCleanups;

  const onRefreshRequest = (data: Record<string,unknown>) => {
    metrics.intentsEventCount++;
    metrics.lastEventAt = Date.now();
    const reason = data && data.reason ? data.reason : 'intent';
    const source = data && data.source ? data.source : 'unknown';
    log('info', 'INTENT: Refresh request recebido', { reason, source });
    handleRefreshIntent(header, data);
  };

  const onShowRequest = (data: Record<string,unknown>) => {
    metrics.intentsEventCount++;
    metrics.lastEventAt = Date.now();
    const source = data && data.source ? data.source : 'unknown';
    log('info', 'INTENT: Show request recebido', { source });
    handleShowIntent(header, data);
  };

  const onHideRequest = (data: Record<string,unknown>) => {
    metrics.intentsEventCount++;
    metrics.lastEventAt = Date.now();
    const source = data && data.source ? data.source : 'unknown';
    log('info', 'INTENT: Hide request recebido', { source });
    handleHideIntent(header, data);
  };

  const cleanup1 = safeOn(eb, HEADER_INTENTS.REFRESH, onRefreshRequest);
  const cleanup2 = safeOn(eb, HEADER_INTENTS.SHOW, onShowRequest);
  const cleanup3 = safeOn(eb, HEADER_INTENTS.HIDE, onHideRequest);

  if (cleanup1) cleanups.push(typeof cleanup1 === 'function' ? cleanup1 : () => { const bus = getPort('eventBus'); if (bus && bus.off) bus.off(HEADER_INTENTS.REFRESH, onRefreshRequest); });
  if (cleanup2) cleanups.push(typeof cleanup2 === 'function' ? cleanup2 : () => { const bus = getPort('eventBus'); if (bus && bus.off) bus.off(HEADER_INTENTS.SHOW, onShowRequest); });
  if (cleanup3) cleanups.push(typeof cleanup3 === 'function' ? cleanup3 : () => { const bus = getPort('eventBus'); if (bus && bus.off) bus.off(HEADER_INTENTS.HIDE, onHideRequest); });

  log('info', `HEADER_INTENTS configurados (${cleanups.length} listeners)`);
}

export function cleanupIntentsHandlers(headerEvents: unknown) {
  // @ts-expect-error TS migration - TS2339
  headerEvents._intentsCleanups.forEach((cleanup: () => void) => {
    try { if (typeof cleanup === 'function') cleanup(); } catch (e: any) { }
  });
  // @ts-expect-error TS migration - TS2339
  headerEvents._intentsCleanups = [];
  log('debug', 'HEADER_INTENTS cleanup concluído');
}
