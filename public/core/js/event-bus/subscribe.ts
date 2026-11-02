// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.event-bus.subscribe
// PURPOSE: EventBus Subscribe Methods
// ───────────────────────────────────────────────────────────────
// IMPORTS: PRIORITY, _log from constants
// PROVIDES: on, once, off, subscribe, subscribeMultiple, removeAllListeners
// @changelog v8.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v8.2.0-ENTERPRISE - ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PRIORITY, _log } from './constants.js';

export const MODULE_ID = 'core.js.event-bus.subscribe';
export const VERSION = '8.3.0-P2-ENTERPRISE';

interface EventBusListener {
  handler: (...args: unknown[]) => unknown;
  priority: number;
  context: unknown;
  once: boolean;
  timeout: number | null;
  sourceModule: string;
  addedAt: number;
  id: string;
}

interface EventBusRegistry {
  isDuplicate: (eventName: string, handler: (...args: unknown[]) => unknown, priority: number) => boolean;
  preventDuplicate: () => void;
  register: (eventName: string, handler: (...args: unknown[]) => unknown, priority: number, listenerId: string) => void;
  unregister: (eventName: string, handler: (...args: unknown[]) => unknown, priority: number) => void;
  clear: () => void;
}

interface EventBusMetrics {
  increment: (stat: string) => void;
  trackTelemetry: (eventName: string, data: Record<string, unknown>) => void;
  addToLog: (action: string, eventName: string, data?: Record<string, unknown>) => void;
}

type ListenerMap = Map<string, Set<EventBusListener>>;

interface EventBusInstance {
  _isDestroyed: boolean;
  _registry: EventBusRegistry;
  _metrics: EventBusMetrics;
  _listeners: ListenerMap;
  _onceListeners: ListenerMap;
  _invalidateCache: (eventName: string) => void;
  maxListenersPerEvent: number;
  [key: string]: unknown;
}

interface SubscribeOptions {
  once?: boolean;
  priority?: number;
  timeout?: number;
  sourceModule?: string;
  source?: string;
  allowDuplicate?: boolean;
  context?: unknown;
}

export const on = (bus: EventBusInstance, eventName: string, handler: (...args: unknown[]) => unknown, options: SubscribeOptions = {}): (() => void) => {
  if (bus._isDestroyed) { _log('warn', 'Cannot subscribe - EventBus is destroyed'); return () => {}; }
  if (typeof eventName !== 'string' || !eventName) throw new Error('EventBus.on: eventName must be a non-empty string');
  if (typeof handler !== 'function') throw new Error('EventBus.on: handler must be a function');
  const priority = options.priority !== undefined ? options.priority : PRIORITY.NORMAL;
  const timeout = options.timeout !== undefined ? options.timeout : null;
  const sourceModule = options.sourceModule || options.source || 'unknown';
  if (!options.allowDuplicate && bus._registry.isDuplicate(eventName, handler, priority)) { bus._registry.preventDuplicate(); bus._metrics.increment('dedupePrevented'); _log('info', `Dedupe prevented duplicate for "${eventName}"`); return () => {}; }
  const listenerMap = options.once ? bus._onceListeners : bus._listeners;
  if (!listenerMap.has(eventName)) listenerMap.set(eventName, new Set());
  const currentCount = (bus._listeners.get(eventName)?.size || 0) + (bus._onceListeners.get(eventName)?.size || 0);
  if (currentCount >= bus.maxListenersPerEvent) { _log('warn', `Max listeners (${bus.maxListenersPerEvent}) reached for "${eventName}"`); bus._metrics.trackTelemetry('eventbus:max-listeners', { eventName, count: currentCount }); }
  const listenerId = `${eventName}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const listener = { handler, priority, context: options.context || null, once: options.once || false, timeout, sourceModule, addedAt: Date.now(), id: listenerId };
  // @ts-expect-error strict migration — TS2532
  listenerMap.get(eventName).add(listener);
  bus._registry.register(eventName, handler, priority, listenerId);
  bus._invalidateCache(eventName);
  bus._metrics.increment('subscribes');
  bus._metrics.addToLog('subscribe', eventName, { once: options.once || false, priority, sourceModule });
  _log('info', `Subscribed to "${eventName}" (priority: ${priority}, source: ${sourceModule})`);
  return () => { removeListener(bus, eventName, listener, listenerMap); bus._registry.unregister(eventName, handler, priority); bus._metrics.increment('unsubscribes'); };
};

export const subscribe = (bus: EventBusInstance, eventName: string, handler: (...args: unknown[]) => unknown, options: SubscribeOptions = {}) => { const unsubscribe = on(bus, eventName, handler, options); return { unsubscribe, eventName, handler }; };

export const subscribeMultiple = (bus: EventBusInstance, eventNames: string[], handler: (...args: unknown[]) => unknown, options: SubscribeOptions = {}) => {
  if (!Array.isArray(eventNames)) throw new Error('subscribeMultiple: eventNames must be an array');
  const unsubscribes = eventNames.map((name) => on(bus, name, handler, options));
  return { unsubscribe: () => { for (const unsub of unsubscribes) { unsub(); } }, eventNames, count: eventNames.length };
};

export const once = (bus: EventBusInstance, eventName: string, handler: (...args: unknown[]) => unknown, options: SubscribeOptions = {}) => { options.once = true; return on(bus, eventName, handler, options); };

export const off = (bus: EventBusInstance, eventName: string, handler?: ((...args: unknown[]) => unknown)) => {
  if (!handler) {
    for (const map of [bus._listeners, bus._onceListeners]) {
      // @ts-expect-error strict migration — TS2532
      if (map.has(eventName)) { for (const l of map.get(eventName)) { bus._registry.unregister(eventName, l.handler, l.priority); } map.delete(eventName); }
    }
    bus._invalidateCache(eventName);
    bus._metrics.addToLog('unsubscribe-all', eventName);
    return;
  }
  for (const map of [bus._listeners, bus._onceListeners]) {
    if (map.has(eventName)) {
      const listeners = map.get(eventName);
      for (const listener of listeners!) { if (listener.handler === handler) { listeners!.delete(listener); bus._registry.unregister(eventName, listener.handler, listener.priority); bus._metrics.increment('unsubscribes'); } }
      if (listeners!.size === 0) map.delete(eventName);
    }
  }
  bus._invalidateCache(eventName);
  bus._metrics.addToLog('unsubscribe', eventName);
};

export const removeAllListeners = (bus: EventBusInstance, eventName?: string) => {
  if (eventName) { off(bus, eventName); }
  else { for (const name of bus._listeners.keys()) { off(bus, name); } for (const name of bus._onceListeners.keys()) { off(bus, name); } bus._registry.clear(); }
  _log('info', eventName ? `Removed all listeners for "${eventName}"` : 'Removed ALL listeners');
};

export const removeListener = (bus: EventBusInstance, eventName: string, listener: EventBusListener, map: ListenerMap) => { if (map.has(eventName)) { map.get(eventName)!.delete(listener); if (map.get(eventName)!.size === 0) map.delete(eventName); bus._invalidateCache(eventName); } };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default { MODULE_ID, VERSION, on, subscribe, subscribeMultiple, once, off, removeAllListeners, removeListener, info, healthCheck };
