import {
  escapeHtml,
  formatNumber,
  formatDateTime,
  formatDuration
} from "../../utils/formatters.js";
const MODULE_ID = "panel-02/ui/table/helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } };
}
import Formatters from "../../utils/formatters.js";
var helpers_default = {
  escapeHtml: Formatters.escapeHtml,
  formatNumber: Formatters.formatNumber,
  formatDateTime: Formatters.formatDateTime,
  formatDuration: Formatters.formatDuration
};
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  escapeHtml,
  formatDateTime,
  formatDuration,
  formatNumber,
  healthCheck,
  info
};
