
// Capability Manager - Governança de Capacidades em Runtime
// @version 1.1.0-HEALTH-CONTRACT
// @description Gerencia habilitação/desabilitação de capacidades do sistema
// @changelog v1.1.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   CAPABILITIES, CAPABILITY_DEFAULTS, KERNEL_EVENTS,
//   getDefaultCapabilities from ./constants.js
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
//
// RECEIVES (via createCapabilityManager options):
//   options.initialMode — Initial kernel mode
//   options.eventBus    — EventBus for capability events
//   options.logger      — Logger instance
//
// EMITS (via eventBus):
//   KERNEL_EVENTS.CAPABILITY_ENABLED  — Capability was enabled
//   KERNEL_EVENTS.CAPABILITY_DISABLED — Capability was disabled
//   KERNEL_EVENTS.CAPABILITY_CHANGE   — Any capability change
//
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  CAPABILITIES,
  CAPABILITY_DEFAULTS,
  KERNEL_EVENTS,
  getDefaultCapabilities
} from './constants.js';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

var MODULE_ID = 'capability-manager';
var VERSION = '1.1.0-HEALTH-CONTRACT';

interface CapabilityManagerOptions {
  initialMode?: string;
  eventBus?: { emit?: (event: string, data: Record<string, unknown>) => void } | null;
  logger?: Record<string, Function> | null;
}

interface CapabilityHistoryEntry {
  action: string;
  capability: string;
  value: boolean | string | null;
  reason: string | null;
  mode: string;
  timestamp: number;
}

type CapabilityListener = (payload: { event: string; data: Record<string, unknown>; timestamp: number }) => void;

