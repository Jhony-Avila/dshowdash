import { createNotificationManager } from "../../utils/notification-manager.js";
import { createFormValidator } from "../../utils/form-validator.js";
import { createStorageManager } from "../../utils/storage-manager.js";
import { createClipboardManager } from "../../utils/clipboard-manager.js";
import { createDragDropManager } from "../../utils/drag-drop-manager.js";
import { createModalManager } from "../../utils/modal-manager.js";
import { createTooltipManager } from "../../utils/tooltip-manager.js";
import { createContextMenuManager } from "../../utils/context-menu-manager.js";
import { createHotkeyManager } from "../../utils/hotkey-manager.js";
import { createScrollManager } from "../../utils/scroll-manager.js";
import { createFocusManager } from "../../utils/focus-manager.js";
import { createUndoManager } from "../../utils/undo-manager.js";
import { createThemeManager } from "../../utils/theme-manager-v2.js";
import { createAnimationManager } from "../../utils/animation-manager-v2.js";
import { createMediaQueryManager } from "../../utils/media-query-manager.js";
import { createIntersectionManager } from "../../utils/intersection-manager.js";
import { createResizeManager } from "../../utils/resize-manager.js";
import { createMutationManager } from "../../utils/mutation-manager.js";
import { registerLoaded } from "../../core/dependency-map.js";
import { getEnv, ENV } from "../../config.js";
const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.phases.phase6-ui";
async function initPhase6(context) {
  const config = context.config;
  const bootMetrics = context.bootMetrics;
  const logger = context.logger;
  bootMetrics?.startPhase("phase6");
  logger?.debug("Phase 6 starting...");
  let notificationManager = null, formValidator = null, storageManager = null;
  let clipboardManager = null, dragDropManager = null, modalManager = null;
  let tooltipManager = null, contextMenuManager = null, hotkeyManager = null;
  let scrollManager = null, focusManager = null, undoManager = null;
  let themeManager = null, animationManager = null, mediaQueryManager = null;
  let intersectionManager = null, resizeManager = null, mutationManager = null;
  if (config.enableNotificationManager) {
    notificationManager = createNotificationManager({ position: "top-right", maxVisible: 5 });
    registerLoaded("notification-manager");
  }
  if (config.enableFormValidator) {
    formValidator = createFormValidator({ validateOnBlur: true });
    registerLoaded("form-validator");
  }
  if (config.enableStorageManager) {
    storageManager = createStorageManager({ prefix: "cm_", defaultStorage: "local" });
    registerLoaded("storage-manager");
  }
  if (config.enableClipboardManager) {
    clipboardManager = createClipboardManager({});
    registerLoaded("clipboard-manager");
  }
  if (config.enableDragDropManager) {
    dragDropManager = createDragDropManager({});
    registerLoaded("drag-drop-manager");
  }
  if (config.enableModalManager) {
    modalManager = createModalManager({ closeOnEscape: true, closeOnBackdrop: true });
    registerLoaded("modal-manager");
  }
  if (config.enableTooltipManager) {
    tooltipManager = createTooltipManager({ position: "top", showDelay: 200 });
    registerLoaded("tooltip-manager");
  }
  if (config.enableContextMenuManager) {
    contextMenuManager = createContextMenuManager({ theme: "dark" });
    registerLoaded("context-menu-manager");
  }
  if (config.enableHotkeyManager) {
    hotkeyManager = createHotkeyManager({ debug: getEnv() === ENV.DEVELOPMENT });
    registerLoaded("hotkey-manager");
  }
  if (config.enableScrollManager) {
    scrollManager = createScrollManager({ throttleMs: 100 });
    registerLoaded("scroll-manager");
  }
  if (config.enableFocusManager) {
    focusManager = createFocusManager({ autoFocus: true });
    registerLoaded("focus-manager");
  }
  if (config.enableUndoManager) {
    undoManager = createUndoManager({ maxHistory: 100 });
    registerLoaded("undo-manager");
  }
  if (config.enableThemeManager) {
    themeManager = createThemeManager({ defaultTheme: "system" });
    registerLoaded("theme-manager-v2");
  }
  if (config.enableAnimationManager) {
    animationManager = createAnimationManager({ respectReducedMotion: true });
    registerLoaded("animation-manager-v2");
  }
  if (config.enableMediaQueryManager) {
    mediaQueryManager = createMediaQueryManager({ debounceMs: 100 });
    registerLoaded("media-query-manager");
  }
  if (config.enableIntersectionManager) {
    intersectionManager = createIntersectionManager({ rootMargin: "50px" });
    registerLoaded("intersection-manager");
  }
  if (config.enableResizeManager) {
    resizeManager = createResizeManager({ debounceMs: 100 });
    registerLoaded("resize-manager");
  }
  if (config.enableMutationManager) {
    mutationManager = createMutationManager({ batchMs: 16 });
    registerLoaded("mutation-manager");
  }
  bootMetrics?.endPhase("phase6");
  logger?.debug("Phase 6 ready");
  return {
    notificationManager,
    formValidator,
    storageManager,
    clipboardManager,
    dragDropManager,
    modalManager,
    tooltipManager,
    contextMenuManager,
    hotkeyManager,
    scrollManager,
    focusManager,
    undoManager,
    themeManager,
    animationManager,
    mediaQueryManager,
    intersectionManager,
    resizeManager,
    mutationManager
  };
}
var phase6_ui_default = { initPhase6 };
export {
  MODULE_ID,
  VERSION,
  phase6_ui_default as default,
  initPhase6
};
