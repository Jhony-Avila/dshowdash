const VERSION = "3.0.0-UX-ENHANCED";
const MODULE_ID = "main.ui.container-main.components.ux-enhancements.effects.morph";
function enableMorphTransitions(container) {
  container?.classList?.add("dsd-container--morph-transitions");
  return {
    disable() {
      container?.classList?.remove("dsd-container--morph-transitions");
    }
  };
}
export {
  MODULE_ID,
  VERSION,
  enableMorphTransitions
};
