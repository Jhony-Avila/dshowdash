// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.9.0-ABSOLUTE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-init
// PURPOSE: Initializer - Main Init
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID, MAIN_CONTAINER_EVENTS from ../constants.js
//   incrementInitializations, incrementErrors, updateInitTime from ../state.js
//   createAdapters from ./adapters-factory.js
//   createPorts from ./ports-factory.js
//   bootstrapPrimaryContainer from ../bootstrap/container-bootstrap.js
//   createContainerPort from /components/main/ports/ContainerPort.js
//   createMainEngine from /components/main/domain/main-engine.js
//   buildContext from /components/main/domain/context-builder.js
//   createActionHub from /components/main/domain/action-hub/index.js
//
// PROVIDES:
//   initializeMain() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   MAIN_CONTAINER_EVENTS.PRIMARY_READY
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import type { MainState, MainEngine, ActionHub } from '../../../types.js';
import { MODULE_ID, MAIN_CONTAINER_EVENTS } from '../constants.js';
import {
  incrementInitializations,
  incrementErrors,
  updateInitTime
} from '../state.js';
import { createAdapters } from './adapters-factory.js';
import { createPorts } from './ports-factory.js';
import { bootstrapPrimaryContainer } from '../bootstrap/container-bootstrap.js';

import { createContainerPort } from '/components/main/ports/ContainerPort.js';
import { createMainEngine } from '/components/main/domain/main-engine.js';
import { buildContext } from '/components/main/domain/context-builder.js';
import { createActionHub } from '/components/main/domain/action-hub/index.js';

export const VERSION = '3.6.0-PATH-FIX';

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

/**
 * Inicializa o Main
 * @param {Object} state - Estado compartilhado
 * @param {Object} options - Opções de inicialização
 * @returns {Promise<Object>} state
 */
export function initializeMain(state: MainState, options?: Record<string, unknown>) {
  options = options || {};
  const startTime = performance.now();
  incrementInitializations();
  
  const externalDeps = {
    eventBus: options.eventBus || null,
    router: options.router || null,
    globalState: options.globalState || null,
    telemetryCore: options.telemetryCore || null,
    document: options.document || null
  };
  
  return Promise.resolve().then(() => {
    // Create adapters
    const adapterResult = createAdapters(externalDeps, state);
    state.eventBusAdapter = adapterResult.eventBusAdapter as unknown as MainState['eventBusAdapter'];
    state.containerAdapter = adapterResult.containerAdapter as MainState['containerAdapter'];
    state.adapters = adapterResult.adapters;
    
    // Create container port
    state.containerPort = createContainerPort(state.containerAdapter as Record<string, unknown>);
    
    // Create ports
    state.ports = createPorts(state.adapters as Record<string, Record<string, unknown>>, {
      eventBusAdapter: state.eventBusAdapter,
      containerAdapter: state.containerAdapter
    });
    
    // Build context
    state.context = buildContext({
      ports: state.ports,
      adapters: state.adapters,
      eventBus: externalDeps.eventBus,
      router: externalDeps.router,
      globalState: externalDeps.globalState,
      telemetry: externalDeps.telemetryCore,
      document: externalDeps.document
    });
    
    // Create engine
    state.engine = createMainEngine(Object.assign({}, state.context, {
      defaultPanel: options.defaultPanel || 'panel-01'
    })) as MainState['engine'];

    const engine = state.engine as MainEngine & Record<string, (...args: unknown[]) => unknown>;
    return engine.init();
  }).then(() => {
    const engine = state.engine as MainEngine & Record<string, (...args: unknown[]) => unknown>;
    // Create action hub
    state.actionHub = createActionHub({
      ports: {
        events: state.eventBusAdapter,
        telemetry: state.ports.telemetry,
        navigation: state.ports.navigation,
        timer: state.ports.timer
      },
      mainEngine: state.engine,
      manifestController: typeof engine.getManifestController === 'function' ? engine.getManifestController() : null
    }) as unknown as ActionHub;
    const actionHub = state.actionHub as ActionHub & Record<string, (...args: unknown[]) => unknown>;
    actionHub.init();
    engine.setActionHub(state.actionHub);

    return engine.mount();
  }).then(() => {
    // Bootstrap primary container
    state.primaryContainer = bootstrapPrimaryContainer(state) as MainState['primaryContainer'];
    
    // Resolve primary handle
    state.primaryHandle = null;
    const cPort = state.containerPort as Record<string, unknown> | null;
    if (cPort && typeof cPort.resolvePrimaryHandle === 'function') {
      state.primaryHandle = (cPort.resolvePrimaryHandle as () => Record<string, unknown>)();
    }

    // Emit PRIMARY_READY event
    const pHandle = state.primaryHandle as Record<string, unknown> | null;
    if (pHandle && state.eventBusAdapter && state.eventBusAdapter.emit) {
      try {
        state.eventBusAdapter.emit(MAIN_CONTAINER_EVENTS.PRIMARY_READY, {
          handle: pHandle,
          containerId: (pHandle.containerId as string) || 'container-main',
          mode: (pHandle.mode as string) || 'unknown',
          source: MODULE_ID
        });
      } catch (e) {
        // Non-critical: event emission failure should not break init
      }
    }
    
    // Update metrics
    const initTime = Math.round(performance.now() - startTime);
    updateInitTime(initTime);
    
    return state;
  }).catch(error => {
    incrementErrors();
    throw error;
  });
}

export default {
  initializeMain
};
