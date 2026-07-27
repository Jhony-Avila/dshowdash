import { PERSISTENCE_EVENTS } from "/core/runtime/events/catalog/persistence.events.js";
const VERSION = "2.1.0-P18EC";
const MODULE_ID = "audit-timeline-controller";
const MAX_EVENTS = 1e3;
class TimelineController {
  constructor(context = {}) {
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._timeline = [];
    this._maxEvents = context.maxEvents || MAX_EVENTS;
    this._metrics = { appended: 0, queries: 0, trimmed: 0 };
  }
  append(event) {
    try {
      const entry = { ...event, timestamp: event.timestamp || Date.now(), timelineIndex: this._timeline.length };
      this._timeline.push(entry);
      this._metrics.appended++;
      if (this._timeline.length > this._maxEvents) {
        const trimCount = this._timeline.length - this._maxEvents;
        this._timeline.splice(0, trimCount);
        this._metrics.trimmed += trimCount;
      }
      return { ok: true, index: entry.timelineIndex };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  getTimeline() {
    this._metrics.queries++;
    return [...this._timeline];
  }
  getRange(options = {}) {
    this._metrics.queries++;
    const { fromTs, toTs, limit } = options;
    let result = [...this._timeline];
    if (fromTs !== void 0) result = result.filter((e) => e.timestamp >= fromTs);
    if (toTs !== void 0) result = result.filter((e) => e.timestamp <= toTs);
    if (limit !== void 0 && Number(limit) > 0) result = result.slice(-Number(limit));
    return result;
  }
  // @ts-expect-error TS migration - TS2339
  getAfter(timestamp) {
    this._metrics.queries++;
    return this._timeline.filter((e) => e.timestamp > timestamp);
  }
  // @ts-expect-error TS migration - TS2339
  getBefore(timestamp) {
    this._metrics.queries++;
    return this._timeline.filter((e) => e.timestamp < timestamp);
  }
  getLast(n = 10) {
    this._metrics.queries++;
    return this._timeline.slice(-n);
  }
  // @ts-expect-error TS migration - TS2339
  getByName(name) {
    this._metrics.queries++;
    return this._timeline.filter((e) => e.name === name);
  }
  clear() {
    const count = this._timeline.length;
    this._timeline = [];
    this._emit(PERSISTENCE_EVENTS.TIMELINE_CLEARED, { count });
    return { cleared: count };
  }
  _emit(event, data = {}) {
    try {
      this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    } catch (e) {
    }
  }
  healthCheck() {
    const usage = this._timeline.length / this._maxEvents;
    return { status: usage < 0.9 ? "healthy" : "degraded", score: `${Math.round((1 - usage) * 100)}%`, entries: this._timeline.length, maxEvents: this._maxEvents, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, entries: this._timeline.length, maxEvents: this._maxEvents, metrics: { ...this._metrics }, oldestTs: this._timeline[0]?.timestamp || null, newestTs: this._timeline[this._timeline.length - 1]?.timestamp || null };
  }
}
function createTimelineController(context) {
  return new TimelineController(context);
}
var timeline_controller_default = { TimelineController, createTimelineController, MAX_EVENTS, VERSION, MODULE_ID };
export {
  MODULE_ID,
  TimelineController,
  VERSION,
  createTimelineController,
  timeline_controller_default as default
};
