// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.7.0-P1-TIMEOUT)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Context Provider - Orchestrator Integration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   CONTEXT_EVENTS from /core/runtime/events/index.js
//   MODULE_ID, RETRY_MAX, RETRY_DELAY from ../constants.js
//   ContextProviderCore from ../core/provider.js
//   trackContextEvent from ../telemetry/tracker.js
//   integrationState, metrics, cancelOrchestratorRetryTimeout from ./state.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID_INT — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   setupOrchestratorIntegration() — exported function
//   cleanupOrchestratorIntegration() — exported function
//   retryOrchestratorIntegration() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   data.responseEvent
// LISTENS (eventos):
//   CONTEXT_EVENTS.UPDATE
//   CONTEXT_EVENTS.REQUEST
//   CONTEXT_EVENTS.RESET
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { CONTEXT_EVENTS } from '/core/runtime/events/catalog/state.events.js';
import { MODULE_ID, RETRY_MAX, RETRY_DELAY } from '../constants.js';
import { ContextProviderCore } from '../core/provider.js';
import { trackContextEvent } from '../telemetry/tracker.js';
import { integrationState, metrics, cancelOrchestratorRetryTimeout } from './state.js';

export const VERSION = '5.7.0-P1-TIMEOUT';
export const MODULE_ID_INT = 'context-provider-orchestrator';

const Ports = createCorePorts({ moduleId: `${MODULE_ID}:orchestrator` });

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

// Armazena referências aos handlers para cleanup correto
let _contextUpdateHandler: ((data: Record<string, unknown>) => void) | null = null;
let _contextRequestHandler: ((data: Record<string, unknown>) => void) | null = null;
let _contextResetHandler: ((data: Record<string, unknown>) => void) | null = null;

/**
 * Configura integração com Orchestrator/EventBus
 * @returns {boolean}
 */
export function setupOrchestratorIntegration() {
  // Já configurado
  if (integrationState.orchestratorCleanups.length > 0) {
    return true;
  }

  const eb = _getPort('eventBus');

  if (!eb) {
    if (integrationState.orchestratorRetryCount < RETRY_MAX) {
      integrationState.orchestratorRetryCount++;
      const delay = RETRY_DELAY * integrationState.orchestratorRetryCount;
      _log('info', 'EventBus not available, retrying', {
        attempt: integrationState.orchestratorRetryCount,
        delay
      });

      // P1-TIMEOUT: Armazena timeoutId para cancelamento
      integrationState.orchestratorRetryTimeoutId = setTimeout(setupOrchestratorIntegration, delay);
    } else {
      _log('warn', 'EventBus not available after max retries');
    }
    return false;
  }

  // P1-TIMEOUT: Limpa timeout pendente se existir (conexão bem-sucedida)
  if (integrationState.orchestratorRetryTimeoutId !== null) {
    clearTimeout(integrationState.orchestratorRetryTimeoutId);
    integrationState.orchestratorRetryTimeoutId = null;
  }

  try {
    integrationState.lastOrchestratorOwner = 'Orchestrator';

    // Handler para CONTEXT_EVENTS.UPDATE
    _contextUpdateHandler = (data: Record<string, any>) => {
      if (!data || !data.context) return;
      try {
        ContextProviderCore.set(data.context, data.value, false, {
          owner: data.owner || 'Orchestrator',
          silent: data.silent
        });
        metrics.orchestratorEvents++;
      } catch (e: any) {
        metrics.orchestratorErrors++;
        _log('warn', 'Orchestrator context update failed:', e.message);
      }
    };

    // Handler para CONTEXT_EVENTS.REQUEST
    _contextRequestHandler = (data: Record<string, any>) => {
      if (!data || !data.context) return;
      try {
        const value = ContextProviderCore.get(data.context);
        if (data.callback && typeof data.callback === 'function') {
          data.callback(value);
        }
        const ebEmit = _getPort('eventBus');
        if (data.responseEvent && ebEmit && ebEmit.emit) {
          ebEmit.emit(data.responseEvent, { context: data.context, value });
        }
      } catch (e: any) {
        _log('warn', 'Orchestrator context request failed:', e.message);
      }
    };

    // Handler para CONTEXT_EVENTS.RESET
    _contextResetHandler = (data: Record<string, any>) => {
      try {
        if (data && data.context) {
          (ContextProviderCore as any).reset(data.context, {
            owner: data.owner || 'Orchestrator'
          });
        }
      } catch (e: any) {
        _log('warn', 'Orchestrator context reset failed:', e.message);
      }
    };

    // Registra handlers
    eb.on(CONTEXT_EVENTS.UPDATE, _contextUpdateHandler);
    eb.on(CONTEXT_EVENTS.REQUEST, _contextRequestHandler);
    eb.on(CONTEXT_EVENTS.RESET, _contextResetHandler);

    // Registra cleanups - cada um separadamente para garantir execução
    integrationState.orchestratorCleanups.push(() => {
      const e = _getPort('eventBus');
      if (e && e.off && _contextUpdateHandler) {
        e.off(CONTEXT_EVENTS.UPDATE, _contextUpdateHandler);
      }
    });

    integrationState.orchestratorCleanups.push(() => {
      const e = _getPort('eventBus');
      if (e && e.off && _contextRequestHandler) {
        e.off(CONTEXT_EVENTS.REQUEST, _contextRequestHandler);
      }
    });

    integrationState.orchestratorCleanups.push(() => {
      const e = _getPort('eventBus');
      if (e && e.off && _contextResetHandler) {
        e.off(CONTEXT_EVENTS.RESET, _contextResetHandler);
      }
    });

    _log('info', 'Orchestrator integration setup complete');

    try {
      trackContextEvent('context.integration.orchestrator.connected');
    } catch (e: any) { /* ignore */ }

    return true;
  } catch (error: any) {
    _log('error', 'Failed to setup Orchestrator integration:', error.message);
    return false;
  }
}

