// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-store:subscribers
// PURPOSE: Global State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ./store-config.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   notifySubscribers
//   addSubscriber
//   removeSubscriber
//   info
//   healthCheck
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { metrics, getNestedValue } from './store-config.js';

const VERSION = '1.1.0-ENTERPRISE';
const MODULE_ID = 'global-state-store:subscribers';

function notifySubscribers(subscribers: Map<unknown, unknown>, prevState: unknown, nextState: unknown, action: unknown, telemetry: unknown) {
  subscribers.forEach((sub: unknown, id: unknown) => {
    const s: any = sub;
    const callback = s.callback;
    const selector = s.selector;
    const deepCompare = s.deepCompare;
    try {
      if (selector) {
        const prevValue = typeof selector === 'function' ? selector(prevState) : getNestedValue(prevState, selector);
        const nextValue = typeof selector === 'function' ? selector(nextState) : getNestedValue(nextState, selector);
        let hasChanged;
        if (deepCompare) {
          metrics.deepCompares++;
          hasChanged = JSON.stringify(prevValue) !== JSON.stringify(nextValue);
        } else {
          hasChanged = !Object.is(prevValue, nextValue);
        }
        if (hasChanged) {
          metrics.notificationsSent++;
          callback(nextValue, prevValue, action);
        } else {
          metrics.notificationsSkipped++;
        }
      } else {
        metrics.notificationsSent++;
        callback(nextState, prevState, action);
      }
    } catch (error) {
      if (telemetry) (telemetry as any).trackError(error, { subscriberId: id, action });
    }
  });
}

function addSubscriber(subscribers: Map<unknown, unknown>, counter: { value: number }, callback: (...args: unknown[]) => void, selector: unknown, options: Record<string, unknown>) {
  if (typeof callback !== 'function') throw new Error('Callback must be a function');
  const id = counter.value++;
  const deepCompare = options && options.deepCompare === true;
  subscribers.set(id, { callback, selector, deepCompare });
  return id;
}

function removeSubscriber(subscribers: Map<unknown, unknown>, id: unknown) {
  subscribers.delete(id);
}

function info() { return { moduleId: MODULE_ID, version: VERSION }; }

function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { notifyReady: typeof notifySubscribers === 'function', addReady: typeof addSubscriber === 'function', removeReady: typeof removeSubscriber === 'function' } };
}

export { VERSION, MODULE_ID, notifySubscribers, addSubscriber, removeSubscriber, info, healthCheck };
export default { VERSION, MODULE_ID, notifySubscribers, addSubscriber, removeSubscriber, info, healthCheck };
