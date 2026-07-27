// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: event-recorder
// PURPOSE: Event Recorder - Gravação e replay de eventos para debug
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//   VERSION, MODULE_ID, RECORDER_STATES, EVENT_TYPES, createEventStore, createLis...
//
// PROVIDES:
//   createEventRecorder() — exported function
//   getEventRecorder() — exported function
//   resetEventRecorder() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   RECORDER_STATES — exported value
//   EVENT_TYPES — exported value
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

import { createLogger } from './logger.js';
import {
  VERSION, MODULE_ID, RECORDER_STATES, EVENT_TYPES,
  createEventStore,
  createListenerSetup,
  createReplayEngine,
  createExportManager,
  createPersistence,
  createStatsReporter
} from './event-recorder/index.js';

export { VERSION, MODULE_ID, RECORDER_STATES, EVENT_TYPES };

// Cria o Event Recorder
export function createEventRecorder(this: any, options: Record<string, any> = {}) {
  const {
    maxEvents = 1000,
    captureEventBus = true,
    captureDOMEvents = false,
    captureNetworkEvents = false,
    eventFilter = null,
    onEventCaptured = null,
    persistToStorage = false,
    storageKey = 'cm-event-recorder'
  } = options;

  const _logger = createLogger(MODULE_ID);
  let _state: string = RECORDER_STATES.IDLE;

  // Criar componentes modulares
  const eventStore = createEventStore({ maxEvents });

  const persistence = createPersistence({
    eventStore,
    storageKey,
    enabled: persistToStorage,
    logger: _logger
  });

  // Handler de captura
  const onCapture = (type: string, name: string, data: Record<string, unknown>, source: string) => {
    if (_state !== RECORDER_STATES.RECORDING) return;
    if (eventFilter && !eventFilter({ type, name, data })) return;
    
    const event = eventStore.capture(type, name, data, source);
    onEventCaptured?.(event);
    
    if (persistToStorage) persistence.save();
  };

  const listenerSetup = createListenerSetup({
    captureEventBus,
    captureDOMEvents,
    captureNetworkEvents,
    onCapture
  });

  const replayEngine = createReplayEngine({
    eventStore,
    listenerSetup,
    logger: _logger
  });

  const exportManager = createExportManager({
    eventStore,
    logger: _logger
  });

  const statsReporter = createStatsReporter({
    eventStore,
    getState: () => _state
  });

  // Carrega do storage se habilitado
  persistence.load();

  const recorder = {
    // === INJECTION ===
    inject({ eventBus }: Record<string, unknown>) {
      listenerSetup.setEventBus(eventBus);
      if (_state === RECORDER_STATES.RECORDING && captureEventBus) {
        listenerSetup.setupEventBus();
      }
    },

    // === RECORDING CONTROL ===
    start() {
      if (_state === RECORDER_STATES.RECORDING) return this;

      _state = RECORDER_STATES.RECORDING;
      eventStore.initSession();
      listenerSetup.setupAll();

      _logger.debug(`Recording started: ${eventStore.getSessionId()}`);
      return this;
    },

    stop() {
      if (_state === RECORDER_STATES.IDLE) return this;

      listenerSetup.removeAll();
      _state = RECORDER_STATES.IDLE;
      
      _logger.debug(`Recording stopped: ${eventStore.getEventCount()} events captured`);
      return this;
    },

    pause() {
      if (_state === RECORDER_STATES.RECORDING) {
        _state = RECORDER_STATES.PAUSED;
        _logger.debug('Recording paused');
      }
      return this;
    },

    resume() {
      if (_state === RECORDER_STATES.PAUSED) {
        _state = RECORDER_STATES.RECORDING;
        _logger.debug('Recording resumed');
      }
      return this;
    },

    // === CAPTURE METHODS ===
    capture(name: string, data: Record<string, any> = {}) {
      onCapture(EVENT_TYPES.CUSTOM, name, data, 'manual');
      return this;
    },

    captureState(stateName: unknown, value: unknown) {
      onCapture(EVENT_TYPES.STATE, (stateName as string), (value as Record<string, unknown>), 'state');
      return this;
    },

    captureUserAction(action: string, details: Record<string, any> = {}) {
      onCapture(EVENT_TYPES.USER, action, details, 'user');
      return this;
    },

    // === QUERIES ===
    getEvents: (filter: (...args: unknown[]) => void) => eventStore.getEvents(filter),
    getTimeline: () => eventStore.getTimeline(),

    // === EXPORT/IMPORT ===
    export: () => exportManager.export(),
    exportJSON: () => exportManager.exportJSON(),
    import: (data: Record<string, unknown>) => exportManager.import(data),

    // === REPLAY ===
    onReplay: (name: string, cb: (...args: unknown[]) => void) => replayEngine.onReplay(name, cb),
    replay: async (opts: Record<string, unknown>) => {
      _state = RECORDER_STATES.REPLAYING;
      await replayEngine.replay(opts);
      _state = RECORDER_STATES.IDLE;
    },
    stopReplay: () => {
      replayEngine.stop();
      _state = RECORDER_STATES.IDLE;
      return this;
    },

    // === STATE ===
    getState: () => _state,
    getSessionId: () => eventStore.getSessionId(),
    getEventCount: () => eventStore.getEventCount(),
    getDuration: () => eventStore.getDuration(),

    // === CLEAR ===
    clear() {
      eventStore.clear();
      persistence.clear();
      return this;
    },

    // === STATS & INFO ===
    getStats: () => statsReporter.getStats(),
    healthCheck: () => statsReporter.healthCheck(),
    info: () => statsReporter.info({
      captureEventBus,
      captureDOMEvents,
      captureNetworkEvents,
      persistToStorage
    }),

    // === DESTROY ===
    destroy() {
      this.stop();
      this.clear();
      replayEngine.clearCallbacks();
    }
  };

  return recorder;
}

// Singleton
let _instance: Record<string, unknown> | null = null;

export function getEventRecorder(options: Record<string, any> = {}) {
  if (!_instance) {
    _instance = createEventRecorder(options);
  }
  return _instance;
}

export function resetEventRecorder() {
  if (_instance) {
    (_instance.destroy as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(RECORDER_STATES),
    eventTypes: Object.keys(EVENT_TYPES),
    modular: true
  };
}

export function healthCheck() {
  if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, modular: true };
}

export default {
  VERSION, MODULE_ID, RECORDER_STATES, EVENT_TYPES,
  createEventRecorder, getEventRecorder, resetEventRecorder,
  info, healthCheck
};
