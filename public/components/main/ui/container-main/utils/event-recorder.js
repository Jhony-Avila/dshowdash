import { createLogger } from "./logger.js";
import {
  VERSION,
  MODULE_ID,
  RECORDER_STATES,
  EVENT_TYPES,
  createEventStore,
  createListenerSetup,
  createReplayEngine,
  createExportManager,
  createPersistence,
  createStatsReporter
} from "./event-recorder/index.js";
function createEventRecorder(options = {}) {
  const {
    maxEvents = 1e3,
    captureEventBus = true,
    captureDOMEvents = false,
    captureNetworkEvents = false,
    eventFilter = null,
    onEventCaptured = null,
    persistToStorage = false,
    storageKey = "cm-event-recorder"
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _state = RECORDER_STATES.IDLE;
  const eventStore = createEventStore({ maxEvents });
  const persistence = createPersistence({
    eventStore,
    storageKey,
    enabled: persistToStorage,
    logger: _logger
  });
  const onCapture = (type, name, data, source) => {
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
  persistence.load();
  const recorder = {
    // === INJECTION ===
    inject({ eventBus }) {
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
        _logger.debug("Recording paused");
      }
      return this;
    },
    resume() {
      if (_state === RECORDER_STATES.PAUSED) {
        _state = RECORDER_STATES.RECORDING;
        _logger.debug("Recording resumed");
      }
      return this;
    },
    // === CAPTURE METHODS ===
    capture(name, data = {}) {
      onCapture(EVENT_TYPES.CUSTOM, name, data, "manual");
      return this;
    },
    captureState(stateName, value) {
      onCapture(EVENT_TYPES.STATE, stateName, value, "state");
      return this;
    },
    captureUserAction(action, details = {}) {
      onCapture(EVENT_TYPES.USER, action, details, "user");
      return this;
    },
    // === QUERIES ===
    getEvents: (filter) => eventStore.getEvents(filter),
    getTimeline: () => eventStore.getTimeline(),
    // === EXPORT/IMPORT ===
    export: () => exportManager.export(),
    exportJSON: () => exportManager.exportJSON(),
    import: (data) => exportManager.import(data),
    // === REPLAY ===
    onReplay: (name, cb) => replayEngine.onReplay(name, cb),
    replay: async (opts) => {
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
let _instance = null;
function getEventRecorder(options = {}) {
  if (!_instance) {
    _instance = createEventRecorder(options);
  }
  return _instance;
}
function resetEventRecorder() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(RECORDER_STATES),
    eventTypes: Object.keys(EVENT_TYPES),
    modular: true
  };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, modular: true };
}
var event_recorder_default = {
  VERSION,
  MODULE_ID,
  RECORDER_STATES,
  EVENT_TYPES,
  createEventRecorder,
  getEventRecorder,
  resetEventRecorder,
  info,
  healthCheck
};
export {
  EVENT_TYPES,
  MODULE_ID,
  RECORDER_STATES,
  VERSION,
  createEventRecorder,
  event_recorder_default as default,
  getEventRecorder,
  healthCheck,
  info,
  resetEventRecorder
};
