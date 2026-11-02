// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-store
// PURPOSE: Theme Manager - Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ThemeStore — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Logger
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export var VERSION = '4.3.0-STRICT-MODE';
export var MODULE_ID = 'theme-store';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

var _log = function(level: string): void { var logger = _getPort('logger'); if (!logger) return; var args = Array.prototype.slice.call(arguments, 1); var prefix = '[' + MODULE_ID + ']'; if (level === 'error') { if ((logger as Record<string, unknown>).error) (logger as { error: (...a: unknown[]) => void }).error.apply(logger, [prefix].concat(args)); return; } if (level === 'warn') { if ((logger as Record<string, unknown>).warn) (logger as { warn: (...a: unknown[]) => void }).warn.apply(logger, [prefix].concat(args)); return; } };

export function getVersion(): string { return VERSION; }

type ThemeState = { currentTheme: string; source: string; lastChangedAt: number | null; isApplying: boolean; error: string | null };
var _state: ThemeState = { currentTheme: 'dark', source: 'default', lastChangedAt: null, isApplying: false, error: null };
var _listeners = new Set<(snapshot: ThemeState) => void>();

function cloneState(): ThemeState { return Object.assign({}, _state); }

// @ts-expect-error TS migration - TS2349, TS2554
function notifyListeners(): void { var snapshot = cloneState(); _listeners.forEach(function(listener) { try { listener(snapshot); } catch (error) { _log('error', 'Listener error:', error); } }); }

export var ThemeStore = {
  getState: function(): ThemeState { return cloneState(); },
  get: function(key: string): unknown { if (key in _state) return (_state as Record<string, unknown>)[key]; return undefined; },
  set: function(partial: Partial<ThemeState>): boolean {
    if (!partial || typeof partial !== 'object') return false;
    try {
      var changed = false;
      var prevTheme = _state.currentTheme;
      var prevSource = _state.source;
      var partialRecord = partial as Record<string, unknown>;
      for (var key in partialRecord) { if (key in _state && (_state as Record<string, unknown>)[key] !== partialRecord[key]) { (_state as Record<string, unknown>)[key] = partialRecord[key]; changed = true; } }
      if (_state.currentTheme !== prevTheme || _state.source !== prevSource) _state.lastChangedAt = Date.now();
      if (changed) notifyListeners();
      return changed;

    // @ts-expect-error TS migration - TS2554
    } catch (error) { _log('error', 'Set error:', error); return false; }
  },

  // @ts-expect-error TS migration - TS2554
  subscribe: function(listener: (snapshot: ThemeState) => void): () => void { if (typeof listener !== 'function') { _log('warn', 'Subscribe: listener must be function'); return function() {}; } _listeners.add(listener); return function() { _listeners.delete(listener); }; },
  getListenerCount: function(): number { return _listeners.size; },
  reset: function(defaultTheme: string): boolean { if (!defaultTheme) defaultTheme = 'dark'; _state.currentTheme = defaultTheme; _state.source = 'default'; _state.lastChangedAt = null; _state.isApplying = false; _state.error = null; notifyListeners(); return true; },
  toJSON: function(): ThemeState { return cloneState(); },
  healthCheck: function(): Record<string, unknown> { return { healthy: true, version: VERSION, moduleId: MODULE_ID, state: cloneState(), listenerCount: _listeners.size, issues: null as null, loggerAvailable: !!_getPort('logger'), portsInitialized: _Ports.isInitialized(), strictMode: isStrict() }; }
};

export default ThemeStore;
