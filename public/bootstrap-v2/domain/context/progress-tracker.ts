// Context Progress Tracker
// @version 1.2.0-DOMAIN-PURE
// @changelog v1.2.0-DOMAIN-PURE - EventBus injetado via options.eventBus (elimina window.EventBus direto)
// @changelog v1.1.0-MODULAR - Modularização inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES (via createProgressTracker options):
//   options.stateStore       — State store for progress data
//   options.notifyListeners  — Callback to notify context listeners
//   options.eventBus         — EventBus for emitting progress events
//
// IMPORTS:
//   PROGRESS_EVENTS from ./constants.js
//   getPhaseById, BOOT_MANIFEST from ../../boot-manifest/index.js
//
// EMITS (via options.eventBus):
//   PROGRESS_EVENTS.START          — Boot progress started
//   PROGRESS_EVENTS.PHASE_START    — Phase started
//   PROGRESS_EVENTS.PHASE_COMPLETE — Phase completed
//   PROGRESS_EVENTS.COMPLETE       — Boot completed
//
// WINDOW ACCESS: None (fully injection-driven)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PROGRESS_EVENTS } from './constants.js';
import { getPhaseById, BOOT_MANIFEST } from '../../boot-manifest/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.context.progress-tracker';

interface ProgressState {
  currentPhase: string | null;
  currentPhaseIndex: number;
  totalPhases: number;
  percentage: number;
}

interface ProgressStateStore {
  setProgress(progress: Partial<ProgressState>): void;
  getProgress(): ProgressState;
}

interface EventBus {
  emit(event: string, data: Record<string, unknown>): void;
}

interface ProgressTrackerOptions {
  stateStore?: ProgressStateStore;
  notifyListeners?: (type: string, data: Record<string, unknown>) => void;
  eventBus?: EventBus | null;
}

export function createProgressTracker(options: ProgressTrackerOptions) {
  if (options === undefined) options = {};
  const stateStore = options.stateStore!;
  const notifyListeners = options.notifyListeners!;
  const _eventBus = options.eventBus || null;

  function emitProgress(event: string, data: Record<string, unknown>) {
    notifyListeners('progress', { event: event, data: data, timestamp: Date.now() });

    // v1.2.0: emit via injected EventBus (tolerant when absent)
    if (_eventBus && _eventBus.emit) {
      try {
        _eventBus.emit(event, Object.assign({}, data, { timestamp: Date.now() }));
      } catch (e) { }
    }
  }

  return {
    start: function() {
      stateStore.setProgress({ percentage: 0 });
      emitProgress(PROGRESS_EVENTS.START, { percentage: 0, phase: null });
    },

    onPhaseStart: function(phaseId: string) {
      const phase = getPhaseById(phaseId);
      let phaseIndex = 0;

      for (let i = 0; i < BOOT_MANIFEST.phases.length; i++) {
        if (BOOT_MANIFEST.phases[i].id === phaseId) {
          phaseIndex = i;
          break;
        }
      }

      const totalPhases = BOOT_MANIFEST.phases.length;
      const percentage = Math.round((phaseIndex / totalPhases) * 100);

      stateStore.setProgress({
        currentPhase: phaseId,
        currentPhaseIndex: phaseIndex,
        percentage: percentage
      });

      emitProgress(PROGRESS_EVENTS.PHASE_START, {
        phase: phaseId,
        phaseName: phase ? phase.name : phaseId,
        phaseIndex: phaseIndex,
        totalPhases: totalPhases,
        percentage: percentage
      });
    },

    onPhaseComplete: function(phaseId: string) {
      const progress = stateStore.getProgress();
      const phaseIndex = progress.currentPhaseIndex + 1;
      const totalPhases = progress.totalPhases;
      const percentage = Math.round((phaseIndex / totalPhases) * 100);

      stateStore.setProgress({ percentage: percentage });

      emitProgress(PROGRESS_EVENTS.PHASE_COMPLETE, {
        phase: phaseId,
        phaseIndex: phaseIndex,
        totalPhases: totalPhases,
        percentage: percentage
      });
    },

    onComplete: function(success: boolean, state: string, totalTime: number) {
      stateStore.setProgress({ percentage: 100 });

      emitProgress(PROGRESS_EVENTS.COMPLETE, {
        success: success,
        state: state,
        totalTime: totalTime,
        percentage: 100
      });
    },

    getProgress: function() {
      return Object.assign({}, stateStore.getProgress());
    }
  };
}

export default { createProgressTracker };
