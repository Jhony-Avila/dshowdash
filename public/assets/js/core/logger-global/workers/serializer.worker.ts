// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-serializer-worker
// PURPOSE: Logger Global - Serializer Worker v8.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   (none — internal module)
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

var MODULE_ID = 'logger-global-serializer-worker';
var VERSION = '8.1.0-ENTERPRISE';

self.onmessage = function(event) {
  var data = event.data;
  var type = data.type;
  var payload = data.payload;
  var id = data.id;
  
  try {
    var result;
    if (type === 'serialize') result = serializeEntry(payload);
    else if (type === 'batch-serialize') result = payload.map(serializeEntry);
    else if (type === 'format') result = formatForOutput(payload);
    else if (type === 'sanitize') result = sanitizeData(payload);
    else if (type === 'info') result = { moduleId: MODULE_ID, version: VERSION };
    else throw new Error('Unknown operation: ' + type);
    
    self.postMessage({ id: id, ok: true, result: result });
  } catch (error) {
    self.postMessage({ id: id, ok: false, error: (error as Error).message });
  }
};

function serializeEntry(entry: Record<string, unknown>) {
  return JSON.stringify({ timestamp: entry.timestamp, level: entry.level, component: entry.component, message: truncate(entry.message as string, 1000), context: sanitizeContext(entry.context as string), correlationId: entry.correlationId, userId: entry.userId, sessionId: entry.sessionId });
}

function formatForOutput(entry: Record<string, unknown>) {
  var time = new Date(entry.timestamp as number).toISOString();
  return time + ' [' + (entry.level as string).toUpperCase() + '] [' + entry.component + '] ' + entry.message;
}

function sanitizeData(data: Record<string, unknown>) { return sanitizeObject(data, 0); }

// @ts-expect-error strict migration — TS7023
function sanitizeObject(obj: Record<string, unknown>, depth: number) {
  if (depth > 10) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  // @ts-expect-error strict migration — TS7024
  if (Array.isArray(obj)) return obj.slice(0, 100).map(function(item) { return sanitizeObject(item, depth + 1); });
  if (typeof obj === 'object') {
    var result = {};
    var keys = Object.keys(obj).slice(0, 50);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var lowerKey = key.toLowerCase();
      // @ts-expect-error TS migration - TS7053
      result[key] = isSensitiveKey(lowerKey) ? '[REDACTED]' : sanitizeObject(obj[key], depth + 1);
    }
    return result;
  }
  return obj;
}

function sanitizeString(str: string) {
  str = str.replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, '***.***.***-**');
  str = str.replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, '**.***.***/****.--');
  str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  str = str.replace(/(\+?55\s?)?(\(?\d{2}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/g, '[PHONE]');
  str = str.replace(/eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[JWT]');
  str = str.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[CARD]');
  return str;
}

function isSensitiveKey(key: string) {
  var sensitivePatterns = ['password', 'senha', 'pwd', 'pass', 'token', 'secret', 'key', 'auth', 'credit', 'card', 'cvv', 'cvc', 'ssn', 'cpf', 'rg', 'cnpj'];
  for (var i = 0; i < sensitivePatterns.length; i++) { if (key.indexOf(sensitivePatterns[i]) !== -1) return true; }
  return false;
}

function sanitizeContext(context: string | Record<string, unknown>) { if (!context || typeof context !== 'object') return {}; return sanitizeObject(context as Record<string, unknown>, 0); }
function truncate(str: string, maxLen: number) { if (typeof str !== 'string') return str; if (str.length <= maxLen) return str; return str.substring(0, maxLen) + '...'; }
