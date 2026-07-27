/**
 * @file Debug Presets — State Management
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/devtools/debug-presets/state
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none
 * 
 * @provides _state, _config, addToHistory, notifySubscribers
 * @provides getState, subscribe, unsubscribe
 * 
 * @description
 * Centralized state for debug presets including history and subscribers.
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.debug-presets.state';

export const _state = {
  current: null as DynObj,
  previous: null as DynObj,
  currentConfig: null as DynObj,
  enabled: false,
  history: [] as DynObj,
  subscribers: [] as DynObj
};

export const _config = {
  maxHistorySize: 10,
  persistOnChange: true
};

export function addToHistory(presetName: string) {
  _state.history.push({
    preset: presetName,
    timestamp: Date.now()
  });
  
  if (_state.history.length > _config.maxHistorySize) {
    _state.history.shift();
  }
}

export function notifySubscribers(event: string, data: DynObj) {
  for (let i = 0; i < _state.subscribers.length; i++) {
    try {
      _state.subscribers[i](event, data);
    } catch (e) {
      // Ignore subscriber errors
    }
  }
}

export function getState() {
  return {
    current: _state.current,
    previous: _state.previous,
    enabled: _state.enabled,
    historyLength: _state.history.length
  };
}

export function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') return () => {};
  _state.subscribers.push(callback);
  return () => {
    const idx = _state.subscribers.indexOf(callback);
    if (idx >= 0) _state.subscribers.splice(idx, 1);
  };
}

export function unsubscribe(callback: DynObj) {
  const idx = _state.subscribers.indexOf(callback);
  if (idx >= 0) {
    _state.subscribers.splice(idx, 1);
    return true;
  }
  return false;
}
