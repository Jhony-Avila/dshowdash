// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.event-bus.emit
// PURPOSE: EventBus Emit Methods
// ───────────────────────────────────────────────────────────────
// IMPORTS: _log from constants
// PROVIDES: emit, emitSync, executeWithTimeout, getMatchingListeners
// @changelog v8.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v8.2.0-ENTERPRISE - ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { _log } from './constants.js';
import type { EventListener } from './wildcard-matcher.js';

export const MODULE_ID = 'core.js.event-bus.emit';
export const VERSION = '8.3.0-P2-ENTERPRISE';

interface EventBusInstance {
  _isDestroyed: boolean;
  _metrics: {
    increment(stat: string, value?: number): void;
    updateEventMetrics(eventName: string, type: string, duration?: number): void;
    addToHistory(event: BusEvent): void;
    addToLog(action: string, eventName: string, data?: unknown): void;
    trackTelemetry(eventName: string, data: unknown): void;
  };
  _wildcardMatcher: {
    getMatchingListeners(eventName: string, listeners: Map<string, Set<EventListener>>, onceListeners: Map<string, Set<EventListener>>): (EventListener & { matchedPattern: string })[];
  };
  _listeners: Map<string, Set<EventListener>>;
  _onceListeners: Map<string, Set<EventListener>>;
  _registry: {
    unregister(eventName: string, handler: (...args: unknown[]) => unknown, priority: number): void;
  };
  _invalidateCache(eventName: string): void;
  defaultTimeout: number;
}

interface BusEvent {
  name: string;
  data: unknown;
  timestamp: number;
  options: Record<string, unknown>;
}

interface EmitOptions {
  [key: string]: unknown;
}

interface ErrorResult {
  error: string;
  handlerId?: string;
}

export const executeWithTimeout = async (bus: EventBusInstance, listener: EventListener, data: unknown, event: BusEvent, timeout: number | null): Promise<unknown> => {
  if (!timeout) return await listener.handler.call(listener.context, data, event);
  return new Promise((resolve, reject) => {
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => { bus._metrics.increment('timeouts'); reject(new Error(`Timeout after ${timeout}ms`)); }, timeout);
    Promise.resolve(listener.handler.call(listener.context, data, event))
      .then((result: unknown) => { clearTimeout(timeoutId); resolve(result); })
      .catch((err: Error) => { clearTimeout(timeoutId); reject(err); });
  });
};

export const emit = async (bus: EventBusInstance, eventName: string, data: unknown = null, options: EmitOptions = {}): Promise<unknown[]> => {
  if (bus._isDestroyed) { _log('warn', 'Cannot emit - EventBus is destroyed'); return []; }
  bus._metrics.increment('emitted');
  bus._metrics.updateEventMetrics(eventName, 'emits');
  const event: BusEvent = { name: eventName, data, timestamp: Date.now(), options };
  bus._metrics.addToHistory(event);
  bus._metrics.addToLog('emit', eventName, data);
  const directListeners: EventListener[] = getMatchingListeners(bus, eventName);
  const wildcardListeners = bus._wildcardMatcher.getMatchingListeners(eventName, bus._listeners, bus._onceListeners);
  const allListeners: EventListener[] = directListeners.concat(wildcardListeners);
  if (allListeners.length === 0) { bus._metrics.increment('skipped'); _log('info', `No listeners for "${eventName}", skipping`); return []; }
  _log('info', `Emitting "${eventName}" to ${allListeners.length} listeners`, data);
  const sortedListeners: EventListener[] = allListeners.sort((a, b) => a.priority - b.priority);
  const results: unknown[] = [];
  const onceToRemove: { eventName: string; listener: EventListener }[] = [];
  for (const listener of sortedListeners) {
    const startTime: number = Date.now();
    try {
      const timeout: number | null = listener.timeout !== undefined ? listener.timeout : bus.defaultTimeout;
      const result: unknown = await executeWithTimeout(bus, listener, data, event, timeout);
      results.push(result);
      bus._metrics.increment('handled');
      bus._metrics.updateEventMetrics(eventName, 'handled', Date.now() - startTime);
      if (listener.once) onceToRemove.push({ eventName: listener.matchedPattern || eventName, listener });
    } catch (error) {
      const errorInfo: Record<string, unknown> = { eventName, handlerId: listener.id, sourceModule: listener.sourceModule, error: (error as Error).message, timestamp: Date.now() };
      _log('error', `Handler error for "${eventName}":`, errorInfo);
      bus._metrics.increment('errors');
      bus._metrics.updateEventMetrics(eventName, 'errors');
      bus._metrics.addToLog('error', eventName, errorInfo);
      bus._metrics.trackTelemetry('eventbus:handler-error', errorInfo);
      results.push({ error: (error as Error).message, handlerId: listener.id } satisfies ErrorResult);
    }
  }
  for (const item of onceToRemove) {
    if (bus._onceListeners.has(item.eventName)) {
      bus._onceListeners.get(item.eventName)!.delete(item.listener);
      bus._registry.unregister(item.eventName, item.listener.handler, item.listener.priority);
      bus._invalidateCache(item.eventName);
    }
  }
  return results;
};

