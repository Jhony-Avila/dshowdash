// Subscription Manager
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via factory context):
//   context.listeners — listeners array
//   context.cleanups — cleanups array
// PROVIDES: createSubscriptionManager() factory returning:
//   subscribe(), on()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.kernel.module.subscriptions.subscription-manager';

interface SubscriptionManagerContext {
  listeners: Array<(payload: { event: string; data: Record<string, unknown> }) => void>;
  cleanups: Array<() => void>;
}

export function createSubscriptionManager(context: SubscriptionManagerContext) {
  var listeners = context.listeners;
  var cleanups = context.cleanups;

  return {
    subscribe: function(callback: (payload: { event: string; data: Record<string, unknown> }) => void) {
      if (typeof callback === 'function') {
        listeners.push(callback);
        return function unsubscribe() {
          var idx = listeners.indexOf(callback);
          if (idx !== -1) listeners.splice(idx, 1);
        };
      }
      return function() {};
    },

    on: function(event: string, callback: (data: Record<string, unknown>) => void) {
      var self = this;
      var unsub = self.subscribe(function(payload: { event: string; data: Record<string, unknown> }) {
        if (payload.event === event) {
          callback(payload.data);
        }
      });
      cleanups.push(unsub);
      return unsub;
    }
  };
}

export default { createSubscriptionManager };
