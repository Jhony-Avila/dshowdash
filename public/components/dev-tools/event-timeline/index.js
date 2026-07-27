import { MODULE_ID, TIMELINE_STATES, EVENT_TYPES as _EVENT_TYPES, DEFAULT_OPTIONS } from "./constants.js";
const EVENT_TYPES = _EVENT_TYPES;
import { createRecordingManager } from "./recording.js";
import { createReplayManager } from "./replay.js";
import { createSnapshotsManager } from "./snapshots.js";
import { createDataManager } from "./data-manager.js";
const VERSION = "2.0.0-ENTERPRISE-MODULAR";
class EventTimeline {
  _eventBus;
  _logger;
  _maxEvents;
  _autoRecord;
  _events;
  _state;
  _metrics;
  _snapshotsManager;
  _recordingManager;
  _replayManager;
  _dataManager;
  constructor(options = {}) {
    this._eventBus = options.eventBus || null;
    this._logger = options.logger || null;
    this._maxEvents = options.maxEvents || DEFAULT_OPTIONS.maxEvents;
    this._autoRecord = options.autoRecord !== false;
    this._events = [];
    this._state = TIMELINE_STATES.IDLE;
    this._metrics = {
      eventsRecorded: 0,
      eventsReplayed: 0,
      snapshotsTaken: 0,
      sessionsRecorded: 0,
      errors: 0
    };
    const context = this._createContext();
    this._snapshotsManager = createSnapshotsManager(context);
    this._recordingManager = createRecordingManager(context);
    this._replayManager = createReplayManager(context);
    this._dataManager = createDataManager({ ...context, snapshotsManager: this._snapshotsManager });
  }
  _createContext() {
    return {
      getState: () => this._state,
      setState: (s) => {
        this._state = s;
      },
      getEvents: () => this._events,
      setEvents: (e) => {
        this._events = e;
      },
      clearEvents: () => {
        this._events = [];
      },
      pushEvent: (e) => this._pushEvent(e),
      addSystemEvent: (name, data) => this._addSystemEvent(name, data),
      getFilters: () => this._dataManager?.getFilters() || /* @__PURE__ */ new Set(),
      getEventBus: () => this._eventBus,
      getRecordingStartedAt: () => this._recordingManager?.getRecordingStartedAt(),
      log: (level, msg, data) => this._log(level, msg, data),
      incrementMetric: (key) => {
        if (this._metrics[key] !== void 0) this._metrics[key]++;
      }
    };
  }
  init() {
    if (this._autoRecord && this._eventBus) {
      this._recordingManager.subscribeToEvents(this._eventBus);
    }
    this._log("info", "EventTimeline initialized", { autoRecord: this._autoRecord });
    return this;
  }
  setEventBus(eventBus) {
    this._eventBus = eventBus;
    if (this._autoRecord && this._state === TIMELINE_STATES.IDLE) {
      this._recordingManager.subscribeToEvents(eventBus);
    }
  }
  setLogger(logger) {
    this._logger = logger;
  }
  // Recording API
  startRecording(options = {}) {
    return this._recordingManager.start();
  }
  pauseRecording() {
    return this._recordingManager.pause();
  }
  resumeRecording() {
    return this._recordingManager.resume();
  }
  stopRecording() {
    return this._recordingManager.stop();
  }
  addEvent(eventName, data = {}, type = EVENT_TYPES.CUSTOM) {
    return this._recordingManager.createEvent(eventName, data, type);
  }
  // Snapshots API
  takeSnapshot(label = "") {
    return this._snapshotsManager.take(label);
  }
  restoreSnapshot(snapshotId) {
    return this._snapshotsManager.restore(snapshotId);
  }
  // Replay API
  startReplay(options = {}) {
    return this._replayManager.start(options);
  }
  stopReplay() {
    return this._replayManager.stop();
  }
  stepForward() {
    return this._replayManager.stepForward();
  }
  stepBackward() {
    return this._replayManager.stepBackward();
  }
  goToEvent(index) {
    return this._replayManager.goToEvent(index);
  }
  // Data API
  searchEvents(query, options = {}) {
    return this._dataManager.search(query, options);
  }
  setFilter(types = []) {
    this._dataManager.setFilter(types);
    return this;
  }
  clearFilter() {
    this._dataManager.clearFilter();
    return this;
  }
  exportEvents(options = {}) {
    return this._dataManager.exportData(options);
  }
  importEvents(data, options = {}) {
    return this._dataManager.importData(data, options);
  }
  clear() {
    this._events = [];
    this._snapshotsManager.clear();
    this._replayManager.reset();
    this._log("info", "Timeline cleared");
  }
  // Private methods
  _pushEvent(event) {
    this._events.push(event);
    this._metrics.eventsRecorded++;
    if (this._events.length > this._maxEvents) {
      this._events.shift();
    }
  }
  _addSystemEvent(eventName, data = {}) {
    if (this._state === TIMELINE_STATES.RECORDING || this._state === TIMELINE_STATES.PAUSED) {
      const event = this._recordingManager.createEvent(eventName, data, EVENT_TYPES.SYSTEM);
      this._pushEvent(event);
    }
  }
  _log(level, message, data = {}) {
    if (this._logger) {
      const logFn = this._logger[level];
      logFn?.(`[${MODULE_ID}] ${message}`, data);
    }
  }
  // Public getters
  getState() {
    return this._state;
  }
  getEvents() {
    return [...this._events];
  }
  getEventCount() {
    return this._events.length;
  }
  getSnapshots() {
    return this._snapshotsManager.getAll();
  }
  getReplayIndex() {
    return this._replayManager.getIndex();
  }
  getMetrics() {
    return { ...this._metrics };
  }
  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      state: this._state,
      eventCount: this._events.length,
      snapshotCount: this._snapshotsManager.count(),
      replayIndex: this._replayManager.getIndex(),
      replaySpeed: this._replayManager.getSpeed(),
      maxEvents: this._maxEvents,
      hasEventBus: !!this._eventBus,
      hasLogger: !!this._logger,
      filters: Array.from(this._dataManager.getFilters()),
      metrics: this._metrics,
      timestamp: Date.now()
    };
  }
  healthCheck() {
    const checks = {
      hasEventBus: !!this._eventBus,
      stateValid: Object.values(TIMELINE_STATES).includes(this._state),
      eventsValid: Array.isArray(this._events),
      modulesLoaded: !!(this._recordingManager && this._replayManager && this._snapshotsManager && this._dataManager),
      noErrors: this._metrics.errors === 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  }
  destroy() {
    this.stopRecording();
    this.stopReplay();
    this._recordingManager.unsubscribe();
    this._events = [];
    this._snapshotsManager.clear();
    this._eventBus = null;
    this._logger = null;
  }
}
function createEventTimeline(options = {}) {
  return new EventTimeline(options);
}
var event_timeline_default = EventTimeline;
export {
  EVENT_TYPES,
  EventTimeline,
  MODULE_ID,
  TIMELINE_STATES,
  VERSION,
  createEventTimeline,
  event_timeline_default as default
};
