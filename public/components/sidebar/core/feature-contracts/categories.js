const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar-feature-categories";
const CATEGORIES = Object.freeze({
  CORE: "core",
  UI: "ui",
  SEARCH: "search",
  NAVIGATION: "navigation",
  DATA: "data",
  ACCESSIBILITY: "accessibility",
  VISUAL: "visual",
  PERFORMANCE: "performance",
  DEBUG: "debug"
});
var categories_default = CATEGORIES;
export {
  CATEGORIES,
  MODULE_ID,
  VERSION,
  categories_default as default
};
