// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.feature-flags.server-api
// PURPOSE: Server API integration for fetching and checking feature flags
// ───────────────────────────────────────────────────────────────
// @contract FETCH_FLAGS_FROM_SERVER - fetchFlagsFromServer(env, metrics, emit, track)
// @contract CHECK_FLAG_ON_SERVER - checkFlagOnServer(key, metrics, emit, track)
// @contract FETCH_WITH_RETRY - fetchWithRetry(url, options, attempt) retries fetch
// @contract GET_SERVER_FLAGS - getServerFlags() returns cached server flags
// @contract GET_LAST_FETCH_TIME - getLastFetchTime() returns last fetch timestamp
// @contract GET_ABORT_CONTROLLER - getAbortController() returns abort controller
// @contract SET_ABORT_CONTROLLER - setAbortController(ctrl) sets abort controller
// @contract RESET_SERVER_STATE - resetServerState() resets server state
// @contract HEALTH - info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: getPort, log from ./ports.js
// IMPORTS: FlagRegistry from ./core/registry.js
// IMPORTS: trackFlagEvent from ./telemetry/tracker.js
// IMPORTS: FEATURE_FLAGS_EVENTS from /core/runtime/events/index.js
// PROVIDES: fetchFlagsFromServer, checkFlagOnServer, fetchWithRetry,
//           getServerFlags, getLastFetchTime, getAbortController,
//           setAbortController, resetServerState, info, CONFIG,
//           VERSION, MODULE_ID
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-P18EC: Removed local emit() calls, using only
//            FEATURE_FLAGS_EVENTS constants
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getPort, log } from './ports.js';
import { FlagRegistry } from './core/registry.js';
import { trackFlagEvent } from './telemetry/tracker.js';
import { FEATURE_FLAGS_EVENTS } from '/core/runtime/events/catalog/feature-flags.events.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.feature-flags.server-api';

export const CONFIG = {
  endpoints: {
    list: '/api/feature-flags/?action=list',
    check: '/api/feature-flags/?action=check&flag='
  },
  retry: { maxAttempts: 3, baseDelay: 1000, maxDelay: 5000 },
  timeout: 10000
};

let serverFlags: Record<string, unknown> = {};
let lastFetchTime = 0;
let _abortController: AbortController | null = null;

export function getServerFlags() {
  return { ...serverFlags };
}

export function getLastFetchTime() {
  return lastFetchTime;
}

export function getAbortController() {
  return _abortController;
}

export function setAbortController(ctrl: AbortController | null): void {
  _abortController = ctrl;
}

export function resetServerState() {
  serverFlags = {};
  lastFetchTime = 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function fetchWithRetry(url: string, options: RequestInit = {}, attempt = 1): Promise<Response> {
  const { maxAttempts, baseDelay, maxDelay } = CONFIG.retry;

  if (!_abortController || _abortController.signal.aborted) {
    _abortController = new AbortController();
  }

  const fetchOptions = {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
    ...options,
    signal: _abortController.signal
  };

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      _abortController!.abort();
    }, CONFIG.timeout);

    fetch(url, fetchOptions as RequestInit)
      .then(response => {
        clearTimeout(timeoutId);

        if (!response.ok && attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          log('warn', `Request failed (${response.status}), retry ${attempt}/${maxAttempts}`);
          return sleep(delay)
            .then(() => fetchWithRetry(url, options, attempt + 1))
            .then(resolve)
            .catch(reject);
        }

        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          reject(new Error('REQUEST_TIMEOUT'));
          return;
        }

        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          log('warn', `Request error, retry ${attempt}/${maxAttempts}`);
          sleep(delay)
            .then(() => {
              _abortController = new AbortController();
              return fetchWithRetry(url, options, attempt + 1);
            })
            .then(resolve)
            .catch(reject);
          return;
        }

        reject(error);
      });
  });
}

interface ServerMetrics {
  fetchCount: number;
  checkCount: number;
  errorCount: number;
  [key: string]: number;
}

export function fetchFlagsFromServer(environment = 'production', metrics: ServerMetrics, emit: (event: string, data: Record<string, unknown>) => void, trackTelemetry: (event: string, data: Record<string, unknown>) => void): Promise<Record<string, unknown>> {
  return new Promise(resolve => {
    const url = `${CONFIG.endpoints.list}&env=${environment}`;

    fetchWithRetry(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data.ok && data.flags) {
          serverFlags = data.flags;
          lastFetchTime = Date.now();
          metrics.fetchCount++;

          for (const [flagKey, flagData] of Object.entries(data.flags) as [string, Record<string, unknown>][]) {
            if (flagData.enabled) FlagRegistry.enable(flagKey);
            else FlagRegistry.disable(flagKey);

            if (flagData.payload) {
              FlagRegistry.update(flagKey, { payload: flagData.payload });
            }
          }

          trackFlagEvent('flags:server:fetched', {
            count: Object.keys(data.flags).length,
            environment: data.environment
          });

          trackTelemetry('fetched', {
            count: Object.keys(data.flags).length,
            environment
          });

          const eventBus = getPort('eventBus');
          if (eventBus?.emit) {
            eventBus.emit(FEATURE_FLAGS_EVENTS.SERVER_UPDATED, {
              flags: data.flags,
              timestamp: Date.now()
            });
          }
        }
        resolve(data);
      })
      .catch(error => {
        metrics.errorCount++;
        trackFlagEvent('flags:server:fetch-error', { error: error.message });
        trackTelemetry('error', { action: 'fetch', error: error.message });

        const eventBus = getPort('eventBus');
        if (eventBus?.emit) {
          eventBus.emit(FEATURE_FLAGS_EVENTS.ERROR, {
            action: 'fetch',
            error: error.message
          });
        }

        log('warn', 'Server fetch error:', error.message);
        resolve({ ok: false, error: error.message });
      });
  });
}

export function checkFlagOnServer(flagKey: string, metrics: ServerMetrics, emit: (event: string, data: Record<string, unknown>) => void, trackTelemetry: (event: string, data: Record<string, unknown>) => void): Promise<Record<string, unknown>> {
  return new Promise(resolve => {
    fetchWithRetry(CONFIG.endpoints.check + encodeURIComponent(flagKey))
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data.ok) {
          metrics.checkCount++;

          if (data.enabled) FlagRegistry.enable(flagKey);
          else FlagRegistry.disable(flagKey);

          trackFlagEvent('flags:server:checked', {
            flag: flagKey,
            enabled: data.enabled,
            source: data.source
          });

          trackTelemetry('checked', {
            flag: flagKey,
            enabled: data.enabled
          });
        }
        resolve(data);
      })
      .catch(error => {
        metrics.errorCount++;
        trackTelemetry('error', {
          action: 'check',
          flag: flagKey,
          error: error.message
        });

        const eventBus = getPort('eventBus');
        if (eventBus?.emit) {
          eventBus.emit(FEATURE_FLAGS_EVENTS.ERROR, {
            action: 'check',
            flag: flagKey,
            error: error.message
          });
        }

        resolve({ ok: false, error: error.message });
      });
  });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    serverFlagsCount: Object.keys(serverFlags).length,
    lastFetchTime,
    timestamp: Date.now()
  };
}

export default {
  fetchFlagsFromServer,
  checkFlagOnServer,
  getServerFlags,
  getLastFetchTime,
  resetServerState,
  info,
  VERSION,
  MODULE_ID
};
