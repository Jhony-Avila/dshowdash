// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-FIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-controller-events
// PURPOSE: NavigationController - Event Listeners
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   NAV_EVENTS, NAV_INTENTS from /core/runtime/events/catalog/nav.events.js
//   extractPanelId from ../../context-builder.js
//   addToIntentHistory from ../state/store.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setupBrokerListeners() — exported function
//   cleanupListeners() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   NAV_EVENTS.INTENT_RESOLVED
//   NAV_EVENTS.NAVIGATE_BLOCKED
//   NAV_EVENTS.NAVIGATE_ERROR
//   NAV_EVENTS.NAVIGATE_START
//   NAV_EVENTS.NAVIGATE_SUCCESS
//   NAV_INTENTS.NAVIGATE
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { NAV_EVENTS, NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';
import { extractPanelId } from '../../context-builder.js';
import { addToIntentHistory } from '../state/store.js';

export const MODULE_ID = 'navigation-controller-events';
export const VERSION = '8.2.0-FIX';

export function setupBrokerListeners(state: Record<string, unknown>, getPort: (name: string) => unknown) {
  const eb = getPort('eventBus') as Record<string, (...args: unknown[]) => unknown> | null;
  if (!eb || !eb.on) return;
  const metrics = state.metrics as Record<string, number>;
  const cleanups = state.cleanups as Array<() => void>;

  // Intent resolved
  const onIntentResolved = (data: Record<string, unknown>) => {
    metrics.intentsReceived++;
    metrics.intentsFromBroker++;
    addToIntentHistory(state, { type: 'resolved', data, timestamp: Date.now() });
  };
  eb.on(NAV_EVENTS.INTENT_RESOLVED, onIntentResolved);
  cleanups.push(() => { if (eb.off) eb.off(NAV_EVENTS.INTENT_RESOLVED, onIntentResolved); });

  // Navigate start
  const onNavigateStart = (data: Record<string, unknown>) => {
    addToIntentHistory(state, { type: 'start', data, timestamp: Date.now() });
  };
  eb.on(NAV_EVENTS.NAVIGATE_START, onNavigateStart);
  cleanups.push(() => { if (eb.off) eb.off(NAV_EVENTS.NAVIGATE_START, onNavigateStart); });

  // Navigate success
  const onNavigateSuccess = (data: Record<string, unknown>) => {
    addToIntentHistory(state, { type: 'success', data, timestamp: Date.now() });
    if (data && data.target) {
      const target = data.target as Record<string, unknown>;
      state.lastValidNavigation = {
        panelId: target.panelId || extractPanelId(target.value as string),
        route: target.value,
        timestamp: Date.now(),
        intentId: data.intentId
      };
    }
  };
  eb.on(NAV_EVENTS.NAVIGATE_SUCCESS, onNavigateSuccess);
  cleanups.push(() => { if (eb.off) eb.off(NAV_EVENTS.NAVIGATE_SUCCESS, onNavigateSuccess); });

  // Navigate blocked
  const onNavigateBlocked = (data: Record<string, unknown>) => {
    metrics.navigationsBlocked++;
    addToIntentHistory(state, { type: 'blocked', data, timestamp: Date.now() });
  };
  eb.on(NAV_EVENTS.NAVIGATE_BLOCKED, onNavigateBlocked);
  cleanups.push(() => { if (eb.off) eb.off(NAV_EVENTS.NAVIGATE_BLOCKED, onNavigateBlocked); });

  // Navigate error
  const onNavigateError = (data: Record<string, unknown>) => {
    addToIntentHistory(state, { type: 'error', data, timestamp: Date.now() });
  };
  eb.on(NAV_EVENTS.NAVIGATE_ERROR, onNavigateError);
  cleanups.push(() => { if (eb.off) eb.off(NAV_EVENTS.NAVIGATE_ERROR, onNavigateError); });

  // UI Intent navigate
  const onUIIntent = (data: Record<string, unknown>) => {
    metrics.intentsReceived++;
    addToIntentHistory(state, { type: 'ui-intent', data, timestamp: Date.now() });
    const broker = getPort('navigationBroker') as Record<string, (...args: unknown[]) => unknown> | null;
    if (broker && broker.processIntent && data) broker.processIntent(data);
  };
  eb.on(NAV_INTENTS.NAVIGATE, onUIIntent);
  cleanups.push(() => { if (eb.off) eb.off(NAV_INTENTS.NAVIGATE, onUIIntent); });
}

export function cleanupListeners(state: Record<string, unknown>) {
  const cleanups = state.cleanups as Array<() => void>;
  for (let i = 0; i < cleanups.length; i++) {
    try { cleanups[i](); } catch (e) { }
  }
  state.cleanups = [];
}

export default {
  setupBrokerListeners,
  cleanupListeners
};
