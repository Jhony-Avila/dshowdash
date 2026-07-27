const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-integration.core.legacy-adapter";
function createLegacyAdapter(panelId, panel, element) {
  return {
    panelId,
    panel,
    element,
    originalMethods: {},
    // Intercepta resize
    resize(width, height) {
      if (panel.onResize) {
        panel.onResize({ width, height });
      } else if (panel.handleResize) {
        panel.handleResize(width, height);
      } else if (panel._resize) {
        panel._resize(width, height);
      }
      if (element) {
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
      }
    },
    // Intercepta move
    move(x, y) {
      if (panel.onMove) {
        panel.onMove({ x, y });
      } else if (panel.handleMove) {
        panel.handleMove(x, y);
      }
      if (element) {
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
      }
    },
    // Intercepta fullscreen
    setFullscreen(isFullscreen) {
      if (panel.onFullscreen) {
        panel.onFullscreen(isFullscreen);
      } else if (panel.setFullscreen) {
        panel.setFullscreen(isFullscreen);
      }
    },
    // Obtém estado
    getState() {
      if (panel.getState) {
        return panel.getState();
      }
      return {
        width: element?.offsetWidth,
        height: element?.offsetHeight
      };
    }
  };
}
var legacy_adapter_default = { createLegacyAdapter };
export {
  MODULE_ID,
  VERSION,
  createLegacyAdapter,
  legacy_adapter_default as default
};
