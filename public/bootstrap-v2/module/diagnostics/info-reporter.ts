// Info Reporter
// @version 2.6.1-CONTRACTS
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, MODULE_ID from ../constants.js
//   BOOT_MANIFEST from ../../boot-manifest/index.js
//   getEnabledFeatures from ../../config.js
//   getBootLoopStatus from ../boot-loop/index.js
//   getSingletonState from ../singleton/index.js
// RECEIVES (via createInfoReporter context):
//   context.config, orchestrator, stateMachine, kernel,
//   context.globalTimeout, bootExecutor, listeners, cleanups
// PROVIDES: info() — comprehensive system status reporter
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID } from '../constants.js';
import { BOOT_MANIFEST } from '../../boot-manifest/index.js';
import { getEnabledFeatures } from '../../config.js';
import { getBootLoopStatus } from '../boot-loop/index.js';
import { getSingletonState } from '../singleton/index.js';

interface InfoReporterContext {
  config: Record<string, unknown> & { debug: unknown; phases: Record<string, boolean> };
  orchestrator: Record<string, Function>;
  stateMachine: { getState: () => string; isReady: () => boolean } | null;
  kernel: Record<string, Function> | null;
  globalTimeout: { getStatus: () => Record<string, unknown> } | null;
  bootExecutor: { getResult: () => { success: boolean; totalTime?: number; phases?: Array<{ length: number }>; error?: string } | null };
  listeners: unknown[];
  cleanups: unknown[];
}

export function createInfoReporter(context: InfoReporterContext) {
  var config = context.config;
  var orchestrator = context.orchestrator;
  var stateMachine = context.stateMachine;
  var kernel = context.kernel;
  var globalTimeout = context.globalTimeout;
  var bootExecutor = context.bootExecutor;
  var listeners = context.listeners;
  var cleanups = context.cleanups;

  return function info() {
    var contextSnapshot = null;
    var ctx = orchestrator.getBootContext();
    if (ctx) contextSnapshot = ctx.getSnapshot();

    var healthStatus = null;
    var healthAgg = orchestrator.getHealthAggregator();
    if (healthAgg) healthStatus = healthAgg.calculate();

    var kernelInfo = kernel ? kernel.info() : null;
    var bootLoopStatus = getBootLoopStatus();
    var timeoutStatus = globalTimeout ? globalTimeout.getStatus() : null;
    var bootResult = bootExecutor.getResult();

    var periodicStatus: Record<string, unknown> = { running: false, checkCount: 0, history: [] as unknown[] };
    if (healthAgg && healthAgg.getPeriodicHistory) {
      periodicStatus = healthAgg.getPeriodicHistory();
    }

    var memoryMetrics = null;
    if (healthAgg && healthAgg.getMemoryMetrics) {
      memoryMetrics = healthAgg.getMemoryMetrics();
    }

    return {
      version: VERSION,
      moduleId: MODULE_ID,
      modular: true,
      state: stateMachine ? stateMachine.getState() : 'unknown',
      isReady: stateMachine ? stateMachine.isReady() : false,
      singletonState: getSingletonState(),
      longLived: true,
      listeners: listeners.length,
      cleanups: cleanups.length,
      p21Compliant: true,
      p24Instrumented: true,
      p25Compliant: true,
      manifestIntegrated: true,
      kernelIntegrated: true,
      quickWinsApplied: ['QW01', 'QW04', 'QW08', 'QW10', 'QW11', 'QW19', 'QW21', 'QW22', 'KERNEL'],
      improvements: [
        '#10-StateMachineSync', '#26-CleanupListeners',
        '#12-RetryJitter', '#16-BootLoopDetection', '#24-GlobalTimeout',
        '#5-PeriodicHealthCheck', '#6-MemoryMetrics', '#25-DegradationNotifier',
        'MODULAR-ARCHITECTURE'
      ],
      manifestVersion: BOOT_MANIFEST.version,
      enabledFeatures: getEnabledFeatures(),
      bootLoop: bootLoopStatus,
      globalTimeout: timeoutStatus,
      periodicHealth: periodicStatus,
      memory: memoryMetrics,
      bootResult: bootResult ? {
        success: bootResult.success,
        totalTime: bootResult.totalTime,
        phasesCompleted: bootResult.phases ? bootResult.phases.length : 0
      } : null,
      bootContext: contextSnapshot ? {
        state: contextSnapshot.state,
        health: contextSnapshot.health,
        healthScore: contextSnapshot.healthScore,
        degraded: contextSnapshot.degraded,
        phasesCompleted: contextSnapshot.phasesCompleted
      } : null,
      bootHealth: healthStatus ? {
        status: healthStatus.status,
        score: healthStatus.score,
        issues: healthStatus.issueCount,
        warnings: healthStatus.warningCount
      } : null,
      kernel: kernelInfo ? {
        mode: kernelInfo.mode,
        initialized: kernelInfo.initialized,
        syncEnabled: kernelInfo.syncEnabled,
        capabilities: kernelInfo.capabilities ? kernelInfo.capabilities.enabledCount : 0
      } : null,
      config: {
        debug: config.debug,
        enabledPhases: Object.keys(config.phases).filter(function(k) { return config.phases[k]; })
      }
    };
  };
}

export default { createInfoReporter };
