const MODULE_ID = "panel-permissions-admin.config.trigger-icons";
const VERSION = "9.3.0-P2-ENTERPRISE";
const TRIGGER_ICONS = {
  create: "fa-plus-circle",
  read: "fa-eye",
  update: "fa-edit",
  delete: "fa-trash-alt",
  execute: "fa-play-circle",
  admin: "fa-user-shield",
  export: "fa-file-export",
  import: "fa-file-import",
  approve: "fa-check-circle",
  reject: "fa-times-circle",
  assign: "fa-user-plus",
  revoke: "fa-user-minus"
};
function getTriggerIcon(trigger) {
  return TRIGGER_ICONS[trigger] || "fa-key";
}
function renderTriggerIcon(trigger, className = "") {
  return `<i class="fas ${getTriggerIcon(trigger)} ${className}"></i>`;
}
var trigger_icons_default = { TRIGGER_ICONS, getTriggerIcon, renderTriggerIcon };
export {
  MODULE_ID,
  TRIGGER_ICONS,
  VERSION,
  trigger_icons_default as default,
  getTriggerIcon,
  renderTriggerIcon
};
