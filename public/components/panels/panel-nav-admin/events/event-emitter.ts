// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.3.0-MIGRATION-PHASE7)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.events.event-emitter
// PURPOSE: Custom Event Emitter — API emit/on para comunicação inter-componentes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION, MODULE_ID
//   EventEmitter — Factory function
//   createNavAdminEmitter() — Pre-configured emitter for nav-admin
//   info(), healthCheck()
//
// @origin Adapted from panel-01 emit/on API for nav-admin domain
// @changelog
//   10.3.0-MIGRATION-PHASE7: Initial creation — FASE 7 D.1
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '10.3.0-MIGRATION-PHASE7';
export const MODULE_ID = 'panel-nav-admin.events.event-emitter';

/**
 * Nav-admin event types.
 * @type {Object}
 */
export const NAV_ADMIN_EVENTS = Object.freeze({
  ITEM_CREATED: 'nav-admin:item:created',
  ITEM_UPDATED: 'nav-admin:item:updated',
  ITEM_DELETED: 'nav-admin:item:deleted',
  ITEM_REORDERED: 'nav-admin:item:reordered',
  ITEM_DUPLICATED: 'nav-admin:item:duplicated',
  SECTION_CREATED: 'nav-admin:section:created',
  SECTION_UPDATED: 'nav-admin:section:updated',
  SECTION_DELETED: 'nav-admin:section:deleted',
  BULK_OPERATION: 'nav-admin:bulk:operation',
  IMPORT_COMPLETED: 'nav-admin:import:completed',
  EXPORT_COMPLETED: 'nav-admin:export:completed',
  FILTER_CHANGED: 'nav-admin:filter:changed',
  VIEW_CHANGED: 'nav-admin:view:changed',
  SETTINGS_CHANGED: 'nav-admin:settings:changed',
  DATA_REFRESHED: 'nav-admin:data:refreshed',
  ERROR: 'nav-admin:error'
});

/**
 * Factory: creates an EventEmitter with emit/on/off/once API.
 *
 * @param {Object} [options]
 * @param {number} [options.maxListeners=50] — Max listeners per event
 * @param {boolean} [options.debug=false] — Log emitted events
 * @returns {Object} EventEmitter instance
 */
interface EventHandler {
  (...args: unknown[]): void;
  _original?: (...args: unknown[]) => void;
}

export function EventEmitter(options: Record<string, unknown> = {}) {
  const { maxListeners = 50, debug = false } = options;

  /** @private */
  const _listeners = new Map();

  /** @private */
  const _metrics: { emitted: number; listened: number; removed: number; eventCounts: Record<string, number> } = {
    emitted: 0,
    listened: 0,
    removed: 0,
    eventCounts: {}
  };

  /**
   * Register an event listener.
   *
   * @param {string} event — Event name
   * @param {Function} handler — Callback function
   * @returns {Function} Unsubscribe function
   */
  function on(event: string, handler: (...args: unknown[]) => void) {
    if (typeof handler !== 'function') return () => {};

    if (!_listeners.has(event)) {
      _listeners.set(event, []);
    }

    const handlers = _listeners.get(event);
    // @ts-expect-error strict migration — TS18046
    if (handlers.length >= maxListeners) {
      console.warn(`[EventEmitter] Max listeners (${maxListeners}) reached for "${event}"`);
    }

    handlers.push(handler);
    _metrics.listened++;

    return () => off(event, handler);
  }

  /**
   * Register a one-time event listener.
   *
   * @param {string} event — Event name
   * @param {Function} handler — Callback function
   * @returns {Function} Unsubscribe function
   */
  function once(event: string, handler: (...args: unknown[]) => void) {
    if (typeof handler !== 'function') return () => {};

    const wrappedHandler: EventHandler = (...args: unknown[]) => {
      off(event, wrappedHandler);
      handler(...args);
    };
    wrappedHandler._original = handler;

    return on(event, wrappedHandler);
  }

  /**
   * Remove an event listener.
   *
   * @param {string} event — Event name
   * @param {Function} handler — Handler to remove
   */
  function off(event: string, handler: (...args: unknown[]) => void) {
    if (!_listeners.has(event)) return;

    const handlers = _listeners.get(event);
    const index = handlers.findIndex((h: EventHandler) => h === handler || h._original === handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      _metrics.removed++;
    }

    if (handlers.length === 0) {
      _listeners.delete(event);
    }
  }

  /**
   * Emit an event with data.
   *
   * @param {string} event — Event name
   * @param {*} data — Event payload
   * @returns {number} Number of handlers called
   */
  function emit(event: string, data?: unknown) {
    _metrics.emitted++;
    _metrics.eventCounts[event] = (_metrics.eventCounts[event] || 0) + 1;

    if (debug) {
      console.debug(`[EventEmitter] emit "${event}"`, data);
    }

    const handlers = _listeners.get(event);
    if (!handlers || handlers.length === 0) return 0;

    const snapshot = [...handlers];
    let called = 0;

    for (const handler of snapshot) {
      try {
        handler(data, { event, timestamp: Date.now() });
        called++;
      } catch (err) {
        console.error(`[EventEmitter] Error in handler for "${event}":`, err);
      }
    }

    return called;
  }

  /**
   * Remove all listeners, optionally for a specific event.
   *
   * @param {string} [event] — If omitted, clears all events
   */
  function removeAll(event?: string) {
    if (event) {
      _listeners.delete(event);
    } else {
      _listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event.
   *
   * @param {string} event
   * @returns {number}
   */
  function listenerCount(event: string) {
    return (_listeners.get(event) || []).length;
  }

  /**
   * Get all registered event names.
   * @returns {Array<string>}
   */
  function eventNames() {
    return [..._listeners.keys()];
  }

  /**
   * Get emit metrics.
   * @returns {Object}
   */
  function getEmitMetrics() {
    return { ..._metrics, activeListeners: _getTotalListeners() };
  }

  /** @private */
  function _getTotalListeners() {
    let total = 0;
    for (const handlers of _listeners.values()) {
      total += handlers.length;
    }
    return total;
  }

  return {
    on, once, off, emit,
    removeAll, listenerCount, eventNames,
    getEmitMetrics
  };
}

/**
 * Create a pre-configured EventEmitter for nav-admin.
 * Includes NAV_ADMIN_EVENTS as constants.
 *
 * @param {Object} [options] — Options for EventEmitter
 * @returns {Object} Nav-admin EventEmitter with EVENTS constant
 */
export function createNavAdminEmitter(options: Record<string, unknown> = {}) {
  const emitter = EventEmitter(options);

  (emitter as Record<string, unknown>).EVENTS = NAV_ADMIN_EVENTS;
  return emitter;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, eventTypes: Object.keys(NAV_ADMIN_EVENTS).length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { EventEmitter, createNavAdminEmitter, NAV_ADMIN_EVENTS, info, healthCheck, VERSION, MODULE_ID };
