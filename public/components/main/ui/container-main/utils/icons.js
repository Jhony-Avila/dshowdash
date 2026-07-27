const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-main-icons";
const ICONS = {
  // Window controls
  minimize: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  maximize: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="2.5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>',
  restore: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-1" stroke="currentColor" stroke-width="1.5"/></svg>',
  close: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  fullscreen: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 5V2h3M9 2h3v3M12 9v3H9M5 12H2V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  exitFullscreen: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2v3H2M9 5h3V2M9 12V9h3M2 9h3v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  // Chevrons
  chevronUp: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 9l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevronDown: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevronLeft: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevronRight: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  // Actions
  menu: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="11" r="1" fill="currentColor"/></svg>',
  search: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 10l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3v8M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  minus: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 019-3M12 7a5 5 0 01-9 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11 1v3h-3M3 13v-3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  // Zoom
  zoomIn: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 10l2 2M6 4v4M4 6h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  zoomOut: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 10l2 2M4 6h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  zoomReset: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 10l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><text x="6" y="8" font-size="5" fill="currentColor" text-anchor="middle">1:1</text></svg>',
  // Split view
  splitHorizontal: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M7 1.5v11" stroke="currentColor" stroke-width="1.5"/></svg>',
  splitVertical: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M1.5 7h11" stroke="currentColor" stroke-width="1.5"/></svg>',
  // Status/Feedback (16x16)
  info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v4M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l7 13H1L8 1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v3M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  // Error boundary (48x48)
  errorLarge: '<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/><path d="M24 14v12M24 30v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  // Close small (12x12)
  closeSmall: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
};
function getIcon(name, fallback = "") {
  return ICONS[name] || fallback;
}
function getIconSized(name, width, height) {
  const icon = ICONS[name];
  if (!icon) return "";
  return icon.replace(/width="(\d+)"/, `width="${width}"`).replace(/height="(\d+)"/, `height="${height}"`);
}
function getIconNames() {
  return Object.keys(ICONS);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, iconCount: Object.keys(ICONS).length, icons: getIconNames() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, iconCount: Object.keys(ICONS).length };
}
var icons_default = { ICONS, getIcon, getIconSized, getIconNames, info, healthCheck, VERSION, MODULE_ID };
export {
  ICONS,
  MODULE_ID,
  VERSION,
  icons_default as default,
  getIcon,
  getIconNames,
  getIconSized,
  healthCheck,
  info
};
