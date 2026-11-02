// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-formatter
// PURPOSE: Logger Global - Formatter v3.3.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   extractComponentName, getTimestamp, normalizeMessage, getSessionId, getTraceId, getBootId, getEnvironment, getCurrentRoute, safeStringify, getLocalTimeFormatted, getCorrelationId, getUserId, getUserRole, sanitizeSensitiveData from ../utils/helpers.js
//   isValidLevel from ./levels.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   formatLogEntry() — exported function
//   formatForConsole() — exported function
//   formatForTelemetry() — exported function
//   isValidLogEntry() — exported function
//   formatForEventBus() — exported function
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

import { extractComponentName, getTimestamp, normalizeMessage, getSessionId, getTraceId, getBootId, getEnvironment, getCurrentRoute, safeStringify, getLocalTimeFormatted, getCorrelationId, getUserId, getUserRole, sanitizeSensitiveData } from '../utils/helpers.js';
import { isValidLevel } from './levels.js';

export var VERSION = '3.3.0-ENTERPRISE';
export var MODULE_ID = 'logger-global-formatter';

export function getVersion() { return VERSION; }

export function formatLogEntry(level: string, message: string, context: string | Record<string, unknown>) {
  if (!context) context = {} as Record<string, unknown>;
  var entry: { timestamp: string | number; level: string; component: string; message: string; [key: string]: unknown } = { timestamp: getTimestamp(), level: isValidLevel(level) ? level : 'info', component: extractComponentName(context) as string, message: normalizeMessage(message) as string, context: sanitizeContext(context), source: 'browser', environment: getEnvironment(), route: getCurrentRoute() };
  var correlationId = getCorrelationId();
  if (correlationId) entry.correlationId = correlationId;
  var userId = getUserId();
  if (userId) entry.userId = userId;
  var userRole = getUserRole();
  if (userRole) entry.userRole = userRole;
  var sessionId = getSessionId();
  if (sessionId) entry.sessionId = sessionId;
  var traceId = getTraceId(context);
  if (traceId) entry.traceId = traceId;
  var bootId = getBootId();
  if (bootId) entry.bootId = bootId;
  return entry;
}

function sanitizeContext(context: string | Record<string, unknown>) {
  if (!context || typeof context !== 'object') return {};
  var skipKeys = ['component', 'componentName', 'name', 'id', 'traceId', 'trace_id', 'sessionId', 'session_id', 'bootId', 'boot_id', 'correlationId', 'correlation_id', 'userId', 'user_id', 'userRole', 'user_role'];
  var filtered = {};
  for (var key in context) {
    if (!Object.prototype.hasOwnProperty.call(context, key)) continue;
    var shouldSkip = false;
    for (var s = 0; s < skipKeys.length; s++) { if (skipKeys[s] === key) { shouldSkip = true; break; } }
    if (shouldSkip) continue;
    try {
      var value = context[key];
      // @ts-expect-error strict migration — TS7053
      if (value instanceof Error) { filtered[key] = { name: value.name, message: value.message, stack: value.stack ? value.stack.split('\n').slice(0, 10).join('\n') : '' }; }
      // @ts-expect-error strict migration — TS7053
      else if (typeof value === 'function') { filtered[key] = '[Function: ' + (value.name || 'anonymous') + ']'; }
      // @ts-expect-error strict migration — TS7053
      else if (typeof value === 'object' && value !== null) { filtered[key] = JSON.parse(safeStringify(value)); }
      // @ts-expect-error strict migration — TS7053
      else { filtered[key] = value; }
    // @ts-expect-error strict migration — TS7053
    } catch (e) { filtered[key] = '[Unserializable]'; }
  }
  return sanitizeSensitiveData(filtered);
}

export function formatForConsole(entry: Record<string, unknown>) {
  var time = getLocalTimeFormatted(entry.timestamp as number);
  var level = (entry.level as string).toUpperCase();
  while (level.length < 8) level += ' ';
  var component = '[' + entry.component + ']';
  while (component.length < 20) component += ' ';
  var prefix = time + ' ' + level + ' ' + component;
  if (entry.correlationId) { prefix += ' [' + (entry.correlationId as string).slice(0, 12) + ']'; }
  var hasContext = false;
  for (var k in entry.context as Record<string, unknown>) { if (Object.prototype.hasOwnProperty.call(entry.context, k)) { hasContext = true; break; } }
  return { prefix: prefix, message: entry.message, context: hasContext ? entry.context : null };
}

export function formatForTelemetry(entry: Record<string, unknown>) {
  var data = { message: entry.message, environment: entry.environment, route: entry.route, correlationId: entry.correlationId, userId: entry.userId };
  // @ts-expect-error TS migration - TS7053
  for (var k in entry.context) { if (Object.prototype.hasOwnProperty.call(entry.context, k)) data[k] = entry.context[k]; }
  return { name: entry.component + ':' + entry.level, data: data, options: { component: entry.component, severity: entry.level, timestamp: entry.timestamp, sessionId: entry.sessionId, traceId: entry.traceId, bootId: entry.bootId, correlationId: entry.correlationId, userId: entry.userId, userRole: entry.userRole } };
}

export function isValidLogEntry(entry: Record<string, unknown>) { return entry && typeof entry === 'object' && typeof entry.timestamp === 'number' && typeof entry.level === 'string' && typeof entry.component === 'string' && typeof entry.message === 'string'; }

export function formatForEventBus(entry: Record<string, unknown>) { return { event: 'logger:' + entry.level, payload: { level: entry.level, component: entry.component, message: entry.message, correlationId: entry.correlationId, userId: entry.userId, timestamp: entry.timestamp, context: entry.context } }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { formatLogEntryReady: typeof formatLogEntry === 'function', formatForConsoleReady: typeof formatForConsole === 'function' } }; }
