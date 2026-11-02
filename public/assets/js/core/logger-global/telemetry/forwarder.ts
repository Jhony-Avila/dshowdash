// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-forwarder
// PURPOSE: Logger Global - Telemetry Forwarder v3.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   formatForTelemetry from ../core/formatter.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   initForwarder() — exported function
//   forwardToTelemetry() — exported function
//   setForwardingEnabled() — exported function
//   isTelemetryAvailable() — exported function
//   getForwardingStats() — exported function
//   resetForwardingStats() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Telemetry
// ═══════════════════════════════════════════════════════════════
'use strict';

import { formatForTelemetry } from '../core/formatter.js';

export var VERSION = '3.1.0-ENTERPRISE';
export var MODULE_ID = 'logger-global-forwarder';

export function getVersion() { return VERSION; }

interface TelemetryLike {
  isReady?: () => boolean;
  track: (eventName: string, eventData: Record<string, unknown>) => void;
  [key: string]: unknown;
}

var telemetryModule: TelemetryLike | null = null;
var forwardingEnabled = true;
var lastError = null;

var forwardingStats = { forwarded: 0, failed: 0, lastForward: null as number | null, lastError: null as string | null, initAttempts: 0, initSuccess: false };

export function initForwarder() {
  forwardingStats.initAttempts++;
  return new Promise(function(resolve) {
    try {
      if (typeof window !== 'undefined' && window.Telemetry && typeof window.Telemetry.isReady === 'function' && window.Telemetry.isReady()) {
        telemetryModule = window.Telemetry as TelemetryLike;
        forwardingStats.initSuccess = true;
        resolve({ ok: true, available: true, source: 'window' });
        return;
      }
      
      import('../../telemetry-core/index.js').then(function(module: Record<string, unknown>) {
        telemetryModule = module.Telemetry as TelemetryLike;
        if (telemetryModule && typeof telemetryModule.isReady === 'function') {
          var isAvailable = telemetryModule.isReady();
          forwardingStats.initSuccess = isAvailable;
          resolve({ ok: true, available: isAvailable, source: 'import' });
        } else {
          forwardingStats.initSuccess = false;
          resolve({ ok: true, available: false });
        }
      }).catch(function() {
        forwardingStats.initSuccess = false;
        resolve({ ok: true, available: false });
      });
    } catch (error) {
      telemetryModule = null;
      lastError = error;
      forwardingStats.lastError = (error as Error)?.message ? (error as Error).message : 'Unknown error';
      forwardingStats.initSuccess = false;
      resolve({ ok: false, available: false, error: error });
    }
  });
}

export function forwardToTelemetry(logEntry: Record<string, unknown>) {
  if (!forwardingEnabled) return { ok: false, reason: 'forwarding-disabled' };
  var telem = telemetryModule || (typeof window !== 'undefined' ? window.Telemetry as TelemetryLike : null);
  if (!telem) return { ok: false, reason: 'telemetry-not-loaded' };
  if (typeof telem.track !== 'function') return { ok: false, reason: 'telemetry-track-not-available' };

  try {
    var telemetryData = formatForTelemetry(logEntry);
    var eventName = 'log:' + logEntry.level;
    var eventData: Record<string, unknown> = { component: logEntry.component || 'unknown', message: logEntry.message || '', level: logEntry.level, timestamp: logEntry.timestamp };
    for (var k in telemetryData.data) { if (Object.prototype.hasOwnProperty.call(telemetryData.data, k)) eventData[k] = (telemetryData.data as Record<string, unknown>)[k]; }
    telem.track(eventName, eventData);
    forwardingStats.forwarded++;
    forwardingStats.lastForward = Date.now();
    return { ok: true };
  } catch (error) {
    forwardingStats.failed++;
    forwardingStats.lastError = (error as Error)?.message ? (error as Error).message : 'Forward error';
    return { ok: false, error: error };
  }
}

export function setForwardingEnabled(enabled: boolean) { forwardingEnabled = Boolean(enabled); }

export function isTelemetryAvailable() {
  if (telemetryModule && typeof (telemetryModule as TelemetryLike).track === 'function') return true;
  if (typeof window !== 'undefined' && window.Telemetry && typeof window.Telemetry.track === 'function') return true;
  return false;
}

export function getForwardingStats() { return { version: VERSION, moduleId: MODULE_ID, enabled: forwardingEnabled, available: isTelemetryAvailable(), forwarded: forwardingStats.forwarded, failed: forwardingStats.failed, totalForwarded: forwardingStats.forwarded, totalErrors: forwardingStats.failed, lastForward: forwardingStats.lastForward, lastError: forwardingStats.lastError, initAttempts: forwardingStats.initAttempts, initSuccess: forwardingStats.initSuccess }; }

export function resetForwardingStats() { forwardingStats = { forwarded: 0, failed: 0, lastForward: null, lastError: null, initAttempts: forwardingStats.initAttempts, initSuccess: forwardingStats.initSuccess }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, enabled: forwardingEnabled, available: isTelemetryAvailable() }; }
export function healthCheck() { return { status: forwardingEnabled ? 'HEALTHY' : 'DISABLED', moduleId: MODULE_ID, version: VERSION, checks: { forwardingEnabled: forwardingEnabled, telemetryAvailable: isTelemetryAvailable() } }; }
