// Phase Globals Contract — Mapa formal de dependências por global
// @version 1.1.0-FIX-APPSHELL
// @description Declara quais globais cada phase CRIA e quais CONSOME
// @changelog v1.1.0-FIX-APPSHELL: AppShell movido de required→optional em phase-4-main (pode ser skipped quando auth pendente)
// @changelog v1.0.0-ACTION3: Criação inicial — Ação 3 do Briefing Bootstrap-V2
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (pure data — self-contained)
// PROVIDES: PHASE_GLOBALS_CONTRACT, getPhaseContract, getGlobalCreator,
//           getGlobalConsumers, validateGlobalsAvailable
// WINDOW ACCESS: None (validation is done by dependency-checker using windowAdapter)
// ═══════════════════════════════════════════════════════════════
'use strict';

export var VERSION = '1.1.0-FIX-APPSHELL';
export var MODULE_ID = 'boot-manifest:phase-globals-contract';

/**
 * MAPA FORMAL DE GLOBAIS POR PHASE
 *
 * Extraído dos Dependency Contracts de cada phase:
 * - creates: globais que esta phase registra (via windowAdapter.expose ou window.Core)
 * - requires: globais que esta phase PRECISA — ausência = erro
 * - optional: globais que esta phase USA se disponíveis — ausência = warning
 *
 * Regra: Um global "required" por phase-N DEVE ter sido "created" por phase < N
 */
export var PHASE_GLOBALS_CONTRACT = Object.freeze({

  'phase-0-critical': {
    order: 0,
    creates: [
      'EventBus',
      'Logger',
      'ErrorBoundary',
      'Config',
      'SecurityCSRF',
      'Environment'
    ],
    requires: [],
    optional: []
  },

  'phase-1-core': {
    order: 1,
    creates: [
      'GlobalState',
      'ReadyFlags',
      'AssetLoader',
      'Telemetry',
      'TelemetryCore',
      'ContextProvider'
    ],
    requires: [
      'EventBus',
      'Logger'
    ],
    optional: []
  },

  'phase-2-auth': {
    order: 2,
    creates: [
      'AppContext',
      'SessionManager',
      'PermissionsGuard',
      'AuthAdapter'
    ],
    requires: [
      'EventBus',
      'Logger',
      'GlobalState'
    ],
    optional: [
      'ReadyFlags',
      'Config'
    ]
  },

  'phase-3-shell': {
    order: 3,
    creates: [
      'LayoutManager',
      'AppShell',
      'Header',
      'Sidebar',
      'NavRail',
      'Footer',
      'RouterGlobal'
    ],
    requires: [
      'EventBus',
      'Logger'
    ],
    optional: [
      'SessionManager',
      'GlobalState',
      'ReadyFlags'
    ]
  },

  'phase-4-main': {
    order: 4,
    creates: [
      'ContainerMain',
      'CMBootstrap',
      'ApplicationKernel'
    ],
    requires: [
      'EventBus',
      'Logger'
    ],
    optional: [
      'AppShell',
      'SessionManager',
      'GlobalState',
      'ContextProvider',
      'ReadyFlags'
    ]
  },

  'phase-5-ui': {
    order: 5,
    creates: [
      'OverlayLayer',
      'UIOrchestrator',
      'Toast'
    ],
    requires: [
      'EventBus'
    ],
    optional: [
      'AppShell',
      'ApplicationKernel',
      'PermissionsGuard',
      'HealthAggregator',
      'ContextProvider',
      'RuntimeContext'
    ]
  },

  'phase-6-platform': {
    order: 6,
    creates: [
      'Platform'
    ],
    requires: [
      'EventBus'
    ],
    optional: [
      'ContainerMain',
      'AppShell',
      'ReadyFlags'
    ]
  }
});

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Retorna o contrato de uma phase específica.
 * @param {string} phaseId
 * @returns {Object|null}
 */
export function getPhaseContract(phaseId: string) {
  return PHASE_GLOBALS_CONTRACT[phaseId as keyof typeof PHASE_GLOBALS_CONTRACT] || null;
}

/**
 * Retorna qual phase cria um global específico.
 * @param {string} globalName
 * @returns {string|null} phaseId que cria o global
 */
export function getGlobalCreator(globalName: string) {
  var phaseIds = Object.keys(PHASE_GLOBALS_CONTRACT);
  for (var i = 0; i < phaseIds.length; i++) {
    var contract = PHASE_GLOBALS_CONTRACT[phaseIds[i] as keyof typeof PHASE_GLOBALS_CONTRACT];
    if (contract.creates.indexOf(globalName) !== -1) {
      return phaseIds[i];
    }
  }
  return null;
}

/**
 * Retorna todas as phases que consomem um global.
 * @param {string} globalName
 * @returns {Array<{phaseId: string, type: 'required'|'optional'}>}
 */
export function getGlobalConsumers(globalName: string) {
  var consumers: Array<{ phaseId: string; type: 'required' | 'optional' }> = [];
  var phaseIds = Object.keys(PHASE_GLOBALS_CONTRACT);
  for (var i = 0; i < phaseIds.length; i++) {
    var contract = PHASE_GLOBALS_CONTRACT[phaseIds[i] as keyof typeof PHASE_GLOBALS_CONTRACT];
    // @ts-expect-error strict migration — TS2345
    if (contract.requires.indexOf(globalName) !== -1) {
      consumers.push({ phaseId: phaseIds[i], type: 'required' });
    // @ts-expect-error strict migration — TS2345
    } else if (contract.optional.indexOf(globalName) !== -1) {
      consumers.push({ phaseId: phaseIds[i], type: 'optional' });
    }
  }
  return consumers;
}

/**
 * Valida se os globais necessários para uma phase estão disponíveis.
 * Recebe um resolver function que verifica existência (ex: windowAdapter.get).
 *
 * @param {string} phaseId
 * @param {Function} resolveGlobal — (name) => truthy se existe, falsy se não
 * @returns {Object} { satisfied, missingRequired, missingOptional }
 */
export function validateGlobalsAvailable(phaseId: string, resolveGlobal: (name: string) => unknown) {
  var contract = PHASE_GLOBALS_CONTRACT[phaseId as keyof typeof PHASE_GLOBALS_CONTRACT];
  if (!contract) {
    return { satisfied: true, missingRequired: [], missingOptional: [] };
  }

  var missingRequired = [];
  var missingOptional = [];

  for (var i = 0; i < contract.requires.length; i++) {
    var name = contract.requires[i];
    if (!resolveGlobal(name)) {
      missingRequired.push(name);
    }
  }

  for (var j = 0; j < contract.optional.length; j++) {
    var optName = contract.optional[j];
    if (!resolveGlobal(optName)) {
      missingOptional.push(optName);
    }
  }

  return {
    satisfied: missingRequired.length === 0,
    missingRequired: missingRequired,
    missingOptional: missingOptional
  };
}

export default {
  VERSION,
  MODULE_ID,
  PHASE_GLOBALS_CONTRACT,
  getPhaseContract,
  getGlobalCreator,
  getGlobalConsumers,
  validateGlobalsAvailable
};
