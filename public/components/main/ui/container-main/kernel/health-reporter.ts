// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health-reporter
// PURPOSE: Kernel Health Reporter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, KERNEL_STATES from ./constants.js
//   VERSION as CORE_VERSION from ../core/constants.js
//   contractsHealthCheck from ../contracts/index.js
//
// PROVIDES:
//   createHealthReporter() — exported function
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

import { VERSION, MODULE_ID, KERNEL_STATES } from './constants.js';
import { VERSION as CORE_VERSION } from '../core/constants.js';
import { contractsHealthCheck } from '../contracts/index.js';

export function createHealthReporter(options: Record<string, any> = {}) {
  const { registry, stateMachine, errorHandler, getResetCount } = options;

  let _startTime: number | null = null;
  let _totalSlotActivations = 0;
  let _totalResets = 0;
  let _lastReset: unknown = null;

  return {
    setStartTime(time: number) {
      _startTime = time;
    },

    incrementSlotActivations() {
      _totalSlotActivations++;
    },

    incrementResets() {
      _totalResets++;
      _lastReset = Date.now();
    },

    getKernelMetrics() {
      const errorMetrics = errorHandler?.getMetrics() || {};
      return {
        startTime: _startTime,
        totalSlotActivations: _totalSlotActivations,
        totalErrors: errorMetrics.totalErrors || 0,
        totalResets: _totalResets,
        lastError: errorMetrics.lastError,
        lastReset: _lastReset,
        managerInitTimes: registry?.getInitTimes() || {},
        resetCount: getResetCount?.() || 0,
        uptime: _startTime ? Date.now() - _startTime : 0,
        managers: registry?.listActive() || [],
        slots: registry?.get('slot')?.getStats?.() || {},
        resources: registry?.get('resource')?.getStats() || {},
        listeners: registry?.get('listener')?.getStats?.() || {},
        capabilities: registry?.get('capability')?.getStats?.() || {},
        images: registry?.get('image')?.getMetrics?.() || {},
        cleanupScheduled: registry?.get('cleanup')?.getScheduled?.()?.length || 0
      };
    },

    async healthCheck() {
      const state = stateMachine?.getState() || KERNEL_STATES.IDLE;
      const contractsHealth = contractsHealthCheck();
      const resetCount = getResetCount?.() || 0;
      
      const managersHealth: Record<string, any> = {};
      const managers = registry?.getAll() || {};
      for (const [name, manager] of Object.entries(managers)) {
        if (manager && (manager as any).healthCheck) {
          managersHealth[name] = (manager as any).healthCheck();
        }
      }

      const isError = state === KERNEL_STATES.ERROR;
      const isResetting = state === KERNEL_STATES.RESETTING;
      const allHealthy = !isError && !isResetting && Object.values(managersHealth)
        .every(h => h.status === 'HEALTHY' || h.status === 'WARNING');

      return {
        status: isError ? 'ERROR' : isResetting ? 'RESETTING' : allHealthy ? 'HEALTHY' : 'DEGRADED',
        version: VERSION,
        moduleId: MODULE_ID,
        coreVersion: CORE_VERSION,
        kernelState: state,
        resetCount,
        canReset: state !== KERNEL_STATES.DESTROYED && state !== KERNEL_STATES.RESETTING,
        metrics: this.getKernelMetrics(),
        subsystems: {
          contracts: contractsHealth,
          ...managersHealth
        }
      };
    },

    info(features: Record<string, any> = {}) {
      const state = stateMachine?.getState() || KERNEL_STATES.IDLE;
      const resetCount = getResetCount?.() || 0;
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        coreVersion: CORE_VERSION,
        kernelState: state,
        resetCount,
        canReset: state !== KERNEL_STATES.DESTROYED && state !== KERNEL_STATES.RESETTING,
        slotCount: registry?.get('slot')?.list?.()?.length || 0,
        activeSlot: registry?.get('slot')?.getActiveId?.() || null,
        managersActive: registry?.listActive()?.length || 0,
        features
      };
    }
  };
}

export default { createHealthReporter };
