// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-buffer
// PURPOSE: Logger Global - Circular Buffer v4.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isValidLogEntry from ../core/formatter.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   pushToBuffer() — exported function
//   getBuffer() — exported function
//   getBufferByLevel() — exported function
//   getBufferByComponent() — exported function
//   clearBuffer() — exported function
//   flushBuffer() — exported function
//   getRecentLogs() — exported function
//   getOldestLogs() — exported function
//   searchBuffer() — exported function
//   getBufferStats() — exported function
//   isBufferFull() — exported function
//   getBufferSize() — exported function
//   getBufferCapacity() — exported function
//   setMaxBufferSize() — exported function
//   peekLatest() — exported function
//   peekOldest() — exported function
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

import { isValidLogEntry } from '../core/formatter.js';

export const VERSION = '4.0.0-ENTERPRISE';
export const MODULE_ID = 'logger-global-buffer';

export function getVersion() {
  return VERSION;
}

// Configuração do Ring Buffer
var MAX_BUFFER_SIZE = 500;

// Ring Buffer Implementation
var _buffer = new Array(MAX_BUFFER_SIZE);
var _head = 0; // Próxima posição para escrita
var _tail = 0; // Posição mais antiga
var _count = 0; // Quantidade atual de itens
var _totalAdded = 0;
var _totalOverwritten = 0;

var _stats = {
  totalAdded: 0,
  totalDiscarded: 0,
  overwrites: 0,
  lastFlush: null as number | null,
  lastPush: null as number | null
};

// Push para o ring buffer (O(1))
export function pushToBuffer(logEntry: Record<string, unknown>) {
  if (!isValidLogEntry(logEntry)) return false;

  try {
    var entry = {
      ...(logEntry as Record<string, unknown>),
      bufferedAt: Date.now(),
      bufferIndex: _totalAdded
    };
    
    // Se buffer cheio, sobrescreve o mais antigo
    if (_count >= MAX_BUFFER_SIZE) {
      _stats.overwrites++;
      _stats.totalDiscarded++;
      _tail = (_tail + 1) % MAX_BUFFER_SIZE;
    } else {
      _count++;
    }
    
    _buffer[_head] = entry;
    _head = (_head + 1) % MAX_BUFFER_SIZE;
    
    _stats.totalAdded++;
    _stats.lastPush = Date.now();
    _totalAdded++;
    
    return true;
  } catch (e) {
    return false;
  }
}

// Obtém todos os logs em ordem cronológica
export function getBuffer() {
  if (_count === 0) return [];
  
  var result = [];
  var index = _tail;
  
  for (var i = 0; i < _count; i++) {
    if (_buffer[index]) {
      result.push(_buffer[index]);
    }
    index = (index + 1) % MAX_BUFFER_SIZE;
  }
  
  return result;
}

// Obtém logs por nível
export function getBufferByLevel(level: string) {
  return getBuffer().filter(function(entry) {
    return entry.level === level;
  });
}

// Obtém logs por componente
export function getBufferByComponent(component: string) {
  return getBuffer().filter(function(entry) {
    return entry.component === component;
  });
}

// Limpa o buffer
export function clearBuffer() {
  var count = _count;
  _buffer = new Array(MAX_BUFFER_SIZE);
  _head = 0;
  _tail = 0;
  _count = 0;
  _stats.lastFlush = Date.now();
  return count;
}

// Flush - retorna e limpa
export function flushBuffer() {
  var flushed = getBuffer();
  clearBuffer();
  return flushed;
}

// Obtém últimos N logs
export function getRecentLogs(count: number) {
  count = count || 10;
  var all = getBuffer();
  return all.slice(-count);
}

// Obtém primeiro N logs
export function getOldestLogs(count: number) {
  count = count || 10;
  var all = getBuffer();
  return all.slice(0, count);
}

// Busca no buffer
export function searchBuffer(predicate: (entry: unknown, index: number, array: unknown[]) => boolean) {
  return getBuffer().filter(predicate);
}

// Stats
export function getBufferStats() {
  return {
    currentSize: _count,
    maxSize: MAX_BUFFER_SIZE,
    utilizationPercent: Math.round((_count / MAX_BUFFER_SIZE) * 100),
    totalAdded: _stats.totalAdded,
    totalDiscarded: _stats.totalDiscarded,
    overwrites: _stats.overwrites,
    dropped: _stats.totalDiscarded,
    lastFlush: _stats.lastFlush,
    lastPush: _stats.lastPush,
    headPosition: _head,
    tailPosition: _tail,
    isCircular: true
  };
}

export function isBufferFull() {
  return _count >= MAX_BUFFER_SIZE;
}

export function getBufferSize() {
  return _count;
}

export function getBufferCapacity() {
  return MAX_BUFFER_SIZE;
}

// Configura tamanho máximo (recreia buffer)
export function setMaxBufferSize(size: number) {
  if (size < 10 || size > 10000) {
    return { ok: false, reason: 'Size must be between 10 and 10000' };
  }
  
  var oldBuffer = getBuffer();
  MAX_BUFFER_SIZE = size;
  _buffer = new Array(MAX_BUFFER_SIZE);
  _head = 0;
  _tail = 0;
  _count = 0;
  
  // Reimporta últimos logs que cabem
  var toRestore = oldBuffer.slice(-size);
  toRestore.forEach(function(entry) {
    pushToBuffer(entry);
  });
  
  return { ok: true, newSize: size, restored: toRestore.length };
}

// Iterator para uso com for...of
export function* iterate() {
  var index = _tail;
  for (var i = 0; i < _count; i++) {
    if (_buffer[index]) {
      yield _buffer[index];
    }
    index = (index + 1) % MAX_BUFFER_SIZE;
  }
}

// Peek no mais recente sem remover
export function peekLatest() {
  if (_count === 0) return null;
  var latestIndex = (_head - 1 + MAX_BUFFER_SIZE) % MAX_BUFFER_SIZE;
  return _buffer[latestIndex];
}

// Peek no mais antigo sem remover
export function peekOldest() {
  if (_count === 0) return null;
  return _buffer[_tail];
}

export function healthCheck() {
  var utilization = Math.round((_count / MAX_BUFFER_SIZE) * 100);
  return {
    status: utilization > 90 ? 'WARNING' : 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    size: _count,
    capacity: MAX_BUFFER_SIZE,
    utilization: utilization + '%',
    isCircular: true,
    overwrites: _stats.overwrites
  };
}
