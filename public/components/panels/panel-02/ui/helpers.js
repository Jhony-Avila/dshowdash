import { escapeHtml as _escapeHtml } from "../utils/formatters.js";
const escapeHtml = _escapeHtml;
const MODULE_ID = "panel-02/ui/helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } };
}
var helpers_default = { escapeHtml };
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  escapeHtml,
  healthCheck,
  info
};
