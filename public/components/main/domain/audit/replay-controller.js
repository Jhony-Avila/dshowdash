import { PERSISTENCE_EVENTS } from "/core/runtime/events/catalog/persistence.events.js";
const VERSION = "2.1.0-P18EC";
const MODULE_ID = "replay-controller";
class ReplayController {
  constructor(context = {}) {
    this._executor = context.executor || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._metrics = { replays: 0, executed: 0, skipped: 0, errors: 0 };
  }
  async replay(actions = [], options = {}) {
    const { dryRun = true } = options;
    const startedAt = Date.now();
    this._emit(PERSISTENCE_EVENTS.REPLAY_STARTED, { count: actions.length, dryRun });
    this._track("replay:started", { count: actions.length, dryRun });
    this._metrics.replays++;
    const report = { ok: true, dryRun, count: actions.length, executed: 0, skipped: 0, errors: [], results: [], startedAt, endedAt: null };
    for (const action of actions) {
      if (!this._isValidAction(action)) {
        report.skipped++;
        this._metrics.skipped++;
        report.results.push({ action, skipped: true, reason: "invalid-structure" });
        continue;
      }
      try {
        if (dryRun) {
          report.executed++;
          this._metrics.executed++;
          report.results.push({ action, dryRun: true, wouldExecute: true });
        } else {
          if (!this._executor) {
            report.errors.push({ action, error: "No executor available" });
            this._metrics.errors++;
            continue;
          }
          const actionPayload = this._extractActionPayload(action);
          const result = await this._executor.execute(actionPayload);
          if (result.ok) {
            report.executed++;
            this._metrics.executed++;
            report.results.push({ action, result });
          } else {
            report.errors.push({ action, error: result.error });
            this._metrics.errors++;
          }
        }
      } catch (error) {
        report.errors.push({ action, error: error.message });
        this._metrics.errors++;
      }
    }
    report.endedAt = Date.now();
    report.ok = report.errors.length === 0;
    if (report.ok) this._emit(PERSISTENCE_EVENTS.REPLAY_COMPLETED, { count: report.executed, dryRun, duration: report.endedAt - report.startedAt });
    else this._emit(PERSISTENCE_EVENTS.REPLAY_ERROR, { errors: report.errors.length, dryRun });
    this._track("replay:completed", { executed: report.executed, errors: report.errors.length, dryRun });
    return report;
  }
  async replayFrom(timeline, options = {}) {
    const { fromTs, toTs, dryRun = true } = options;
    if (!timeline || typeof timeline.getRange !== "function") return { ok: false, error: "Invalid timeline: getRange() required" };
    const replayableEvents = events.filter((e) => this._isReplayableEvent(e));
    return this.replay(replayableEvents, { dryRun });
  }
  // @ts-expect-error TS migration - TS2578
  _isReplayableEvent(event) {
    const replayableNames = ["ui:action", "action:accepted", "action:dispatching"];
    return replayableNames.includes(event.name);
  }
  // @ts-expect-error TS migration - TS2578
  _extractActionPayload(entry) {
    if (entry.payload?.action) return entry.payload.action;
    if (entry.payload?.actionId) return entry.payload;
    if (entry.actionId) return entry;
    return { actionId: entry.meta?.actionId || entry.name || "unknown", kind: entry.meta?.kind || "ui", meta: entry.meta || {}, payload: entry.payload || {} };
  }
  _track(event, data = {}) {
    try {
      this._telemetry?.track?.(event, data);
    } catch (e) {
    }
  }
  healthCheck() {
    const checks = { hasExecutor: !!this._executor, hasEvents: !!this._events };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 1 ? "healthy" : "degraded", score: `${passed}/2`, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, hasExecutor: !!this._executor, metrics: { ...this._metrics } };
  }
}
function createReplayController(context) {
  return new ReplayController(context);
}
var replay_controller_default = { ReplayController, createReplayController, VERSION, MODULE_ID };
export {
  MODULE_ID,
  ReplayController,
  VERSION,
  createReplayController,
  replay_controller_default as default
};
