// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: queue
// PURPOSE: Offline Mode Manager - Queue
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   OFFLINE_STATES from ../constants.js
//   getConfig, getState, setState, getOfflineQueue, setOfflineQueue, addToQueue, ...
//   _log, _emit from ../helpers/logger.js
//   _saveState from ../helpers/storage.js
//
// PROVIDES:
//   queueRequest() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { OFFLINE_STATES } from '../constants.js';
import { getConfig, getState, setState, getOfflineQueue, setOfflineQueue, addToQueue, incrementMetric } from '../state.js';
import { _log, _emit } from '../helpers/logger.js';
import { _saveState } from '../helpers/storage.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.offline-mode-manager.network.queue';

export async function _processOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0 || getState() !== OFFLINE_STATES.ONLINE) return;
  
  const config = getConfig();
  setState(OFFLINE_STATES.SYNCING);
  _emit('syncStart', { queueSize: queue.length });
  incrementMetric('syncAttempts');
  
  const currentQueue = [...queue];
  setOfflineQueue([]);
  
  let successCount = 0;
  
  for (const request of currentQueue) {
    try {
      // @ts-expect-error TS migration - TS2769, TS2339
      const response = await fetch((request as Record<string, unknown>).url, request.options);
      if (response.ok) {
        successCount++;
        if ((request as Record<string, unknown>).callback) {
          ((request as Record<string, unknown>).callback as (...args: unknown[]) => unknown)(null, response);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      _log('warn', 'Failed to process queued request:', (request as Record<string, unknown>).url, error.message);
      // @ts-expect-error TS migration - TS2365
      if ((request as Record<string, unknown>).attempts < config.retryAttempts) {
        // @ts-expect-error TS migration - TS2339
        addToQueue({ ...(request as Record<string, unknown>), attempts: request.attempts + 1 });
      } else if ((request as Record<string, unknown>).callback) {
        ((request as Record<string, unknown>).callback as (...args: unknown[]) => unknown)(error, null);
      }
    }
  }
  
  setState(OFFLINE_STATES.ONLINE);
  _saveState();
  
  if (successCount > 0) {
    incrementMetric('syncSuccesses');
  }
  
  _emit('syncComplete', { processed: currentQueue.length, successful: successCount, remaining: getOfflineQueue().length });
  _log('info', `Sync complete: ${successCount}/${currentQueue.length} requests processed`);
}

export function queueRequest(url: string, options: Record<string, unknown> = {}, callback: ((...args: unknown[]) => void) | null = null) {
  const config = getConfig();
  if (!config.queueOfflineRequests) {
    _log('warn', 'Offline queue disabled');
    return false;
  }
  
  addToQueue({
    url,
    options,
    callback,
    attempts: 0,
    timestamp: Date.now()
  });
  
  incrementMetric('queuedRequests');
  _saveState();
  
  _emit('requestQueued', { url, queueSize: getOfflineQueue().length });
  
  return true;
}
