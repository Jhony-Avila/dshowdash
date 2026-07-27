// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-event-hooks
// PURPOSE: Container Event Hooks Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LIFECYCLE_HOOKS — exported value
//   createEventHooks() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'focusin'
//   'focusout'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../utils/logger.js';

export const VERSION = '8.3.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-event-hooks';

const logger = createLogger(MODULE_ID);

// Options validation
function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.debugMode !== undefined && typeof options.debugMode !== 'boolean') errors.push('debugMode must be a boolean');
  if (options.maxListeners !== undefined && (typeof options.maxListeners !== 'number' || options.maxListeners < 1)) errors.push('maxListeners must be a positive number');
  if (options.onHookError !== undefined && typeof options.onHookError !== 'function') errors.push('onHookError must be a function');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export const LIFECYCLE_HOOKS = {
  BEFORE_MOUNT: 'beforeMount',
  MOUNTED: 'mounted',
  BEFORE_UPDATE: 'beforeUpdate',
  UPDATED: 'updated',
  BEFORE_UNMOUNT: 'beforeUnmount',
  UNMOUNTED: 'unmounted',
  ERROR: 'error',
  STATE_CHANGE: 'stateChange',
  RESIZE: 'resize',
  FOCUS: 'focus',
  BLUR: 'blur'
};

