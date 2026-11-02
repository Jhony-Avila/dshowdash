// Health Check
// @version 2.7.0-HEALTH-CONTRACT
// @changelog v2.7.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.7.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, MODULE_ID from ../constants.js
//   getBootLoopStatus from ../boot-loop/index.js
//   getSingletonState from ../singleton/index.js
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// RECEIVES (via createHealthCheck context):
//   context.orchestrator, stateMachine, kernel, globalTimeout,
//   context.degradationNotifier, listeners, cleanups
// PROVIDES: healthCheck()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID } from '../constants.js';
import { getBootLoopStatus } from '../boot-loop/index.js';
import { getSingletonState } from '../singleton/index.js';
import { createHealthResult, HEALTH_STATUS } from '../../contracts/health-contract.ts';

interface HealthCheckContext {
  orchestrator: Record<string, Function>;
  stateMachine: { isReady: () => boolean; getState: () => string };
  kernel: Record<string, Function> | null;
  globalTimeout: { getStatus: () => Record<string, unknown> } | null;
  degradationNotifier: { info: () => Record<string, unknown> } | null;
  listeners: unknown[];
  cleanups: unknown[];
}

export function createHealthCheck(context: HealthCheckContext) {
  var orchestrator = context.orchestrator;
  var stateMachine = context.stateMachine;
  var kernel = context.kernel;
  var globalTimeout = context.globalTimeout;
  var degradationNotifier = context.degradationNotifier;
  var listeners = context.listeners;
  var cleanups = context.cleanups;
  
  return function healthCheck() {
    var healthAgg = orchestrator.getHealthAggregator();
    var bootHealth = healthAgg ? healthAgg.getStatus() : 'unknown';
    var bootScore = healthAgg ? healthAgg.getScore() : 0;
    var kernelHealth = kernel ? kernel.healthCheck() : null;
    var bootLoopStatus = getBootLoopStatus();
    var timeoutStatus = globalTimeout ? globalTimeout.getStatus() : null;
    var singletonState = getSingletonState();
    
    var periodicStatus: Record<string, unknown> = { running: false, checkCount: 0, history: [] as unknown[] };
    if (healthAgg && healthAgg.getPeriodicHistory) {
      periodicStatus = healthAgg.getPeriodicHistory();
    }
    
    var memoryMetrics = null;
    if (healthAgg && healthAgg.getMemoryMetrics) {
      memoryMetrics = healthAgg.getMemoryMetrics();
    }
    
    var notifierInfo = degradationNotifier ? degradationNotifier.info() : null;
    
    var status: string = HEALTH_STATUS.HEALTHY;
    if (!stateMachine.isReady()) {
      status = HEALTH_STATUS.DEGRADED;
    }
    
    return createHealthResult({
      status: status,
      moduleId: MODULE_ID,
      version: VERSION,
      checks: {
        stateMachineReady: stateMachine.isReady(),
        kernelIntegrated: !!kernel,
        orchestratorActive: !!orchestrator,
        healthAggregatorAvailable: !!healthAgg
      },
      details: {
        modular: true,
        longLived: true,
        listeners: listeners.length,
        cleanups: cleanups.length,
        singletonState: singletonState ? singletonState.state : 'unknown',
        p21Compliant: true,
        p24Instrumented: true,
        p25Compliant: true,
        manifestIntegrated: true,
        kernelIntegrated: true,
        stateMachineSyncEnabled: kernelHealth ? kernelHealth.syncEnabled : false,
        quickWinsApplied: true,
        bootHealth: bootHealth,
        bootScore: bootScore,
        kernel: kernelHealth,
        bootLoop: bootLoopStatus,
        globalTimeout: timeoutStatus,
        periodicHealth: periodicStatus,
        memory: memoryMetrics,
        degradationNotifier: notifierInfo,
        improvements: [
          '#10-StateMachineSync', '#26-CleanupListeners',
          '#12-RetryJitter', '#16-BootLoopDetection', '#24-GlobalTimeout',
          '#5-PeriodicHealthCheck', '#6-MemoryMetrics', '#25-DegradationNotifier',
          'MODULAR-ARCHITECTURE'
        ]
      }
    });
  };
}

export default { createHealthCheck };
