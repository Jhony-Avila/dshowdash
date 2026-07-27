import { TABLE_EVENTS as CENTRAL_TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "1.1.0-P18EC";
const MODULE_ID = "table-engine.constants";
const DEFAULT_CSS_PREFIX = "tbl-";
const TABLE_EVENTS = CENTRAL_TABLE_EVENTS;
const SHORTCUTS = {
  SELECT_ALL: "ctrl+a",
  DESELECT: "escape",
  DELETE: "delete",
  COPY: "ctrl+c",
  SEARCH: "ctrl+f",
  EXPORT: "ctrl+e",
  REFRESH: "f5",
  HELP: "f1",
  UP: "arrowup",
  DOWN: "arrowdown",
  EXPAND: "enter",
  COLLAPSE: "escape"
};
const DEFAULTS = {
  pageSize: 25,
  pageSizes: [10, 25, 50, 100],
  density: "normal",
  densities: ["compact", "normal", "comfortable"],
  virtualScroll: true,
  virtualScrollBuffer: 10,
  resizable: true,
  reorderable: true,
  selectable: true,
  expandable: true,
  exportable: true,
  searchable: true,
  sortable: true
};
const COLUMN_TYPES = {
  TEXT: "text",
  NUMBER: "number",
  CURRENCY: "currency",
  DATE: "date",
  DATETIME: "datetime",
  BOOLEAN: "boolean",
  STATUS: "status",
  ACTIONS: "actions",
  CUSTOM: "custom"
};
var constants_default = { VERSION, MODULE_ID, DEFAULT_CSS_PREFIX, TABLE_EVENTS, SHORTCUTS, DEFAULTS, COLUMN_TYPES };
export {
  COLUMN_TYPES,
  DEFAULTS,
  DEFAULT_CSS_PREFIX,
  MODULE_ID,
  SHORTCUTS,
  TABLE_EVENTS,
  VERSION,
  constants_default as default
};
