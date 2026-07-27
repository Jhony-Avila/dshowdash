// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: integration
// PURPOSE: Navigation History - Browser Integration (Panel-Level)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   NAVIGATION_TYPES from ../constants.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   setupBrowserHistory() — exported function
//   updateBrowserHistory() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_HISTORY_SYNC — before modifying browser history
// LISTENS (eventos):
//   'popstate'
// WINDOW ACCESS: (none)
//   window.addEventListener
//   window.history
// ───────────────────────────────────────────────────────────────
// OWNERSHIP NOTE (P14 Compliance):
//   PANEL_HISTORY_OWNER: This module owns panel-level history sync.
//   RouterGlobal owns route-level navigation (#/route).
//   This module syncs panel state within a route (virtualRoute).
//   Coexistence is intentional and documented.
// ═══════════════════════════════════════════════════════════════
// @version 1.3.0-STRICT-MODE
// @changelog v1.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.2.0-P0-ENTERPRISE - Use Ports instead of (window as any).EventBusGlobal (P0 compliance)
'use strict';

import { NAVIGATION_TYPES } from '../constants.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'navigation-history:browser-integration';
export const VERSION = '1.4.0-P2-ENTERPRISE';

// P0 ENTERPRISE: EventBus via Ports, not window fallback
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: EventBus
// ═══════════════════════════════════════════════════════════════
function _getEventBus() {
  _initPorts();

  // 1. Try Ports first
  const portEventBus = Ports.get('eventBus');
  if (portEventBus) return portEventBus;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && (window as any).Core?.windowAdapter?.get) {
    const waEventBus = (window as any).Core.windowAdapter.get('EventBus');
    if (waEventBus) return waEventBus;
  }

  return null;
}

// Emit helper for observability (P0: uses Ports, no window fallback)
function _emitHistorySync(action: string, entry: Record<string, unknown>, type: string) {
  if (typeof window === 'undefined') return;
  const eventBus = _getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit('PANEL_HISTORY_SYNC', {
      action,
      entry,
      type,
      source: MODULE_ID,
      timestamp: Date.now()
    });
  }
}

export function setupBrowserHistory(state: Record<string, unknown>, config: Record<string, unknown>, notifyListeners: unknown, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  if (!config.useBrowserHistory || typeof window === 'undefined') return false;

  window.addEventListener('popstate', (event) => {
    if (state.isNavigating) return;

    const historyState = event.state;
    if (historyState && historyState.navigationId) {
      const index = (state.history as unknown[]).findIndex((h: unknown) => (h as Record<string, unknown>).id === historyState.navigationId);
      if (index !== -1) {
        state.isNavigating = true;
        // @ts-expect-error TS migration - TS2365
        const direction = (index as number) < state.currentIndex ? 'back' : 'forward';
        state.currentIndex = index;
        const entry = (state.history as Record<string, unknown>)[index];

        (notifyListeners as (...args: unknown[]) => unknown)('popstate', {
          entry,
          index: state.currentIndex,
          direction
        });

        // @ts-expect-error TS migration - TS2349
        config.onNavigate?.(entry, NAVIGATION_TYPES.POP);
        state.isNavigating = false;
      }
    }
  });

  logger.debug('Browser history integration enabled');
  return true;
}

export function updateBrowserHistory(entry: Record<string, unknown>, type: string, browserHistoryEnabled: unknown, isNavigating: unknown) {
  if (!browserHistoryEnabled || isNavigating) return;

  const historyState = {
    navigationId: entry.id,
    panelId: entry.panelId,
    // @ts-expect-error TS migration - TS2698
    ...(entry as Record<string, unknown>).state
  };

  // PANEL_HISTORY_OWNER: Panel-level history sync (coexists with RouterGlobal route-level)
  if (type === NAVIGATION_TYPES.PUSH) {
    _emitHistorySync('pushState', entry, type); // Observability: emit before modify
    // @ts-expect-error TS migration - TS2345
    window.history.pushState(historyState, (entry.title as string), entry.url); // PANEL_HISTORY_OWNER: pushState (scope=panel-state-only)
  } else if (type === NAVIGATION_TYPES.REPLACE) {
    _emitHistorySync('replaceState', entry, type); // Observability: emit before modify
    // @ts-expect-error TS migration - TS2345
    window.history.replaceState(historyState, (entry.title as string), entry.url); // PANEL_HISTORY_OWNER: replaceState (scope=panel-state-only)
  }
}

export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    ownership: 'PANEL_HISTORY_OWNER',
    scope: 'panel-state-only',
    p0Enterprise: true,
    portsInitialized: _portsInitialized,
    strictMode: isStrict()
  };
}

export default { setupBrowserHistory, updateBrowserHistory, info, injectPorts, getPorts, MODULE_ID, VERSION };
