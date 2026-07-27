// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-UX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-components-index
// PURPOSE: Container-Main Components Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CORE_COMPONENTS — exported value
//   PHASE3_COMPONENTS — exported value
//   PHASE5_COMPONENTS — exported value
//   UX_ENHANCEMENTS — exported value
//   ALL_COMPONENTS — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.js
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '3.0.0-UX-ENHANCED';
export const MODULE_ID = 'container-components-index';

// ───────────────────────────────────────────────────────────────
// Explicit named re-exports (fixes TS2308 duplicate member errors).
// Common names (VERSION, MODULE_ID, info, healthCheck, injectEventBus)
// are intentionally omitted — each sub-module owns them locally and
// the barrel exports its own VERSION/MODULE_ID/info/healthCheck above.
// ───────────────────────────────────────────────────────────────

// Core Components (28)
export { createAccessibility } from './accessibility.js';
export { createBreadcrumb } from './breadcrumb.js';
export { PRESETS, createConfigPresets } from './config-presets.js';
export { createContextMenu } from './context-menu.js';
export { createControls } from './controls.js';
export {
  createDebugPanel,
  init   as debugPanelInit,
  destroy as debugPanelDestroy,
  show   as debugPanelShow,
  hide   as debugPanelHide,
  toggle as debugPanelToggle,
  isVisible as debugPanelIsVisible,
  render as debugPanelRender,
  setElement as debugPanelSetElement
} from './debug-panel.js';
export { createDragHandler } from './drag-handler.js';
export { ERROR_SEVERITY, createErrorBoundary } from './error-boundary.js';
export { LIFECYCLE_HOOKS, createEventHooks } from './event-hooks.js';
export { createHeader, createHeaderWithStatus } from './header.js';
export { DEFAULT_SHORTCUTS, createKeyboardHandler } from './keyboard-handler.js';
export { createMultiWindow } from './multi-window.js';
export { BADGE_VARIANTS, createNotificationBadge } from './notification-badge.js';
export { createPerformanceMonitor } from './performance-monitor.js';
export { injectPorts, getPorts, injectStorage, PLUGIN_LIFECYCLE, PLUGIN_CONTRACT, createPluginSystem } from './plugin-system.js';
export { PROGRESS_VARIANT, createProgressBar } from './progress-bar.js';
export { RESIZE_HANDLES, createResizeHandler } from './resize-handler.js';
export { createSearchBox } from './search-box.js';
export { createSkeleton } from './skeleton.js';
export { SNAP_ZONE, createSnapDock } from './snap-dock.js';
export { SPLIT_DIRECTION, createSplitView } from './split-view.js';
export { STORAGE_TYPE, createStatePersistence } from './state-persistence.js';
export { STATUS, createStatusIndicator } from './status-indicator.js';
export { TOAST_POSITION, TOAST_TYPE, createToast } from './toast.js';
export { TOOLBAR_POSITION, createToolbar } from './toolbar.js';
export { createUsageMetrics } from './usage-metrics.js';
export { createZoomControls } from './zoom-controls.js';

// Phase 3 Components (10)
export {
  MODAL_SIZE, MODAL_POSITION, createModal,
  closeAll  as modalCloseAll,
  getActiveCount as modalGetActiveCount,
  confirm   as modalConfirm,
  alert     as modalAlert
} from './modal.js';
export {
  TOOLTIP_POSITION,
  init    as tooltipInit,
  show    as tooltipShow,
  hide    as tooltipHide,
  destroy as tooltipDestroy
} from './tooltip.js';
export {
  DROPDOWN_POSITION, createDropdown,
  closeAll as dropdownCloseAll
} from './dropdown.js';
export {
  POPOVER_POSITION, POPOVER_TRIGGER, createPopover,
  closeAll as popoverCloseAll
} from './popover.js';
export { TAB_POSITION, createEnhancedTabs } from './tabs-enhanced.js';
export { createAccordion } from './accordion.js';
export { createSlider } from './slider.js';
export { BADGE_VARIANT, BADGE_SIZE, createBadge } from './badge.js';
export { AVATAR_SIZE, AVATAR_STATUS, createAvatar, createAvatarGroup } from './avatar.js';
export { SPINNER_SIZE, SPINNER_VARIANT, createSpinner, createOverlaySpinner } from './spinner.js';

// Phase 5 Components (3)
export { CHIP_VARIANT, CHIP_SIZE, createChip, createChipGroup } from './chip.js';
export { ALERT_VARIANT, createAlert, showAlert } from './alert.js';
export { CARD_VARIANT, createCard } from './card.js';

// UX Enhancements
export {
  createScrollIndicator, createCompactScrollHeader,
  createValidationShake,
  createSaveIndicator, createConnectionStatus,
  createParallaxBackground, enableMorphTransitions, createPiPMode,
  setDepth,
  createEnhancements, createAllEnhancements
} from './ux-enhancements/index.js';

// Component lists
export const CORE_COMPONENTS = [
  'accessibility', 'breadcrumb', 'config-presets', 'context-menu', 'controls',
  'debug-panel', 'drag-handler', 'error-boundary', 'event-hooks', 'header',
  'keyboard-handler', 'multi-window', 'notification-badge', 'performance-monitor',
  'plugin-system', 'progress-bar', 'resize-handler', 'search-box', 'skeleton',
  'snap-dock', 'split-view', 'state-persistence', 'status-indicator', 'toast',
  'toolbar', 'usage-metrics', 'zoom-controls', 'tab-manager'
];

export const PHASE3_COMPONENTS = [
  'modal', 'tooltip', 'dropdown', 'popover', 'tabs-enhanced',
  'accordion', 'slider', 'badge', 'avatar', 'spinner'
];

export const PHASE5_COMPONENTS = [
  'chip', 'alert', 'card'
];

export const UX_ENHANCEMENTS = [
  'ux-enhancements'
];

export const ALL_COMPONENTS = [...CORE_COMPONENTS, ...PHASE3_COMPONENTS, ...PHASE5_COMPONENTS, ...UX_ENHANCEMENTS];

export function info() {
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

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    totalComponents: ALL_COMPONENTS.length
  };
}

export default {
  VERSION, MODULE_ID,
  CORE_COMPONENTS, PHASE3_COMPONENTS, PHASE5_COMPONENTS, UX_ENHANCEMENTS, ALL_COMPONENTS,
  info, healthCheck
};
