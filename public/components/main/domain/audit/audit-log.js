import { PERSISTENCE_EVENTS } from "/core/runtime/events/catalog/persistence.events.js";
const VERSION = "2.1.0-P18EC";
const MODULE_ID = "audit-log";
const MAX_ENTRIES = 2e3;
class AuditLog {
  constructor(context = {}) {
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._log = [];
    this._idCounter = 0;
    this._maxEntries = context.maxEntries || MAX_ENTRIES;
    this._metrics = { recorded: 0, trimmed: 0, errors: 0 };
  }
  record(entry) {
    try {
      const record = { id: `audit_${++this._idCounter}_${Date.now()}`, timestamp: entry.timestamp || Date.now(), type: entry.type || "event", name: entry.name || entry.eventName || "unknown", payload: entry.payload || {}, source: entry.source || MODULE_ID, meta: { correlationId: entry.meta?.correlationId || entry.correlationId || null, actionId: entry.meta?.actionId || entry.actionId || null, userId: entry.meta?.userId || null, containerId: entry.meta?.containerId || null, ...entry.meta } };
      this._metrics.recorded++;
      if (this._log.length > this._maxEntries) {
        const trimCount = this._log.length - this._maxEntries;
        this._log.splice(0, trimCount);
        this._metrics.trimmed += trimCount;
      }
      this._emit(PERSISTENCE_EVENTS.AUDIT_RECORDED, { id: record.id, name: record.name, type: record.type });
      return record;
    } catch (error) {
      this._metrics.errors++;
      return null;
    }
  }
  // @ts-expect-error TS migration - TS2339
  getByName(name) {
    return this._log.filter((e) => e.name === name);
  }
  // @ts-expect-error TS migration - TS2339
  getByType(type) {
    return this._log.filter((e) => e.type === type);
  }
  getLast(n = 10) {
    return this._log.slice(-n);
  }
  clear() {
    const count = this._log.length;
    this._log = [];
    this._idCounter = 0;
    this._emit(PERSISTENCE_EVENTS.AUDIT_CLEARED, { count });
    return { cleared: count };
  }
  _emit(event, data = {}) {
    try {
      this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    } catch (e) {
    }
  }
  healthCheck() {
    const usage = this._log.length / this._maxEntries;
    return { status: usage < 0.9 ? "healthy" : "degraded", score: `${Math.round((1 - usage) * 100)}%`, entries: this._log.length, maxEntries: this._maxEntries, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, entries: this._log.length, maxEntries: this._maxEntries, metrics: { ...this._metrics }, oldestId: this._log[0]?.id || null, newestId: this._log[this._log.length - 1]?.id || null };
  }
}
function createAuditLog(context) {
  return new AuditLog(context);
}
var audit_log_default = { AuditLog, createAuditLog, MAX_ENTRIES, VERSION, MODULE_ID };
export {
  AuditLog,
  MODULE_ID,
  VERSION,
  createAuditLog,
  audit_log_default as default
};
