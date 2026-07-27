// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:media-query-manager
// PURPOSE: Media Query Manager - Gerenciamento de breakpoints responsivos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BREAKPOINTS — exported value
//   ORIENTATIONS — exported value
//   createMediaQueryManager() — exported function
//   getMediaQueryManager() — exported function
//   resetMediaQueryManager() — exported function
//   getCurrentBreakpoint() — exported function
//   isMobile() — exported function
//   isDesktop() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'resize'
// WINDOW ACCESS:
//   window.addEventListener
//   window.innerHeight
//   window.innerWidth
//   window.matchMedia
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:media-query-manager';

export const BREAKPOINTS = Object.freeze({
  XS: 0, SM: 576, MD: 768, LG: 992, XL: 1200, XXL: 1400
});

export const ORIENTATIONS = Object.freeze({ PORTRAIT: 'portrait', LANDSCAPE: 'landscape' });

export function createMediaQueryManager(options: Record<string, any> = {}) {
  const { breakpoints = BREAKPOINTS, defaultBreakpoint = 'MD', debounceMs = 100 } = options;

  const _logger = createLogger(MODULE_ID);
  const _listeners = new Map<string, Record<string, unknown>>();
  const _mediaQueries = new Map();
  let _currentBreakpoint = defaultBreakpoint;
  let _orientation = ORIENTATIONS.PORTRAIT;
  let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let _counter = 0;
  let _metrics = { breakpointChanges: 0, orientationChanges: 0 };

  function _getBreakpoint() {
    const width = window.innerWidth;

    // @ts-expect-error TS migration - TS2362, TS2363
    const sorted = Object.entries(breakpoints).sort((a, b) => b[1] - a[1]);
    for (const [name, minWidth] of sorted) {

      // @ts-expect-error TS migration - TS2365
      if (width >= minWidth) return name;
    }
    return Object.keys(breakpoints)[0];
  }

  function _getOrientation() {
    return window.innerHeight > window.innerWidth ? ORIENTATIONS.PORTRAIT : ORIENTATIONS.LANDSCAPE;
  }

  function _notifyListeners(type: string, data: Record<string, unknown>) {
    _listeners.forEach((config, id) => {
      if (config.type === type || config.type === 'all') {
        try { (config.callback as (...args: unknown[]) => void)(data); } catch (e) { _logger.error(`Listener error [${id}]:`, e); }
      }
    });
  }

  function _handleResize() {
    // @ts-expect-error strict migration — TS2769
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      const newBreakpoint = _getBreakpoint();
      const newOrientation = _getOrientation();

      if (newBreakpoint !== _currentBreakpoint) {
        const oldBreakpoint = _currentBreakpoint;
        _currentBreakpoint = newBreakpoint;
        _metrics.breakpointChanges++;
        _notifyListeners('breakpoint', { breakpoint: newBreakpoint, previousBreakpoint: oldBreakpoint, width: window.innerWidth });
      }

      if (newOrientation !== _orientation) {
        const oldOrientation = _orientation;

        // @ts-expect-error TS migration - TS2322
        _orientation = newOrientation;
        _metrics.orientationChanges++;
        _notifyListeners('orientation', { orientation: newOrientation, previousOrientation: oldOrientation });
      }
    }, debounceMs);
  }

  // Inicialização
  _currentBreakpoint = _getBreakpoint();

  // @ts-expect-error TS migration - TS2322
  _orientation = _getOrientation();
  window.addEventListener('resize', _handleResize);

  const manager = {
    // Getters
    getCurrentBreakpoint() { return _currentBreakpoint; },
    getOrientation() { return _orientation; },
    getWidth() { return window.innerWidth; },
    getHeight() { return window.innerHeight; },

    // Comparadores
    isBreakpoint(name: string) { return _currentBreakpoint === name; },
    isAtLeast(name: string) { return window.innerWidth >= (breakpoints[name] || 0); },

    // @ts-expect-error TS migration - TS2362, TS2363, TS2365
    isAtMost(name) { const sorted = Object.entries(breakpoints).sort((a, b) => a[1] - b[1]); const index = sorted.findIndex(([n]) => n === name); if (index === -1) return false; const nextBp = sorted[index + 1]; return nextBp ? window.innerWidth < nextBp[1] : true; },
    // @ts-expect-error strict migration — TS2345
    isBetween(min: number, max: number) { return this.isAtLeast(min) && this.isAtMost(max); },
    isPortrait() { return _orientation === ORIENTATIONS.PORTRAIT; },

    // @ts-expect-error TS migration - TS2367
    isLandscape() { return _orientation === ORIENTATIONS.LANDSCAPE; },

    // Mobile/Desktop helpers
    isMobile() { return this.isAtMost('SM'); },
    // @ts-expect-error strict migration — TS2345
    isTablet() { return this.isBetween('MD', 'LG'); },
    isDesktop() { return this.isAtLeast('LG'); },

    // Media Query helpers
    matches(query: string) {
      if (!_mediaQueries.has(query)) {
        _mediaQueries.set(query, window.matchMedia(query));
      }
      return _mediaQueries.get(query).matches;
    },

    // Listeners
    onBreakpointChange(callback: (...args: unknown[]) => void) {
      const id = `bp-${++_counter}`;
      _listeners.set(id, { type: 'breakpoint', callback });
      return id;
    },

    onOrientationChange(callback: (...args: unknown[]) => void) {
      const id = `or-${++_counter}`;
      _listeners.set(id, { type: 'orientation', callback });
      return id;
    },

    onChange(callback: (...args: unknown[]) => void) {
      const id = `all-${++_counter}`;
      _listeners.set(id, { type: 'all', callback });
      return id;
    },

    off(id: string) { return _listeners.delete(id); },

    // Breakpoint-specific callbacks
    when(breakpoint: unknown, callback: (...args: unknown[]) => void, options: Record<string, any> = {}) {
      const id = `when-${++_counter}`;
      const check = () => {
        // @ts-expect-error strict migration — TS2345
        const matches = options.atLeast ? this.isAtLeast(breakpoint) : this.isBreakpoint(breakpoint);
        if (matches) callback({ breakpoint: _currentBreakpoint, width: window.innerWidth });
      };
      
      check(); // Verificar imediatamente
      _listeners.set(id, { type: 'breakpoint', callback: check });
      return id;
    },

    // CSS class helpers
    applyBreakpointClass(element: HTMLElement, prefix = 'bp') {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return;
      Object.keys(breakpoints).forEach(bp => element.classList.remove(`${prefix}-${bp.toLowerCase()}`));
      element.classList.add(`${prefix}-${_currentBreakpoint.toLowerCase()}`);
    },

    getBreakpoints() { return { ...breakpoints }; },
    getMetrics() { return { ..._metrics, currentBreakpoint: _currentBreakpoint, orientation: _orientation, listeners: _listeners.size }; },
    resetMetrics() { _metrics = { breakpointChanges: 0, orientationChanges: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, currentBreakpoint: _currentBreakpoint, orientation: _orientation, listeners: _listeners.size, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, currentBreakpoint: _currentBreakpoint, orientation: _orientation, breakpoints: Object.keys(breakpoints), width: window.innerWidth, height: window.innerHeight }; },

    destroy() {
      window.removeEventListener('resize', _handleResize);
      // @ts-expect-error strict migration — TS2769
      clearTimeout(_debounceTimer);
      _listeners.clear();
      _mediaQueries.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getMediaQueryManager(options: Record<string, any> = {}) { if (!_instance) _instance = createMediaQueryManager(options); return _instance; }
export function resetMediaQueryManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function getCurrentBreakpoint() { return (getMediaQueryManager().getCurrentBreakpoint as (...args: unknown[]) => unknown)(); }
export function isMobile() { return (getMediaQueryManager().isMobile as (...args: unknown[]) => unknown)(); }
export function isDesktop() { return (getMediaQueryManager().isDesktop as (...args: unknown[]) => unknown)(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, breakpoints: Object.keys(BREAKPOINTS) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, BREAKPOINTS, ORIENTATIONS, createMediaQueryManager, getMediaQueryManager, resetMediaQueryManager, getCurrentBreakpoint, isMobile, isDesktop, info, healthCheck };
