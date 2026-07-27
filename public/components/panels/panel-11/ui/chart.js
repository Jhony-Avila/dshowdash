const MODULE_ID = "panel-11.ui.chart";
const VERSION = "9.3.0-P2-ENTERPRISE";
function createChart(container, { type = "bar", data = [], labels = [], options = {} }) {
  if (!window.Chart || !container) return null;
  const config = {
    type,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: options.colors || ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e"],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...options
    }
  };
  return new window.Chart(container, config);
}
function updateChartData(chart, data, labels) {
  if (!chart) return;
  if (labels) chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}
function destroyChart(chart) {
  chart?.destroy?.();
}
var chart_default = { createChart, updateChartData, destroyChart };
export {
  MODULE_ID,
  VERSION,
  createChart,
  chart_default as default,
  destroyChart,
  updateChartData
};
