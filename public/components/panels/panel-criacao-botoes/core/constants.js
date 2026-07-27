const PANEL_ID = "panel-criacao-botoes";
const MODULE_ID = "panels.panel-criacao-botoes";
const VERSION = "1.0.0";
const CSS_PREFIX = "pcb";
const CONTEXT = "sidebar";
const SOURCE_TABLE = "ui_nav_items";
const PANELS_API = "/api/admin/panels";
const PANELS_API_QUERY = "?per_page=200&sort=title&order=asc";
const STUB_PANEL_ID = "panel-stub-dev";
const SELECTORS = {
  container: `[data-panel="${PANEL_ID}"]`,
  root: `.${CSS_PREFIX}`,
  list: `.${CSS_PREFIX}-list`,
  group: `.${CSS_PREFIX}-group`,
  item: `.${CSS_PREFIX}-item`,
  form: `.${CSS_PREFIX}-form`,
  preview: `.${CSS_PREFIX}-preview`,
  skeleton: `.${CSS_PREFIX}-skeleton`,
  emptyState: `.${CSS_PREFIX}-empty`,
  error: `.${CSS_PREFIX}-error`
};
const CLASSES = {
  itemActive: `${CSS_PREFIX}-item--active`,
  itemInactive: `${CSS_PREFIX}-item--inactive`,
  loading: `${CSS_PREFIX}--loading`,
  hidden: `${CSS_PREFIX}--hidden`
};
const DATA_ATTRS = {
  action: "data-action",
  itemId: "data-item-id",
  groupKey: "data-group-key"
};
export {
  CLASSES,
  CONTEXT,
  CSS_PREFIX,
  DATA_ATTRS,
  MODULE_ID,
  PANELS_API,
  PANELS_API_QUERY,
  PANEL_ID,
  SELECTORS,
  SOURCE_TABLE,
  STUB_PANEL_ID,
  VERSION
};