/**
 * Limpa integração com Orchestrator
 */
export function cleanupOrchestratorIntegration() {
  // P1-TIMEOUT: Cancela timeout pendente primeiro
  cancelOrchestratorRetryTimeout();

  // Executa cleanups registrados
  for (let i = 0; i < integrationState.orchestratorCleanups.length; i++) {
    try {
      if (typeof integrationState.orchestratorCleanups[i] === 'function') {
        integrationState.orchestratorCleanups[i]();
      }
    } catch (e: any) { /* ignore */ }
  }

  integrationState.orchestratorCleanups = [];

  // Limpa referências aos handlers
  _contextUpdateHandler = null;
  _contextRequestHandler = null;
  _contextResetHandler = null;

  _log('info', 'Orchestrator integration cleaned up');
}

/**
 * Reinicia integração com Orchestrator
 * @returns {boolean}
 */
export function retryOrchestratorIntegration() {
  cleanupOrchestratorIntegration();
  integrationState.orchestratorRetryCount = 0;
  return setupOrchestratorIntegration();
}

export function info() {
  return {
    moduleId: MODULE_ID_INT,
    version: VERSION,
    hasRetryPending: integrationState.orchestratorRetryTimeoutId !== null,
    retryCount: integrationState.orchestratorRetryCount,
    handlersRegistered: {
      update: _contextUpdateHandler !== null,
      request: _contextRequestHandler !== null,
      reset: _contextResetHandler !== null
    },
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const checks = {
    connected: integrationState.orchestratorCleanups.length > 0,
    noRetryPending: integrationState.orchestratorRetryTimeoutId === null,
    withinRetryLimit: integrationState.orchestratorRetryCount <= RETRY_MAX,
    handlersIntact: _contextUpdateHandler !== null || integrationState.orchestratorCleanups.length === 0
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
  setupOrchestratorIntegration,
  cleanupOrchestratorIntegration,
  retryOrchestratorIntegration,
  setDebug,
  injectPorts,
  getPorts,
  info,
  healthCheck,
  VERSION,
  MODULE_ID: MODULE_ID_INT
};
