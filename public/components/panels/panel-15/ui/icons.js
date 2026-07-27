const MODULE_ID = "panel-15.ui.icons";
const VERSION = "9.3.0-P2-ENTERPRISE";
const ICONS = {
  add: "fa-plus",
  edit: "fa-pencil-alt",
  delete: "fa-trash-alt",
  save: "fa-save",
  cancel: "fa-ban",
  refresh: "fa-redo",
  search: "fa-search",
  filter: "fa-filter",
  export: "fa-file-export",
  import: "fa-file-import",
  settings: "fa-cog",
  info: "fa-info-circle"
};
function getIcon(name, fallback = "fa-circle") {
  return ICONS[name] || fallback;
}
function iconHTML(name, extraClass = "") {
  return `<i class="fas ${getIcon(name)} ${extraClass}"></i>`;
}
var icons_default = { ICONS, getIcon, iconHTML };
export {
  ICONS,
  MODULE_ID,
  VERSION,
  icons_default as default,
  getIcon,
  iconHTML
};
