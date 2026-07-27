const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.default-options";
const DEFAULT_OPTIONS = Object.freeze({
  // Core
  id: null,
  title: "Container",
  icon: null,
  className: "",
  variant: "default",
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
  toolbarPosition: "top",
  searchEnabled: false,
  searchPlaceholder: "Buscar...",
  progressEnabled: true,
  toastEnabled: true,
  toastPosition: "bottom-right",
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
var default_options_default = DEFAULT_OPTIONS;
export {
  DEFAULT_OPTIONS,
  MODULE_ID,
  VERSION,
  default_options_default as default
};
