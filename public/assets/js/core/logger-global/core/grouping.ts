// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-grouping
// PURPOSE: Logger Global - Console Grouping v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   openGroup() — exported function
//   closeGroup() — exported function
//   closeAllGroups() — exported function
//   shouldAutoGroup() — exported function
//   incrementGroupLogCount() — exported function
//   group() — exported function
//   groupCollapsed() — exported function
//   initGrouping() — exported function
//   setGroupingEnabled() — exported function
//   isGroupingEnabled() — exported function
//   getGroupingConfig() — exported function
//   getGroupingStats() — exported function
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
export const MODULE_ID = 'logger-global-grouping';

var _config = {
  enabled: true,
  autoGroupByComponent: true,
  autoGroupByCorrelationId: true,
  collapseByDefault: true,
  maxOpenGroups: 5,
  autoCloseAfterMs: 5000
};

var _activeGroups = new Map();
var _groupTimers = new Map();
var _stats = {
  groupsOpened: 0,
  groupsClosed: 0,
  logsGrouped: 0
};

// Abre um grupo
export function openGroup(groupId: unknown, label: string, collapsed: unknown) {
  if (!_config.enabled) return false;
  if (typeof console.group !== 'function') return false;
  
  // Fecha grupos antigos se excedeu limite
  while (_activeGroups.size >= _config.maxOpenGroups) {
    var oldest = _activeGroups.keys().next().value;
    closeGroup(oldest);
  }
  
  try {
    if (collapsed || _config.collapseByDefault) {
      console.groupCollapsed(label || groupId);
    } else {
      console.group(label || groupId);
    }
    
    _activeGroups.set(groupId, {
      label: label,
      openedAt: Date.now(),
      logCount: 0
    });
    
    _stats.groupsOpened++;
    
    // Timer para auto-close
    if (_config.autoCloseAfterMs > 0) {
      var timer = setTimeout(function() {
        closeGroup(groupId);
      }, _config.autoCloseAfterMs);
      _groupTimers.set(groupId, timer);
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

// Fecha um grupo
export function closeGroup(groupId: unknown) {
  if (!_activeGroups.has(groupId)) return false;
  
  try {
    console.groupEnd();
    
    var group = _activeGroups.get(groupId);
    _activeGroups.delete(groupId);
    _stats.groupsClosed++;
    
    // Limpa timer
    var timer = _groupTimers.get(groupId);
    if (timer) {
      clearTimeout(timer);
      _groupTimers.delete(groupId);
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

// Fecha todos os grupos
export function closeAllGroups() {
  var closed = 0;
  _activeGroups.forEach(function(value, key) {
    if (closeGroup(key)) closed++;
  });
  return closed;
}

// Verifica se deve agrupar automaticamente
export function shouldAutoGroup(entry: Record<string, unknown>) {
  if (!_config.enabled) return null;
  
  // Por correlationId
  if (_config.autoGroupByCorrelationId && entry.correlationId) {
    var cid = entry.correlationId;
    if (!_activeGroups.has('cid:' + cid)) {
      return {
        groupId: 'cid:' + cid,
        label: '📋 Correlation: ' + (cid as string).substring(0, 12)
      };
    }
  }
  
  // Por componente (para sequência de logs do mesmo componente)
  if (_config.autoGroupByComponent && entry.component) {
    var compKey = 'comp:' + entry.component;
    if (!_activeGroups.has(compKey)) {
      // Só abre grupo se tiver múltiplos logs próximos
      return null; // Desabilitado por padrão para evitar ruído
    }
  }
  
  return null;
}

// Incrementa contador de logs no grupo
export function incrementGroupLogCount(groupId: unknown) {
  var group = _activeGroups.get(groupId);
  if (group) {
    group.logCount++;
    _stats.logsGrouped++;
    
    // Reset timer
    var timer = _groupTimers.get(groupId);
    if (timer) {
      clearTimeout(timer);
      timer = setTimeout(function() {
        closeGroup(groupId);
      }, _config.autoCloseAfterMs);
      _groupTimers.set(groupId, timer);
    }
  }
}

// API manual para grupos customizados
export function group(label: string) {
  var groupId = 'manual:' + Date.now();
  openGroup(groupId, label, false);
  return {
    id: groupId,
    end: function() { closeGroup(groupId); }
  };
}

export function groupCollapsed(label: string) {
  var groupId = 'manual:' + Date.now();
  openGroup(groupId, label, true);
  return {
    id: groupId,
    end: function() { closeGroup(groupId); }
  };
}

// Config
export function initGrouping(config: Record<string, unknown>) {
  config = config || {};
  if (config.enabled !== undefined) _config.enabled = config.enabled as boolean;
  if (config.autoGroupByComponent !== undefined) _config.autoGroupByComponent = config.autoGroupByComponent as boolean;
  if (config.autoGroupByCorrelationId !== undefined) _config.autoGroupByCorrelationId = config.autoGroupByCorrelationId as boolean;
  if (config.collapseByDefault !== undefined) _config.collapseByDefault = config.collapseByDefault as boolean;
  if (config.maxOpenGroups) _config.maxOpenGroups = config.maxOpenGroups as number;
  if (config.autoCloseAfterMs !== undefined) _config.autoCloseAfterMs = config.autoCloseAfterMs as number;
  
  return { ok: true, config: getGroupingConfig() };
}

export function setGroupingEnabled(enabled: boolean) {
  _config.enabled = enabled;
  if (!enabled) {
    closeAllGroups();
  }
}

export function isGroupingEnabled() {
  return _config.enabled;
}

export function getGroupingConfig() {
  return { ..._config };
}

export function getGroupingStats() {
  var activeList: unknown[] = [];
  _activeGroups.forEach(function(g, id) {
    activeList.push({ id: id, label: g.label, logCount: g.logCount });
  });
  
  return {
    enabled: _config.enabled,
    activeGroups: activeList,
    groupsOpened: _stats.groupsOpened,
    groupsClosed: _stats.groupsClosed,
    logsGrouped: _stats.logsGrouped
  };
}

export function healthCheck() {
  return {
    status: _config.enabled ? 'HEALTHY' : 'DISABLED',
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    activeGroups: _activeGroups.size
  };
}
