import { AUDIT_TRAIL_EVENTS } from "/core/runtime/events/catalog/audit-trail.events.js";
const VERSION = "2.1.0-P18EC";
const MODULE_ID = "audit";
import { createAuditLog } from "./audit-log.js";
import { createTimelineController } from "./timeline-controller.js";
import { createReplayController } from "./replay-controller.js";
function createAuditModule(context = {}) {
  const events = context.ports?.events || null;
  const auditLog = createAuditLog(context);
  const timeline = createTimelineController(context);
  const replay = createReplayController({ ...context, executor: context.executor });
  const unsubs = [];
  function recordEvent(name, payload = {}, meta = {}) {
    const entry = auditLog.record({ type: "event", name, payload, meta, source: meta.source || MODULE_ID });
    if (entry) timeline.append(entry);
    return entry;
  }
  function recordAction(action, phase = "unknown") {
    const entry = auditLog.record({
      type: "action",
      name: `action:${phase}`,
      payload: action,
      meta: {
        actionId: action?.actionId,
        kind: action?.kind,
        // @ts-expect-error TS migration - TS2339
        correlationId: action?.meta?.correlationId,
        source: action?.source
      }
    });
    if (entry) timeline.append(entry);
    return entry;
  }
  function handleDumpRequest() {
    const payload = {
      audit: {
        entries: auditLog.getAll(),
        stats: auditLog.info()
      },
      timeline: {
        items: timeline.getTimeline(),
        stats: timeline.info()
      },
      replay: {
        last: replay.info()
      },
      version: VERSION,
      schemaVersion: "2.0.0",
      timestamp: Date.now()
    };
    events?.emit?.(AUDIT_TRAIL_EVENTS.DUMP, payload);
  }
  function init() {
    if (events?.on) {
      const unsub = events.on(AUDIT_TRAIL_EVENTS.DUMP_REQUEST, handleDumpRequest);
      if (typeof unsub === "function") unsubs.push(unsub);
    }
  }
  function destroy() {
    unsubs.forEach((u) => {
      try {
        if (typeof u === "function") u();
      } catch (e) {
      }
    });
    unsubs.length = 0;
  }
  init();
  return {
    auditLog,
    timeline,
    replay,
    recordEvent,
    recordAction,
    init,
    destroy,
    healthCheck() {
      return {
        status: "healthy",
        auditLog: auditLog.healthCheck(),
        timeline: timeline.healthCheck(),
        replay: replay.healthCheck(),
        version: VERSION,
        moduleId: MODULE_ID
      };
    },
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        auditLog: auditLog.info(),
        timeline: timeline.info(),
        replay: replay.info()
      };
    },
    clear() {
      const auditCleared = auditLog.clear();
      const timelineCleared = timeline.clear();
      return { auditCleared, timelineCleared };
    }
  };
}
import { AuditLog as AuditLog2, createAuditLog as createAuditLog2 } from "./audit-log.js";
import { TimelineController as TimelineController2, createTimelineController as createTimelineController2 } from "./timeline-controller.js";
import { ReplayController as ReplayController2, createReplayController as createReplayController2 } from "./replay-controller.js";
var audit_default = { createAuditModule, VERSION, MODULE_ID };
export {
  AuditLog2 as AuditLog,
  MODULE_ID,
  ReplayController2 as ReplayController,
  TimelineController2 as TimelineController,
  VERSION,
  createAuditLog2 as createAuditLog,
  createAuditModule,
  createReplayController2 as createReplayController,
  createTimelineController2 as createTimelineController,
  audit_default as default
};
