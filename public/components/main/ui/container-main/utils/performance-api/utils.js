const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.performance-api.utils";
function shouldSample(sampleRate) {
  return Math.random() < sampleRate;
}
function addToHistory(state, entry) {
  state.metrics.history.unshift(entry);
  if (state.metrics.history.length > state.maxHistorySize) {
    state.metrics.history.pop();
  }
}
function calculatePercentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(p / 100 * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
export {
  MODULE_ID,
  VERSION,
  addToHistory,
  calculatePercentile,
  shouldSample
};
