// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.5.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-writer
// PURPOSE: Logger Global - Writer (escrita de logs para multiplos destinos)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   formatLogEntry, formatForConsole, formatForEventBus from ./formatter.js
//   LEVEL_COLORS, LEVEL_ICONS from ./levels.js
//   shouldLog, isConsoleEnabled, isTelemetryForwardingEnabled, isBufferEnabled, isEventBusEnabled, shouldSuppressConsole, incrementSuppressedCount from ./lifecycle.js
//   pushToBuffer from ../state/buffer.js
//   forwardToTelemetry from ../telemetry/forwarder.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   writeLog() — exported function
//   getWriteStats() — exported function
//   resetWriteStats() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// P18EC-REVIEWED: Core logging infrastructure - generic EventBus emit
// @version 3.5.0-STRICT-MODE
// @changelog v3.5.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v3.4.0-ENTERPRISE - Added info(), healthCheck(), ES5 conversion
'use strict';

import { formatLogEntry, formatForConsole, formatForEventBus } from './formatter.js';
import { LEVEL_COLORS, LEVEL_ICONS } from './levels.js';
import { shouldLog, isConsoleEnabled, isTelemetryForwardingEnabled, isBufferEnabled, isEventBusEnabled, shouldSuppressConsole, incrementSuppressedCount } from './lifecycle.js';
import { pushToBuffer } from '../state/buffer.js';
import { forwardToTelemetry } from '../telemetry/forwarder.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export var VERSION = '3.5.0-STRICT-MODE';
export var MODULE_ID = 'logger-global-writer';

export function getVersion() { return VERSION; }

var writeStats = { total: 0, byLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, critical: 0 }, consoleWrites: 0, consoleSuppressed: 0, telemetryForwards: 0, bufferPushes: 0, eventBusEmits: 0, errors: 0 };

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: EventBus
// ═══════════════════════════════════════════════════════════════
function _getEventBus() {
  // 1. Try Core.windowAdapter first
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var waEventBus = window.Core.windowAdapter.get('EventBus');
    if (waEventBus) return waEventBus;
  }

  return null;
}

export function writeLog(level: string, message: string, context: string | Record<string, unknown>) {
  if (!context) context = {} as Record<string, unknown>;
  try {
    if (!shouldLog(level, (context as Record<string, unknown>).component as string || 'app')) { return { ok: true, skipped: true }; }
    var entry = formatLogEntry(level, message, context);
    writeStats.total++;
    // @ts-expect-error strict migration — TS7053
    writeStats.byLevel[level] = (writeStats.byLevel[level] || 0) + 1;

    if (isConsoleEnabled()) {
      if (shouldSuppressConsole(level)) { writeStats.consoleSuppressed++; incrementSuppressedCount(); }
      // @ts-expect-error strict migration — TS2345
      else { try { writeToConsole(entry); writeStats.consoleWrites++; } catch (consoleError) { safeConsoleError('Console write failed', consoleError); } }
    }

    // @ts-expect-error strict migration — TS2345
    if (isTelemetryForwardingEnabled()) { try { var result = forwardToTelemetry(entry); if (result.ok) writeStats.telemetryForwards++; } catch (telemetryError) { safeConsoleError('Telemetry forward failed', telemetryError); } }
    // @ts-expect-error strict migration — TS2345
    if (isBufferEnabled()) { try { pushToBuffer(entry); writeStats.bufferPushes++; } catch (bufferError) { safeConsoleError('Buffer push failed', bufferError); } }
    if (isEventBusEnabled()) { try { emitToEventBus(entry); writeStats.eventBusEmits++; } catch (eventBusError) { } }

    return { ok: true, entry: entry, suppressed: shouldSuppressConsole(level) };
  // @ts-expect-error strict migration — TS2345
  } catch (error) { writeStats.errors++; safeConsoleError('Logger write failed', error); return { ok: false, error: error }; }
}

function writeToConsole(entry: Record<string, unknown>) {
  try {
    var formatted = formatForConsole(entry);
    var color = LEVEL_COLORS[entry.level as keyof typeof LEVEL_COLORS] || '#666';
    var icon = LEVEL_ICONS[entry.level as keyof typeof LEVEL_ICONS] || '';
    var style = 'color: ' + color + '; font-weight: bold;';
    var resetStyle = 'color: inherit; font-weight: normal;';
    var prefix = '%c' + icon + ' ' + formatted.prefix + '%c';
    var args = formatted.context ? [prefix, style, resetStyle, formatted.message, formatted.context] : [prefix, style, resetStyle, formatted.message];

    switch (entry.level) {
      case 'critical':
      case 'error': console.error.apply(console, args); break;
      case 'warn': console.warn.apply(console, args); break;
      case 'debug':
      case 'trace': console.debug.apply(console, args); break;
      default: console.info.apply(console, args);
    }
  // @ts-expect-error strict migration — TS2345
  } catch (error) { safeConsoleError('Console write failed', error); }
}

function emitToEventBus(entry: Record<string, unknown>) {
  var validLevels = ['warn', 'error', 'critical'];
  var isValid = false;
  for (var i = 0; i < validLevels.length; i++) { if (validLevels[i] === entry.level) { isValid = true; break; } }
  if (!isValid) return;

  var eventBus = _getEventBus();
  if (!eventBus || typeof eventBus.emit !== 'function') return;

  try {
    var formatted = formatForEventBus(entry);
    eventBus.emitSync(formatted.event, formatted.payload, { sourceModule: 'logger-global', priority: 3 });
  } catch (e) { }
}

function safeConsoleError(message: string, error: Error) { try { console.error('[Logger Internal] ' + message + ':', error); } catch (e) { } }

// @ts-expect-error strict migration — TS18046, TS7053
export function getWriteStats() { var stats: Record<string, unknown> = {}; for (var k in writeStats) { if (k === 'byLevel') { stats.byLevel = {}; for (var l in writeStats.byLevel) stats.byLevel[l] = writeStats.byLevel[l]; } else stats[k] = writeStats[k]; } return stats; }

export function resetWriteStats() { writeStats = { total: 0, byLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, critical: 0 }, consoleWrites: 0, consoleSuppressed: 0, telemetryForwards: 0, bufferPushes: 0, eventBusEmits: 0, errors: 0 }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, totalWrites: writeStats.total, strictMode: isStrict() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { writeLogReady: typeof writeLog === 'function', statsReady: writeStats !== null }, strictMode: isStrict() }; }
