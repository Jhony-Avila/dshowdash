// StateMachine Sync Public API
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: mapStateToMode from ../../constants.js
// RECEIVES (via createStateMachineSyncAPI context):
//   context.stateMachine, getMode, setMode, checkIfDegraded
// PROVIDES: sync()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { mapStateToMode } from '../../constants.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.kernel.module.state-machine-sync.api';

interface StateMachineSyncAPIContext {
  stateMachine: { getState?: () => string | null } | null;
  getMode: () => string;
  setMode: (mode: string, reason: string) => { success: boolean };
  checkIfDegraded: () => boolean;
}

export function createStateMachineSyncAPI(context: StateMachineSyncAPIContext) {
  var stateMachine = context.stateMachine;
  var getMode = context.getMode;
  var setMode = context.setMode;
  var checkIfDegraded = context.checkIfDegraded;

  return {
    sync: function() {
      if (!stateMachine) {
        return { success: false, error: 'NO_STATE_MACHINE' };
      }

      var currentState = stateMachine.getState ? stateMachine.getState() : null;
      if (!currentState) {
        return { success: false, error: 'CANNOT_GET_STATE' };
      }

      var isDegraded = checkIfDegraded();
      var targetMode = mapStateToMode(currentState, isDegraded);
      var currentMode = getMode();

      if (targetMode !== currentMode) {
        var result = setMode(targetMode, 'Manual sync with StateMachine');
        return { success: result.success, from: currentMode, to: targetMode, bootState: currentState };
      }

      return { success: true, noChange: true, mode: currentMode, bootState: currentState };
    }
  };
}

export default { createStateMachineSyncAPI };
