// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Pending Queue - Process
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, queue, state, refs, setQueue from ./state.js
//   emit from ./events.js
//   cleanExpired from ./expiration.js
//
// PROVIDES:
//   process() — exported function
//   startAutoProcess() — exported function
//   stopAutoProcess() — exported function
//   isAutoProcessEnabled() — exported function
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

import { config, queue, state, refs, setQueue } from './state.js';
import { emit } from './events.js';
import { cleanExpired } from './expiration.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.0.0-ELEVATION';
export const MODULE_ID = 'overlay-layer.kernel.pending-queue.process';

export function process() {
  if (!config.enabled || queue.length === 0) {
    return { ok: true, processed: 0, remaining: queue.length };
  }
  
  state.lastProcess = Date.now();
  cleanExpired();
  
  if (!refs.openOverlay) {
    return { ok: false, error: 'open-function-not-injected' };
  }
  
  const results = {
    processed: 0,
    opened: [] as DynObj,
    requeued: [] as DynObj,
    failed: [] as DynObj,
    expired: [] as DynObj
  };
  
  const toProcess = [...queue];
  setQueue([]);
  
  for (const item of toProcess) {
    if (item.expiresAt <= Date.now()) {
      results.expired.push(item.queueId);
      state.totalExpired++;
      continue;
    }
    
    if (refs.canOpenOverlay) {
      const canOpen = refs.canOpenOverlay(item.descriptor.type, {
        scope: item.descriptor.scope || 'global'
      });
      
      if (!canOpen.allowed) {
        item.retries++;
        
        if (item.retries >= item.maxRetries) {
          results.failed.push({
            queueId: item.queueId,
            reason: 'max-retries-exceeded',
            lastBlockReason: canOpen.reason
          });
          state.totalFailed++;
        } else {
          queue.push(item);
          results.requeued.push(item.queueId);
        }
        continue;
      }
    }
    
    try {
      const openResult = refs.openOverlay(item.descriptor, {
        ...item.options,
        bypassRateLimit: true,
        fromQueue: true
      });
      
      if (openResult?.ok) {
        results.opened.push({
          queueId: item.queueId,
          overlayId: openResult.id,
          waitTime: Date.now() - item.enqueuedAt
        });
        results.processed++;
        state.totalProcessed++;
        
        emit('overlay:queue-processed', {
          queueId: item.queueId,
          overlayId: openResult.id,
          waitTime: Date.now() - item.enqueuedAt
        });
      } else {
        item.retries++;
        
        if (item.retries >= item.maxRetries) {
          results.failed.push({
            queueId: item.queueId,
            reason: 'open-failed',
            errors: openResult?.errors
          });
          state.totalFailed++;
        } else {
          queue.push(item);
          results.requeued.push(item.queueId);
        }
      }
    } catch (error: any) {
      item.retries++;
      
      if (item.retries >= item.maxRetries) {
        results.failed.push({
          queueId: item.queueId,
          reason: 'exception',
          error: error.message
        });
        state.totalFailed++;
      } else {
        queue.push(item);
        results.requeued.push(item.queueId);
      }
    }
  }
  
  return {
    ok: true,
    processed: results.processed,
    remaining: queue.length,
    results
  };
}

export function startAutoProcess(interval: number) {
  if (state.processIntervalId) {
    stopAutoProcess();
  }
  
  const processInterval = interval || config.processInterval;
  config.autoProcess = true;
  
  state.processIntervalId = setInterval(() => {
    if (config.autoProcess && queue.length > 0) {
      process();
    }
  }, processInterval);
  
  return { ok: true, interval: processInterval };
}

export function stopAutoProcess() {
  config.autoProcess = false;
  
  if (state.processIntervalId) {
    clearInterval(state.processIntervalId);
    state.processIntervalId = null;
  }
  
  return { ok: true };
}

export function isAutoProcessEnabled() {
  return config.autoProcess && state.processIntervalId !== null;
}
