// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: audit-timeline-controller
// PURPOSE: Timeline Controller - Linha do Tempo P9 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERSISTENCE_EVENTS from /core/runtime/events/catalog/persistence.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createTimelineController() — exported function
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

import { PERSISTENCE_EVENTS } from '/core/runtime/events/catalog/persistence.events.js';

export const VERSION = '2.1.0-P18EC';
export const MODULE_ID = 'audit-timeline-controller';
const MAX_EVENTS = 1000;

export class TimelineController {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._timeline = [];
    this._maxEvents = context.maxEvents || MAX_EVENTS;
    this._metrics = { appended: 0, queries: 0, trimmed: 0 };
  }

  append(event: string) {
    try {
// @ts-expect-error TS migration - TS2339
      const entry = { ...event, timestamp: event.timestamp || Date.now(), timelineIndex: this._timeline.length };
      this._timeline.push(entry);
      this._metrics.appended++;
      if (this._timeline.length > this._maxEvents) { const trimCount = this._timeline.length - this._maxEvents; this._timeline.splice(0, trimCount); this._metrics.trimmed += trimCount; }
      return { ok: true, index: entry.timelineIndex };
    } catch (error: any) { return { ok: false, error: error.message }; }
  }

  getTimeline() { this._metrics.queries++; return [...this._timeline]; }
  getRange(options: Record<string, unknown> = {}) { this._metrics.queries++; const { fromTs, toTs, limit } = options; let result = [...this._timeline]; if (fromTs !== undefined) result = result.filter(e => e.timestamp >= fromTs!); if (toTs !== undefined) result = result.filter(e => e.timestamp <= toTs!); if (limit !== undefined && Number(limit) > 0) result = result.slice(-Number(limit)); return result; }
// @ts-expect-error TS migration - TS2339
  getAfter(timestamp: number) { this._metrics.queries++; return this._timeline.filter((e: unknown) => e.timestamp > timestamp); }
// @ts-expect-error TS migration - TS2339
  getBefore(timestamp: number) { this._metrics.queries++; return this._timeline.filter((e: unknown) => e.timestamp < timestamp); }
  getLast(n = 10) { this._metrics.queries++; return this._timeline.slice(-n); }
// @ts-expect-error TS migration - TS2339
  getByName(name: string) { this._metrics.queries++; return this._timeline.filter((e: unknown) => e.name === name); }

  clear() { const count = this._timeline.length; this._timeline = []; this._emit(PERSISTENCE_EVENTS.TIMELINE_CLEARED, { count }); return { cleared: count }; }
  _emit(event: string, data: Record<string, unknown> = {}) { try { this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); } catch (e) {} }

  healthCheck() { const usage = this._timeline.length / this._maxEvents; return { status: usage < 0.9 ? 'healthy' : 'degraded', score: `${Math.round((1 - usage) * 100)}%`, entries: this._timeline.length, maxEvents: this._maxEvents, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, entries: this._timeline.length, maxEvents: this._maxEvents, metrics: { ...this._metrics }, oldestTs: this._timeline[0]?.timestamp || null, newestTs: this._timeline[this._timeline.length - 1]?.timestamp || null }; }
}

export function createTimelineController(context: Record<string, unknown>) { return new TimelineController(context); }
export default { TimelineController, createTimelineController, MAX_EVENTS, VERSION, MODULE_ID };
