// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-spans
// PURPOSE: Logger Global - Trace Spans v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   startSpan() — exported function
//   endSpan() — exported function
//   getCurrentSpanId() — exported function
//   getSpan() — exported function
//   getActiveSpans() — exported function
//   getCompletedSpans() — exported function
//   withSpan() — exported function
//   getSpanStats() — exported function
//   resetSpanStats() — exported function
//   clearCompletedSpans() — exported function
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

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'logger-global-spans';

// Spans ativos
var _activeSpans = new Map();
var _completedSpans: unknown[] = [];
var MAX_COMPLETED_SPANS = 100;

var _stats = {
  spansStarted: 0,
  spansCompleted: 0,
  spansFailed: 0,
  totalDurationMs: 0
};

// Gera ID único para span
function generateSpanId() {
  return 'span-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
}

// Inicia um novo span
export function startSpan(name: string, context: string | Record<string, unknown>) {
  context = context || {} as Record<string, unknown>;
  var spanId = generateSpanId();
  var parentId = (context as Record<string, unknown>).parentSpanId || getCurrentSpanId();
  
  var span = {
    id: spanId,
    name: name,
    parentId: parentId,
    startTime: Date.now(),
    endTime: null as unknown | null,
    duration: null as unknown | null,
    status: 'active',
    context: context,
    events: [] as unknown[],
    attributes: {}
  };
  
  _activeSpans.set(spanId, span);
  _stats.spansStarted++;
  
  // Retorna objeto com métodos de controle
  return {
    id: spanId,
    
    // Adiciona evento ao span
    addEvent: function(eventName: string, data: Record<string, unknown>) {
      var s = _activeSpans.get(spanId);
      if (s) {
        s.events.push({
          name: eventName,
          timestamp: Date.now(),
          data: data || {}
        });
      }
      return this;
    },
    
    // Define atributo
    setAttribute: function(key: string, value: unknown) {
      var s = _activeSpans.get(spanId);
      if (s) {
        s.attributes[key] = value;
      }
      return this;
    },
    
    // Define múltiplos atributos
    setAttributes: function(attrs: Record<string, unknown>) {
      var s = _activeSpans.get(spanId);
      if (s && attrs) {
        for (var key in attrs) {
          if (attrs.hasOwnProperty(key)) {
            s.attributes[key] = attrs[key];
          }
        }
      }
      return this;
    },
    
    // Finaliza com sucesso
    end: function(finalContext: Record<string, unknown>) {
      return endSpan(spanId, 'success', finalContext);
    },
    
    // Finaliza com erro
    fail: function(error: Error) {
      return endSpan(spanId, 'error', { error: error });
    },
    
    // Obtém duração parcial
    elapsed: function() {
      var s = _activeSpans.get(spanId);
      return s ? Date.now() - s.startTime : 0;
    }
  };
}

// Finaliza um span
export function endSpan(spanId: string, status: string | number, finalContext: Record<string, unknown>) {
  var span = _activeSpans.get(spanId);
  if (!span) {
    return { ok: false, reason: 'span-not-found' };
  }
  
  span.endTime = Date.now();
  span.duration = span.endTime - span.startTime;
  span.status = status || 'success';
  
  if (finalContext) {
    for (var key in finalContext) {
      if (finalContext.hasOwnProperty(key)) {
        span.context[key] = finalContext[key];
      }
    }
  }
  
  // Move para completados
  _activeSpans.delete(spanId);
  _completedSpans.push(span);
  
  // Mantém limite de spans completados
  while (_completedSpans.length > MAX_COMPLETED_SPANS) {
    _completedSpans.shift();
  }
  
  if (status as string === 'error') {
    _stats.spansFailed++;
  } else {
    _stats.spansCompleted++;
  }
  _stats.totalDurationMs += span.duration;
  
  return {
    ok: true,
    span: {
      id: span.id,
      name: span.name,
      duration: span.duration,
      status: span.status
    }
  };
}

// Obtém span ativo atual (último criado)
export function getCurrentSpanId() {
  var lastKey = null;
  _activeSpans.forEach(function(value, key) {
    lastKey = key;
  });
  return lastKey;
}

// Obtém span por ID
export function getSpan(spanId: string) {
  return _activeSpans.get(spanId) || null;
}

// Lista spans ativos
export function getActiveSpans() {
  var result: unknown[] = [];
  _activeSpans.forEach(function(span) {
    result.push({
      id: span.id,
      name: span.name,
      elapsed: Date.now() - span.startTime,
      status: span.status
    });
  });
  return result;
}

// Lista spans completados recentes
export function getCompletedSpans(limit: number) {
  limit = limit || 10;
  // @ts-expect-error strict migration — TS2345
  return _completedSpans.slice(-limit).map(function(span: Record<string, unknown>) {
    return {
      id: span.id,
      name: span.name,
      duration: span.duration,
      status: span.status,
      startTime: span.startTime,
      endTime: span.endTime
    };
  });
}

// Wrapper para medir função async
export function withSpan(name: string, fn: (...args: unknown[]) => unknown, context: string | Record<string, unknown>) {
  var span = startSpan(name, context);

  try {
    var result = fn();

    // Se é Promise
    if (result && typeof (result as Record<string, unknown>).then === 'function') {
      return (result as Promise<unknown>)
        .then(function(res: unknown) {
          span.end({ result: 'success' });
          return res;
        })
        .catch(function(err: Error) {
          span.fail(err);
          throw err;
        });
    }

    // Síncrono
    span.end({ result: 'success' });
    return result;
  } catch (err) {
    span.fail(err as Error);
    throw err;
  }
}

// Stats
export function getSpanStats() {
  var avgDuration = _stats.spansCompleted > 0 
    ? Math.round(_stats.totalDurationMs / _stats.spansCompleted) 
    : 0;
  
  return {
    activeSpans: _activeSpans.size,
    completedSpans: _completedSpans.length,
    spansStarted: _stats.spansStarted,
    spansCompleted: _stats.spansCompleted,
    spansFailed: _stats.spansFailed,
    avgDurationMs: avgDuration,
    totalDurationMs: _stats.totalDurationMs
  };
}

export function resetSpanStats() {
  _stats = {
    spansStarted: 0,
    spansCompleted: 0,
    spansFailed: 0,
    totalDurationMs: 0
  };
}

// Limpa spans antigos
export function clearCompletedSpans() {
  var count = _completedSpans.length;
  _completedSpans = [];
  return count;
}

export function healthCheck() {
  return {
    status: _stats.spansFailed > 0 ? 'DEGRADED' : 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    activeSpans: _activeSpans.size,
    completedSpans: _completedSpans.length,
    stats: getSpanStats()
  };
}
