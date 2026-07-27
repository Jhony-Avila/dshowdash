const VERSION = "1.0.0";
const MODULE_ID = "container-main:print-manager";
const PRINT_ORIENTATIONS = Object.freeze({
  PORTRAIT: "portrait",
  LANDSCAPE: "landscape"
});
const PRINT_SIZES = Object.freeze({
  A4: "A4",
  A3: "A3",
  LETTER: "letter",
  LEGAL: "legal",
  AUTO: "auto"
});
const PAGE_BREAK_MODES = Object.freeze({
  AUTO: "auto",
  AVOID: "avoid",
  ALWAYS: "always"
});
const DEFAULT_CONFIG = Object.freeze({
  orientation: PRINT_ORIENTATIONS.PORTRAIT,
  pageSize: PRINT_SIZES.A4,
  margins: { top: 15, right: 15, bottom: 15, left: 15 },
  showHeader: true,
  showFooter: true,
  headerContent: null,
  footerContent: null,
  showPageNumbers: true,
  showDate: true,
  showTitle: true,
  title: null,
  excludeSelectors: [".dsd-no-print", ".dsd-debug-panel", "nav", "aside"],
  includeOnlySelector: null,
  grayscale: false,
  removeBackgrounds: false,
  optimizeImages: true,
  scale: 1
});
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  PAGE_BREAK_MODES,
  PRINT_ORIENTATIONS,
  PRINT_SIZES,
  VERSION
};
