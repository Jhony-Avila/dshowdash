// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: default-options
// PURPOSE: Container Factory Default Options
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   DEFAULT_OPTIONS — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.container-factory.default-options';

export const DEFAULT_OPTIONS = Object.freeze({
  // Core
  id: null,
  title: 'Container',
  icon: null,
  className: '',
  variant: 'default',
  
  // Controls
  showControls: true,
  collapsible: true,
  closable: false,
  fullscreenable: true,
  
  // Features
  contextMenuEnabled: true,
  keyboardEnabled: true,
  draggable: false,
  resizable: false,
  breadcrumbEnabled: false,
  splitViewEnabled: false,
  notificationBadgeEnabled: false,
  statePersistenceEnabled: true,
  toolbarEnabled: false,
  toolbarItems: [],
  toolbarPosition: 'top',
  searchEnabled: false,
  searchPlaceholder: 'Buscar...',
  progressEnabled: true,
  toastEnabled: true,
  toastPosition: 'bottom-right',
  snapEnabled: false,
  zoomEnabled: false,
  zoomMin: 50,
  zoomMax: 200,
  accessibilityEnabled: true,
  accessibilityFocusTrap: false,
  accessibilityAnnounce: true,
  debugEnabled: false,
  debugStartExpanded: false,
  errorBoundaryEnabled: true,
  eventHooksEnabled: true,
  
  // Callbacks
  onClose: null,
  onCollapse: null,
  onExpand: null,
  onFullscreen: null,
  onResize: null,
  onDrag: null,
  onReady: null,
  onError: null
});

export default DEFAULT_OPTIONS;
