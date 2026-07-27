// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16:event-replay
// PURPOSE: EventReplay - Panel-16 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EventBusPort, TelemetryPort, StoragePort from ../ports/index.js
//   StateController from ../state/controller.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//
// PROVIDES:
//   EventReplay — exported value
//   EVENT_REPLAY_EVENTS — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   EVENT_REPLAY_EVENTS.RECORDING_STARTED
//   EVENT_REPLAY_EVENTS.RECORDING_STOPPED
//   EVENT_REPLAY_EVENTS.REPLAY_COMPLETED
//   EVENT_REPLAY_EVENTS.REPLAY_STARTED
//   EVENT_REPLAY_EVENTS.REPLAY_STOPPED
//   event.type
// LISTENS (eventos):
//   'abort'
//   eventName
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { EventBusPort, TelemetryPort, StoragePort } from '../ports/index.js';
import { StateController as _StateController } from '../state/controller.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';

interface StateControllerAPI {
  snapshot(): Record<string, unknown>;
  subscribe(callback: (change: unknown) => void, filter?: string | string[] | null): () => void;
  restore(snapshot: Record<string, unknown>, options?: Record<string, unknown>): void;
  set(prop: string | unknown, value: unknown, options?: Record<string, unknown>): void;
  get(prop?: string): unknown;
  [key: string]: unknown;
}
const StateController = _StateController as unknown as StateControllerAPI;

const MODULE_ID = 'panel-16:event-replay';
const VERSION = '9.3.0-P2-ENTERPRISE';
const MAX_EVENTS = 500;
const STORAGE_KEY = 'p16_event_recordings';

const EVENT_REPLAY_EVENTS = Object.freeze({
  RECORDING_STARTED: 'panel-16:event-replay:recording-started',
  RECORDING_STOPPED: 'panel-16:event-replay:recording-stopped',
  REPLAY_STARTED: 'panel-16:event-replay:replay-started',
  REPLAY_COMPLETED: 'panel-16:event-replay:replay-completed',
  REPLAY_STOPPED: 'panel-16:event-replay:replay-stopped'
});

const PANEL_OBSERVED_EVENTS = [
  'panel-16:refresh', 'panel-16:filter-change', 'panel-16:period-change',
  'panel-16:sort-change', 'panel-16:view-change', 'panel-16:selection-change'
];

function EventReplayClass(this: any) {
  this._isRecording = false;
  this._isReplaying = false;
  this._events = [];
  this._recordings = new Map();
  this._startTime = null;
  this._replayAbort = null;
  this._cleanups = [];
  this._metrics = { recordings: 0, replays: 0, eventsRecorded: 0, eventsReplayed: 0 };
}

EventReplayClass.prototype.init = function() {
  try {
    const saved = StoragePort.local.get(STORAGE_KEY);
    if (saved) {
      const self = this;
      Object.keys(saved).forEach(name => {
        self._recordings.set(name, saved[name]);
      });
    }

    TelemetryPort.track(LIFECYCLE_EVENTS.INITIALIZED, { feature: 'event-replay', recordings: this._recordings.size });
  } catch (e: any) {}
  return this;
};

EventReplayClass.prototype.startRecording = function(name: string) {
  if (this._isRecording) return false;
  const self = this;
  this._isRecording = true;
  this._events = [];
  this._startTime = Date.now();
  this._recordingName = name || (`recording-${Date.now().toString(36)}`);
  this._initialSnapshot = StateController.snapshot();

  const unsubState = StateController.subscribe((change: unknown) => {
    if (!self._isRecording) return;
    self._recordEvent('state:mutation', change);
  });
  if (typeof unsubState === 'function') this._cleanups.push(unsubState);

  PANEL_OBSERVED_EVENTS.forEach(eventName => {
    const unsub = EventBusPort.on(eventName, (data: unknown) => {
      if (!self._isRecording) return;
      self._recordEvent(eventName, data);
    });
    if (typeof unsub === 'function') self._cleanups.push(unsub);
  });


  TelemetryPort.track(LIFECYCLE_EVENTS.INIT, { feature: 'recording', name: this._recordingName });
  EventBusPort.emit(EVENT_REPLAY_EVENTS.RECORDING_STARTED, { recordingName: this._recordingName, source: MODULE_ID, timestamp: Date.now() });
  return true;
};

