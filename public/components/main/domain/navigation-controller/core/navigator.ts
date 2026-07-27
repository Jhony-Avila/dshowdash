// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-controller-navigator
// PURPOSE: NavigationController - Core Navigator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   extractPanelId from ../../context-builder.js
//   cleanup, updateTimingMetrics from ../state/store.js
//   processQueue from ../queue/manager.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   LOCAL_NAV_EVENTS — exported value
//   validateNavigation() — exported function
//   emitNavigationBlocked() — exported function
//   executeNavigation() — exported function
//   doNavigate() — exported function
//   cancel() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LOCAL_NAV_EVENTS.BLOCKED
//   LOCAL_NAV_EVENTS.INVALID_ROUTE
//   UI_INTENTS.SHOW_TOAST
// LISTENS (eventos):
//   'abort'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { extractPanelId } from '../../context-builder.js';
import { cleanup, updateTimingMetrics } from '../state/store.js';
import { processQueue } from '../queue/manager.js';

export const MODULE_ID = 'navigation-controller-navigator';
export const VERSION = '9.0.0-P1-HEX';

export const LOCAL_NAV_EVENTS = {
  START: 'navigation:start',
  END: 'navigation:end',
  BLOCKED: 'navigation:blocked',
  INVALID_ROUTE: 'navigation:invalid-route',
  CANCELLED: 'navigation:cancelled',
  ERROR: 'navigation:error',
  TIMEOUT: 'navigation:timeout'
};

// P1-HEX: Timer helpers using state.timerPort
function _setTimeout(state: Record<string, unknown>, fn: (...args: unknown[]) => unknown, ms: number) {
  const tp = state.timerPort as Record<string, (...args: unknown[]) => unknown> | null;
  if (tp && tp.setTimeout) return tp.setTimeout(fn, ms);
  return setTimeout(fn, ms);
}

function _clearTimeout(state: Record<string, unknown>, id: unknown) {
  if (id === null || id === undefined) return;
  const tp = state.timerPort as Record<string, (...args: unknown[]) => unknown> | null;
  if (tp && tp.clearTimeout) return tp.clearTimeout(id);
  return clearTimeout(id as ReturnType<typeof setTimeout>);
}

export function validateNavigation(manifestController: Record<string, unknown>, route: string, options: Record<string, unknown>) {
  if (!manifestController) return Promise.resolve({ valid: true, reason: 'no-manifest-controller' });
  
// @ts-expect-error TS migration - TS2339
  const routePath = typeof route === 'string' ? route : (route && route.path ? route.path : '/');
  
  const mc = manifestController as Record<string, (...args: unknown[]) => Promise<Record<string, unknown> | null>>;
  if (mc.validateRoute) {
    return mc.validateRoute(routePath);
  }

  if (mc.resolveRoute) {
    return mc.resolveRoute(routePath).then((resolved: Record<string, unknown> | null) => ({
      valid: resolved !== null,
      panelId: resolved ? resolved.panelId : null,
      reason: resolved === null ? 'route-not-found' : 'valid'
    }));
  }
  
  return Promise.resolve({ valid: true, reason: 'no-validation-available' });
}

export function emitNavigationBlocked(state: Record<string, unknown>, telemetry: Record<string, unknown>, getPort: (name: string) => unknown, route: string, reason: string, validation: Record<string, unknown>, moduleId: string) {
  const metrics = state.metrics as Record<string, number>;
  metrics.navigationsBlocked++;
  metrics.invalidRoutes++;
  const lastNav = state.lastValidNavigation as Record<string, unknown> | null;

  const payload = {
    route,
    reason,
    validation: validation || {},
    lastValidPanel: lastNav ? lastNav.panelId : null,
    timestamp: Date.now()
  };
  
  if (telemetry && telemetry.track) {
// @ts-expect-error TS migration - TS2349
    telemetry.track(LOCAL_NAV_EVENTS.BLOCKED, payload);
  }
  
  const eb = getPort('eventBus') as Record<string, (...args: unknown[]) => unknown> | null;
  if (eb && eb.emit) {
    eb.emit(LOCAL_NAV_EVENTS.BLOCKED, payload);
    eb.emit(LOCAL_NAV_EVENTS.INVALID_ROUTE, payload);
    eb.emit(UI_INTENTS.SHOW_TOAST, {
      type: 'warning',
      title: 'Navegação Indisponível',
      message: 'Esta funcionalidade ainda não está disponível.',
      duration: 4000,
      source: moduleId,
      timestamp: Date.now()
    });
  }
  
  return payload;
}

