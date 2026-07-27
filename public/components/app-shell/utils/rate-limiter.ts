/**
 * @file Rate Limiter
 * @version 1.0.0
 * @module app-shell/utils/rate-limiter
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone utility)
 * 
 * @provides VERSION, MODULE_ID, PRESETS
 * @provides throttle, debounce, rafThrottle
 * @provides getThrottled, getDebounced, removeThrottled, removeDebounced, clearAll
 * @provides getMetrics, healthCheck, info
 * 
 * @browserAPI setTimeout, clearTimeout, requestAnimationFrame
 * 
 * @description
 * Rate limiting utilities: throttle, debounce, and RAF-based throttle.
 * Includes presets for common use cases (scroll, resize, input).
 * 
 * @example
 * import { throttle, debounce, PRESETS } from './rate-limiter.js';
 * const throttled = throttle(handleScroll, PRESETS.SCROLL);
 * const debounced = debounce(handleSearch, PRESETS.SEARCH);
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-rate-limiter';

export const PRESETS = Object.freeze({ RESIZE: 150, SCROLL: 100, INPUT: 300, SEARCH: 400, MOUSEMOVE: 50, CLICK: 250 });

const _throttled = new Map();
const _debounced = new Map();
const _metrics = { throttleCalls: 0, throttleSkipped: 0, debounceCalls: 0, debounceSkipped: 0 };

export function throttle(fn: DynObj, delay: number, options: DynObj) {
  options = options || {};
  const leading = options.leading !== false;
  const trailing = options.trailing !== false;
  let lastCall = 0, lastArgs: DynObj = null, timeoutId: DynObj = null;

  function throttled(this: any) {
    _metrics.throttleCalls++;
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    lastArgs = arguments;

    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      lastCall = now;
      fn.apply(this, lastArgs);
    } else if (!timeoutId && trailing) {
      const self = this;
      timeoutId = setTimeout(() => {
        lastCall = leading ? Date.now() : 0;
        timeoutId = null;
        fn.apply(self, lastArgs);
      }, remaining);
    } else {
      _metrics.throttleSkipped++;
    }
  }

  throttled.cancel = () => { if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; } };
  throttled.flush = function() { if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; fn.apply(this, lastArgs); } };
  return throttled;
}

export function debounce(fn: DynObj, delay: number, options: DynObj) {
  options = options || {};
  const leading = options.leading || false;
  const trailing = options.trailing !== false;
  const maxWait = options.maxWait;
  let timeoutId: DynObj = null, lastArgs: DynObj = null, lastThis: DynObj = null, lastCallTime = 0, lastInvokeTime = 0;

  function invokeFunc(time: DynObj) {
    lastInvokeTime = time;
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  }

  function shouldInvoke(time: DynObj) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return lastCallTime === 0 || timeSinceLastCall >= delay || (maxWait !== undefined && timeSinceLastInvoke >= maxWait);
  }

  function debounced(this: any) {
    _metrics.debounceCalls++;
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking && leading && !timeoutId) {
      invokeFunc(time);
      return;
    }

    if (timeoutId) { clearTimeout(timeoutId); _metrics.debounceSkipped++; }

    if (trailing) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        invokeFunc(Date.now());
      }, delay);
    }
  }

  debounced.cancel = () => { if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; } lastArgs = lastThis = null; lastCallTime = 0; };
  debounced.flush = () => { if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; invokeFunc(Date.now()); } };
  debounced.pending = () => timeoutId !== null;
  return debounced;
}

export function rafThrottle(fn: DynObj) {
  let rafId: DynObj = null, lastArgs: DynObj = null;

  function throttled(this: any) {
    lastArgs = arguments;
    if (rafId) return;
    const self = this;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      fn.apply(self, lastArgs);
    });
  }

  throttled.cancel = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } };
  return throttled;
}

export function getThrottled(name: string, fn: DynObj, delay: number, options: DynObj) {
  if (_throttled.has(name)) return _throttled.get(name);
  const t = throttle(fn, delay, options);
  _throttled.set(name, t);
  return t;
}

export function getDebounced(name: string, fn: DynObj, delay: number, options: DynObj) {
  if (_debounced.has(name)) return _debounced.get(name);
  const d = debounce(fn, delay, options);
  _debounced.set(name, d);
  return d;
}

export function removeThrottled(name: string) {
  const t = _throttled.get(name);
  if (t) { t.cancel(); _throttled.delete(name); return true; }
  return false;
}

export function removeDebounced(name: string) {
  const d = _debounced.get(name);
  if (d) { d.cancel(); _debounced.delete(name); return true; }
  return false;
}

export function clearAll() {
  _throttled.forEach(t => { t.cancel(); });
  _debounced.forEach(d => { d.cancel(); });
  _throttled.clear();
  _debounced.clear();
}

export function throttleWithPreset(fn: DynObj, presetName: string, options: DynObj) {
  const delay = (PRESETS as DynObj)[presetName] || (PRESETS as DynObj)[presetName.toUpperCase()] || 100;
  return throttle(fn, delay, options);
}

export function debounceWithPreset(fn: DynObj, presetName: string, options: DynObj) {
  const delay = (PRESETS as DynObj)[presetName] || (PRESETS as DynObj)[presetName.toUpperCase()] || 300;
  return debounce(fn, delay, options);
}

export function getMetrics() {
  return Object.assign({}, _metrics, { managedThrottled: _throttled.size, managedDebounced: _debounced.size });
}

export function healthCheck() {
  const checks = { operational: true, notOverloaded: _throttled.size + _debounced.size < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, presets: PRESETS, managedThrottled: Array.from(_throttled.keys()), managedDebounced: Array.from(_debounced.keys()), metrics: getMetrics(), timestamp: Date.now() };
}

export default { VERSION, MODULE_ID, PRESETS, throttle, debounce, rafThrottle, getThrottled, getDebounced, removeThrottled, removeDebounced, clearAll, throttleWithPreset, debounceWithPreset, getMetrics, healthCheck, info };
