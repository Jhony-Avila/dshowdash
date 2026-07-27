/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — event-timeline/index.js
 * @version 2.0.0-ENTERPRISE-MODULAR
 * @batch Batch Z (Contract #203 of 217)
 *
 * IMPORTS (EXTERNAL):
 *   ./constants.js    → { VERSION as CONST_VERSION, MODULE_ID, TIMELINE_STATES, EVENT_TYPES, DEFAULT_OPTIONS }
 *   ./recording.js    → { createRecordingManager }
 *   ./replay.js       → { createReplayManager }
 *   ./snapshots.js    → { createSnapshotsManager }
 *   ./data-manager.js → { createDataManager }
 *
 * EXPORTS (PUBLIC API):
 *   VERSION, MODULE_ID, TIMELINE_STATES, EVENT_TYPES
 *   class EventTimeline (constructor, init, setEventBus, setLogger)
 *   Recording: startRecording, pauseRecording, resumeRecording, stopRecording, addEvent
 *   Snapshots: takeSnapshot, restoreSnapshot
 *   Replay: startReplay, stopReplay, stepForward, stepBackward, goToEvent
 *   Data: searchEvents, setFilter, clearFilter, exportEvents, importEvents, clear
 *   Getters: getState, getEvents, getEventCount, getSnapshots, getReplayIndex, getMetrics
 *   info(), healthCheck(), destroy()
 *   createEventTimeline() factory
 *   default: EventTimeline
 *
 * BROWSER APIs:
 *   Date.now()
 *
 * PATTERNS:
 *   Hexagonal Architecture — DevTools Component (P2.2)
 *   Modular manager delegation (recording, replay, snapshots, data)
 *   Shared context object pattern for cross-module state
 *   Event recording, replay, snapshots, search, import/export
 * ═══════════════════════════════════════════════════════════════ */
// EventTimeline - Sistema de debug temporal (P2.2)
// @version 2.0.0-ENTERPRISE-MODULAR
// Grava, visualiza e reproduz eventos do sistema
// Arquitetura Hexagonal - DevTools Component
'use strict';

import { VERSION as CONST_VERSION, MODULE_ID, TIMELINE_STATES, EVENT_TYPES as _EVENT_TYPES, DEFAULT_OPTIONS } from './constants.js';
const EVENT_TYPES = _EVENT_TYPES as Readonly<Record<string, string>>;
import { createRecordingManager } from './recording.js';
import { createReplayManager } from './replay.js';
import { createSnapshotsManager } from './snapshots.js';
import { createDataManager } from './data-manager.js';

export const VERSION = '2.0.0-ENTERPRISE-MODULAR';
export { MODULE_ID, TIMELINE_STATES, EVENT_TYPES };

interface TimelineEvent {
  id?: string;
  type?: string;
  name?: string;
  data?: Record<string, unknown>;
  timestamp?: number;
  [key: string]: unknown;
}

interface TimelineMetrics {
  eventsRecorded: number;
  eventsReplayed: number;
  snapshotsTaken: number;
  sessionsRecorded: number;
  errors: number;
  [key: string]: number;
}

interface EventBus {
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
  emit?: (event: string, ...args: unknown[]) => void;
  [key: string]: unknown;
}

interface Logger {
  info?: (message: string, data?: Record<string, unknown>) => void;
  warn?: (message: string, data?: Record<string, unknown>) => void;
  error?: (message: string, data?: Record<string, unknown>) => void;
  debug?: (message: string, data?: Record<string, unknown>) => void;
  [key: string]: unknown;
}

interface TimelineOptions {
  eventBus?: EventBus | null;
  logger?: Logger | null;
  maxEvents?: number;
  autoRecord?: boolean;
}

export class EventTimeline {
  private _eventBus: EventBus | null;
  private _logger: Logger | null;
  private _maxEvents: number;
  private _autoRecord: boolean;
  private _events: TimelineEvent[];
  private _state: string;
  private _metrics: TimelineMetrics;
  private _snapshotsManager: ReturnType<typeof createSnapshotsManager>;
  private _recordingManager: ReturnType<typeof createRecordingManager>;
  private _replayManager: ReturnType<typeof createReplayManager>;
  private _dataManager: ReturnType<typeof createDataManager>;

  constructor(options: TimelineOptions = {}) {
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

    // Contexto compartilhado para os m\u00f3dulos
    const context = this._createContext();

    // Inicializar m\u00f3dulos
    // @ts-expect-error strict migration — TS2345
    this._snapshotsManager = createSnapshotsManager(context);
    // @ts-expect-error strict migration — TS2345
    this._recordingManager = createRecordingManager(context);
    this._replayManager = createReplayManager(context);
    this._dataManager = createDataManager({ ...context, snapshotsManager: this._snapshotsManager });
  }

  _createContext(): { getState: () => string; setState: (s: string) => void; getEvents: () => TimelineEvent[]; setEvents: (e: TimelineEvent[]) => void; clearEvents: () => void; pushEvent: (e: TimelineEvent) => void; addSystemEvent: (name: string, data: Record<string, unknown>) => void; getFilters: () => Set<string>; getEventBus: () => EventBus | null; getRecordingStartedAt: () => number | null; log: (level: string, msg: string, data?: Record<string, unknown>) => void; incrementMetric: (key: string) => void } {
    return {
      getState: () => this._state,
      setState: (s: string) => { this._state = s; },
      getEvents: () => this._events,
      setEvents: (e: TimelineEvent[]) => { this._events = e; },
      clearEvents: () => { this._events = []; },
      pushEvent: (e: TimelineEvent) => this._pushEvent(e),
      addSystemEvent: (name: string, data: Record<string, unknown>) => this._addSystemEvent(name, data),
      getFilters: () => this._dataManager?.getFilters() || new Set<string>(),
      getEventBus: () => this._eventBus,
      getRecordingStartedAt: () => this._recordingManager?.getRecordingStartedAt(),
      log: (level: string, msg: string, data?: Record<string, unknown>) => this._log(level, msg, data),
      incrementMetric: (key: string) => { if (this._metrics[key] !== undefined) this._metrics[key]++; }
    };
  }

  init(): this {
    if (this._autoRecord && this._eventBus) {
      this._recordingManager.subscribeToEvents(this._eventBus);
    }
    this._log('info', 'EventTimeline initialized', { autoRecord: this._autoRecord });
    return this;
  }

  setEventBus(eventBus: EventBus): void {
    this._eventBus = eventBus;
    if (this._autoRecord && this._state === TIMELINE_STATES.IDLE) {
      this._recordingManager.subscribeToEvents(eventBus);
    }
  }

  setLogger(logger: Logger): void { this._logger = logger; }

  // Recording API
  startRecording(options: Record<string, unknown> = {}): boolean { return this._recordingManager.start(); }
  pauseRecording(): { duration: number } { return this._recordingManager.pause(); }
  resumeRecording(): boolean { return this._recordingManager.resume(); }
  stopRecording(): { duration: number } { return this._recordingManager.stop(); }
  addEvent(eventName: string, data: Record<string, unknown> = {}, type: string = EVENT_TYPES.CUSTOM): ReturnType<typeof this._recordingManager.createEvent> { return this._recordingManager.createEvent(eventName, data, type); }

  // Snapshots API
  takeSnapshot(label: string = ''): ReturnType<typeof this._snapshotsManager.take> { return this._snapshotsManager.take(label); }
  restoreSnapshot(snapshotId: string): ReturnType<typeof this._snapshotsManager.restore> { return this._snapshotsManager.restore(snapshotId); }

  // Replay API
  startReplay(options: Record<string, unknown> = {}): void { return this._replayManager.start(options); }
  stopReplay(): void { return this._replayManager.stop(); }
  stepForward(): void { return this._replayManager.stepForward(); }
  stepBackward(): void { return this._replayManager.stepBackward(); }
  goToEvent(index: number): void { return this._replayManager.goToEvent(index); }

  // Data API
  searchEvents(query: string, options: Record<string, unknown> = {}): TimelineEvent[] { return this._dataManager.search(query, options); }
  setFilter(types: string[] = []): this { this._dataManager.setFilter(types); return this; }
  clearFilter(): this { this._dataManager.clearFilter(); return this; }
  exportEvents(options: Record<string, unknown> = {}): TimelineEvent[] { return this._dataManager.exportData(options); }
  importEvents(data: TimelineEvent[], options: Record<string, unknown> = {}): void { return this._dataManager.importData(data, options); }

  clear(): void {
    this._events = [];
    this._snapshotsManager.clear();
    this._replayManager.reset();
    this._log('info', 'Timeline cleared');
  }

  // Private methods
  _pushEvent(event: TimelineEvent): void {
    this._events.push(event);
    this._metrics.eventsRecorded++;
    if (this._events.length > this._maxEvents) {
      this._events.shift();
    }
  }

  _addSystemEvent(eventName: string, data: Record<string, unknown> = {}): void {
    if (this._state === TIMELINE_STATES.RECORDING || this._state === TIMELINE_STATES.PAUSED) {
      const event = this._recordingManager.createEvent(eventName, data, EVENT_TYPES.SYSTEM);
      this._pushEvent(event as unknown as TimelineEvent);
    }
  }

  _log(level: string, message: string, data: Record<string, unknown> = {}): void {
    if (this._logger) {
      const logFn = this._logger[level] as ((msg: string, d: Record<string, unknown>) => void) | undefined;
      logFn?.(`[${MODULE_ID}] ${message}`, data);
    }
  }

  // Public getters
  getState(): string { return this._state; }
  getEvents(): TimelineEvent[] { return [...this._events]; }
  getEventCount(): number { return this._events.length; }
  getSnapshots(): ReturnType<typeof this._snapshotsManager.getAll> { return this._snapshotsManager.getAll(); }
  getReplayIndex(): number { return this._replayManager.getIndex(); }
  getMetrics(): TimelineMetrics { return { ...this._metrics }; }

  info(): Record<string, unknown> {
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

  healthCheck(): Record<string, unknown> {
    const checks = {
      hasEventBus: !!this._eventBus,
      stateValid: Object.values(TIMELINE_STATES).includes(this._state as typeof TIMELINE_STATES[keyof typeof TIMELINE_STATES]),
      eventsValid: Array.isArray(this._events),
      modulesLoaded: !!(this._recordingManager && this._replayManager && this._snapshotsManager && this._dataManager),
      noErrors: this._metrics.errors === 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    return {
      status: passed === total ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY'),
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  }

  destroy(): void {
    this.stopRecording();
    this.stopReplay();
    this._recordingManager.unsubscribe();
    this._events = [];
    this._snapshotsManager.clear();
    this._eventBus = null;
    this._logger = null;
  }
}

export function createEventTimeline(options: TimelineOptions = {}): EventTimeline {
  return new EventTimeline(options);
}

export default EventTimeline;