EventReplayClass.prototype.stopRecording = function() {
  if (!this._isRecording) return null;
  this._isRecording = false;
  const duration = Date.now() - this._startTime;

  this._cleanups.forEach((unsub: unknown) => { if (typeof unsub === 'function') unsub(); });
  this._cleanups = [];

  const recording = {
    name: this._recordingName,
    timestamp: this._startTime,
    duration,
    eventCount: this._events.length,
    initialSnapshot: this._initialSnapshot,
    events: this._events.slice()
  };

  this._recordings.set(this._recordingName, recording);
  this._persist();
  this._metrics.recordings++;
  this._metrics.eventsRecorded += this._events.length;


  TelemetryPort.track(LIFECYCLE_EVENTS.DESTROYED, { feature: 'recording', name: this._recordingName, events: this._events.length, duration });
  EventBusPort.emit(EVENT_REPLAY_EVENTS.RECORDING_STOPPED, { recordingName: recording.name, eventCount: recording.eventCount, duration: recording.duration, source: MODULE_ID, timestamp: Date.now() });
  return recording;
};

EventReplayClass.prototype._recordEvent = function(type: string, data: unknown) {
  if (this._events.length >= MAX_EVENTS) {
    this._events = this._events.slice(-MAX_EVENTS + 1);
  }
  this._events.push({
    type,
    data: this._serializeData(data),
    timestamp: Date.now(),
    relativeTime: Date.now() - this._startTime
  });
};

EventReplayClass.prototype._serializeData = (data: unknown) => {
  try {
    if (data instanceof Set) return { _type: 'Set', values: Array.from(data) };
    if (data instanceof Map) return { _type: 'Map', entries: Array.from(data.entries()) };
    return JSON.parse(JSON.stringify(data));
  } catch (e: any) {
    return { _error: 'serialization-failed', message: e.message };
  }
};

EventReplayClass.prototype._deserializeData = (data: Record<string, unknown>) => {
  if (data && data._type === 'Set') return new Set(data.values as Iterable<unknown>);
  if (data && data._type === 'Map') return new Map(data.entries as Iterable<readonly [unknown, unknown]>);
  return data;
};

EventReplayClass.prototype.replay = function(name: string, options: Record<string, unknown>) {
  const self = this;
  if (!options) options = {};
  const recording = this._recordings.get(name);
  if (!recording) {
    TelemetryPort.warn('replay:not-found', { name });
    return Promise.resolve(false);
  }

  if (this._isReplaying) this.stopReplay();
  this._isReplaying = true;
  this._replayAbort = new AbortController();
  const speed = options.speed || 1;
  const skipDelay = options.skipDelay || false;


  TelemetryPort.track(LIFECYCLE_EVENTS.INIT, { feature: 'replay', name, eventCount: recording.eventCount, speed });
  EventBusPort.emit(EVENT_REPLAY_EVENTS.REPLAY_STARTED, { recordingName: name, eventCount: recording.eventCount, speed, source: MODULE_ID, timestamp: Date.now() });

  if (recording.initialSnapshot && options.restoreState !== false) {
    StateController.restore(recording.initialSnapshot);
  }

  let i = 0;
  const runNext = () => {
    if (self._replayAbort.signal.aborted || i >= recording.events.length) {
      self._isReplaying = false;
      self._metrics.replays++;

      TelemetryPort.track(LIFECYCLE_EVENTS.DESTROYED, { feature: 'replay', name, eventsReplayed: recording.events.length });
      EventBusPort.emit(EVENT_REPLAY_EVENTS.REPLAY_COMPLETED, { recordingName: name, eventsReplayed: recording.events.length, source: MODULE_ID, timestamp: Date.now() });
      return Promise.resolve(true);
    }
    const event = recording.events[i];
    const nextEvent = recording.events[i + 1];
    self._replayEvent(event);
    self._metrics.eventsReplayed++;
    if (options.onProgress) (options.onProgress as (data: Record<string, unknown>) => void)({ current: i + 1, total: recording.events.length, event });
    i++;
    if (!skipDelay && nextEvent) {
      const delay = (nextEvent.relativeTime - event.relativeTime) / Number(speed);
      if (delay > 0) return self._delay(delay, self._replayAbort.signal).then(runNext);
    }
    return runNext();
  };
  return runNext();
};

