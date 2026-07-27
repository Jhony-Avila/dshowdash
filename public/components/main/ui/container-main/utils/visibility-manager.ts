// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:visibility-manager
// PURPOSE: Visibility Manager - Page Visibility API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   VISIBILITY_STATES — exported value
//   createVisibilityManager() — exported function
//   getVisibilityManager() — exported function
//   resetVisibilityManager() — exported function
//   isPageVisible() — exported function
//   isPageHidden() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'visibilitychange'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE7';
export const MODULE_ID = 'container-main:visibility-manager';

export const VISIBILITY_STATES = Object.freeze({ VISIBLE: 'visible', HIDDEN: 'hidden', PRERENDER: 'prerender' });

export function createVisibilityManager(options: Record<string, any> = {}) {
  const { onVisible = null, onHidden = null, autoPauseTimers = false } = options;

  const _logger = createLogger(MODULE_ID);
  const _listeners = new Map<string, Record<string, unknown>>();
  const _pausedTimers = new Map();
  let _counter = 0;
  let _hiddenTime = 0;
  let _totalHiddenTime = 0;
  let _metrics = { visibilityChanges: 0, hiddenEvents: 0, visibleEvents: 0 };

  function _getVisibilityState() {
    if (document.visibilityState) return document.visibilityState;
    if (document.hidden !== undefined) return document.hidden ? VISIBILITY_STATES.HIDDEN : VISIBILITY_STATES.VISIBLE;
    return VISIBILITY_STATES.VISIBLE;
  }

  function _notifyListeners(event: string, data: Record<string, unknown>) {
    _listeners.forEach((config: Record<string, unknown>) => {
      if (config.event === event || config.event === 'all') {
        try { (config.callback as (...args: unknown[]) => void)(data); } catch (e) { _logger.error('Listener error:', e); }
      }
    });
  }

  function _handleVisibilityChange() {
    _metrics.visibilityChanges++;
    const state = _getVisibilityState();
    const data = { state, timestamp: Date.now() };

    if (state === VISIBILITY_STATES.HIDDEN) {
      _metrics.hiddenEvents++;
      _hiddenTime = Date.now();
      _notifyListeners('hidden', data);
      onHidden?.(data);
      if (autoPauseTimers) _pauseAllRegisteredTimers();
    } else if (state === VISIBILITY_STATES.VISIBLE) {
      _metrics.visibleEvents++;
      if (_hiddenTime > 0) {
        _totalHiddenTime += Date.now() - _hiddenTime;

        // @ts-expect-error TS migration - TS2339
        data.hiddenDuration = Date.now() - _hiddenTime;
      }
      _hiddenTime = 0;
      _notifyListeners('visible', data);
      onVisible?.(data);
      if (autoPauseTimers) _resumeAllRegisteredTimers();
    }

    _notifyListeners('change', data);
  }

  function _pauseAllRegisteredTimers() {
    _pausedTimers.forEach((config, id) => {
      if (config.type === 'interval' && config.active) {
        clearInterval(config.timerId);
        config.active = false;
      }
    });
  }

  function _resumeAllRegisteredTimers() {
    _pausedTimers.forEach((config, id) => {
      if (config.type === 'interval' && !config.active) {
        config.timerId = setInterval(config.callback, config.delay);
        config.active = true;
      }
    });
  }

  // Event listener
  document.addEventListener('visibilitychange', _handleVisibilityChange);

  const manager = {
    isVisible() { return _getVisibilityState() === VISIBILITY_STATES.VISIBLE; },
    isHidden() { return _getVisibilityState() === VISIBILITY_STATES.HIDDEN; },
    getState() { return _getVisibilityState(); },
    getTotalHiddenTime() { return _totalHiddenTime + (_hiddenTime > 0 ? Date.now() - _hiddenTime : 0); },

    onVisible(callback: (...args: unknown[]) => void) { const id = `vis-${++_counter}`; _listeners.set(id, { event: 'visible', callback }); return id; },
    onHidden(callback: (...args: unknown[]) => void) { const id = `hid-${++_counter}`; _listeners.set(id, { event: 'hidden', callback }); return id; },
    onChange(callback: (...args: unknown[]) => void) { const id = `chg-${++_counter}`; _listeners.set(id, { event: 'change', callback }); return id; },
    off(id: string) { return _listeners.delete(id); },

    // Auto-pause interval quando página fica hidden
    registerInterval(callback: (...args: unknown[]) => void, delay: number) {
      const id = `timer-${++_counter}`;
      const timerId = setInterval(callback, delay);
      _pausedTimers.set(id, { type: 'interval', callback, delay, timerId, active: true });
      return id;
    },

    unregisterInterval(id: string) {
      const config = _pausedTimers.get(id);
      if (config) {
        if (config.active) clearInterval(config.timerId);
        _pausedTimers.delete(id);
        return true;
      }
      return false;
    },

    // Executa callback apenas quando visível
    whenVisible(callback: (...args: unknown[]) => void) {
      if (this.isVisible()) { callback(); return null; }
      const id = this.onVisible(() => { callback(); this.off(id); });
      return id;
    },

    // Aguarda página ficar visível
    waitForVisible(timeoutMs = 30000) {
      if (this.isVisible()) return Promise.resolve(true);
      return new Promise((resolve) => {
        const timeout = setTimeout(() => { this.off(id); resolve(false); }, timeoutMs);
        const id = this.onVisible(() => { clearTimeout(timeout); this.off(id); resolve(true); });
      });
    },

    getMetrics() { return { ..._metrics, state: _getVisibilityState(), totalHiddenTime: this.getTotalHiddenTime(), listeners: _listeners.size, registeredTimers: _pausedTimers.size }; },
    resetMetrics() { _metrics = { visibilityChanges: 0, hiddenEvents: 0, visibleEvents: 0 }; _totalHiddenTime = 0; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, state: _getVisibilityState(), metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, state: _getVisibilityState(), totalHiddenTime: this.getTotalHiddenTime() }; },

    destroy() {
      document.removeEventListener('visibilitychange', _handleVisibilityChange);
      _pausedTimers.forEach((config) => { if (config.active) clearInterval(config.timerId); });
      _pausedTimers.clear();
      _listeners.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getVisibilityManager(options: Record<string, any> = {}) { if (!_instance) _instance = createVisibilityManager(options); return _instance; }
export function resetVisibilityManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function isPageVisible() { return (getVisibilityManager().isVisible as (...args: unknown[]) => unknown)(); }
export function isPageHidden() { return (getVisibilityManager().isHidden as (...args: unknown[]) => unknown)(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, states: Object.keys(VISIBILITY_STATES) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, VISIBILITY_STATES, createVisibilityManager, getVisibilityManager, resetVisibilityManager, isPageVisible, isPageHidden, info, healthCheck };
