import { STATUS_COLORS, SLA_THRESHOLDS } from "../../core/constants.js";
function formatNumber(n) {
  if (n == null) return "\u2014";
  return n.toLocaleString("pt-BR");
}
function truncate(str, max) {
  if (!str || str.length <= max) return str;
  return `${str.substring(0, max)}...`;
}
function getUptimeStatus(percent) {
  if (percent >= SLA_THRESHOLDS.EXCELLENT) return "excellent";
  if (percent >= SLA_THRESHOLDS.GOOD) return "good";
  if (percent >= SLA_THRESHOLDS.WARNING) return "warning";
  return "critical";
}
function getRateColor(rate) {
  if (rate >= SLA_THRESHOLDS.EXCELLENT) return STATUS_COLORS.excellent;
  if (rate >= SLA_THRESHOLDS.GOOD) return STATUS_COLORS.good;
  if (rate >= SLA_THRESHOLDS.WARNING) return STATUS_COLORS.warning;
  return STATUS_COLORS.critical;
}
function getStatusLabel(status) {
  const labels = { excellent: "Excelente", good: "Bom", warning: "Aten\xE7\xE3o", critical: "Cr\xEDtico" };
  return labels[status] || status;
}
function generateSparkline(rate) {
  const points = [];
  const height = 20, width = 60;
  const variance = Math.max(0, 100 - rate) / 10;
  for (let i = 0; i < 10; i++) {
    const y = height - (rate + (Math.random() - 0.5) * variance) / 100 * height;
    points.push(`${i * (width / 9)},${Math.max(2, Math.min(height - 2, y))}`);
  }
  const color = STATUS_COLORS[getUptimeStatus(rate)];
  return `<svg width="${width}" height="${height}" class="p13-spark-svg"><polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function applyFilters(jobs, filters, sortOptions) {
  let filtered = [...jobs];
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter((job) => job.job_name.toLowerCase().includes(search) || (job.job_type || "").toLowerCase().includes(search));
  }
  if (filters.status !== "all") {
    filtered = filtered.filter((job) => job.status === filters.status);
  }
  const sortConfig = sortOptions[filters.sort];
  if (sortConfig) {
    filtered.sort((a, b) => {
      const aVal = a[sortConfig.field];
      const bVal = b[sortConfig.field];
      if (typeof aVal === "string") return sortConfig.order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortConfig.order === "asc" ? aVal - bVal : bVal - aVal;
    });
  }
  return filtered;
}
var utils_default = { formatNumber, truncate, getUptimeStatus, getRateColor, getStatusLabel, generateSparkline, applyFilters };
const MODULE_ID = "panel-13.ui.utils";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { utilsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  applyFilters,
  utils_default as default,
  formatNumber,
  generateSparkline,
  getRateColor,
  getStatusLabel,
  getUptimeStatus,
  healthCheck,
  info,
  truncate
};
