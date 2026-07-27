import { EVENT_TYPES } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.event-recorder.replay-engine";
function createReplayEngine(options = {}) {
  const { eventStore, listenerSetup, logger } = options;
  const _replayCallbacks = /* @__PURE__ */ new Map();
  let _isReplaying = false;
  return {
    // Registra callback para replay
    onReplay(eventName, callback) {
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
    async replay(replayOptions = {}) {
      const { speed = 1, filter = null, onEvent = null } = replayOptions;
      if (_isReplaying) {
        logger?.warn("Already replaying");
        return;
      }
      const events = eventStore.getEvents(filter);
      if (events.length === 0) {
        logger?.warn("No events to replay");
        return;
      }
      _isReplaying = true;
      logger?.info(`Replaying ${events.length} events at ${speed}x speed`);
      const eventBus = listenerSetup.getEventBus();
      for (let i = 0; i < events.length; i++) {
        if (!_isReplaying) break;
        const event = events[i];
        const nextEvent = events[i + 1];
        const callbacks = _replayCallbacks.get(event.name) || [];
        for (const cb of callbacks) {
          try {
            await cb(event);
          } catch (e) {
            logger?.warn("Replay callback error:", e);
          }
        }
        if (event.type === EVENT_TYPES.EVENTBUS && eventBus?.emit) {
          eventBus.emit(`replay:${event.name}`, event.data);
        }
        onEvent?.(event, i, events.length);
        if (nextEvent) {
          const delay = (nextEvent.relativeTime - event.relativeTime) / speed;
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 5e3)));
          }
        }
      }
      _isReplaying = false;
      logger?.info("Replay completed");
    },
    // Para replay
    stop() {
      if (_isReplaying) {
        _isReplaying = false;
        logger?.info("Replay stopped");
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
var replay_engine_default = { createReplayEngine };
export {
  MODULE_ID,
  VERSION,
  createReplayEngine,
  replay_engine_default as default
};
