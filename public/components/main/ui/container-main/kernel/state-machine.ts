// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state-machine
// PURPOSE: Kernel State Machine
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   KERNEL_STATES, MODULE_ID from ./constants.js
//   METRIC_TYPES from ../resources/metrics-persistence.js
//   KERNEL_UI_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createStateMachine() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   KERNEL_UI_EVENT_NAMES.STATE_CHANGED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { KERNEL_STATES, MODULE_ID } from './constants.js';
import { METRIC_TYPES } from '../resources/metrics-persistence.js';
import { KERNEL_UI_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '10.0.0-INTEGRATED';

export function createStateMachine(options: Record<string, any> = {}) {
  const { metricsManager, eventBridge, onStateChange } = options;
  
  let _state: string = KERNEL_STATES.IDLE;

  return {
    getState() {
      return _state;
    },

    setState(newState: string) {
      if (_state === newState) return false;
      const oldState = _state;
      _state = newState;
      
      metricsManager?.record(MODULE_ID, 'state_change', 1, {
        type: METRIC_TYPES.COUNTER,
        tags: { from: oldState, to: newState }
      });

      onStateChange?.(newState, oldState);
      eventBridge?.emit(KERNEL_UI_EVENT_NAMES.STATE_CHANGED, { state: newState, previousState: oldState });
      
      return true;
    },

    isState(...states: unknown[]) {
      return states.includes(_state);
    },

    canTransitionTo(targetState: string) {
      const transitions = {
        [KERNEL_STATES.IDLE]: [KERNEL_STATES.INITIALIZING],
        [KERNEL_STATES.INITIALIZING]: [KERNEL_STATES.READY, KERNEL_STATES.ERROR],
        [KERNEL_STATES.READY]: [KERNEL_STATES.RUNNING, KERNEL_STATES.RESETTING, KERNEL_STATES.DESTROYED],
        [KERNEL_STATES.RUNNING]: [KERNEL_STATES.PAUSED, KERNEL_STATES.RESETTING, KERNEL_STATES.ERROR, KERNEL_STATES.DESTROYED],
        [KERNEL_STATES.PAUSED]: [KERNEL_STATES.RUNNING, KERNEL_STATES.RESETTING, KERNEL_STATES.DESTROYED],
        [KERNEL_STATES.ERROR]: [KERNEL_STATES.RESETTING, KERNEL_STATES.DESTROYED],
        [KERNEL_STATES.RESETTING]: [KERNEL_STATES.READY, KERNEL_STATES.ERROR],
        [KERNEL_STATES.DESTROYED]: [] as unknown[]
      };
      return (transitions as Record<string, string[]>)[_state]?.includes(targetState) || false;
    }
  };
}

export default { createStateMachine };
