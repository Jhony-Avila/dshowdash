// Mode Manager
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: KERNEL_MODES, KERNEL_EVENTS, isValidTransition from ../../constants.js
// RECEIVES (via createModeManager context):
//   context.log, emit, modeHistoryManager, capabilityManager,
//   context.getModeRef, setModeRef, setLastModeChange
// PROVIDES: getMode(), setMode()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { KERNEL_MODES, KERNEL_EVENTS, isValidTransition } from '../../constants.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.mode.manager';

interface ModeManagerContext {
  log: (level: string, message: string, data?: Record<string, unknown>) => void;
  emit: (event: string, data: Record<string, unknown>) => void;
  modeHistoryManager: { record: (from: string, to: string, reason: string) => void };
  capabilityManager: { setMode: (mode: string) => void };
  getModeRef: () => string;
  setModeRef: (mode: string) => void;
  setLastModeChange: (t: number) => void;
}

export function createModeManager(context: ModeManagerContext) {
  const log = context.log;
  const emit = context.emit;
  const modeHistoryManager = context.modeHistoryManager;
  const capabilityManager = context.capabilityManager;
  const getModeRef = context.getModeRef;
  const setModeRef = context.setModeRef;
  const setLastModeChange = context.setLastModeChange;

  function getMode() {
    return getModeRef();
  }

  function setModeInternal(newMode: string, reason: string, fromSync: boolean) {
    const oldMode = getModeRef();
    setModeRef(newMode);
    setLastModeChange(Date.now());

    modeHistoryManager.record(oldMode, newMode, reason);
    capabilityManager.setMode(newMode);

    log('info', 'Mode changed', { from: oldMode, to: newMode, reason: reason, fromSync: !!fromSync });

    emit(KERNEL_EVENTS.MODE_CHANGE, { from: oldMode, to: newMode, reason: reason, fromSync: !!fromSync });

    if (newMode === KERNEL_MODES.DEGRADED) {
      emit(KERNEL_EVENTS.MODE_DEGRADED, { from: oldMode, reason: reason });
    } else if (newMode === KERNEL_MODES.NORMAL) {
      emit(KERNEL_EVENTS.MODE_NORMAL, { from: oldMode, reason: reason });
    } else if (newMode === KERNEL_MODES.RECOVERY) {
      emit(KERNEL_EVENTS.MODE_RECOVERY, { from: oldMode, reason: reason });
    }

    return { success: true, from: oldMode, to: newMode };
  }

  function setMode(newMode: string, reason: string) {
    if (!(KERNEL_MODES as Record<string, string>)[newMode]) {
      log('error', 'Invalid mode: ' + newMode);
      return { success: false, error: 'INVALID_MODE' };
    }

    const currentMode = getModeRef();
    if (!isValidTransition(currentMode, newMode)) {
      log('warn', 'Invalid mode transition', { from: currentMode, to: newMode });
      return { success: false, error: 'INVALID_TRANSITION', from: currentMode, to: newMode };
    }

    return setModeInternal(newMode, reason, false);
  }

  return {
    getMode: getMode,
    setMode: setMode,
    setModeInternal: setModeInternal
  };
}

export default { createModeManager };
