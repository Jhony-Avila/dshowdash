// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: memory-leak-detector/patchers
// PURPOSE: Patchers para interceptar event listeners e timers
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   patchEventListeners — Intercepta addEventListener/removeEventListener
//   unpatchEventListeners — Restaura event listeners originais
//   patchTimers — Intercepta setInterval/setTimeout
//   unpatchTimers — Restaura timers originais
// BROWSER APIs.prototype, window.setInterval, window.setTimeout
// ═══════════════════════════════════════════════════════════════
/**
 * @module MemoryLeakDetectorPatchers
 * @description Patchers de events e timers
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.memory-leak-detector.patchers';

let _origAddEvent: DynObj = null;
let _origRemoveEvent: DynObj = null;
let _origSetInterval: DynObj = null;
let _origClearInterval: DynObj = null;
let _origSetTimeout: DynObj = null;
let _origClearTimeout: DynObj = null;

function _generateId() {
    return `leak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function patchEventListeners(trackedListeners: DynObj) {
    if (_origAddEvent) return;

    _origAddEvent = EventTarget.prototype.addEventListener;
    _origRemoveEvent = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function(type, listener, options) {
        const id = _generateId();
        const target = this;

        trackedListeners.set(id, {
            id,
            target,
            targetName: target.constructor ? target.constructor.name : 'Unknown',
            type,
            listener,
            options,
            addedAt: Date.now(),
            stack: new Error().stack
        });

        return _origAddEvent.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function(this: any, type, listener, options) {
        trackedListeners.forEach(function(entry: DynObj, id: DynObj) {
            // @ts-expect-error strict migration — TS2683
            if (entry.target === this && entry.type === type && entry.listener === listener) {
                trackedListeners.delete(id);
            }
        }, this);

        return _origRemoveEvent.call(this, type, listener, options);
    };
}

export function unpatchEventListeners() {
    if (_origAddEvent) {
        EventTarget.prototype.addEventListener = _origAddEvent;
        EventTarget.prototype.removeEventListener = _origRemoveEvent;
        _origAddEvent = null;
        _origRemoveEvent = null;
    }
}

export function patchTimers(trackedIntervals: DynObj, trackedTimeouts: DynObj) {
    if (_origSetInterval) return;

    _origSetInterval = window.setInterval;
    _origClearInterval = window.clearInterval;
    _origSetTimeout = window.setTimeout;
    _origClearTimeout = window.clearTimeout;

    // @ts-expect-error strict migration — TS2322
    window.setInterval = function(fn: DynObj, delay: number) {
        const id = _origSetInterval.apply(window, arguments);
        trackedIntervals.set(id, {
            id,
            delay,
            createdAt: Date.now(),
            stack: new Error().stack
        });
        return id;
    };

    window.clearInterval = id => {
        trackedIntervals.delete(id);
        return _origClearInterval.call(window, id);
    };

    (window as any).setTimeout = function(fn: DynObj, delay: number) {
        const id = _origSetTimeout.apply(window, arguments);
        trackedTimeouts.set(id, {
            id,
            delay,
            createdAt: Date.now(),
            stack: new Error().stack
        });

        const originalFn = fn;
        arguments[0] = function() {
            trackedTimeouts.delete(id);
            if (typeof originalFn === 'function') {
                return originalFn.apply(this, arguments);
            }
        };

        return id;
    };

    window.clearTimeout = id => {
        trackedTimeouts.delete(id);
        return _origClearTimeout.call(window, id);
    };
}

export function unpatchTimers() {
    if (_origSetInterval) {
        window.setInterval = _origSetInterval;
        window.clearInterval = _origClearInterval;
        window.setTimeout = _origSetTimeout;
        window.clearTimeout = _origClearTimeout;
        _origSetInterval = null;
        _origClearInterval = null;
        _origSetTimeout = null;
        _origClearTimeout = null;
    }
}