export function createEventHooks(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { debugMode = false, maxListeners = 100, onHookError } = options;

  let _initialized = false;
  let _hooks = new Map();
  let _onceHooks = new Map();
  let _wildcardListeners: { callback: (...args: unknown[]) => void; context: Record<string, unknown> | null }[] = [];
  let _resizeObserver: ResizeObserver | null = null;
  let _mutationObserver: MutationObserver | null = null;
  let _boundFocusIn: EventListener | null = null;
  let _boundFocusOut: EventListener | null = null;


  // @ts-expect-error TS migration - TS2556
  function _log(...args: unknown[]) { if (debugMode) logger.debug(args[0] as string, args[1]); }

  function _emit(hookName: string, data: Record<string, unknown>, isInternal = false) {
    const results: unknown[] = [];
    _wildcardListeners.forEach(({ callback, context }) => {
      try { results.push({ hook: '*', result: (callback as Function).call(context, hookName, data) }); }
      catch (e) { onHookError?.(hookName, e); }
    });
    if (_hooks.has(hookName)) {
      _hooks.get(hookName).forEach(({ callback, context, priority }: Record<string, unknown>) => {
        try { results.push({ hook: hookName, priority, result: (callback as Function).call(context, data) }); }
        catch (e) { onHookError?.(hookName, e); }
      });
    }
    if (_onceHooks.has(hookName)) {
      _onceHooks.get(hookName).forEach(({ callback, context }: Record<string, unknown>) => {
        try { results.push({ hook: hookName, once: true, result: (callback as Function).call(context, data) }); }
        catch (e) { onHookError?.(hookName, e); }
      });
      _onceHooks.delete(hookName);
    }
    if (!isInternal) container.dispatchEvent(new CustomEvent(`hook:${hookName}`, { bubbles: true, detail: data }));
    _log(`Emitted "${hookName}"`, data, `(${results.length} listeners)`);
    return results;
  }

  const hooks = {
    init() {
      if (_initialized) return this;
      _resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) _emit(LIFECYCLE_HOOKS.RESIZE, { width: entry.contentRect.width, height: entry.contentRect.height }, true);
      });
      _resizeObserver.observe(container);
      _boundFocusIn = (e: Event) => _emit(LIFECYCLE_HOOKS.FOCUS, { target: e.target }, true);
      _boundFocusOut = (e: Event) => _emit(LIFECYCLE_HOOKS.BLUR, { target: e.target }, true);
      container.addEventListener('focusin', _boundFocusIn as EventListener);
      container.addEventListener('focusout', _boundFocusOut as EventListener);
      _mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') _emit(LIFECYCLE_HOOKS.UPDATED, { mutation }, true);
          if (mutation.type === 'attributes') _emit(LIFECYCLE_HOOKS.STATE_CHANGE, { attribute: mutation.attributeName, oldValue: mutation.oldValue }, true);
        });
      });
      _mutationObserver.observe(container, { childList: true, subtree: true, attributes: true, attributeOldValue: true });
      _initialized = true;
      _emit(LIFECYCLE_HOOKS.MOUNTED, { containerId: container.id });
      return this;
    },
    on(hookName: string, callback: (...args: unknown[]) => void, context: Record<string, unknown> | null = null, priority = 100) {
      if (typeof callback !== 'function') return this;
      if (hookName === '*') { _wildcardListeners.push({ callback, context }); return this; }
      if (!_hooks.has(hookName)) _hooks.set(hookName, []);
      const listeners = _hooks.get(hookName);
      if (listeners.length >= maxListeners) { logger.warn(`Max listeners (${maxListeners}) reached for hook "${hookName}"`); return this; }
      listeners.push({ callback, context, priority });
      listeners.sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority);
      return this;
    },
    once(hookName: string, callback: (...args: unknown[]) => void, context: Record<string, unknown> | null = null) {
      if (typeof callback !== 'function') return this;
      if (!_onceHooks.has(hookName)) _onceHooks.set(hookName, []);
      _onceHooks.get(hookName).push({ callback, context });
      return this;
    },
    off(hookName: string, callback: (...args: unknown[]) => void) {
      if (hookName === '*') { _wildcardListeners = _wildcardListeners.filter(l => l.callback !== callback); return this; }
      if (_hooks.has(hookName)) { _hooks.set(hookName, _hooks.get(hookName).filter((l: { callback: (...args: unknown[]) => void }) => l.callback !== callback)); }
      if (_onceHooks.has(hookName)) { _onceHooks.set(hookName, _onceHooks.get(hookName).filter((l: { callback: (...args: unknown[]) => void }) => l.callback !== callback)); }
      return this;
    },
    emit(hookName: string, data: Record<string, unknown>) { return _emit(hookName, data, false); },
    clear(hookName: string) {
      if (hookName) { _hooks.delete(hookName); _onceHooks.delete(hookName); }
      else { _hooks.clear(); _onceHooks.clear(); _wildcardListeners = []; }
      return this;
    },
    getListeners(hookName: string) {
      if (hookName === '*') return [..._wildcardListeners];
      return [...(_hooks.get(hookName) || []), ...(_onceHooks.get(hookName) || [])];
    },
    hasListeners(hookName: string) { return this.getListeners(hookName).length > 0; },
    isInitialized() { return _initialized; },
    destroy() {
      _emit(LIFECYCLE_HOOKS.BEFORE_UNMOUNT, { containerId: container.id });
      _resizeObserver?.disconnect();
      _resizeObserver = null;
      _mutationObserver?.disconnect();
      _mutationObserver = null;
      if (_boundFocusIn) container.removeEventListener('focusin', _boundFocusIn as EventListener);
      if (_boundFocusOut) container.removeEventListener('focusout', _boundFocusOut as EventListener);
      _boundFocusIn = null;
      _boundFocusOut = null;
      _hooks.clear();
      _onceHooks.clear();
      _wildcardListeners = [];
      _initialized = false;
      _emit(LIFECYCLE_HOOKS.UNMOUNTED, { containerId: container.id });
    },
    healthCheck() {
      const totalListeners = Array.from(_hooks.values()).reduce((sum, arr) => sum + arr.length, 0) + Array.from(_onceHooks.values()).reduce((sum, arr) => sum + arr.length, 0) + _wildcardListeners.length;
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, hookCount: _hooks.size, totalListeners, maxListeners, domOnly: true, hasValidation: true };
    }
  };

  return hooks;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, domOnly: true, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, domOnly: true, hasValidation: true }; }

export default { createEventHooks, info, healthCheck, VERSION, MODULE_ID, LIFECYCLE_HOOKS };