export function executeNavigation(state: Record<string, unknown>, panelLifecycle: Record<string, unknown>, stateMachine: Record<string, unknown>, telemetry: Record<string, unknown>, getPort: (name: string) => unknown, route: string | Record<string, unknown>, options: Record<string, unknown>) {
  state.navigating = true;
  state.abortController = new AbortController();
  const startTime = performance.now();
  const sm = stateMachine as Record<string, (...args: unknown[]) => unknown>;
  const pl = panelLifecycle as Record<string, (...args: unknown[]) => unknown>;
  const stateMetrics = state.metrics as Record<string, number>;
  const ac = state.abortController as AbortController;

  let panelId;
  if (typeof route === 'string' && route.match(/^panel-/i)) {
    panelId = route;
  } else if (typeof route === 'string') {
    panelId = extractPanelId(route);
  } else {
    // @ts-expect-error strict migration — TS2345
    panelId = extractPanelId(route ? (route as Record<string, unknown>).path as string : null);
  }

  const containerId = options.containerId || null;
  const timeout = options.timeout || state.timeoutMs;

  state.currentNavigation = { panelId, route, startTime, containerId };

  const tel = telemetry as Record<string, (...args: unknown[]) => unknown>;

  // P1-HEX: Use TimerPort via helper for timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    state.timeoutId = _setTimeout(state, () => {
      if (state.navigating && ac) {
        stateMetrics.navigationsTimedOut++;
        ac.abort();
        if (tel && tel.track) {
          tel.track(LOCAL_NAV_EVENTS.TIMEOUT, { panelId, timeout });
        }
        reject(new Error(`Navigation timeout after ${timeout}ms`));
      }
    }, timeout as number);
  });

  const abortPromise = new Promise((_, reject) => {
    ac.signal.addEventListener('abort', () => {
      reject(new Error('Navigation cancelled'));
    }, { once: true });
  });

  if (tel && tel.track) {
    tel.track(LOCAL_NAV_EVENTS.START, { panelId, route, containerId });
  }

  sm.transition('navigating');

  const navigationPromise = doNavigate(state, panelLifecycle, stateMachine, panelId, containerId as string, options, ac.signal);

  return Promise.race([navigationPromise, timeoutPromise, abortPromise]).then(() => {
    // P1-HEX: Use TimerPort via helper for clearTimeout
    _clearTimeout(state, state.timeoutId);
    state.timeoutId = null;

    const navigationTime = Math.round(performance.now() - startTime);
    updateTimingMetrics(state, navigationTime);
    sm.transition('ready');
    stateMetrics.navigationsCompleted++;
    state.lastValidNavigation = { panelId, route, timestamp: Date.now() };

    if (tel && tel.track) {
      tel.track(LOCAL_NAV_EVENTS.END, { panelId, success: true, navigationTime });
    }

    cleanup(state);
    processQueue(state, (r: unknown, o: unknown) => executeNavigation(state, panelLifecycle, stateMachine, telemetry, getPort, r as string, o as Record<string, unknown>));
    return true;
  }).catch((error: Error & { name: string }) => {
    // P1-HEX: Use TimerPort via helper for clearTimeout
    _clearTimeout(state, state.timeoutId);
    state.timeoutId = null;

    const navigationTime = Math.round(performance.now() - startTime);

    if (error.message === 'Navigation cancelled' || error.name === 'NavigationCancelledError') {
      stateMetrics.navigationsCancelled++;
      if (tel && tel.track) {
        tel.track(LOCAL_NAV_EVENTS.CANCELLED, { panelId, navigationTime });
      }
    } else if (error.message.includes('timeout')) {
      sm.transition('error');
    } else {
      stateMetrics.navigationsFailed++;
      sm.transition('error');
      if (tel && tel.error) {
        tel.error(error, { panelId, phase: 'navigation', navigationTime });
      }
    }

    cleanup(state);
    processQueue(state, (r: unknown, o: unknown) => executeNavigation(state, panelLifecycle, stateMachine, telemetry, getPort, r as string, o as Record<string, unknown>));
    throw error;
  });
}

export function doNavigate(state: Record<string, unknown>, panelLifecycle: Record<string, unknown>, stateMachine: Record<string, unknown>, panelId: string, containerId: string, options: Record<string, unknown>, signal: AbortSignal) {
  let promise: Promise<unknown> = Promise.resolve();
  const plc = panelLifecycle as Record<string, (...args: unknown[]) => unknown>;
  const smc = stateMachine as Record<string, (...args: unknown[]) => unknown>;

  if (plc.hasPanel()) {
    smc.transition('unmounting');
    promise = promise.then(() => plc.unmount());
  }

  return promise.then(() => {
    smc.transition('loading-panel');
    return plc.load(panelId, { signal });
  }).then(panelModule => {
    smc.transition('mounting');
    return plc.mount(panelModule, panelId, Object.assign({ containerId, signal }, options));
  });
}

export function cancel(state: Record<string, unknown>) {
  if (state.abortController && state.navigating) {
    (state.abortController as AbortController).abort();
    return true;
  }
  return false;
}

export default {
  LOCAL_NAV_EVENTS,
  validateNavigation,
  emitNavigationBlocked,
  executeNavigation,
  doNavigate,
  cancel,
  VERSION,
  MODULE_ID
};