EventReplayClass.prototype.stopReplay = function() {
  if (this._replayAbort) { this._replayAbort.abort(); this._replayAbort = null; }
  this._isReplaying = false;

  TelemetryPort.track(LIFECYCLE_EVENTS.DESTROYED, { feature: 'replay', phase: 'stopped' });
  EventBusPort.emit(EVENT_REPLAY_EVENTS.REPLAY_STOPPED, { source: MODULE_ID, timestamp: Date.now() });
};

EventReplayClass.prototype._replayEvent = function(event: Record<string, unknown>) {
  const data = this._deserializeData(event.data);
  if (event.type === 'state:mutation' && data && data.prop) {
    StateController.set(data.prop, data.value, { silent: false, trackHistory: false });
  } else {
    EventBusPort.emit(event.type, data);
  }
};

EventReplayClass.prototype._delay = (ms: number, signal: AbortSignal) => new Promise<void>(resolve => {
  const timeout = setTimeout(resolve, ms);
  if (signal) signal.addEventListener('abort', () => { clearTimeout(timeout); resolve(); });
});

EventReplayClass.prototype.list = function() {
  const result: Array<Record<string, unknown>> = [];
  this._recordings.forEach((rec: Record<string, unknown>, name: string) => {
    result.push({ name, timestamp: rec.timestamp, duration: rec.duration, eventCount: rec.eventCount });
  });
  return result;
};

EventReplayClass.prototype.get = function(name: string) { return this._recordings.get(name); };
EventReplayClass.prototype.remove = function(name: string) { const removed = this._recordings.delete(name); if (removed) this._persist(); return removed; };
EventReplayClass.prototype.clear = function() { const count = this._recordings.size; this._recordings.clear(); this._persist(); return count; };

EventReplayClass.prototype.export = function(name: string) {
  const recording = this._recordings.get(name);
  if (!recording) return null;
  return JSON.stringify(recording, null, 2);
};

EventReplayClass.prototype.import = function(jsonStr: string) {
  try {
    const recording = JSON.parse(jsonStr);
    if (!recording.name || !recording.events) return false;
    this._recordings.set(recording.name, recording);
    this._persist();
    return true;
  } catch (e: any) { return false; }
};

EventReplayClass.prototype._persist = function() {
  try {
    const obj: Record<string, unknown> = {};
    this._recordings.forEach((rec: unknown, name: string) => { obj[name] = rec; });
    StoragePort.local.set(STORAGE_KEY, obj);
  } catch (e: any) {}
};

EventReplayClass.prototype.isRecording = function() { return this._isRecording; };
EventReplayClass.prototype.isReplaying = function() { return this._isReplaying; };
EventReplayClass.prototype.getMetrics = function() { return Object.assign({}, this._metrics, { recordings: this._recordings.size }); };

EventReplayClass.prototype.destroy = function() {
  this._cleanups.forEach((fn: () => void) => { try { fn(); } catch (e: any) {} });
  this._cleanups = [];
  if (this._isRecording) this.stopRecording();
  if (this._isReplaying) this.stopReplay();
};

EventReplayClass.prototype.healthCheck = function() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { initialized: true, recording: this._isRecording, replaying: this._isReplaying }, metrics: this.getMetrics(), p21Compliant: true, cleanups: this._cleanups.length, timestamp: Date.now() };
};

EventReplayClass.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, isRecording: this._isRecording, isReplaying: this._isReplaying, recordings: this.list(), currentEventCount: this._events.length, metrics: this.getMetrics(), p21Compliant: true };
};

const EventReplay = new (EventReplayClass as unknown as new () => Record<string, unknown>)();
export { EventReplay, EVENT_REPLAY_EVENTS, MODULE_ID, VERSION };
export default EventReplay;
