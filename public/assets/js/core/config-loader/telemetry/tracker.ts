// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-loader-telemetry
// PURPOSE: Config Loader - Telemetry Tracker v2.2.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Telemetry, createLegacyAdapter from ../../telemetry-core/index.js
//   TELEMETRY_ENDPOINT from ../../api-client/config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   initTelemetry() — exported function
//   track() — exported function
//   trackError() — exported function
//   trackTiming() — exported function
//   getEventLog() — exported function
//   clearEventLog() — exported function
//   getSessionId() — exported function
//   getTrackerInfo() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { Telemetry, createLegacyAdapter } from '../../telemetry-core/index.js';
import { TELEMETRY_ENDPOINT } from '../../api-client/config.js';

export var VERSION = '2.2.0-ENTERPRISE';
export var MODULE_ID = 'config-loader-telemetry';
var NAMESPACE = 'config-loader';

export function getVersion() { return VERSION; }

var adapter: ReturnType<typeof createLegacyAdapter> | null = null;
var sessionId: string | null = null;
var initialized = false;

export function initTelemetry(sid: string) {
  if (initialized) return;
  sessionId = sid || ('cfg-' + Date.now());

  if (!Telemetry.isReady()) {
    Telemetry.init({ endpoint: TELEMETRY_ENDPOINT, component: NAMESPACE, debug: false, flushIntervalMs: 30000, maxBufferSize: 500, batchSize: 20 });
  }

  adapter = createLegacyAdapter(NAMESPACE);
  initialized = true;
  adapter.track('telemetry:init', { sessionId: sessionId, version: VERSION, moduleId: MODULE_ID });
}

export function track(event: string, data: Record<string, unknown> = {}) {
  if (!data) data = {};
  data.moduleId = MODULE_ID;
  if (!adapter) { Telemetry.event(NAMESPACE + ':' + event, data, { component: NAMESPACE }); return; }
  adapter.track(event, data);
}

export function trackError(context: string, error: Error | string, extra: Record<string, unknown> = {}) {
  var errorData: Record<string, unknown> = { message: (error && (error as Error).message) ? (error as Error).message : String(error), stack: error && (error as Error).stack ? (error as Error).stack : null, moduleId: MODULE_ID };
  for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) errorData[k] = extra[k]; }
  if (!adapter) { Telemetry.error(NAMESPACE + ':' + context + ':error', errorData, { component: NAMESPACE }); return; }
  extra.moduleId = MODULE_ID;
  adapter.trackError(context, error, extra);
}

export function trackTiming(operation: string, durationMs: number, success: boolean = true) {
  if (success === undefined) success = true;
  if (!adapter) { Telemetry.metric(NAMESPACE + ':' + operation + ':timing', { duration: durationMs, success: success, unit: 'ms', moduleId: MODULE_ID }, { component: NAMESPACE }); return; }
  adapter.trackTiming(operation, durationMs, success);
}

export function getEventLog() {
  // @ts-expect-error strict migration — TS2339
  try { var buffer = Telemetry.getBufferSnapshot(); var filtered: any[] = []; for (var i = 0; i < buffer.length; i++) { if (buffer[i].component === NAMESPACE) filtered.push(buffer[i]); } return filtered; }
  catch (e) { return []; }
}

export function clearEventLog() { }

export function getSessionId() {
  if (sessionId) return sessionId;
  try { var stats = Telemetry.getStats ? Telemetry.getStats() : null; return stats && stats.sessionId ? stats.sessionId : null; } catch (e) { return null; }
}

export function getTrackerInfo() { return { version: VERSION, moduleId: MODULE_ID, namespace: NAMESPACE, initialized: initialized, sessionId: sessionId, telemetryEndpoint: TELEMETRY_ENDPOINT, eventCount: getEventLog().length }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: initialized }; }
export function healthCheck() { return { status: initialized ? 'HEALTHY' : 'IDLE', moduleId: MODULE_ID, version: VERSION, checks: { initialized: initialized, trackReady: typeof track === 'function' } }; }
