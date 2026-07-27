// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:fullscreen-manager
// PURPOSE: Fullscreen Manager - API Fullscreen
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createFullscreenManager() — exported function
//   getFullscreenManager() — exported function
//   resetFullscreenManager() — exported function
//   enterFullscreen() — exported function
//   exitFullscreen() — exported function
//   toggleFullscreen() — exported function
//   isFullscreen() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'MSFullscreenChange'
//   'MSFullscreenError'
//   'fullscreenchange'
//   'fullscreenerror'
//   'mozfullscreenchange'
//   'mozfullscreenerror'
//   'webkitfullscreenchange'
//   'webkitfullscreenerror'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE7';
export const MODULE_ID = 'container-main:fullscreen-manager';

export function createFullscreenManager(options: Record<string, any> = {}) {
  const { onEnter = null, onExit = null, onError = null } = options;

  const _logger = createLogger(MODULE_ID);
  const _listeners = new Map<string, Record<string, unknown>>();
  let _counter = 0;
  let _metrics = { enters: 0, exits: 0, errors: 0 };

  function _getFullscreenElement() {
    return document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement;
  }

  function _requestFullscreen(element: HTMLElement) {
    if (element.requestFullscreen) return element.requestFullscreen();
    // @ts-expect-error TS migration - TS2551
    if (element.webkitRequestFullscreen) return element.webkitRequestFullscreen();
    // @ts-expect-error TS migration - TS2551
    if (element.mozRequestFullScreen) return element.mozRequestFullScreen();
    // @ts-expect-error TS migration - TS2551
    if (element.msRequestFullscreen) return element.msRequestFullscreen();
    return Promise.reject(new Error('Fullscreen API not supported'));
  }

  function _exitFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if ((document as any).webkitExitFullscreen) return (document as any).webkitExitFullscreen();
    if ((document as any).mozCancelFullScreen) return (document as any).mozCancelFullScreen();
    if ((document as any).msExitFullscreen) return (document as any).msExitFullscreen();
    return Promise.reject(new Error('Fullscreen API not supported'));
  }

  function _notifyListeners(event: string, data: Record<string, unknown>) {
    _listeners.forEach((config: Record<string, unknown>) => {
      if (config.event === event || config.event === 'all') {
        try { (config.callback as (...args: unknown[]) => void)(data); } catch (e) { _logger.error('Listener error:', e); }
      }
    });
  }

  function _handleChange() {
    const isFullscreen = !!_getFullscreenElement();
    const data = { isFullscreen, element: _getFullscreenElement() };

    if (isFullscreen) {
      _metrics.enters++;
      _notifyListeners('enter', data);
      onEnter?.(data);
    } else {
      _metrics.exits++;
      _notifyListeners('exit', data);
      onExit?.(data);
    }

    _notifyListeners('change', data);
  }

  function _handleError(e: Event) {
    _metrics.errors++;
    const data = { error: e };
    _notifyListeners('error', data);
    onError?.(data);
  }

  // Event listeners
  document.addEventListener('fullscreenchange', _handleChange);
  document.addEventListener('webkitfullscreenchange', _handleChange);
  document.addEventListener('mozfullscreenchange', _handleChange);
  document.addEventListener('MSFullscreenChange', _handleChange);
  document.addEventListener('fullscreenerror', _handleError);
  document.addEventListener('webkitfullscreenerror', _handleError);
  document.addEventListener('mozfullscreenerror', _handleError);
  document.addEventListener('MSFullscreenError', _handleError);

  const manager = {
    isSupported() {
      return document.fullscreenEnabled || (document as any).webkitFullscreenEnabled || (document as any).mozFullScreenEnabled || (document as any).msFullscreenEnabled;
    },

    isFullscreen() { return !!_getFullscreenElement(); },
    getFullscreenElement() { return _getFullscreenElement(); },

    async enter(element = document.documentElement) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return Promise.reject(new Error('Element not found'));
      if (!this.isSupported()) return Promise.reject(new Error('Fullscreen not supported'));
      try {
        await _requestFullscreen(element);
        return true;
      } catch (e) {
        // @ts-expect-error strict migration — TS2345
        _handleError(e);
        throw e;
      }
    },

    async exit() {
      if (!this.isFullscreen()) return true;
      try {
        await _exitFullscreen();
        return true;
      } catch (e) {
        // @ts-expect-error strict migration — TS2345
        _handleError(e);
        throw e;
      }
    },

    async toggle(element = document.documentElement) {
      if (this.isFullscreen()) { await this.exit(); return false; }
      else { await this.enter(element); return true; }
    },

    onEnter(callback: (...args: unknown[]) => void) { const id = `enter-${++_counter}`; _listeners.set(id, { event: 'enter', callback }); return id; },
    onExit(callback: (...args: unknown[]) => void) { const id = `exit-${++_counter}`; _listeners.set(id, { event: 'exit', callback }); return id; },
    onChange(callback: (...args: unknown[]) => void) { const id = `change-${++_counter}`; _listeners.set(id, { event: 'change', callback }); return id; },
    onError(callback: (...args: unknown[]) => void) { const id = `error-${++_counter}`; _listeners.set(id, { event: 'error', callback }); return id; },
    off(id: string) { return _listeners.delete(id); },

    getMetrics() { return { ..._metrics, isFullscreen: this.isFullscreen(), supported: this.isSupported(), listeners: _listeners.size }; },
    resetMetrics() { _metrics = { enters: 0, exits: 0, errors: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, supported: this.isSupported(), isFullscreen: this.isFullscreen(), metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, supported: this.isSupported(), isFullscreen: this.isFullscreen() }; },

    destroy() {
      document.removeEventListener('fullscreenchange', _handleChange);
      document.removeEventListener('webkitfullscreenchange', _handleChange);
      document.removeEventListener('mozfullscreenchange', _handleChange);
      document.removeEventListener('MSFullscreenChange', _handleChange);
      document.removeEventListener('fullscreenerror', _handleError);
      document.removeEventListener('webkitfullscreenerror', _handleError);
      document.removeEventListener('mozfullscreenerror', _handleError);
      document.removeEventListener('MSFullscreenError', _handleError);
      _listeners.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getFullscreenManager(options: Record<string, any> = {}) { if (!_instance) _instance = createFullscreenManager(options); return _instance; }
export function resetFullscreenManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function enterFullscreen(element: HTMLElement) { return (getFullscreenManager().enter as (...args: unknown[]) => unknown)(element); }
export function exitFullscreen() { return (getFullscreenManager().exit as (...args: unknown[]) => unknown)(); }
export function toggleFullscreen(element: HTMLElement) { return (getFullscreenManager().toggle as (...args: unknown[]) => unknown)(element); }
export function isFullscreen() { return (getFullscreenManager().isFullscreen as (...args: unknown[]) => unknown)(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, createFullscreenManager, getFullscreenManager, resetFullscreenManager, enterFullscreen, exitFullscreen, toggleFullscreen, isFullscreen, info, healthCheck };
