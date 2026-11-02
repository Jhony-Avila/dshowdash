// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-replay
// PURPOSE: Logger Global - Log Replay v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setBufferRef() — exported function
//   replay() — exported function
//   replayLast() — exported function
//   replayErrors() — exported function
//   replayComponent() — exported function
//   replayCorrelation() — exported function
//   replaySince() — exported function
//   search() — exported function
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
export const MODULE_ID = 'logger-global-replay';

// Referência ao buffer (será injetada)
var _bufferRef: Record<string, unknown> | null = null;

// Configura referência ao buffer
export function setBufferRef(bufferModule: Record<string, unknown>) {
  _bufferRef = bufferModule;
}

// Replay de logs com filtros
export function replay(filter: Record<string, unknown>) {
  filter = filter || {};
  
  if (!_bufferRef || typeof (_bufferRef as Record<string, unknown>).getBuffer !== 'function') {
    console.warn('[Logger Replay] Buffer não disponível');
    return { ok: false, reason: 'buffer-not-available' };
  }

  var logs = (_bufferRef as Record<string, (...args: unknown[]) => unknown>).getBuffer() as Record<string, unknown>[];
  var filtered = filterLogs(logs, filter);
  
  if (filtered.length === 0) {
    console.info('[Logger Replay] Nenhum log encontrado com os filtros aplicados');
    return { ok: true, replayed: 0 };
  }
  
  console.group('📜 Logger Replay (' + filtered.length + ' logs)');
  
  filtered.forEach(function(entry: Record<string, unknown>, index: number) {
    replayEntry(entry, index);
  });
  
  console.groupEnd();
  
  return { ok: true, replayed: filtered.length, total: (logs as Record<string, unknown>[]).length };
}

// Filtra logs
function filterLogs(logs: Record<string, unknown>[], filter: Record<string, unknown>) {
  return logs.filter(function(entry: Record<string, unknown>) {
    // Filtro por nível
    if (filter.level) {
      if (Array.isArray(filter.level)) {
        if (filter.level.indexOf(entry.level) === -1) return false;
      } else {
        if (entry.level !== filter.level) return false;
      }
    }
    
    // Filtro por componente
    if (filter.component) {
      if ((entry.component as string).indexOf(filter.component as string) === -1) return false;
    }
    
    // Filtro por mensagem (regex ou string)
    if (filter.message) {
      if (filter.message instanceof RegExp) {
        if (!filter.message.test(entry.message as string)) return false;
      } else {
        if ((entry.message as string).indexOf(filter.message as string) === -1) return false;
      }
    }
    
    // Filtro por tempo (últimos N ms)
    if (filter.since) {
      var since = typeof filter.since === 'number' ? filter.since : Date.now() - (filter.since as number);
      if ((entry.timestamp as number) < since) return false;
    }
    
    // Filtro por correlationId
    if (filter.correlationId) {
      if (entry.correlationId !== filter.correlationId) return false;
    }
    
    // Limite
    if (filter.limit && logs.indexOf(entry) >= (filter.limit as number)) return false;
    
    return true;
  });
}

// Exibe uma entrada
function replayEntry(entry: Record<string, unknown>, index: number) {
  var time = new Date(entry.timestamp as number).toLocaleTimeString();
  var prefix = '[' + time + '] [' + (entry.level as string).toUpperCase() + '] [' + entry.component + ']';
  
  var args = [prefix, entry.message];
  if (entry.context && Object.keys(entry.context).length > 0) {
    args.push(entry.context);
  }
  
  switch (entry.level) {
    case 'error':
    case 'critical':
      console.error.apply(console, args);
      break;
    case 'warn':
      console.warn.apply(console, args);
      break;
    case 'debug':
    case 'trace':
      console.debug.apply(console, args);
      break;
    default:
      console.log.apply(console, args);
  }
}

// Replay rápido - últimos N logs
export function replayLast(count: number) {
  count = count || 20;
  
  if (!_bufferRef) {
    console.warn('[Logger Replay] Buffer não disponível');
    return { ok: false };
  }
  
  var logs = (_bufferRef as Record<string, (...args: unknown[]) => unknown>).getRecentLogs(count) as Record<string, unknown>[];
  
  console.group('📜 Últimos ' + logs.length + ' logs');
  logs.forEach(function(entry: Record<string, unknown>, i: number) { replayEntry(entry, i); });
  console.groupEnd();
  
  return { ok: true, replayed: logs.length };
}

// Replay apenas erros
export function replayErrors() {
  return replay({ level: ['error', 'critical'] });
}

// Replay por componente
export function replayComponent(componentName: string) {
  return replay({ component: componentName });
}

// Replay por correlationId
export function replayCorrelation(correlationId: string) {
  return replay({ correlationId: correlationId });
}

// Replay desde timestamp
export function replaySince(timestampOrMs: number) {
  var since;
  if (typeof timestampOrMs === 'number' && timestampOrMs < 1000000000000) {
    // É ms relativo
    since = Date.now() - timestampOrMs;
  } else {
    since = timestampOrMs;
  }
  return replay({ since: since });
}

// Busca no buffer (sem exibir)
export function search(filter: Record<string, unknown>) {
  if (!_bufferRef) {
    return [];
  }
  
  var logs = (_bufferRef as Record<string, (...args: unknown[]) => unknown>).getBuffer() as Record<string, unknown>[];
  return filterLogs(logs, filter);
}

export function healthCheck() {
  return {
    status: _bufferRef ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    bufferAvailable: !!_bufferRef
  };
}
