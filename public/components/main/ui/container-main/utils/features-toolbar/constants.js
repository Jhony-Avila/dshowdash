const VERSION = "6.0.0-NEW-FEATURES";
const MODULE_ID = "features-toolbar";
const BUTTON_IDS = Object.freeze({
  // Grupo 1: Navegação (Violet)
  BACK: "back",
  FORWARD: "forward",
  REFRESH: "refresh",
  HISTORY: "history",
  // Grupo 2: Busca (Blue)
  SEARCH: "search",
  COMMAND: "command",
  // Grupo 3: Layout (Emerald)
  SPLIT: "split",
  FULLSCREEN: "fullscreen",
  // Grupo 4: Zoom (Amber)
  ZOOM_OUT: "zoomOut",
  ZOOM_RESET: "zoomReset",
  ZOOM_IN: "zoomIn",
  // Grupo 5: Ações (Pink)
  BOOKMARK: "bookmark",
  EXPORT: "export",
  PRINT: "print",
  // Grupo 6: Config (Cyan)
  THEME: "theme",
  A11Y: "a11y",
  TOUR: "tour",
  // Grupo 7: Ferramentas (Orange)
  OFFLINE: "offline",
  TABS: "tabs",
  LAYOUT: "layout",
  DEVTOOLS: "devtools",
  // Grupo 8: Utilidades (Rose)
  CLIPBOARD: "clipboard",
  SCREENSHOT: "screenshot",
  WAKE_LOCK: "wakeLock"
});
const DROPDOWN_IDS = Object.freeze({
  // Export (Pink)
  EXPORT_PNG: "export-png",
  EXPORT_JPEG: "export-jpeg",
  EXPORT_PDF: "export-pdf",
  EXPORT_SVG: "export-svg",
  // #19: History dropdown items (Violet)
  HISTORY_BACK_ALL: "history-back-all",
  HISTORY_CLEAR: "history-clear",
  // #17: Layout dropdown items (Orange)
  LAYOUT_DEFAULT: "layout-default",
  LAYOUT_COMPACT: "layout-compact",
  LAYOUT_WIDE: "layout-wide",
  // #18: Accessibility dropdown items (Cyan)
  A11Y_FONT_INCREASE: "a11y-font-increase",
  A11Y_FONT_DECREASE: "a11y-font-decrease",
  A11Y_HIGH_CONTRAST: "a11y-high-contrast",
  A11Y_FOCUS_MODE: "a11y-focus-mode",
  // Clipboard dropdown items (Rose)
  CLIPBOARD_COPY_URL: "clipboard-copy-url",
  CLIPBOARD_COPY_CONTENT: "clipboard-copy-content",
  // Screenshot dropdown items (Rose)
  SCREENSHOT_PNG: "screenshot-png",
  SCREENSHOT_PDF: "screenshot-pdf"
});
const ALL_BUTTON_IDS = Object.freeze(Object.values(BUTTON_IDS));
const ALL_DROPDOWN_IDS = Object.freeze(Object.values(DROPDOWN_IDS));
const GROUPS = Object.freeze({
  navigation: {
    id: "navigation",
    label: "Navega\xE7\xE3o",
    colorToken: "nav",
    color: "#a78bfa",
    order: 1,
    buttonIds: ["back", "forward", "refresh", "history"]
  },
  search: {
    id: "search",
    label: "Busca",
    colorToken: "search",
    color: "#60a5fa",
    order: 2,
    buttonIds: ["search", "command"]
  },
  layout: {
    id: "layout",
    label: "Layout",
    colorToken: "layout",
    color: "#34d399",
    order: 3,
    buttonIds: ["split", "fullscreen"]
  },
  zoom: {
    id: "zoom",
    label: "Zoom",
    colorToken: "zoom",
    color: "#fbbf24",
    order: 4,
    buttonIds: ["zoomOut", "zoomReset", "zoomIn"]
  },
  actions: {
    id: "actions",
    label: "A\xE7\xF5es",
    colorToken: "action",
    color: "#f472b6",
    order: 5,
    buttonIds: ["bookmark", "export", "print"]
  },
  config: {
    id: "config",
    label: "Configura\xE7\xE3o",
    colorToken: "config",
    color: "#22d3ee",
    order: 6,
    buttonIds: ["theme", "a11y", "tour"]
  },
  tools: {
    id: "tools",
    label: "Ferramentas",
    colorToken: "tools",
    color: "#fb923c",
    order: 7,
    buttonIds: ["offline", "tabs", "layout", "devtools"]
  },
  utilities: {
    id: "utilities",
    label: "Utilidades",
    colorToken: "util",
    color: "#fb7185",
    order: 8,
    buttonIds: ["clipboard", "screenshot", "wakeLock"]
  }
});
const GROUP_ORDER = Object.freeze(
  Object.values(GROUPS).sort((a, b) => a.order - b.order).map((g) => g.id)
);
const _config = {
  tooltipDelay: 300,
  tooltipEnabled: true
};
function getConfig(key) {
  return _config[key];
}
function setConfig(key, value) {
  if (!(key in _config)) return false;
  _config[key] = value;
  return true;
}
function getAllConfig() {
  return Object.assign({}, _config);
}
const STATE_PROVIDER_FIELDS = Object.freeze([
  "disabled",
  "active",
  "icon",
  "tooltip",
  "badge",
  "dot"
]);
function validateStateProviderResult(state) {
  if (!state || typeof state !== "object") return null;
  const clean = {};
  let hasValidField = false;
  for (let i = 0; i < STATE_PROVIDER_FIELDS.length; i++) {
    const field = STATE_PROVIDER_FIELDS[i];
    if (field in state) {
      clean[field] = state[field];
      hasValidField = true;
    }
  }
  return hasValidField ? clean : null;
}
export {
  ALL_BUTTON_IDS,
  ALL_DROPDOWN_IDS,
  BUTTON_IDS,
  DROPDOWN_IDS,
  GROUPS,
  GROUP_ORDER,
  MODULE_ID,
  STATE_PROVIDER_FIELDS,
  VERSION,
  getAllConfig,
  getConfig,
  setConfig,
  validateStateProviderResult
};
