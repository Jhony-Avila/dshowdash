import { MODULE_ID } from "./constants.js";
import { config, refs } from "./state.js";
const VERSION = "1.0.0";
function emit(event, data) {
  if (refs.eventBus?.emit) {
    refs.eventBus.emit(event, { ...data, moduleId: MODULE_ID, timestamp: Date.now() });
  }
}
function inject(dependencies) {
  if (dependencies.openOverlay) refs.openOverlay = dependencies.openOverlay;
  if (dependencies.canOpenOverlay) refs.canOpenOverlay = dependencies.canOpenOverlay;
  if (dependencies.eventBus) refs.eventBus = dependencies.eventBus;
  if (config.processOnModeChange && refs.eventBus?.on) {
    refs.eventBus.on("overlay:mode-change", () => {
      if (config.autoProcess) {
        import("./process.js").then((m) => m.process());
      }
    });
  }
}
export {
  VERSION,
  emit,
  inject
};
