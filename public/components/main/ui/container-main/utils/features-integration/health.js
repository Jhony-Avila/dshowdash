import { VERSION, MODULE_ID } from "./constants.js";
import { initialized, commandPalette, splitView, tourManager, metrics } from "./state.js";
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: initialized.value,
    metrics: {
      commandsRegistered: metrics.commandsRegistered,
      toursRegistered: metrics.toursRegistered,
      errors: metrics.errors
    }
  };
}
function healthCheck() {
  return {
    status: initialized.value ? "HEALTHY" : "NOT_INITIALIZED",
    version: VERSION,
    moduleId: MODULE_ID,
    hasCommandPalette: !!commandPalette.value,
    hasSplitView: !!splitView.value,
    hasTourManager: !!tourManager.value,
    metrics: {
      commandsRegistered: metrics.commandsRegistered,
      toursRegistered: metrics.toursRegistered,
      errors: metrics.errors
    }
  };
}
export {
  healthCheck,
  info
};
