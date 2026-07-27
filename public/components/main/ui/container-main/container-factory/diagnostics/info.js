import { VERSION, MODULE_ID } from "../constants.js";
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modular: true,
    description: "Unified Container Factory - Single Source of Truth",
    methods: ["createContainer"],
    features: [
      "controls",
      "header",
      "errorBoundary",
      "eventHooks",
      "configPresets",
      "contextMenu",
      "keyboard",
      "drag",
      "resize",
      "breadcrumb",
      "splitView",
      "notificationBadge",
      "statePersistence",
      "toolbar",
      "searchBox",
      "progressBar",
      "toast",
      "snapDock",
      "zoomControls",
      "accessibility",
      "debugPanel"
    ]
  };
}
var info_default = { info };
export {
  info_default as default,
  info
};
