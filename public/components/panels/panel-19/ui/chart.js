const MODULE_ID = "panel-19.ui.chart";
const VERSION = "9.3.0-P2-ENTERPRISE";
function initChart(container, options = {}) {
  const { type = "line", data = [], labels = [] } = options;
  const chartConfig = {
    type,
    data: { labels, datasets: [{ data }] },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  };
  if (window.Chart && container) {
    return new window.Chart(container, chartConfig);
  }
  return null;
}
function updateChart(chart, data, labels) {
  if (!chart) return;
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}
function destroyChart(chart) {
  if (chart?.destroy) chart.destroy();
}
var chart_default = { initChart, updateChart, destroyChart };
export {
  MODULE_ID,
  VERSION,
  chart_default as default,
  destroyChart,
  initChart,
  updateChart
};
