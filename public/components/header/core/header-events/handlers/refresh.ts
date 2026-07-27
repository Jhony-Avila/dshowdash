// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.1.1-SYNTAX-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/handlers/refresh
// PURPOSE: Handles header refresh events and BOOT_EVENTS.COMPONENTS_READY listener
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   HEADER_EVENTS from /core/runtime/events/catalog/header.events.js
//   BOOT_EVENTS from /core/runtime/events/catalog/boot.events.js
//   waitForComponentsReady from /core/runtime/boot-ready-dom-bridge.js
//   TELEMETRY_ACTIONS from ../constants.js
//   getPort from ../ports.js
//   log from ../helpers/logger.js
//   safeOn from ../helpers/event-bus.js
// PROVIDES:
//   setupRefreshEventHandlers(headerEvents) — registers HEADER_EVENTS.REFRESH listener
//   setupComponentsReadyListener(headerEvents) — waits for COMPONENTS_READY event
// LISTENS (eventos):
//   HEADER_EVENTS.REFRESH — tracks refresh telemetry
//   BOOT_EVENTS.COMPONENTS_READY — hides fallback when components are ready
// ═══════════════════════════════════════════════════════════════
// Header Events - Refresh Handler
// @version 6.1.1-SYNTAX-FIX
// @changelog v6.1.1-SYNTAX-FIX - Fixed missing import for waitForComponentsReady
// @changelog v6.1.0-ES6 - Task 10.1 B04: var → const/let
'use strict';

import { HEADER_EVENTS } from '/core/runtime/events/catalog/header.events.js';
import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';
import { waitForComponentsReady } from '/core/runtime/boot-ready-dom-bridge.js';
import { TELEMETRY_ACTIONS } from '../constants.js';
import { getPort } from '../ports.js';
import { log } from '../helpers/logger.js';
import { safeOn } from '../helpers/event-bus.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header.core.header-events.handlers.refresh';

export function setupRefreshEventHandlers(headerEvents: unknown) {
  // @ts-expect-error TS migration - TS2339
  const header = headerEvents.header;
  // @ts-expect-error TS migration - TS2339
  const metrics = headerEvents._metrics;
  
  if (!header.eventBus || typeof header.eventBus.on !== 'function') {
    log('warn', 'Header EventBus não disponível para REFRESH handler');
    return;
  }
  
  header.eventBus.on(HEADER_EVENTS.REFRESH, (payload: Record<string,unknown>) => {
    metrics.refreshCount++;
    metrics.lastEventAt = Date.now();
    log('info', 'Refresh solicitado via componente modular', payload);
    const sampleRate = (header.config && header.config.telemetry && header.config.telemetry.sampleRate) ? header.config.telemetry.sampleRate : 0.1;
    const shouldSample = Math.random() < sampleRate;
    const cfg = getPort('config');
    const debugEnabled = cfg && cfg.app && cfg.app.debug;
    if (shouldSample || debugEnabled) {
      if (header.telemetry && typeof header.telemetry.track === 'function') {
        header.telemetry.track('header:refresh:performance', {
          reason: payload ? payload.reason : null,
          instanceId: header.instanceId,
          action: TELEMETRY_ACTIONS.HEADER.REFRESH_DONE,
          sampled: true
        });
      }
    }
  });
}

export function setupComponentsReadyListener(headerEvents: unknown) {
  // @ts-expect-error TS migration - TS2339
  const header = headerEvents.header;
  // @ts-expect-error TS migration - TS2339
  const metrics = headerEvents._metrics;
  const eb = getPort('eventBus');
  let handled = false;
  
  const onComponentsReady = (data: Record<string,unknown>) => {
    if (handled) return;
    handled = true;
    metrics.componentsReadyCount++;
    metrics.lastEventAt = Date.now();
    log('info', 'Componentes prontos', data);
    if (header && typeof header.hideFallback === 'function') {
      header.hideFallback();
    }
  };
  
  const cleanup = safeOn(eb, BOOT_EVENTS.COMPONENTS_READY, onComponentsReady);
  if (cleanup) {
    // @ts-expect-error TS migration - TS2339
    headerEvents._componentsReadyCleanup = typeof cleanup === 'function' ? cleanup : () => {
      const bus = getPort('eventBus');
      if (bus && bus.off) bus.off(BOOT_EVENTS.COMPONENTS_READY, onComponentsReady);
    };
  }
  
  metrics.bridgeUsed = true;
  waitForComponentsReady(10000).then(() => {
    if (!handled) {
      onComponentsReady({ source: 'bridge' });
    }
  });
}
