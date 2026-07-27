import { renderStructure } from "./structure.js";
import { renderSuccessRate, renderMiniDonut, renderSparkline, renderSummaryCards } from "./summary.js";
import { renderLineChart, renderBarChart } from "./charts.js";
import { renderComparison } from "./comparison.js";
import { renderStatusDistribution, renderAlerts } from "./distribution.js";
var render_default = {
  renderStructure: () => import("./structure.js").then((m) => m.renderStructure),
  renderSuccessRate: () => import("./summary.js").then((m) => m.renderSuccessRate),
  renderMiniDonut: () => import("./summary.js").then((m) => m.renderMiniDonut),
  renderSparkline: () => import("./summary.js").then((m) => m.renderSparkline),
  renderSummaryCards: () => import("./summary.js").then((m) => m.renderSummaryCards),
  renderLineChart: () => import("./charts.js").then((m) => m.renderLineChart),
  renderBarChart: () => import("./charts.js").then((m) => m.renderBarChart),
  renderComparison: () => import("./comparison.js").then((m) => m.renderComparison),
  renderStatusDistribution: () => import("./distribution.js").then((m) => m.renderStatusDistribution),
  renderAlerts: () => import("./distribution.js").then((m) => m.renderAlerts)
};
const MODULE_ID = "panel-09.ui.render";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { indexReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  render_default as default,
  healthCheck,
  info,
  renderAlerts,
  renderBarChart,
  renderComparison,
  renderLineChart,
  renderMiniDonut,
  renderSparkline,
  renderStatusDistribution,
  renderStructure,
  renderSuccessRate,
  renderSummaryCards
};
