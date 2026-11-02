// Migrado para TypeScript: 2026-02-25
// Subscriber Tracker - Rastrear e limpar subscriptions
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Previne memory leaks por subscriptions orfas
// @melhoria #19 - Subscribers nao removidos causam leaks
'use strict';

export const MODULE_ID = 'subscriber-tracker' as const;
export const VERSION = '1.0.0' as const;

interface SubscriptionEntry {
  unsubscribe: () => void;
  trackedAt: number;
  id: string;
}

interface StaleSubscription {
  componentId: string;
  subId: string;
  age: number;
}

interface SubscriberTrackerInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  activeSubscriptions: number;
  trackedComponents: string[];
  totalCreated: number;
}

const _subscriptions: Record<string, Record<string, SubscriptionEntry>> = {};
let _counter: number = 0;

export function track(componentId: string, unsubscribeFn: () => void): string | null {
  if (!componentId || typeof unsubscribeFn !== 'function') return null;
  const subId = `sub-${++_counter}`;
  if (!_subscriptions[componentId]) {
    _subscriptions[componentId] = {};
  }
  _subscriptions[componentId][subId] = {
    unsubscribe: unsubscribeFn,
    trackedAt: Date.now(),
    id: subId
  };
  return subId;
}

export function untrack(componentId: string, subId?: string): boolean {
  if (!_subscriptions[componentId]) return false;
  if (subId) {
    const sub = _subscriptions[componentId][subId];
    if (sub) {
      try { sub.unsubscribe(); } catch (e: unknown) {}
      delete _subscriptions[componentId][subId];
      return true;
    }
    return false;
  }
  return false;
}

export function cleanupComponent(componentId: string): number {
  if (!_subscriptions[componentId]) return 0;
  const subs = _subscriptions[componentId];
  const ids = Object.keys(subs);
  let cleaned: number = 0;
  for (let i = 0; i < ids.length; i++) {
    try {
      subs[ids[i]].unsubscribe();
      cleaned++;
    } catch (e: unknown) {}
  }
  delete _subscriptions[componentId];
  return cleaned;
}

export function cleanupAll(): number {
  const components = Object.keys(_subscriptions);
  let total: number = 0;
  for (let i = 0; i < components.length; i++) {
    total += cleanupComponent(components[i]);
  }
  return total;
}

export function getComponentSubs(componentId: string): string[] {
  if (!_subscriptions[componentId]) return [];
  return Object.keys(_subscriptions[componentId]);
}

export function getActiveCount(): number {
  let count: number = 0;
  const components = Object.keys(_subscriptions);
  for (let i = 0; i < components.length; i++) {
    count += Object.keys(_subscriptions[components[i]]).length;
  }
  return count;
}

export function getStaleSubscriptions(maxAgeMs?: number): StaleSubscription[] {
  maxAgeMs = maxAgeMs || 600000;
  const stale: StaleSubscription[] = [];
  const now = Date.now();
  const components = Object.keys(_subscriptions);
  for (let i = 0; i < components.length; i++) {
    const subs = _subscriptions[components[i]];
    const ids = Object.keys(subs);
    for (let j = 0; j < ids.length; j++) {
      if (now - subs[ids[j]].trackedAt > maxAgeMs!) {
        stale.push({ componentId: components[i], subId: ids[j], age: now - subs[ids[j]].trackedAt });
      }
    }
  }
  return stale;
}

export function info(): SubscriberTrackerInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    activeSubscriptions: getActiveCount(),
    trackedComponents: Object.keys(_subscriptions),
    totalCreated: _counter
  };
}

export default {
  MODULE_ID,
  VERSION,
  track,
  untrack,
  cleanupComponent,
  cleanupAll,
  getComponentSubs,
  getActiveCount,
  getStaleSubscriptions,
  info
};