function createCapabilityManager(options: CapabilityManagerOptions) {
  if (options === undefined) options = {};

  var _mode = options.initialMode || 'INITIALIZING';
  var _capabilities: Record<string, boolean> = getDefaultCapabilities(_mode);
  var _overrides: Record<string, boolean> = {};
  var _listeners: CapabilityListener[] = [];
  var _history: CapabilityHistoryEntry[] = [];
  var _eventBus = options.eventBus || null;

  function _log(level: string, message: string, data?: Record<string, unknown>) {
    if (options.logger && options.logger[level]) {
      options.logger[level]('[' + MODULE_ID + '] ' + message, data);
    }
  }

  function _emit(event: string, data: Record<string, unknown>) {
    if (_eventBus && _eventBus.emit) {
      try {
        _eventBus.emit(event, Object.assign({ timestamp: Date.now() }, data));
      } catch (e) {}
    }
    
    for (var i = 0; i < _listeners.length; i++) {
      try {
        _listeners[i]({ event: event, data: data, timestamp: Date.now() });
      } catch (e) {}
    }
  }

  function _recordHistory(action: string, capability: string, value: boolean | string | null, reason: string) {
    var entry = {
      action: action,
      capability: capability,
      value: value,
      reason: reason || null,
      mode: _mode,
      timestamp: Date.now()
    };
    _history.push(entry);
    if (_history.length > 100) {
      _history.shift();
    }
  }

  // Verificar se capacidade existe
  function isValidCapability(capability: string) {
    return CAPABILITIES.hasOwnProperty(capability);
  }

  // Obter estado atual de uma capacidade
  function isEnabled(capability: string) {
    if (!isValidCapability(capability)) {
      _log('warn', 'Unknown capability: ' + capability);
      return false;
    }
    
    if (_overrides.hasOwnProperty(capability)) {
      return _overrides[capability];
    }
    
    return _capabilities[capability] || false;
  }

  // Alias para isEnabled
  function isCapabilityEnabled(capability: string) {
    return isEnabled(capability);
  }

  // Habilitar capacidade
  function enable(capability: string, reason: string) {
    if (!isValidCapability(capability)) {
      _log('warn', 'Cannot enable unknown capability: ' + capability);
      return { success: false, error: 'UNKNOWN_CAPABILITY' };
    }

    var wasEnabled = isEnabled(capability);
    _overrides[capability] = true;
    
    if (!wasEnabled) {
      _recordHistory('enable', capability, true, reason);
      _log('info', 'Capability enabled: ' + capability, { reason: reason });
      _emit(KERNEL_EVENTS.CAPABILITY_ENABLED, { capability: capability, reason: reason });
      _emit(KERNEL_EVENTS.CAPABILITY_CHANGE, { capability: capability, enabled: true, reason: reason });
    }

    return { success: true, capability: capability, enabled: true };
  }

  // Desabilitar capacidade
  function disable(capability: string, reason: string) {
    if (!isValidCapability(capability)) {
      _log('warn', 'Cannot disable unknown capability: ' + capability);
      return { success: false, error: 'UNKNOWN_CAPABILITY' };
    }

    var wasEnabled = isEnabled(capability);
    _overrides[capability] = false;
    
    if (wasEnabled) {
      _recordHistory('disable', capability, false, reason);
      _log('info', 'Capability disabled: ' + capability, { reason: reason });
      _emit(KERNEL_EVENTS.CAPABILITY_DISABLED, { capability: capability, reason: reason });
      _emit(KERNEL_EVENTS.CAPABILITY_CHANGE, { capability: capability, enabled: false, reason: reason });
    }

    return { success: true, capability: capability, enabled: false };
  }

  // Alternar capacidade
  function toggle(capability: string, reason: string) {
    if (isEnabled(capability)) {
      return disable(capability, reason);
    } else {
      return enable(capability, reason);
    }
  }

  // Limpar override de uma capacidade (volta ao padrão do modo)
  function clearOverride(capability: string) {
    if (_overrides.hasOwnProperty(capability)) {
      delete _overrides[capability];
      _recordHistory('clear-override', capability, _capabilities[capability], 'reset to mode default');
      _log('info', 'Capability override cleared: ' + capability);
      return { success: true, capability: capability, value: _capabilities[capability] };
    }
    return { success: false, error: 'NO_OVERRIDE' };
  }

  // Limpar todos os overrides
  function clearAllOverrides() {
    var count = Object.keys(_overrides).length;
    _overrides = {};
    _recordHistory('clear-all-overrides', '*', null, 'reset all to mode defaults');
    _log('info', 'All capability overrides cleared', { count: count });
    return { success: true, clearedCount: count };
  }

  // Atualizar modo (recalcula capacidades base)
  function setMode(newMode: string) {
    var oldMode = _mode;
    _mode = newMode;
    _capabilities = getDefaultCapabilities(newMode);
    _recordHistory('mode-change', '*', newMode, 'mode updated from ' + oldMode);
    _log('info', 'Capability mode updated', { from: oldMode, to: newMode });
    return { success: true, mode: newMode, capabilities: getAll() };
  }

  // Obter todas as capacidades com estado atual
  function getAll() {
    var result: Record<string, { enabled: boolean; default: boolean; overridden: boolean }> = {};
    var keys = Object.keys(CAPABILITIES);
    for (var i = 0; i < keys.length; i++) {
      var cap = keys[i];
      result[cap] = {
        enabled: isEnabled(cap),
        default: _capabilities[cap] || false,
        overridden: _overrides.hasOwnProperty(cap)
      };
    }
    return result;
  }

  // Obter apenas capacidades habilitadas
  function getEnabled() {
    var result = [];
    var keys = Object.keys(CAPABILITIES);
    for (var i = 0; i < keys.length; i++) {
      if (isEnabled(keys[i])) {
        result.push(keys[i]);
      }
    }
    return result;
  }

  // Obter apenas capacidades desabilitadas
  function getDisabled() {
    var result = [];
    var keys = Object.keys(CAPABILITIES);
    for (var i = 0; i < keys.length; i++) {
      if (!isEnabled(keys[i])) {
        result.push(keys[i]);
      }
    }
    return result;
  }

  // Obter histórico de mudanças
  function getHistory() {
    return _history.slice();
  }

  // Subscrever para mudanças
  function subscribe(callback: CapabilityListener) {
    if (typeof callback === 'function') {
      _listeners.push(callback);
      return function unsubscribe() {
        var idx = _listeners.indexOf(callback);
        if (idx !== -1) _listeners.splice(idx, 1);
      };
    }
    return function() {};
  }

  // Verificações de conveniência
  function canNavigate() { return isEnabled(CAPABILITIES.NAVIGATION); }
  function canAuthenticate() { return isEnabled(CAPABILITIES.AUTH); }
  function canShowUI() { return isEnabled(CAPABILITIES.UI_COMPONENTS); }
  function canShowShell() { return isEnabled(CAPABILITIES.SHELL); }
  function canShowMainContent() { return isEnabled(CAPABILITIES.MAIN_CONTENT); }
  function canUseTelemetry() { return isEnabled(CAPABILITIES.TELEMETRY); }

  // Reset
  function reset() {
    _mode = 'INITIALIZING';
    _capabilities = getDefaultCapabilities(_mode);
    _overrides = {};
    _listeners = [];
    _history = [];
  }

  // Info
  function info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      mode: _mode,
      totalCapabilities: Object.keys(CAPABILITIES).length,
      enabledCount: getEnabled().length,
      disabledCount: getDisabled().length,
      overrideCount: Object.keys(_overrides).length,
      historyLength: _history.length,
      listeners: _listeners.length
    };
  }

  // Health check
  function healthCheck() {
    return createHealthResult({
      status: HEALTH_STATUS.HEALTHY,
      moduleId: MODULE_ID,
      version: VERSION,
      checks: {
        managerActive: true,
        modeSet: !!_mode,
        capabilitiesLoaded: Object.keys(CAPABILITIES).length > 0
      },
      details: {
        mode: _mode,
        enabledCapabilities: getEnabled().length,
        disabledCapabilities: getDisabled().length,
        overrideCount: Object.keys(_overrides).length
      }
    });
  }

  return {
    // Core
    isEnabled: isEnabled,
    isCapabilityEnabled: isCapabilityEnabled,
    enable: enable,
    disable: disable,
    toggle: toggle,
    clearOverride: clearOverride,
    clearAllOverrides: clearAllOverrides,
    setMode: setMode,
    
    // Queries
    isValidCapability: isValidCapability,
    getAll: getAll,
    getEnabled: getEnabled,
    getDisabled: getDisabled,
    getHistory: getHistory,
    
    // Convenience
    canNavigate: canNavigate,
    canAuthenticate: canAuthenticate,
    canShowUI: canShowUI,
    canShowShell: canShowShell,
    canShowMainContent: canShowMainContent,
    canUseTelemetry: canUseTelemetry,
    
    // Lifecycle
    subscribe: subscribe,
    reset: reset,
    info: info,
    healthCheck: healthCheck,
    
    // Constants
    CAPABILITIES: CAPABILITIES
  };
}

export { createCapabilityManager, MODULE_ID, VERSION };

export default {
  createCapabilityManager: createCapabilityManager,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
