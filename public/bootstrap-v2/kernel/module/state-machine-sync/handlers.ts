// StateMachine Sync Handlers
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: KERNEL_EVENTS, mapStateToMode, isValidTransition from ../../constants.js
// RECEIVES (via createStateMachineSyncHandlers context):
//   context.getMode, setModeInternal, checkIfDegraded,
//   context.emit, setLastSyncedState
// PROVIDES: handleTransition()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { KERNEL_EVENTS, mapStateToMode, isValidTransition } from '../../constants.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.kernel.module.state-machine-sync.handlers';

interface StateMachineSyncHandlersContext {
  getMode: () => string;
  setModeInternal: (mode: string, reason: string, fromSync: boolean) => void;
  checkIfDegraded: () => boolean;
  emit: (event: string, data: Record<string, unknown>) => void;
  setLastSyncedState: (state: string) => void;
}

interface TransitionRecord {
  from?: string;
  to?: string;
}

export function createStateMachineSyncHandlers(context: StateMachineSyncHandlersContext) {
  var getMode = context.getMode;
  var setModeInternal = context.setModeInternal;
  var checkIfDegraded = context.checkIfDegraded;
  var emit = context.emit;
  var setLastSyncedState = context.setLastSyncedState;

  function handleTransition(record: TransitionRecord) {
    if (!record || !record.to) return;

    var newState = record.to;
    var isDegraded = checkIfDegraded();
    var targetMode = mapStateToMode(newState, isDegraded);

    setLastSyncedState(newState);

    var currentMode = getMode();
    if (targetMode !== currentMode && isValidTransition(currentMode, targetMode)) {
      var reason = 'StateMachine sync: ' + record.from + ' → ' + record.to;
      setModeInternal(targetMode, reason, true);

      emit(KERNEL_EVENTS.SYNC_STATE, {
        bootState: newState,
        kernelMode: targetMode,
        record: record
      });
    }
  }

  return {
    handleTransition: handleTransition
  };
}

export default { createStateMachineSyncHandlers };
