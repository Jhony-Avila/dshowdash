// Boot Events Catalog - Centralized Event Documentation
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description QW#25 - Catálogo centralizado de todos os eventos do bootstrap
// @changelog v1.0.0-QUICKWINS: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: EVENTS_CATALOG, getEventByName(), getAllEvents(),
//   getEventsByCategory(), getEventsByEmitter(), info()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'boot-events-catalog';
var VERSION = '1.0.1-CONTRACTS';

// QW#25: Catálogo completo de eventos do Bootstrap
var EVENTS_CATALOG = {
  // ========================================
  // PRE-BOOT EVENTS (Stage -1)
  // ========================================
  PRE_BOOT: {
    START: {
      name: 'pre-boot:start',
      description: 'Pre-boot sequence initiated',
      payload: { timestamp: 'number' },
      emitter: 'pre-boot-orchestrator'
    },
    BRIDGE_READY: {
      name: 'pre-boot:bridge:ready',
      description: 'DOM Bridge module loaded',
      payload: { time: 'number' },
      emitter: 'pre-boot-orchestrator'
    },
    METRICS_READY: {
      name: 'pre-boot:metrics:ready',
      description: 'Metrics Polling module loaded',
      payload: { time: 'number' },
      emitter: 'pre-boot-orchestrator'
    },
    PERMISSIONS_READY: {
      name: 'pre-boot:permissions:ready',
      description: 'Permissions module loaded',
      payload: { mode: 'string', time: 'number' },
      emitter: 'pre-boot-orchestrator'
    },
    COMPLETE: {
      name: 'pre-boot:complete',
      description: 'Pre-boot sequence completed',
      payload: { success: 'boolean', timing: 'object', modules: 'object' },
      emitter: 'pre-boot-orchestrator'
    },
    ERROR: {
      name: 'pre-boot:error',
      description: 'Pre-boot error occurred',
      payload: { error: 'string', result: 'object' },
      emitter: 'pre-boot-orchestrator'
    }
  },

  // ========================================
  // ORCHESTRATOR EVENTS (Stage 0+)
  // ========================================
  ORCHESTRATOR: {
    INIT: {
      name: 'orchestrator:init',
      description: 'Boot orchestrator initialized',
      payload: { phases: 'number' },
      emitter: 'boot-orchestrator'
    },
    PHASE_START: {
      name: 'orchestrator:phase:start',
      description: 'Phase execution starting',
      payload: { phaseId: 'string', name: 'string' },
      emitter: 'boot-orchestrator'
    },
    PHASE_COMPLETE: {
      name: 'orchestrator:phase:complete',
      description: 'Phase execution completed',
      payload: { phaseId: 'string', result: 'any', time: 'number' },
      emitter: 'boot-orchestrator'
    },
    PHASE_ERROR: {
      name: 'orchestrator:phase:error',
      description: 'Phase execution failed',
      payload: { phaseId: 'string', error: 'string' },
      emitter: 'boot-orchestrator'
    },
    RECOVERY: {
      name: 'orchestrator:recovery',
      description: 'Phase recovered from error',
      payload: { phaseId: 'string', reason: 'string?' },
      emitter: 'boot-orchestrator'
    },
    COMPLETE: {
      name: 'orchestrator:complete',
      description: 'Boot orchestration completed',
      payload: { success: 'boolean', totalTime: 'number', phases: 'array' },
      emitter: 'boot-orchestrator'
    },
    CONTEXT_READY: {
      name: 'orchestrator:context:ready',
      description: 'Boot context finalized',
      payload: { context: 'object' },
      emitter: 'boot-orchestrator'
    },
    HEALTH_UPDATE: {
      name: 'orchestrator:health:update',
      description: 'Health status updated',
      payload: { health: 'object' },
      emitter: 'boot-orchestrator'
    },
    MANIFEST_INVALID: {
      name: 'orchestrator:manifest:invalid',
      description: 'Manifest validation failed',
      payload: { errors: 'array' },
      emitter: 'boot-orchestrator'
    }
  },

  // ========================================
  // BOOTSTRAP EVENTS (Global)
  // ========================================
  BOOTSTRAP: {
    READY: {
      name: 'bootstrap:ready',
      description: 'Bootstrap completed successfully',
      payload: { totalTime: 'number', phases: 'number', context: 'object', health: 'object' },
      emitter: 'bootstrap-v2'
    },
    CONTEXT_READY: {
      name: 'bootstrap:context-ready',
      description: 'Boot context available',
      payload: { context: 'object', health: 'object', timestamp: 'number' },
      emitter: 'bootstrap-v2'
    },
    COMPLETE: {
      name: 'bootstrap-v2:complete',
      description: 'Full boot sequence finished',
      payload: { result: 'object', elapsed: 'number', stages: 'object' },
      emitter: 'bootstrap-v2-loader'
    },
    ERROR: {
      name: 'bootstrap-v2:error',
      description: 'Bootstrap encountered critical error',
      payload: { error: 'string' },
      emitter: 'bootstrap-v2-loader'
    }
  },

  // ========================================
  // PROGRESS EVENTS (QW#09)
  // ========================================
  PROGRESS: {
    START: {
      name: 'boot:progress:start',
      description: 'Boot progress tracking started',
      payload: { percentage: 'number', phase: 'string?' },
      emitter: 'boot-context'
    },
    PHASE_START: {
      name: 'boot:progress:phase:start',
      description: 'Phase progress started',
      payload: { phase: 'string', phaseName: 'string', phaseIndex: 'number', totalPhases: 'number', percentage: 'number' },
      emitter: 'boot-context'
    },
    PHASE_COMPLETE: {
      name: 'boot:progress:phase:complete',
      description: 'Phase progress completed',
      payload: { phase: 'string', phaseIndex: 'number', totalPhases: 'number', percentage: 'number' },
      emitter: 'boot-context'
    },
    COMPLETE: {
      name: 'boot:progress:complete',
      description: 'Boot progress finished',
      payload: { success: 'boolean', state: 'string', totalTime: 'number', percentage: 'number' },
      emitter: 'boot-context'
    }
  },

  // ========================================
  // HEALTH EVENTS (QW#15)
  // ========================================
  HEALTH: {
    PERIODIC: {
      name: 'boot:health:periodic',
      description: 'Periodic health check executed',
      payload: { checkNumber: 'number', status: 'string', score: 'number', timestamp: 'number' },
      emitter: 'boot-health-aggregator'
    }
  }
};

