import { ICONS } from "../../core/constants.js";
import { formatNumber } from "../helpers.js";
function renderFooter(data, filters) {
  const dataNode = data.data || {};
  const exec = dataNode.executions || {};
  const jobs = dataNode.jobs || {};
  return `
    <footer class="p11-footer">
      <div class="p11-footer-left">
        <span class="p11-footer-stat">${ICONS.bolt} Total: <strong>${formatNumber(exec.total || 0)}</strong></span>
        <span class="p11-footer-stat">${ICONS.check} Sucesso: <strong>${formatNumber(exec.success || 0)}</strong></span>
        <span class="p11-footer-stat">${ICONS.server} Jobs: <strong>${jobs.total || 0}</strong></span>
      </div>
      <div class="p11-footer-right">
        <span class="p11-footer-info">Per\xEDodo: ${filters.period} | Auto-refresh: 60s</span>
      </div>
    </footer>
  `;
}
var footer_default = { renderFooter };
const MODULE_ID = "panels-ui-render-footer";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { footerReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  footer_default as default,
  healthCheck,
  info,
  renderFooter
};
