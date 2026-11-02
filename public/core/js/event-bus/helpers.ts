// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.event-bus.helpers
// PURPOSE: EventBus Helper Methods
// ───────────────────────────────────────────────────────────────
// IMPORTS: _log from constants
// PROVIDES: replay, waitFor, invalidateCache, getStats
// @changelog v8.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v8.2.0-ENTERPRISE - ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { _log } from './constants.js';

export const MODULE_ID = 'core.js.event-bus.helpers';
export const VERSION = '8.3.0-P2-ENTERPRISE';

export const replay = (bus: Record<string, unknown>, eventName: string, handler: (data: unknown, event: Record<string, unknown>) => unknown, options: { fromTimestamp?: number; count?: number; limit?: number } = {}) => {
  (bus._metrics as Record<string, unknown> & { increment: (s: string) => void }).increment('replays');
  const history = (bus._metrics as Record<string, unknown> & { getHistoryByEvent: (n: string) => Array<Record<string, unknown>> }).getHistoryByEvent(eventName);
  if (history.length === 0) { _log('info', `No history to replay for "${eventName}"`); return { replayed: 0, events: [] as Array<Record<string, unknown>> }; }
  const limit = options.limit !== undefined ? options.limit : history.length;
  const eventsToReplay = history.slice(-limit);
  _log('info', `Replaying ${eventsToReplay.length} events for "${eventName}"`);
  const results: Array<Record<string, unknown>> = [];
  for (const event of eventsToReplay) {
    try { const result = handler(event.data, event); results.push({ success: true, result, event }); }
    catch (error) { results.push({ success: false, error: (error as Error).message, event }); }
  }
  return { replayed: results.length, events: results };
};

export const waitFor = (bus: Record<string, unknown> & { once: (name: string, handler: (data: unknown) => void) => () => void }, eventName: string, timeout = 0) => new Promise((resolve, reject) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = bus.once(eventName, (data: unknown) => { if (timeoutId) clearTimeout(timeoutId); resolve(data); });
  if (timeout > 0) { timeoutId = setTimeout(() => { unsubscribe(); reject(new Error(`Timeout waiting for event "${eventName}"`)); }, timeout); }
});

export const invalidateCache = (bus: Record<string, unknown> & { _sortedCache: Map<string, unknown>; _wildcardMatcher: { matches: (a: string, b: string) => boolean } }, eventName: string) => {
  bus._sortedCache.delete(eventName);
  for (const [key] of bus._sortedCache) {
    if (bus._wildcardMatcher.matches(key, eventName) || bus._wildcardMatcher.matches(eventName, key)) { bus._sortedCache.delete(key); }
  }
};

export const getStats = (bus: Record<string, unknown> & { _metrics: { getStats: () => Record<string, unknown> & { totalEvents: number; emitted: number; handled: number; errors: number; startTime: number }; historySize: number }; _debugHelpers: { getTotalListenerCount: () => number }; _sortedCache: Map<string, unknown>; _registry: Map<string, unknown> }) => {
  const stats = bus._metrics.getStats();
  return { totalEvents: stats.totalEvents, emitted: stats.emitted, handled: stats.handled, errors: stats.errors, listeners: bus._debugHelpers.getTotalListenerCount(), historySize: bus._metrics.historySize, cacheSize: bus._sortedCache.size, registrySize: bus._registry.size, uptime: Date.now() - stats.startTime };
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default { MODULE_ID, VERSION, replay, waitFor, invalidateCache, getStats, info, healthCheck };
