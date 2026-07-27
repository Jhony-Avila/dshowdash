const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-integration.utils.panel-detector";
function detectPanelType(panel) {
  if (panel.getLayoutState && panel.setLayoutState) {
    return "modern";
  }
  if (panel.onResize || panel.handleResize || panel._resize) {
    return "legacy";
  }
  return "unknown";
}
var panel_detector_default = { detectPanelType };
export {
  MODULE_ID,
  VERSION,
  panel_detector_default as default,
  detectPanelType
};
