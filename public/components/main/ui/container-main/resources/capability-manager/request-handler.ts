// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: request-handler
// PURPOSE: Request Handler - Lógica de request/grant/revoke
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CAPABILITY_STATUS, DENIAL_REASONS from ./constants.js
//   CAPABILITY_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createRequestHandler() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   CAPABILITY_EVENT_NAMES.DENIED
//   CAPABILITY_EVENT_NAMES.GRANTED
//   CAPABILITY_EVENT_NAMES.REQUEST
//   CAPABILITY_EVENT_NAMES.REVOKED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CAPABILITY_STATUS, DENIAL_REASONS } from './constants.js';
import { CAPABILITY_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.capability-manager.request-handler';

export function createRequestHandler(options: Record<string, any> = {}) {
  const {
    store,
    validator,
    emitter,
    onGrant,
    onDeny,
    onRevoke,
    onRequest
  } = options;

  return {
    request(panelId: string, capability: string) {
      onRequest?.(panelId, capability);
      emitter?.emit(CAPABILITY_EVENT_NAMES.REQUEST, { panelId, capability });

      const record = store.getPanelRecord(panelId);
      
      const existing = record.get(capability);
      if (existing?.status === CAPABILITY_STATUS.GRANTED) {
        store.logRequest(panelId, capability, 'request', 'already-granted');
        return { status: CAPABILITY_STATUS.GRANTED };
      }

      const currentCount = store.getCapabilityCount(capability);
      const validation = validator.validateRequest(panelId, capability, currentCount);

      if (!validation.valid) {
        const result = { status: CAPABILITY_STATUS.DENIED, reason: validation.reason };
        record.set(capability, { 
          ...existing, 
          status: CAPABILITY_STATUS.DENIED, 
          denyReason: result.reason 
        });
        store.logRequest(panelId, capability, 'request', 'denied', result.reason);
        onDeny?.(panelId, capability, result.reason);
        emitter?.emit(CAPABILITY_EVENT_NAMES.DENIED, { panelId, capability, reason: result.reason });
        return result;
      }

      record.set(capability, {
        status: CAPABILITY_STATUS.GRANTED,
        declaredAt: existing?.declaredAt || Date.now(),
        grantedAt: Date.now(),
        revokedAt: null,
        denyReason: null
      });

      store.incrementCapabilityCount(capability);
      store.logRequest(panelId, capability, 'request', 'granted');
      onGrant?.(panelId, capability);
      emitter?.emit(CAPABILITY_EVENT_NAMES.GRANTED, { panelId, capability });

      return { status: CAPABILITY_STATUS.GRANTED };
    },

    requestMultiple(panelId: string, capabilities: string[]) {
      const results: Record<string, any> = {};
      capabilities.forEach((cap: string) => { results[cap] = this.request(panelId, cap); });
      return results;
    },

    revoke(panelId: string, capability: string, reason = DENIAL_REASONS.MANUAL) {
      if (!store.hasPanelRecord(panelId)) return false;

      const record = store.getPanelRecord(panelId);
      const state = record.get(capability);
      
      if (!state || state.status !== CAPABILITY_STATUS.GRANTED) return false;

      record.set(capability, {
        ...state,
        status: CAPABILITY_STATUS.REVOKED,
        revokedAt: Date.now(),
        denyReason: reason
      });

      store.decrementCapabilityCount(capability);
      store.logRequest(panelId, capability, 'revoke', 'revoked', reason);
      onRevoke?.(panelId, capability, reason);
      emitter?.emit(CAPABILITY_EVENT_NAMES.REVOKED, { panelId, capability, reason });

      return true;
    },

    revokeAll(panelId: string, reason = DENIAL_REASONS.MANUAL) {
      if (!store.hasPanelRecord(panelId)) return 0;

      const record = store.getPanelRecord(panelId);
      let count = 0;

      record.forEach((state: Record<string, unknown>, cap: string) => {
        if (state.status === CAPABILITY_STATUS.GRANTED) {
          this.revoke(panelId, cap, reason);
          count++;
        }
      });

      return count;
    }
  };
}

export default { createRequestHandler };
