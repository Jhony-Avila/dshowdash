import { KERNEL_STATES, MODULE_ID } from "./constants.js";
import { METRIC_TYPES } from "../resources/metrics-persistence.js";
import { KERNEL_UI_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "10.0.0-INTEGRATED";
function createStateMachine(options = {}) {
  const { metricsManager, eventBridge, onStateChange } = options;
  let _state = KERNEL_STATES.IDLE;
  return {
    getState() {
      return _state;
    },
    setState(newState) {
      if (_state === newState) return false;
      const oldState = _state;
      _state = newState;
      metricsManager?.record(MODULE_ID, "state_change", 1, {
        type: METRIC_TYPES.COUNTER,
        tags: { from: oldState, to: newState }
      });
      onStateChange?.(newState, oldState);
      eventBridge?.emit(KERNEL_UI_EVENT_NAMES.STATE_CHANGED, { state: newState, previousState: oldState });
      return true;
    },
    isState(...states) {
      return states.includes(_state);
    },
    canTransitionTo(targetState) {
      const transitions = {
        [KERNEL_STATES.IDLE]: [KERNEL_STATES.INITIALIZING],
        [KERNEL_STATES.INITIALIZING]: [KERNEL_STATES.READY, KERNEL_STATES.ERROR],
        [KERNEL_STATES.READY]: [KERNEL_STATES.RUNNING, KERNEL_STATES.RESETTING, KERNEL_STATES.DESTROYED],
        [KERNEL_STATES.RUNNING]: [KERNEL_STATES.PAUSED, KERNEL_STATES.RESETTING, KERNEL_STATES.ERROR, KERNEL_STATES.DESTROYED],
        [KERNEL_STATES.PAUSED]: [KERNEL_STATES.RUNNING, KERNEL_STATES.RESETTING, KERNEL_STATES.DESTROYED],
        [KERNEL_STATES.ERROR]: [KERNEL_STATES.RESETTING, KERNEL_STATES.DESTROYED],
        [KERNEL_STATES.RESETTING]: [KERNEL_STATES.READY, KERNEL_STATES.ERROR],
        [KERNEL_STATES.DESTROYED]: []
      };
      return transitions[_state]?.includes(targetState) || false;
    }
  };
}
var state_machine_default = { createStateMachine };
export {
  VERSION,
  createStateMachine,
  state_machine_default as default
};