export const emitSync = (bus: EventBusInstance, eventName: string, data: unknown = null, options: EmitOptions = {}): unknown[] => {
  if (bus._isDestroyed) { _log('warn', 'Cannot emit - EventBus is destroyed'); return []; }
  bus._metrics.increment('emitted');
  bus._metrics.updateEventMetrics(eventName, 'emits');
  const event: BusEvent = { name: eventName, data, timestamp: Date.now(), options };
  bus._metrics.addToHistory(event);
  const directListeners: EventListener[] = getMatchingListeners(bus, eventName);
  const wildcardListeners = bus._wildcardMatcher.getMatchingListeners(eventName, bus._listeners, bus._onceListeners);
  const allListeners: EventListener[] = directListeners.concat(wildcardListeners);
  if (allListeners.length === 0) { bus._metrics.increment('skipped'); return []; }
  _log('info', `Emitting sync "${eventName}"`, data);
  const sortedListeners: EventListener[] = allListeners.sort((a, b) => a.priority - b.priority);
  const results: unknown[] = [];
  const onceToRemove: { eventName: string; listener: EventListener }[] = [];
  for (const listener of sortedListeners) {
    const startTime: number = Date.now();
    try {
      const result: unknown = listener.handler.call(listener.context, data, event);
      results.push(result);
      bus._metrics.increment('handled');
      bus._metrics.updateEventMetrics(eventName, 'handled', Date.now() - startTime);
      if (listener.once) onceToRemove.push({ eventName: listener.matchedPattern || eventName, listener });
    } catch (error) {
      _log('error', `Handler error for "${eventName}":`, { error: (error as Error).message });
      bus._metrics.increment('errors');
      bus._metrics.updateEventMetrics(eventName, 'errors');
      results.push({ error: (error as Error).message });
    }
  }
  for (const item of onceToRemove) {
    if (bus._onceListeners.has(item.eventName)) {
      bus._onceListeners.get(item.eventName)!.delete(item.listener);
      bus._registry.unregister(item.eventName, item.listener.handler, item.listener.priority);
      bus._invalidateCache(item.eventName);
    }
  }
  return results;
};

export const getMatchingListeners = (bus: EventBusInstance, eventName: string): EventListener[] => {
  const listeners: EventListener[] = [];
  const maps: Map<string, Set<EventListener>>[] = [bus._listeners, bus._onceListeners];
  for (const map of maps) {
    if (map.has(eventName)) {
      for (const l of map.get(eventName)!) { listeners.push(l); }
    }
  }
  return listeners;
};

export const info = (): { moduleId: string; version: string } => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = (): { status: string; moduleId: string; version: string } => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default { MODULE_ID, VERSION, executeWithTimeout, emit, emitSync, getMatchingListeners, info, healthCheck };
