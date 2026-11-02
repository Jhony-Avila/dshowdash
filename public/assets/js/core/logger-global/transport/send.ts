// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-send
// PURPOSE: Logger Global - Send v3.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   retryLogOperation from ./retry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   sendLogBatch() — exported function
//   isTransportAvailable() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { retryLogOperation } from './retry.js';

export const VERSION = '3.0.0-ENTERPRISE';
export const MODULE_ID = 'logger-global-send';

export function getVersion() {
  return VERSION;
}

export async function sendLogBatch(batch: unknown[], endpoint = '/api/logs') {
  if (!batch || !Array.isArray(batch) || batch.length === 0) {
    return { ok: true, sent: 0 };
  }
  
  try {
    const payload = JSON.stringify({ logs: batch, timestamp: Date.now() });
    
    if (navigator.sendBeacon && payload.length < 65536) {
      const success = navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
      return { ok: success, sent: batch.length, method: 'beacon' };
    }
    
    const result = await retryLogOperation(async () => {
      const _ctrl = new AbortController();
      const _tout = setTimeout(() => _ctrl.abort(), 10000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
          signal: _ctrl.signal
        });
        clearTimeout(_tout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
      } catch (e) { clearTimeout(_tout); throw e; }
    });
    
    if (result.ok) {
      return { ok: true, sent: batch.length, method: 'fetch', attempts: result.attempts };
    }
    return { ok: false, error: result.error, sent: 0, method: 'fetch' };
  } catch (error) {
    return { ok: false, error, sent: 0 };
  }
}

export function isTransportAvailable() {
  return typeof fetch === 'function' || typeof navigator.sendBeacon === 'function';
}
