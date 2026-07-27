// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: timer-tracker
// PURPOSE: Timer Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LISTENER_TYPES from ./constants.js
//
// PROVIDES:
//   createTimerTracker() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LISTENER_TYPES } from './constants.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.listener-tracker.timer-tracker';

export function createTimerTracker(options: Record<string, any> = {}) {
  const { 
    panelRegistry,
    limitChecker,
    statsManager,
    generateId,
    createRemover
  } = options;

  return {
    // Rastreia um setTimeout
    trackTimeout(panelId: string, callback: (...args: unknown[]) => void, delay: number) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.TIMER)) return null;

      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();

      // Wrapper que auto-remove após execução
      const wrappedCallback = () => {
        registry.timers.delete(listenerId);
        callback();
      };

      const timerId = setTimeout(wrappedCallback, delay);

      // Registra
      registry.timers.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.TIMER,
        timerId,
        delay,
        createdAt: Date.now()
      });

      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();

      return createRemover(panelId, listenerId, LISTENER_TYPES.TIMER, () => clearTimeout(timerId));
    },

    // Rastreia um setInterval
    trackInterval(panelId: string, callback: (...args: unknown[]) => void, delay: number) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.INTERVAL)) return null;

      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();

      const intervalId = setInterval(callback, delay);

      // Registra
      registry.intervals.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.INTERVAL,
        intervalId,
        delay,
        createdAt: Date.now()
      });

      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();

      return createRemover(panelId, listenerId, LISTENER_TYPES.INTERVAL, () => clearInterval(intervalId));
    },

    // Rastreia um requestAnimationFrame
    trackRAF(panelId: string, callback: (...args: unknown[]) => void) {
      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();

      // Wrapper que auto-remove após execução
      const wrappedCallback = (timestamp: number) => {
        registry.rafs.delete(listenerId);
        callback(timestamp);
      };

      const rafId = requestAnimationFrame(wrappedCallback);

      // Registra
      registry.rafs.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.RAF,
        rafId,
        createdAt: Date.now()
      });

      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();

      return createRemover(panelId, listenerId, LISTENER_TYPES.RAF, () => cancelAnimationFrame(rafId));
    }
  };
}

export default { createTimerTracker };
