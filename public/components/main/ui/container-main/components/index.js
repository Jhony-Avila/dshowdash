const VERSION = "3.0.0-UX-ENHANCED";
const MODULE_ID = "container-components-index";
import { createAccessibility } from "./accessibility.js";
import { createBreadcrumb } from "./breadcrumb.js";
import { PRESETS, createConfigPresets } from "./config-presets.js";
import { createContextMenu } from "./context-menu.js";
import { createControls } from "./controls.js";
import {
  createDebugPanel,
  init,
  destroy,
  show,
  hide,
  toggle,
  isVisible,
  render,
  setElement
} from "./debug-panel.js";
import { createDragHandler } from "./drag-handler.js";
import { ERROR_SEVERITY, createErrorBoundary } from "./error-boundary.js";
import { LIFECYCLE_HOOKS, createEventHooks } from "./event-hooks.js";
import { createHeader, createHeaderWithStatus } from "./header.js";
import { DEFAULT_SHORTCUTS, createKeyboardHandler } from "./keyboard-handler.js";
import { createMultiWindow } from "./multi-window.js";
import { BADGE_VARIANTS, createNotificationBadge } from "./notification-badge.js";
import { createPerformanceMonitor } from "./performance-monitor.js";
import { injectPorts, getPorts, injectStorage, PLUGIN_LIFECYCLE, PLUGIN_CONTRACT, createPluginSystem } from "./plugin-system.js";
import { PROGRESS_VARIANT, createProgressBar } from "./progress-bar.js";
import { RESIZE_HANDLES, createResizeHandler } from "./resize-handler.js";
import { createSearchBox } from "./search-box.js";
import { createSkeleton } from "./skeleton.js";
import { SNAP_ZONE, createSnapDock } from "./snap-dock.js";
import { SPLIT_DIRECTION, createSplitView } from "./split-view.js";
import { STORAGE_TYPE, createStatePersistence } from "./state-persistence.js";
import { STATUS, createStatusIndicator } from "./status-indicator.js";
import { TOAST_POSITION, TOAST_TYPE, createToast } from "./toast.js";
import { TOOLBAR_POSITION, createToolbar } from "./toolbar.js";
import { createUsageMetrics } from "./usage-metrics.js";
import { createZoomControls } from "./zoom-controls.js";
import {
  MODAL_SIZE,
  MODAL_POSITION,
  createModal,
  closeAll,
  getActiveCount,
  confirm,
  alert
} from "./modal.js";
import {
  TOOLTIP_POSITION,
  init as init2,
  show as show2,
  hide as hide2,
  destroy as destroy2
} from "./tooltip.js";
import {
  DROPDOWN_POSITION,
  createDropdown,
  closeAll as closeAll2
} from "./dropdown.js";
import {
  POPOVER_POSITION,
  POPOVER_TRIGGER,
  createPopover,
  closeAll as closeAll3
} from "./popover.js";
import { TAB_POSITION, createEnhancedTabs } from "./tabs-enhanced.js";
import { createAccordion } from "./accordion.js";
import { createSlider } from "./slider.js";
import { BADGE_VARIANT, BADGE_SIZE, createBadge } from "./badge.js";
import { AVATAR_SIZE, AVATAR_STATUS, createAvatar, createAvatarGroup } from "./avatar.js";
import { SPINNER_SIZE, SPINNER_VARIANT, createSpinner, createOverlaySpinner } from "./spinner.js";
import { CHIP_VARIANT, CHIP_SIZE, createChip, createChipGroup } from "./chip.js";
import { ALERT_VARIANT, createAlert, showAlert } from "./alert.js";
import { CARD_VARIANT, createCard } from "./card.js";
import {
  createScrollIndicator,
  createCompactScrollHeader,
  createValidationShake,
  createSaveIndicator,
  createConnectionStatus,
  createParallaxBackground,
  enableMorphTransitions,
  createPiPMode,
  setDepth,
  createEnhancements,
  createAllEnhancements
} from "./ux-enhancements/index.js";
const CORE_COMPONENTS = [
  "accessibility",
  "breadcrumb",
  "config-presets",
  "context-menu",
  "controls",
  "debug-panel",
  "drag-handler",
  "error-boundary",
  "event-hooks",
  "header",
  "keyboard-handler",
  "multi-window",
  "notification-badge",
  "performance-monitor",
  "plugin-system",
  "progress-bar",
  "resize-handler",
  "search-box",
  "skeleton",
  "snap-dock",
  "split-view",
  "state-persistence",
  "status-indicator",
  "toast",
  "toolbar",
  "usage-metrics",
  "zoom-controls",
  "tab-manager"
];
const PHASE3_COMPONENTS = [
  "modal",
  "tooltip",
  "dropdown",
  "popover",
  "tabs-enhanced",
  "accordion",
  "slider",
  "badge",
  "avatar",
  "spinner"
];
const PHASE5_COMPONENTS = [
  "chip",
  "alert",
  "card"
];
const UX_ENHANCEMENTS = [
  "ux-enhancements"
];
const ALL_COMPONENTS = [...CORE_COMPONENTS, ...PHASE3_COMPONENTS, ...PHASE5_COMPONENTS, ...UX_ENHANCEMENTS];
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    coreComponents: CORE_COMPONENTS.length,
    phase3Components: PHASE3_COMPONENTS.length,
    phase5Components: PHASE5_COMPONENTS.length,
    uxEnhancements: UX_ENHANCEMENTS.length,
    totalComponents: ALL_COMPONENTS.length
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    totalComponents: ALL_COMPONENTS.length
  };
}
var components_default = {
  VERSION,
  MODULE_ID,
  CORE_COMPONENTS,
  PHASE3_COMPONENTS,
  PHASE5_COMPONENTS,
  UX_ENHANCEMENTS,
  ALL_COMPONENTS,
  info,
  healthCheck
};
export {
  ALERT_VARIANT,
  ALL_COMPONENTS,
  AVATAR_SIZE,
  AVATAR_STATUS,
  BADGE_SIZE,
  BADGE_VARIANT,
  BADGE_VARIANTS,
  CARD_VARIANT,
  CHIP_SIZE,
  CHIP_VARIANT,
  CORE_COMPONENTS,
  DEFAULT_SHORTCUTS,
  DROPDOWN_POSITION,
  ERROR_SEVERITY,
  LIFECYCLE_HOOKS,
  MODAL_POSITION,
  MODAL_SIZE,
  MODULE_ID,
  PHASE3_COMPONENTS,
  PHASE5_COMPONENTS,
  PLUGIN_CONTRACT,
  PLUGIN_LIFECYCLE,
  POPOVER_POSITION,
  POPOVER_TRIGGER,
  PRESETS,
  PROGRESS_VARIANT,
  RESIZE_HANDLES,
  SNAP_ZONE,
  SPINNER_SIZE,
  SPINNER_VARIANT,
  SPLIT_DIRECTION,
  STATUS,
  STORAGE_TYPE,
  TAB_POSITION,
  TOAST_POSITION,
  TOAST_TYPE,
  TOOLBAR_POSITION,
  TOOLTIP_POSITION,
  UX_ENHANCEMENTS,
  VERSION,
  createAccessibility,
  createAccordion,
  createAlert,
  createAllEnhancements,
  createAvatar,
  createAvatarGroup,
  createBadge,
  createBreadcrumb,
  createCard,
  createChip,
  createChipGroup,
  createCompactScrollHeader,
  createConfigPresets,
  createConnectionStatus,
  createContextMenu,
  createControls,
  createDebugPanel,
  createDragHandler,
  createDropdown,
  createEnhancedTabs,
  createEnhancements,
  createErrorBoundary,
  createEventHooks,
  createHeader,
  createHeaderWithStatus,
  createKeyboardHandler,
  createModal,
  createMultiWindow,
  createNotificationBadge,
  createOverlaySpinner,
  createParallaxBackground,
  createPerformanceMonitor,
  createPiPMode,
  createPluginSystem,
  createPopover,
  createProgressBar,
  createResizeHandler,
  createSaveIndicator,
  createScrollIndicator,
  createSearchBox,
  createSkeleton,
  createSlider,
  createSnapDock,
  createSpinner,
  createSplitView,
  createStatePersistence,
  createStatusIndicator,
  createToast,
  createToolbar,
  createUsageMetrics,
  createValidationShake,
  createZoomControls,
  destroy as debugPanelDestroy,
  hide as debugPanelHide,
  init as debugPanelInit,
  isVisible as debugPanelIsVisible,
  render as debugPanelRender,
  setElement as debugPanelSetElement,
  show as debugPanelShow,
  toggle as debugPanelToggle,
  components_default as default,
  closeAll2 as dropdownCloseAll,
  enableMorphTransitions,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  injectStorage,
  alert as modalAlert,
  closeAll as modalCloseAll,
  confirm as modalConfirm,
  getActiveCount as modalGetActiveCount,
  closeAll3 as popoverCloseAll,
  setDepth,
  showAlert,
  destroy2 as tooltipDestroy,
  hide2 as tooltipHide,
  init2 as tooltipInit,
  show2 as tooltipShow
};
