// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: listener-setup
// PURPOSE: Event Recorder Listener Setup
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EVENT_TYPES from ./constants.js
//
// PROVIDES:
//   createListenerSetup() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   '*'
// WINDOW ACCESS:
//   window.fetch
// ═══════════════════════════════════════════════════════════════
'use strict';

import { EVENT_TYPES } from './constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.event-recorder.listener-setup';

export function createListenerSetup(options: Record<string, any> = {}) {
  const {
    captureEventBus = true,
    captureDOMEvents = false,
    captureNetworkEvents = false,
    onCapture
  } = options;

  let _eventBus: Record<string, unknown> | null = null;
  const _listeners: Array<(...args: unknown[]) => void> = [];

  return {
    // Injeta EventBus
    setEventBus(eventBus: unknown) {
      _eventBus = eventBus as Record<string, unknown>;
    },

    getEventBus() {
      return _eventBus;
    },

    // Configura listeners do EventBus
    setupEventBus() {
      if (!_eventBus || !captureEventBus) return;

      const handler = (event: string, data: Record<string, unknown>) => {
        onCapture?.(EVENT_TYPES.EVENTBUS, event, data, 'eventbus');
      };

      if (_eventBus.on) {
        (_eventBus.on as (...args: unknown[]) => unknown)('*', handler);
        _listeners.push({ 
          // @ts-expect-error TS migration - TS2353
          type: 'eventbus', 
          handler, 
          // @ts-expect-error TS migration - TS2349
          remove: () => _eventBus.off?.('*', handler) 
        });
      }
    },

    // Configura listeners DOM
    setupDOM() {
      if (typeof document === 'undefined' || !captureDOMEvents) return;

      const domEvents = ['click', 'input', 'change', 'submit', 'keydown', 'scroll', 'resize'];
      
      for (const eventName of domEvents) {
        const handler = (e: Event) => {
          const target = e.target;
          onCapture?.(EVENT_TYPES.DOM, eventName, {
            // @ts-expect-error TS migration - TS2339
            tagName: target.tagName,
            // @ts-expect-error TS migration - TS2339
            id: target.id,
            // @ts-expect-error TS migration - TS2339
            className: target.className,
            // @ts-expect-error TS migration - TS2339
            value: target.value?.substring?.(0, 100)
          }, 'dom');
        };

        document.addEventListener(eventName, handler, { passive: true, capture: true });
        _listeners.push({ 
          // @ts-expect-error TS migration - TS2353
          type: 'dom', 
          event: eventName, 
          handler, 
          remove: () => document.removeEventListener(eventName, handler, true) 
        });
      }
    },

    // Configura interceptor de network
    setupNetwork() {
      if (typeof window === 'undefined' || !captureNetworkEvents) return;

      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = Date.now();

        // @ts-expect-error TS migration - TS2339
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

        try {
          const response = await originalFetch(...args);
          onCapture?.(EVENT_TYPES.NETWORK, 'fetch', {
            url,
            method: args[1]?.method || 'GET',
            status: response.status,
            duration: Date.now() - startTime
          }, 'network');
          return response;
        } catch (error) {
          onCapture?.(EVENT_TYPES.NETWORK, 'fetch-error', {
            url,
            error: (error as Error).message,
            duration: Date.now() - startTime
          }, 'network');
          throw error;
        }
      };

      _listeners.push({ 
        // @ts-expect-error TS migration - TS2353
        type: 'network', 
        remove: () => { window.fetch = originalFetch; } 
      });
    },

    // Configura todos os listeners
    setupAll() {
      this.setupEventBus();
      this.setupDOM();
      this.setupNetwork();
    },

    // Remove todos os listeners
    removeAll() {
      for (const listener of _listeners) {
        // @ts-expect-error TS migration - TS2339
        listener.remove?.();
      }
      _listeners.length = 0;
    },

    // Obtém contagem de listeners
    getListenerCount() {
      return _listeners.length;
    }
  };
}

export default { createListenerSetup };