// QW#25: Obter evento por nome
interface CatalogEventEntry {
  name: string;
  description: string;
  payload: Record<string, string>;
  emitter: string;
}

type EventCategory = Record<string, CatalogEventEntry>;

function getEventByName(eventName: string): CatalogEventEntry | null {
  for (var category in EVENTS_CATALOG) {
    if (EVENTS_CATALOG.hasOwnProperty(category)) {
      var events = (EVENTS_CATALOG as Record<string, EventCategory>)[category];
      for (var key in events) {
        if (events.hasOwnProperty(key) && events[key].name === eventName) {
          return events[key];
        }
      }
    }
  }
  return null;
}

// QW#25: Listar todos os eventos
function getAllEvents() {
  var all = [];
  for (var category in EVENTS_CATALOG) {
    if (EVENTS_CATALOG.hasOwnProperty(category)) {
      var events = (EVENTS_CATALOG as Record<string, EventCategory>)[category];
      for (var key in events) {
        if (events.hasOwnProperty(key)) {
          all.push({
            category: category,
            key: key,
            event: events[key]
          });
        }
      }
    }
  }
  return all;
}

// QW#25: Obter eventos por categoria
function getEventsByCategory(category: string): EventCategory | null {
  return (EVENTS_CATALOG as Record<string, EventCategory>)[category] || null;
}

// QW#25: Obter eventos por emitter
function getEventsByEmitter(emitterName: string) {
  var result = [];
  var all = getAllEvents();
  for (var i = 0; i < all.length; i++) {
    if (all[i].event.emitter === emitterName) {
      result.push(all[i]);
    }
  }
  return result;
}

function info() {
  var all = getAllEvents();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalEvents: all.length,
    categories: Object.keys(EVENTS_CATALOG)
  };
}

export {
  EVENTS_CATALOG,
  getEventByName,
  getAllEvents,
  getEventsByCategory,
  getEventsByEmitter,
  info,
  MODULE_ID,
  VERSION
};

export default {
  EVENTS_CATALOG: EVENTS_CATALOG,
  getEventByName: getEventByName,
  getAllEvents: getAllEvents,
  getEventsByCategory: getEventsByCategory,
  getEventsByEmitter: getEventsByEmitter,
  info: info,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
