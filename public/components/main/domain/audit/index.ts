// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P25-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: audit
// PURPOSE: P25-COMPLIANT: EventBus subscriptions have deterministic teardown in destroy()
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   AUDIT_TRAIL_EVENTS from /core/runtime/events/catalog/audit-trail.events.js
//   AuditLog, createAuditLog from ./audit-log.js
//   TimelineController, createTimelineController from ./timeline-controller.js
//   ReplayController, createReplayController from ./replay-controller.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createAuditModule() — exported function
//   AuditLog — exported value
//   createAuditLog — exported value
//   TimelineController — exported value
//   createTimelineController — exported value
//   ReplayController — exported value
//   createReplayController — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   AUDIT_TRAIL_EVENTS.DUMP_REQUEST
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { AUDIT_TRAIL_EVENTS } from '/core/runtime/events/catalog/audit-trail.events.js';

export const VERSION = '2.1.0-P18EC';
export const MODULE_ID = 'audit';

import { AuditLog, createAuditLog } from './audit-log.js';
import { TimelineController, createTimelineController } from './timeline-controller.js';
import { ReplayController, createReplayController } from './replay-controller.js';

export function createAuditModule(context: Record<string, any> = {}) {
  const events = context.ports?.events || null;
  const auditLog = createAuditLog(context);
  const timeline = createTimelineController(context);
  const replay = createReplayController({ ...context, executor: context.executor });
  
  const unsubs: Array<() => void> = [];

  function recordEvent(name: string, payload: Record<string, unknown> = {}, meta: Record<string, unknown> = {}) {
    const entry = auditLog.record({ type: 'event', name, payload, meta, source: meta.source || MODULE_ID });
// @ts-expect-error TS migration - TS2345
    if (entry) timeline.append(entry);
    return entry;
  }

  function recordAction(action: Record<string, unknown>, phase = 'unknown') {
    const entry = auditLog.record({
      type: 'action',
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
// @ts-expect-error TS migration - TS2345
    if (entry) timeline.append(entry);
    return entry;
  }

  // P18EC: Handshake para dump de estado
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
      schemaVersion: '2.0.0',
      timestamp: Date.now()
    };
    
    events?.emit?.(AUDIT_TRAIL_EVENTS.DUMP, payload);
  }

  // Setup listener para dump-request
  function init() {
    if (events?.on) {
      const unsub = events.on(AUDIT_TRAIL_EVENTS.DUMP_REQUEST, handleDumpRequest);
      if (typeof unsub === 'function') unsubs.push(unsub);
    }
  }

  function destroy() {
    unsubs.forEach(u => { try { if (typeof u === 'function') u(); } catch(e) {} });
    unsubs.length = 0;
  }

  // Auto-init se events disponível
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
        status: 'healthy',
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

export { AuditLog, createAuditLog } from './audit-log.js';
export { TimelineController, createTimelineController } from './timeline-controller.js';
export { ReplayController, createReplayController } from './replay-controller.js';

export default { createAuditModule, VERSION, MODULE_ID };
