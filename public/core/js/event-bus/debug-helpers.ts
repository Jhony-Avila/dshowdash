// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.event-bus.debug-helpers
// PURPOSE: EventBus Debug Helpers
// ───────────────────────────────────────────────────────────────
// PROVIDES: DebugHelpers class, listAll, detectLeaks
// @changelog v8.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v8.2.0-ENTERPRISE - ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'core.js.event-bus.debug-helpers';
export const VERSION = '8.3.0-P2-ENTERPRISE';

import type { EventListener } from './wildcard-matcher.js';

interface ListenerCounts {
  persistent: number;
  once: number;
}

interface LeakInfo {
  eventName: string;
  persistent: number;
  once: number;
  total: number;
}

interface ListenerInfo {
  id: string;
  priority: number;
  sourceModule: string;
  addedAt: number;
}

interface ListenersByEventResult {
  eventName: string;
  persistent: ListenerInfo[];
  once: ListenerInfo[];
  total: number;
}

interface RegistryLike {
  preventedCount?: number;
  size?: number;
}

interface WildcardMatcherLike {
  matches(pattern: string, eventName: string): boolean;
}

export class DebugHelpers {
  private _listeners: Map<string, Set<EventListener>>;
  private _onceListeners: Map<string, Set<EventListener>>;
  private _registry: RegistryLike | null;

  constructor(listenersMap: Map<string, Set<EventListener>>, onceListenersMap: Map<string, Set<EventListener>>, registry: RegistryLike | null) {
    this._listeners = listenersMap;
    this._onceListeners = onceListenersMap;
    this._registry = registry;
  }

  updateMaps(listenersMap: Map<string, Set<EventListener>>, onceListenersMap: Map<string, Set<EventListener>>): void { this._listeners = listenersMap; this._onceListeners = onceListenersMap; }

  listAll(): Record<string, ListenerCounts> {
    const all: Record<string, ListenerCounts> = {};
    for (const [name, set] of this._listeners) { all[name] = { persistent: set.size, once: this._onceListeners.get(name)?.size || 0 }; }
    for (const [name, set] of this._onceListeners) { if (!all[name]) all[name] = { persistent: 0, once: set.size }; }
    return all;
  }

  detectLeaks(threshold: number = 10): LeakInfo[] {
    const leaks: LeakInfo[] = [];
    const all = this.listAll();
    for (const [eventName, counts] of Object.entries(all)) {
      const total: number = counts.persistent + counts.once;
      if (total >= threshold) leaks.push({ eventName, persistent: counts.persistent, once: counts.once, total });
    }
    return leaks.sort((a, b) => b.total - a.total);
  }

  getDedupeStats(): { prevented: number; registrySize: number } { return { prevented: this._registry?.preventedCount || 0, registrySize: this._registry?.size || 0 }; }

  getListenersByEvent(eventName: string): ListenersByEventResult {
    const persistent: ListenerInfo[] = [], once: ListenerInfo[] = [];
    if (this._listeners.has(eventName)) { for (const l of this._listeners.get(eventName)!) { persistent.push({ id: l.id, priority: l.priority, sourceModule: l.sourceModule, addedAt: l.addedAt }); } }
    if (this._onceListeners.has(eventName)) { for (const l of this._onceListeners.get(eventName)!) { once.push({ id: l.id, priority: l.priority, sourceModule: l.sourceModule, addedAt: l.addedAt }); } }
    return { eventName, persistent, once, total: persistent.length + once.length };
  }

  getTotalListenerCount(): number {
    let count = 0;
    for (const set of this._listeners.values()) { count += set.size; }
    for (const set of this._onceListeners.values()) { count += set.size; }
    return count;
  }

  getEventNames(): string[] {
    const names = new Set<string>();
    for (const k of this._listeners.keys()) { names.add(k); }
    for (const k of this._onceListeners.keys()) { names.add(k); }
    return Array.from(names);
  }

  hasListeners(eventName: string, wildcardMatcher: WildcardMatcherLike): boolean {
    if (this._listeners.has(eventName) || this._onceListeners.has(eventName)) return true;
    for (const pattern of this._listeners.keys()) { if (wildcardMatcher.matches(pattern, eventName)) return true; }
    for (const pattern of this._onceListeners.keys()) { if (wildcardMatcher.matches(pattern, eventName)) return true; }
    return false;
  }

  getListenerCount(eventName: string, wildcardMatcher: WildcardMatcherLike): number {
    let count: number = (this._listeners.get(eventName)?.size || 0) + (this._onceListeners.get(eventName)?.size || 0);
    for (const [pattern, set] of this._listeners) { if (pattern !== eventName && wildcardMatcher.matches(pattern, eventName)) count += set.size; }
    return count;
  }
}

export const info = (): { moduleId: string; version: string } => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = (): { status: string; moduleId: string; version: string } => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default DebugHelpers;
