// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: replay-engine
// PURPOSE: Event Recorder Replay Engine
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EVENT_TYPES from ./constants.js
//
// PROVIDES:
//   createReplayEngine() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   `replay:${event.name}`
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { EVENT_TYPES } from './constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.event-recorder.replay-engine';

export function createReplayEngine(options: Record<string, any> = {}) {
  const { eventStore, listenerSetup, logger } = options;

  const _replayCallbacks = new Map();
  let _isReplaying = false;

  return {
    // Registra callback para replay
    onReplay(eventName: string, callback: (...args: unknown[]) => void) {
      if (!_replayCallbacks.has(eventName)) {
        _replayCallbacks.set(eventName, []);
      }
      _replayCallbacks.get(eventName).push(callback);
      
      return () => {
        const callbacks = _replayCallbacks.get(eventName);
        const index = callbacks?.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      };
    },

    // Replay eventos
    async replay(replayOptions: Record<string, any> = {}) {
      const { speed = 1, filter = null, onEvent = null } = replayOptions;

      if (_isReplaying) {
        logger?.warn('Already replaying');
        return;
      }

      const events = eventStore.getEvents(filter);
      if (events.length === 0) {
        logger?.warn('No events to replay');
        return;
      }

      _isReplaying = true;
      logger?.info(`Replaying ${events.length} events at ${speed}x speed`);

      const eventBus = listenerSetup.getEventBus();

      for (let i = 0; i < events.length; i++) {
        if (!_isReplaying) break;

        const event = events[i];
        const nextEvent = events[i + 1];
        
        // Executa callbacks registrados
        const callbacks = _replayCallbacks.get(event.name) || [];
        for (const cb of callbacks) {
          try {
            await cb(event);
          } catch (e) {
            logger?.warn('Replay callback error:', e);
          }
        }

        // Emite no EventBus se disponível
        if (event.type === EVENT_TYPES.EVENTBUS && eventBus?.emit) {
          eventBus.emit(`replay:${event.name}`, event.data);
        }

        onEvent?.(event, i, events.length);

        // Delay para próximo evento
        if (nextEvent) {
          const delay = (nextEvent.relativeTime - event.relativeTime) / speed;
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)));
          }
        }
      }

      _isReplaying = false;
      logger?.info('Replay completed');
    },

    // Para replay
    stop() {
      if (_isReplaying) {
        _isReplaying = false;
        logger?.info('Replay stopped');
      }
    },

    // Estado
    isReplaying() {
      return _isReplaying;
    },

    // Limpa callbacks
    clearCallbacks() {
      _replayCallbacks.clear();
    }
  };
}

export default { createReplayEngine };
