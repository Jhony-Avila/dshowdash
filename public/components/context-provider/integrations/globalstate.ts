// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.7.0-P1-TIMEOUT)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Context Provider - GlobalState Integration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   MODULE_ID, RETRY_MAX, RETRY_DELAY, MAX_GLOBALSTATE_SIZE from ../constants.js
//   ContextProviderCore from ../core/provider.js
//   trackContextEvent from ../telemetry/tracker.js
//   integrationState, metrics, cancelGlobalStateRetryTimeout from ./state.js
//   getMapper from ./mapper.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID_INT — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   setupGlobalStateIntegration() — exported function
//   cleanupGlobalStateIntegration() — exported function
//   retryGlobalStateIntegration() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID, RETRY_MAX, RETRY_DELAY, MAX_GLOBALSTATE_SIZE } from '../constants.js';
import { ContextProviderCore } from '../core/provider.js';
import { trackContextEvent } from '../telemetry/tracker.js';
import { integrationState, metrics, cancelGlobalStateRetryTimeout } from './state.js';
import { getMapper } from './mapper.js';

export const VERSION = '5.7.0-P1-TIMEOUT';
export const MODULE_ID_INT = 'context-provider-globalstate';

const Ports = createUiPorts({ moduleId: `${MODULE_ID}:globalstate` });

function _initPorts() {
  Ports.init();
}

function _getPort(name: string) {
  return Ports.get(name);
}

export function injectPorts(p: Record<string, unknown>) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

const _debug = () => {
  const cfg = _getPort('config');
  return cfg && cfg.app && cfg.app.debug ? true : false;
};

const _log = function(level: string, ...args: any[]) {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === 'warn') {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (_debug() && logger.debug) {
    logger.debug(...[prefix].concat(args));
  }
};

/**
 * Aplica contextos mapeados ao ContextProvider
 * @param {object} mappedState - Estado mapeado
 */
function applyMappedContexts(mappedState: Record<string, unknown>) {
  if (!mappedState || typeof mappedState !== 'object') return;
  for (const contextName in mappedState) {
    if (mappedState.hasOwnProperty(contextName)) {
      try {
        ContextProviderCore.set(contextName, mappedState[contextName], false, {
          owner: 'GlobalState',
          silent: true
        });
      } catch (e: any) {
        _log('warn', `Failed to set context ${contextName}:`, e.message);
      }
    }
  }
}

/**
 * Configura integração com GlobalState
 * @returns {boolean}
 */
export function setupGlobalStateIntegration() {
  // Já configurado
  if (integrationState.globalStateCleanups.length > 0) {
    return true;
  }

  const gs = _getPort('globalState');

  if (!gs) {
    if (integrationState.globalStateRetryCount < RETRY_MAX) {
      integrationState.globalStateRetryCount++;
      const delay = RETRY_DELAY * integrationState.globalStateRetryCount;
      _log('info', 'GlobalState not available, retrying', {
        attempt: integrationState.globalStateRetryCount,
        delay
      });

      // P1-TIMEOUT: Armazena timeoutId para cancelamento
      integrationState.globalStateRetryTimeoutId = setTimeout(setupGlobalStateIntegration, delay);
    } else {
      _log('warn', 'GlobalState not available after max retries');
    }
    return false;
  }

  // P1-TIMEOUT: Limpa timeout pendente se existir (conexão bem-sucedida)
  if (integrationState.globalStateRetryTimeoutId !== null) {
    clearTimeout(integrationState.globalStateRetryTimeoutId);
    integrationState.globalStateRetryTimeoutId = null;
  }

  try {
    const mapper = getMapper();
    integrationState.lastGlobalStateOwner = 'GlobalState';

    const unsubscribeAll = gs.subscribe((state: Record<string, unknown>) => {
      try {
        const mappedState = mapper(state);
        const stateStr = JSON.stringify(mappedState);

        if (stateStr && stateStr.length > MAX_GLOBALSTATE_SIZE) {
          _log('warn', 'GlobalState payload too large');
          metrics.payloadTooLarge++;
          if (integrationState.lastValidGlobalState) {
            applyMappedContexts(integrationState.lastValidGlobalState);
            try {
              trackContextEvent('context:global-state:fallback-applied', { reason: 'payload-too-large' });
            } catch (e: any) { /* ignore */ }
          }
          return;
        }

        integrationState.lastValidGlobalState = mappedState;
        // @ts-expect-error strict migration — TS2345
        applyMappedContexts(mappedState);
        metrics.globalStateSyncs++;
      } catch (syncError: any) {
        metrics.globalStateErrors++;
        _log('error', 'GlobalState sync error:', syncError.message);
        if (integrationState.lastValidGlobalState) {
          metrics.globalStateFallbacks++;
          applyMappedContexts(integrationState.lastValidGlobalState);
          try {
            trackContextEvent('context:global-state:fallback-applied', { reason: 'sync-error' });
          } catch (e: any) { /* ignore */ }
        }
      }
    });

    integrationState.globalStateCleanups.push(unsubscribeAll);

    // Aplica estado inicial
    try {
      const initialState = gs.getState ? gs.getState() : (gs.get ? gs.get() : null);
      if (initialState) {
        const mappedInitial = mapper(initialState);
        integrationState.lastValidGlobalState = mappedInitial;
        // @ts-expect-error strict migration — TS2345
        applyMappedContexts(mappedInitial);
      }
    } catch (e: any) {
      _log('warn', 'Failed to get initial GlobalState:', e.message);
    }

    _log('info', 'GlobalState integration setup complete');

    try {
      trackContextEvent('context:integration:globalstate:connected');
    } catch (e: any) { /* ignore */ }

    return true;
  } catch (error: any) {
    _log('error', 'Failed to setup GlobalState integration:', error.message);
    return false;
  }
}

/**
 * Limpa integração com GlobalState
 */
export function cleanupGlobalStateIntegration() {
  // P1-TIMEOUT: Cancela timeout pendente primeiro
  cancelGlobalStateRetryTimeout();

  // Executa cleanups registrados
  for (let i = 0; i < integrationState.globalStateCleanups.length; i++) {
    try {
      if (typeof integrationState.globalStateCleanups[i] === 'function') {
        integrationState.globalStateCleanups[i]();
      }
    } catch (e: any) { /* ignore */ }
  }

  integrationState.globalStateCleanups = [];
  _log('info', 'GlobalState integration cleaned up');
}

/**
 * Reinicia integração com GlobalState
 * @returns {boolean}
 */
export function retryGlobalStateIntegration() {
  cleanupGlobalStateIntegration();
  integrationState.globalStateRetryCount = 0;
  return setupGlobalStateIntegration();
}

export function info() {
  return {
    moduleId: MODULE_ID_INT,
    version: VERSION,
    hasRetryPending: integrationState.globalStateRetryTimeoutId !== null,
    retryCount: integrationState.globalStateRetryCount,
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const checks = {
    connected: integrationState.globalStateCleanups.length > 0,
    noRetryPending: integrationState.globalStateRetryTimeoutId === null,
    withinRetryLimit: integrationState.globalStateRetryCount <= RETRY_MAX
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID_INT,
    version: VERSION,
    timestamp: Date.now()
  };
}

export const setDebug = (enabled: boolean) => { /* no-op, debug controlled via ports */ };

export default {
  setupGlobalStateIntegration,
  cleanupGlobalStateIntegration,
  retryGlobalStateIntegration,
  setDebug,
  injectPorts,
  getPorts,
  info,
  healthCheck,
  VERSION,
  MODULE_ID: MODULE_ID_INT
};
