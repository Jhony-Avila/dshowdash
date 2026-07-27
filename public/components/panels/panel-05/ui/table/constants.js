import { IconRegistry } from "/components/icon-registry/index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:table";
const ICON_MAP = {
  chevronDown: "ui:chevron-down",
  chevronUp: "ui:chevron-up",
  chevronLeft: "ui:chevron-left",
  chevronRight: "ui:chevron-right",
  x: "ui:x",
  star: "ui:star",
  eye: "ui:eye",
  columns: "table:columns",
  inbox: "business:mail",
  pin: "ui:bookmark",
  arrowLeftToLine: "table:page-first",
  arrowRightToLine: "table:page-last",
  alignJustify: "table:density-normal",
  menu: "ui:menu",
  minimize: "ui:minus",
  copy: "ui:copy",
  messageCircle: "business:message",
  dollarSign: "business:dollar",
  calendar: "business:calendar",
  gripVertical: "table:drag",
  loader: "system:loader",
  search: "ui:search",
  download: "ui:download",
  trash: "ui:trash",
  fileText: "business:file-text",
  check: "ui:check",
  checkSquare: "ui:check-square",
  edit: "ui:edit",
  externalLink: "ui:external-link",
  moreVertical: "ui:more-vertical",
  keyboard: "system:help"
};
const ICONS = new Proxy({}, {
  get(target, prop) {
    const mapped = typeof prop === "string" ? ICON_MAP[prop] : void 0;
    return mapped ? IconRegistry.get(mapped) || "" : "";
  },
  has(target, prop) {
    return prop in ICON_MAP;
  },
  ownKeys() {
    return Object.keys(ICON_MAP);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (prop in ICON_MAP) {
      return { enumerable: true, configurable: true, value: this.get(target, prop) };
    }
    return void 0;
  }
});
const SHORTCUTS = {
  "j": { action: "next-row", desc: "Pr\xF3xima linha" },
  "k": { action: "prev-row", desc: "Linha anterior" },
  "e": { action: "expand-row", desc: "Expandir/Colapsar" },
  "v": { action: "view-row", desc: "Ver detalhes" },
  "f": { action: "toggle-fav", desc: "Favoritar" },
  "d": { action: "delete-row", desc: "Excluir" },
  "x": { action: "toggle-select", desc: "Selecionar" },
  "Escape": { action: "clear", desc: "Limpar sele\xE7\xE3o" },
  "?": { action: "show-help", desc: "Mostrar atalhos" }
};
const TABLE_COLUMNS = [
  { id: "expand", label: "", width: 32, resizable: false, hideable: false, type: "expand", pinnable: false, reorderable: false, searchable: false },
  { id: "checkbox", label: "", width: 40, resizable: false, hideable: false, type: "checkbox", pinnable: false, reorderable: false, searchable: false },
  { id: "fav", label: "", width: 40, resizable: false, hideable: false, type: "action", pinnable: false, reorderable: false, searchable: false },
  { id: "nome", label: "Cliente", width: 220, resizable: true, hideable: false, sortable: true, type: "text", pinnable: true, reorderable: true, searchable: true, exportKey: "nome" },
  { id: "cidade", label: "Cidade/UF", width: 140, resizable: true, hideable: true, sortable: true, type: "text", pinnable: true, reorderable: true, searchable: true, exportKey: "cidade" },
  { id: "receita", label: "Receita", width: 120, resizable: true, hideable: true, sortable: true, type: "currency", pinnable: true, reorderable: true, searchable: false, exportKey: "receita" },
  { id: "status", label: "Status", width: 100, resizable: true, hideable: true, sortable: true, type: "badge", pinnable: true, reorderable: true, searchable: true, exportKey: "status" },
  { id: "actions", label: "A\xE7\xF5es", width: 60, resizable: false, hideable: false, type: "action", pinnable: true, reorderable: false, searchable: false }
];
const DENSITY_MODES = ["compact", "comfortable", "expanded"];
const DEFAULT_COLUMN_ORDER = TABLE_COLUMNS.map((c) => c.id);
const SCROLL_MODES = ["pagination", "virtual", "infinite"];
const ROW_HEIGHTS = { compact: 36, comfortable: 48, expanded: 64 };
const VIRTUAL_BUFFER = 5;
const INFINITE_THRESHOLD = 200;
const SEARCH_DEBOUNCE = 250;
const DEFAULT_PER_PAGE = 25;
const DEFAULT_INFINITE_CHUNK = 50;
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    iconCount: Object.keys(ICON_MAP).length,
    source: "IconRegistry"
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: { constantsLoaded: true, iconsMapped: Object.keys(ICON_MAP).length }
  };
}
export {
  DEFAULT_COLUMN_ORDER,
  DEFAULT_INFINITE_CHUNK,
  DEFAULT_PER_PAGE,
  DENSITY_MODES,
  ICONS,
  INFINITE_THRESHOLD,
  MODULE_ID,
  ROW_HEIGHTS,
  SCROLL_MODES,
  SEARCH_DEBOUNCE,
  SHORTCUTS,
  TABLE_COLUMNS,
  VERSION,
  VIRTUAL_BUFFER,
  healthCheck,
  info
};
