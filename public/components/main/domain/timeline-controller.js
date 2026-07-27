const VERSION = "9.0.0-P1-HEX";
const MODULE_ID = "timeline-controller";
let _events = [];
let _maxEvents = 1e3;
let _metrics = { added: 0, cleared: 0, errors: 0 };
function addEvent(event) {
  try {
    _events.push({ ...event, timestamp: event.timestamp || Date.now() });
    if (_events.length > _maxEvents) _events.shift();
    _metrics.added++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function getEvents(filter = {}) {
  let result = [..._events];
  if (filter.type) result = result.filter((e) => e.type === filter.type);
  if (filter.since) result = result.filter((e) => e.timestamp >= filter.since);
  if (filter.limit) result = result.slice(-filter.limit);
  return result;
}
function clearEvents() {
  _metrics.cleared += _events.length;
  _events = [];
}
function getMetrics() {
  return { ..._metrics, eventCount: _events.length };
}
function healthCheck() {
  const isFull = _events.length >= _maxEvents * 0.9;
  return {
    status: isFull ? "DEGRADED" : "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { eventCount: _events.length, maxEvents: _maxEvents, isFull },
    metrics: getMetrics(),
    p1HexCompliant: true
  };
}
function createTimelineController(options = {}) {
  const _ports = options.ports || {};
  const _eventsPort = _ports.events || null;
  const _timerPort = _ports.timer || null;
  let _recording = false;
  let _localEvents = [];
  let _localMetrics = { recorded: 0, errors: 0 };
  let _unsubs = [];
  return {
    VERSION,
    MODULE_ID,
    startRecording() {
      _recording = true;
      _eventsPort?.emit?.("timeline:recording-started", {});
      return true;
    },
    stopRecording() {
      _recording = false;
      _eventsPort?.emit?.("timeline:recording-stopped", {});
      return true;
    },
    isRecording() {
      return _recording;
    },
    record(type, data = {}) {
      if (!_recording) return false;
      try {
        const event = { type, data, timestamp: Date.now() };
        _localEvents.push(event);
        addEvent(event);
        _localMetrics.recorded++;
        if (_localEvents.length > _maxEvents) _localEvents.shift();
        return true;
      } catch (error) {
        _localMetrics.errors++;
        return false;
      }
    },
    getEvents(filter = {}) {
      return getEvents(filter);
    },
    getLocalEvents(limit = 100) {
      return _localEvents.slice(-limit);
    },
    clear() {
      _localEvents = [];
      clearEvents();
      _eventsPort?.emit?.("timeline:cleared", {});
      return true;
    },
    getMetrics() {
      return {
        ...getMetrics(),
        local: { ..._localMetrics, localCount: _localEvents.length }
      };
    },
    healthCheck() {
      return {
        ...healthCheck(),
        recording: _recording,
        localEventCount: _localEvents.length,
        unsubsCount: _unsubs.length,
        p1HexCompliant: true
      };
    },
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        recording: _recording,
        eventCount: _events.length,
        localEventCount: _localEvents.length,
        unsubsCount: _unsubs.length,
        metrics: this.getMetrics(),
        p1HexCompliant: true
      };
    },
    // P1-HEX: Subscription management
    addSubscription(unsub) {
      if (typeof unsub === "function") {
        _unsubs.push(unsub);
      }
    },
    // P1-HEX: Proper cleanup with unsubs
    destroy() {
      _recording = false;
      _localEvents = [];
      _localMetrics = { recorded: 0, errors: 0 };
      _unsubs.forEach((unsub) => {
        try {
          if (typeof unsub === "function") unsub();
        } catch (e) {
        }
      });
      _unsubs = [];
    }
  };
}
var timeline_controller_default = { addEvent, getEvents, clearEvents, getMetrics, healthCheck, createTimelineController, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addEvent,
  clearEvents,
  createTimelineController,
  timeline_controller_default as default,
  getEvents,
  getMetrics,
  healthCheck
};
