const VERSION = "8.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-11.utils.formatters";
function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins2 = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins2}m ${secs}s` : `${mins2}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round(seconds % 3600 / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
function parseApiData(data) {
  if (!data) return { averageTime: null };
  const _d = data;
  const apiData = _d.data || _d;
  const value = apiData.value !== void 0 ? parseFloat(apiData.value) : 0;
  return { averageTime: value };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["formatDuration", "parseApiData"], timestamp: Date.now() };
}
var formatters_default = { formatDuration, parseApiData };
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  formatDuration,
  healthCheck,
  info,
  parseApiData
};
