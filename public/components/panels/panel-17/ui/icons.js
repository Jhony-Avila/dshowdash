const MODULE_ID = "panel-17.ui.icons";
const VERSION = "9.3.0-P2-ENTERPRISE";
const ICONS = {
  add: "fa-plus",
  edit: "fa-edit",
  delete: "fa-trash",
  save: "fa-save",
  cancel: "fa-times",
  refresh: "fa-sync-alt",
  search: "fa-search",
  filter: "fa-filter",
  export: "fa-download",
  import: "fa-upload",
  expand: "fa-chevron-down",
  collapse: "fa-chevron-up",
  settings: "fa-cog",
  info: "fa-info-circle",
  warning: "fa-exclamation-triangle",
  error: "fa-times-circle",
  success: "fa-check-circle"
};
function getIcon(name) {
  return ICONS[name] || "fa-circle";
}
function renderIcon(name, className = "") {
  return `<i class="fas ${getIcon(name)} ${className}"></i>`;
}
var icons_default = { ICONS, getIcon, renderIcon };
export {
  ICONS,
  MODULE_ID,
  VERSION,
  icons_default as default,
  getIcon,
  renderIcon
};
