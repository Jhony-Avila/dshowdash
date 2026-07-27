const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-17:ui:actions";
function exportActivity(recentActivity, toastManager) {
  if (!recentActivity.length) {
    toastManager?.warning("Nenhum dado para exportar");
    return;
  }
  const headers = ["Job", "Status", "Execu\xE7\xE3o", "Dura\xE7\xE3o (s)"];
  const rows = recentActivity.map((item) => [item.job_name, item.status, item.execution_start, item.execution_time_seconds]);
  downloadCSV(headers, rows, "atividade-recente");
  toastManager?.success(`${recentActivity.length} registros exportados`);
}
function exportTopJobs(topJobs, toastManager) {
  if (!topJobs.length) {
    toastManager?.warning("Nenhum dado para exportar");
    return;
  }
  const headers = ["Job", "Execu\xE7\xF5es", "Taxa de Sucesso (%)", "Tempo M\xE9dio (s)"];
  const rows = topJobs.map((job) => [job.job_name, job.total_executions, job.success_rate, job.avg_execution_time]);
  downloadCSV(headers, rows, "top-jobs");
  toastManager?.success(`${topJobs.length} registros exportados`);
}
function downloadCSV(headers, rows, filename) {
  const csvContent = [headers.join(";")].concat(rows.map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))).join("\n");
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
function showJobDetails(jobName, topJobs, recentActivity, drawerComponent) {
  const job = topJobs.find((j) => j.job_name === jobName) || recentActivity.find((a) => a.job_name === jobName);
  if (job && drawerComponent) drawerComponent.open({ ...job, id: jobName, name: jobName });
}
function handleAction(action, item, logger, toastManager) {
  logger?.debug?.("action", { action, item });
  toastManager?.info?.(`A\xE7\xE3o: ${action}`);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var actions_default = { exportActivity, exportTopJobs, downloadCSV, showJobDetails, handleAction };
export {
  MODULE_ID,
  VERSION,
  actions_default as default,
  downloadCSV,
  exportActivity,
  exportTopJobs,
  handleAction,
  info,
  showJobDetails
};
