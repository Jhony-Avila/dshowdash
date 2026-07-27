// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-timer-adapter
// PURPOSE: TimerAdapter - Implementação real do TimerPort
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createTimerAdapter() — exported function
//   getTimerAdapter() — exported function
//   resetTimerAdapter() — exported function
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

export const VERSION = '1.0.0-P1-HEX';
export const MODULE_ID = 'main-timer-adapter';

// Métricas de uso
const _metrics = {
  timeoutsCreated: 0,
  timeoutsCleared: 0,
  intervalsCreated: 0,
  intervalsCleared: 0,
  delaysExecuted: 0
};

// Rastreamento de timers ativos (para cleanup)
const _activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
const _activeIntervals = new Set<ReturnType<typeof setInterval>>();

// Implementação real
export function createTimerAdapter() {
  return {
    setTimeout: (fn: (...args: unknown[]) => void, ms: number, ...args: unknown[]) => {
      _metrics.timeoutsCreated++;
      const id = setTimeout(() => {
        _activeTimeouts.delete(id);
        fn(...args);
      }, ms);
      _activeTimeouts.add(id);
      return id;
    },
    
    clearTimeout: (id: ReturnType<typeof setTimeout> | null | undefined) => {
      if (id !== null && id !== undefined) {
        _metrics.timeoutsCleared++;
        _activeTimeouts.delete(id);
        clearTimeout(id);
      }
    },
    
    setInterval: (fn: (...args: unknown[]) => void, ms: number, ...args: unknown[]) => {
      _metrics.intervalsCreated++;
      const id = setInterval(fn, ms, ...args);
      _activeIntervals.add(id);
      return id;
    },
    
    clearInterval: (id: ReturnType<typeof setInterval> | null | undefined) => {
      if (id !== null && id !== undefined) {
        _metrics.intervalsCleared++;
        _activeIntervals.delete(id);
        clearInterval(id);
      }
    },
    
    delay: (ms: number) => {
      _metrics.delaysExecuted++;
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Cleanup de todos os timers (útil para destroy)
    clearAll: () => {

      _activeTimeouts.forEach(id => clearTimeout(id));

      _activeIntervals.forEach(id => clearInterval(id));
      const cleared = { timeouts: _activeTimeouts.size, intervals: _activeIntervals.size };
      _activeTimeouts.clear();
      _activeIntervals.clear();
      return cleared;
    },
    
    // Diagnósticos
    getActiveCount: () => ({
      timeouts: _activeTimeouts.size,
      intervals: _activeIntervals.size
    }),
    
    getMetrics: () => ({ ..._metrics }),
    
    healthCheck: () => ({
      status: 'HEALTHY',
      version: VERSION,
      moduleId: MODULE_ID,
      checks: {
        activeTimeouts: _activeTimeouts.size,
        activeIntervals: _activeIntervals.size
      },
      metrics: { ..._metrics }
    }),
    
    info: () => ({
      version: VERSION,
      moduleId: MODULE_ID,
      type: 'real',
      active: {
        timeouts: _activeTimeouts.size,
        intervals: _activeIntervals.size
      },
      metrics: { ..._metrics }
    })
  };
}

// Singleton para uso global
let _instance: ReturnType<typeof createTimerAdapter> | null = null;

export function getTimerAdapter() {
  if (!_instance) {
    _instance = createTimerAdapter();
  }
  return _instance;
}

export function resetTimerAdapter() {
  if (_instance) {
    _instance.clearAll();
  }
  _instance = null;
}

export default {
  createTimerAdapter,
  getTimerAdapter,
  resetTimerAdapter,
  VERSION,
  MODULE_ID
};
