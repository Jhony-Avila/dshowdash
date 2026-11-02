// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-deduplication
// PURPOSE: Logger Global - Error Deduplication v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   checkDuplicate() — exported function
//   getDedupSummary() — exported function
//   flushDuplicates() — exported function
//   initDeduplication() — exported function
//   setDedupEnabled() — exported function
//   isDedupEnabled() — exported function
//   getDedupConfig() — exported function
//   getDedupStats() — exported function
//   resetDedupStats() — exported function
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
export const MODULE_ID = 'logger-global-deduplication';

var _config = {
  enabled: true,
  windowMs: 60000, // 1 minuto
  maxEntries: 100,
  levelsToDedup: ['error', 'critical', 'warn']
};

// Cache de mensagens com hash
var _dedupCache = new Map();
var _stats = {
  totalDeduplicated: 0,
  uniqueErrors: 0,
  byMessage: {}
};

// Gera hash simples da mensagem
function hashMessage(message: string, component: string) {
  var str = (component || '') + ':' + (message || '');
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h' + Math.abs(hash).toString(36);
}

// Verifica se é duplicata e retorna info
export function checkDuplicate(entry: Record<string, unknown>) {
  if (!_config.enabled) {
    return { isDuplicate: false };
  }
  
  if (_config.levelsToDedup.indexOf(entry.level as string) === -1) {
    return { isDuplicate: false };
  }
  
  var hash = hashMessage(entry.message as string, entry.component as string);
  var now = Date.now();
  
  // Verifica cache
  var cached = _dedupCache.get(hash);
  
  if (cached) {
    // Verifica se ainda está na janela
    if (now - cached.firstSeen < _config.windowMs) {
      cached.count++;
      cached.lastSeen = now;
      _stats.totalDeduplicated++;
      
      // @ts-expect-error strict migration — TS7053
      if (!_stats.byMessage[hash]) {
        // @ts-expect-error TS migration - TS7053
        _stats.byMessage[hash] = { message: entry.message.substring(0, 50), count: 0 };
      }
      // @ts-expect-error strict migration — TS7053
      _stats.byMessage[hash].count++;
      
      return {
        isDuplicate: true,
        hash: hash,
        count: cached.count,
        firstSeen: cached.firstSeen,
        suppressUntil: cached.firstSeen + _config.windowMs
      };
    } else {
      // Janela expirou, reseta
      _dedupCache.delete(hash);
    }
  }
  
  // Nova entrada
  _dedupCache.set(hash, {
    hash: hash,
    message: entry.message,
    component: entry.component,
    level: entry.level,
    count: 1,
    firstSeen: now,
    lastSeen: now
  });
  
  _stats.uniqueErrors++;
  
  // Limpa entradas antigas se excedeu limite
  if (_dedupCache.size > _config.maxEntries) {
    cleanupOldEntries();
  }
  
  return { isDuplicate: false, hash: hash };
}

// Limpa entradas antigas
function cleanupOldEntries() {
  var now = Date.now();
  var toDelete: unknown[] = [];
  
  _dedupCache.forEach(function(value, key) {
    if (now - value.lastSeen > _config.windowMs) {
      toDelete.push(key);
    }
  });
  
  toDelete.forEach(function(key) {
    _dedupCache.delete(key);
  });
}

// Obtém resumo de erros agrupados
export function getDedupSummary() {
  var summary: unknown[] = [];
  
  _dedupCache.forEach(function(entry) {
    if (entry.count > 1) {
      summary.push({
        hash: entry.hash,
        message: entry.message.substring(0, 100),
        component: entry.component,
        level: entry.level,
        count: entry.count,
        firstSeen: entry.firstSeen,
        lastSeen: entry.lastSeen
      });
    }
  });
  
  // Ordena por count desc
  // @ts-expect-error strict migration — TS2345
  summary.sort(function(a: Record<string, unknown>, b: Record<string, unknown>) { return (b.count as number) - (a.count as number); });
  
  return summary;
}

// Força log mesmo se duplicado (para resumo periódico)
export function flushDuplicates() {
  var flushed = getDedupSummary();
  _dedupCache.clear();
  return flushed;
}

// Config
export function initDeduplication(config: Record<string, unknown>) {
  config = config || {};
  if (config.enabled !== undefined) _config.enabled = config.enabled as boolean;
  if (config.windowMs) _config.windowMs = config.windowMs as number;
  if (config.maxEntries) _config.maxEntries = config.maxEntries as number;
  if (Array.isArray(config.levelsToDedup)) _config.levelsToDedup = config.levelsToDedup as string[];
  
  return { ok: true, config: getDedupConfig() };
}

export function setDedupEnabled(enabled: boolean) {
  _config.enabled = enabled;
  if (!enabled) {
    _dedupCache.clear();
  }
}

export function isDedupEnabled() {
  return _config.enabled;
}

export function getDedupConfig() {
  return {
    enabled: _config.enabled,
    windowMs: _config.windowMs,
    maxEntries: _config.maxEntries,
    levelsToDedup: [..._config.levelsToDedup]
  };
}

export function getDedupStats() {
  return {
    enabled: _config.enabled,
    cacheSize: _dedupCache.size,
    totalDeduplicated: _stats.totalDeduplicated,
    uniqueErrors: _stats.uniqueErrors,
    topMessages: Object.values(_stats.byMessage as any)
      // @ts-expect-error strict migration — TS2345
      .sort(function(a: { count: number; message: string }, b: { count: number; message: string }) { return b.count - a.count; })
      .slice(0, 10)
  };
}

export function resetDedupStats() {
  _stats = {
    totalDeduplicated: 0,
    uniqueErrors: 0,
    byMessage: {}
  };
  _dedupCache.clear();
}

export function healthCheck() {
  return {
    status: _config.enabled ? 'HEALTHY' : 'DISABLED',
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    cacheSize: _dedupCache.size,
    totalDeduplicated: _stats.totalDeduplicated
  };
}
