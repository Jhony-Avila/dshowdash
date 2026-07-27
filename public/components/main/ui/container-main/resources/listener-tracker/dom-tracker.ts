// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-tracker
// PURPOSE: DOM Listener Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LISTENER_TYPES from ./constants.js
//
// PROVIDES:
//   createDOMTracker() — exported function
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
export const MODULE_ID = 'main.ui.container-main.resources.listener-tracker.dom-tracker';

export function createDOMTracker(options: Record<string, any> = {}) {
  const { 
    panelRegistry,
    limitChecker,
    statsManager,
    generateId,
    createRemover
  } = options;

  return {
    // Rastreia um DOM event listener
    track(panelId: string, element: HTMLElement, eventType: string, handler: (...args: unknown[]) => void, listenerOptions: Record<string, any> = {}) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.DOM)) return null;

      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();

      // Adiciona o listener
      element.addEventListener(eventType, handler, listenerOptions);

      // Função de cleanup
      const cleanup = () => {
        element.removeEventListener(eventType, handler, listenerOptions);
      };

      // Registra
      registry.listeners.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.DOM,
        eventType,
        element: element.tagName || 'unknown',
        options: listenerOptions,
        createdAt: Date.now()
      });

      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();

      return createRemover(panelId, listenerId, LISTENER_TYPES.DOM, cleanup);
    },

    // Rastreia um window event listener
    trackWindow(panelId: string, eventType: string, handler: (...args: unknown[]) => void, listenerOptions: Record<string, any> = {}) {
      if (typeof window === 'undefined') return null;
      // @ts-expect-error strict migration — TS2345
      return this.track(panelId, window, eventType, handler, listenerOptions);
    },

    // Rastreia um document event listener
    trackDocument(panelId: string, eventType: string, handler: (...args: unknown[]) => void, listenerOptions: Record<string, any> = {}) {
      if (typeof document === 'undefined') return null;
      // @ts-expect-error strict migration — TS2345
      return this.track(panelId, document, eventType, handler, listenerOptions);
    }
  };
}

export default { createDOMTracker };
