// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.event-bus.wildcard-matcher
// PURPOSE: EventBus Wildcard Pattern Matcher
// ───────────────────────────────────────────────────────────────
// PROVIDES: WildcardMatcher class, matches, getMatchingListeners
// @changelog v8.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v8.2.0-ENTERPRISE - ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'core.js.event-bus.wildcard-matcher';
export const VERSION = '8.3.0-P2-ENTERPRISE';

export interface EventListener {
  handler: (...args: unknown[]) => unknown;
  priority: number;
  context: unknown;
  once: boolean;
  timeout: number | null;
  sourceModule: string;
  addedAt: number;
  id: string;
  matchedPattern?: string;
}

interface WildcardStats {
  matches: number;
}

export class WildcardMatcher {
  private _stats: WildcardStats;

  constructor() { this._stats = { matches: 0 }; }

  matches(pattern: string, eventName: string): boolean {
    if (pattern === '*') return true;
    if (pattern.indexOf('*') === -1) return pattern === eventName;
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    return regex.test(eventName);
  }

  getMatchingListeners(eventName: string, listenersMap: Map<string, Set<EventListener>>, onceListenersMap: Map<string, Set<EventListener>>): (EventListener & { matchedPattern: string })[] {
    const listeners: (EventListener & { matchedPattern: string })[] = [];
    for (const map of [listenersMap, onceListenersMap]) {
      for (const [pattern, set] of map) {
        if (pattern !== eventName && this.matches(pattern, eventName)) {
          for (const listener of set) { listeners.push({ ...listener, matchedPattern: pattern }); this._stats.matches++; }
        }
      }
    }
    return listeners;
  }

  get matchCount(): number { return this._stats.matches; }
  resetStats(): void { this._stats.matches = 0; }
}

export const info = (): { moduleId: string; version: string } => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = (): { status: string; moduleId: string; version: string } => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default WildcardMatcher;
