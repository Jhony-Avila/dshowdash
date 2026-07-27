const MODULE_ID = "panel-01.ui.table.config";
const VERSION = "9.3.0-P2-ENTERPRISE";
const TABLE_CONFIG = {
  pageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  enableVirtualScroll: true,
  virtualScrollThreshold: 100,
  enableSelection: true,
  selectionMode: "multiple",
  enableSorting: true,
  enableFiltering: true,
  enableResize: true,
  enableReorder: false,
  rowHeight: 40,
  headerHeight: 48,
  stickyHeader: true
};
function getTableConfig(overrides = {}) {
  return { ...TABLE_CONFIG, ...overrides };
}
var config_default = TABLE_CONFIG;
export {
  MODULE_ID,
  TABLE_CONFIG,
  VERSION,
  config_default as default,
  getTableConfig
};
