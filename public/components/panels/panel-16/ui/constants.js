const MODULE_ID = "panel-16-ui-constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_VERSION = VERSION;
const STORAGE_KEYS = {
  FILTERS: "p16_filters",
  VIEW: "p16_view_mode",
  COLUMNS: "p16_columns",
  VIEWS: "p16_saved_views",
  FAVORITES: "p16_favorites",
  SORT: "p16_sort",
  PINNED: "p16_pinned_cols"
};
const COLUMN_TYPES = {
  checkbox: { type: "checkbox", align: "center", width: 40 },
  nome: { type: "text", align: "left", width: 250, searchable: true },
  cnpj: { type: "document", align: "left", width: 150, searchable: true },
  local: { type: "text", align: "left", width: 120, searchable: true },
  total_pago: { type: "currency", align: "right", width: 130, sortable: true, filterable: "range" },
  qtd_requisicoes: { type: "number", align: "center", width: 80, sortable: true, filterable: "range" },
  pix: { type: "badge", align: "center", width: 60 },
  status: { type: "badge", align: "center", width: 100, sortable: true, filterable: "select" },
  risco: { type: "indicator", align: "center", width: 60, filterable: "select" },
  action: { type: "action", align: "center", width: 60 }
};
const INFINITE_SCROLL_CONFIG = {
  threshold: 200,
  batchSize: 30,
  maxItems: 500
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } };
}
var constants_default = { MODULE_ID, VERSION, MODULE_VERSION, STORAGE_KEYS, COLUMN_TYPES, INFINITE_SCROLL_CONFIG, info, healthCheck };
export {
  COLUMN_TYPES,
  INFINITE_SCROLL_CONFIG,
  MODULE_ID,
  MODULE_VERSION,
  STORAGE_KEYS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
