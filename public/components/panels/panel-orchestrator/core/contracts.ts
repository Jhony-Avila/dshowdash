// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-contracts
// PURPOSE: Orchestrator Contracts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   MODULE_CONTRACT — exported value
//   PRESET_CONTRACT — exported value
//   API_POLICY_CONTRACT — exported value
//   HEALTH_CHECK_CONTRACT — exported value
//   EVENT_CONTRACT — exported value
//   TELEMETRY_CONTRACT — exported value
//   SCHEDULER_CONTRACT — exported value
//   getContractInfo() — exported function
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

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-contracts';

function getVersion() { return VERSION; }

const MODULE_CONTRACT = {
    required: ['id', 'name', 'type'],
    optional: ['version', 'critical', 'dependencies', 'refreshInterval', 'permissions', 'featureFlags', 'events'],
    lifecycle: ['bootstrap', 'init', 'hydrate', 'render', 'update', 'destroy'],
    types: ['panel', 'card', 'widget', 'service', 'orchestrator']
};

const PRESET_CONTRACT = {
    required: ['id', 'name', 'layoutMode', 'panels'],
    optional: ['description', 'icon', 'permissions', 'featureFlags', 'maxPanels']
};

const API_POLICY_CONTRACT = {
    defaults: { timeout: 10000, maxRetries: 3, backoffBase: 1000, backoffMultiplier: 2, circuitBreakerThreshold: 5, circuitBreakerWindowMs: 60000, dedupe: true, cache: false, cacheTTL: 60000 }
};

const HEALTH_CHECK_CONTRACT = {
    interval: 30000, timeout: 5000, thresholds: { degradeAfterErrors: 3, recoverAfterSuccess: 2 }
};

const EVENT_CONTRACT = {
    payload: { _source: 'string', _moduleId: 'string', _timestamp: 'number' },
    required: ['_source', '_timestamp']
};

const TELEMETRY_CONTRACT = {
    event: { name: 'string', namespace: 'string', sessionId: 'string', data: 'object', timestamp: 'number' }
};

const SCHEDULER_CONTRACT = {
    modes: ['ACTIVE', 'IDLE', 'DEGRADED', 'PAUSED'],
    task: { id: 'string', fn: 'function', interval: 'number', critical: 'boolean', maxRuns: 'number|null' }
};

function getContractInfo() {
    return { version: VERSION, moduleId: MODULE_ID, contracts: { MODULE_CONTRACT, PRESET_CONTRACT, API_POLICY_CONTRACT, HEALTH_CHECK_CONTRACT, EVENT_CONTRACT, TELEMETRY_CONTRACT, SCHEDULER_CONTRACT } };
}

export { VERSION, MODULE_ID, getVersion, MODULE_CONTRACT, PRESET_CONTRACT, API_POLICY_CONTRACT, HEALTH_CHECK_CONTRACT, EVENT_CONTRACT, TELEMETRY_CONTRACT, SCHEDULER_CONTRACT, getContractInfo };

export default { VERSION, MODULE_ID, getVersion, MODULE_CONTRACT, PRESET_CONTRACT, API_POLICY_CONTRACT, HEALTH_CHECK_CONTRACT, EVENT_CONTRACT, TELEMETRY_CONTRACT, SCHEDULER_CONTRACT, getContractInfo };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { contractsReady: true } }; }
