// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: observer-tracker
// PURPOSE: Observer Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LISTENER_TYPES from ./constants.js
//
// PROVIDES:
//   createObserverTracker() — exported function
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
export const MODULE_ID = 'main.ui.container-main.resources.listener-tracker.observer-tracker';

export function createObserverTracker(options: Record<string, any> = {}) {
  const { 
    panelRegistry,
    limitChecker,
    statsManager,
    generateId,
    createRemover,
    eventBus
  } = options;

  return {
    // Rastreia um EventBus listener
    trackEventBus(panelId: string, eventName: string, handler: (...args: unknown[]) => void, bus = eventBus) {
      if (!bus) return null;
      if (!limitChecker.check(panelId, LISTENER_TYPES.EVENTBUS)) return null;

      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();

      // Adiciona o listener
      const unsubscribe = bus.on?.(eventName, handler) || (() => bus.off?.(eventName, handler));

      // Registra
      registry.listeners.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.EVENTBUS,
        eventType: eventName,
        createdAt: Date.now()
      });

      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();

      return createRemover(panelId, listenerId, LISTENER_TYPES.EVENTBUS, unsubscribe);
    },

    // Rastreia um Observer (MutationObserver, ResizeObserver, etc)
    trackObserver(panelId: string, observer: { observe: (t: HTMLElement, o?: Record<string, unknown>) => void; disconnect: () => void; constructor: { name: string } }, target: HTMLElement, observerOptions: Record<string, any> = {}) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.OBSERVER)) return null;

      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();

      // Observa
      observer.observe(target, observerOptions);

      // Registra
      registry.observers.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.OBSERVER,
        observerType: observer.constructor.name,
        createdAt: Date.now()
      });

      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();

      return createRemover(panelId, listenerId, LISTENER_TYPES.OBSERVER, () => observer.disconnect());
    },

    // Rastreia listener genérico com cleanup customizado
    trackCustom(panelId: string, description: string, cleanupFn: (...args: unknown[]) => void) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.CUSTOM)) return null;

      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();

      // Registra
      registry.listeners.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.CUSTOM,
        description,
        createdAt: Date.now()
      });

      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();

      return createRemover(panelId, listenerId, LISTENER_TYPES.CUSTOM, cleanupFn);
    }
  };
}

export default { createObserverTracker };
