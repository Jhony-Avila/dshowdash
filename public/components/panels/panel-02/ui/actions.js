function handleJobAction(action, job, handlers) {
  const { drawerComponent, toastManager, exportManager, logger } = handlers;
  const jobName = job.job_name || job.name || `Job ${job.id}`;
  switch (action) {
    case "view-details":
      drawerComponent?.open(job);
      break;
    case "view-logs":
      toastManager?.info(`Abrindo logs de ${jobName}...`);
      window.open(`/logs/jobs/${job.id}`, "_blank");
      break;
    case "run-job":
      toastManager?.info(`Executando ${jobName}...`);
      break;
    case "pause-job":
      toastManager?.warning(`Pausando ${jobName}...`);
      break;
    case "activate-job":
      toastManager?.success(`Ativando ${jobName}...`);
      break;
    case "copy-id":
      navigator.clipboard?.writeText(String(job.id));
      toastManager?.success(`ID ${job.id} copiado`);
      break;
    case "export-job":
      exportManager?.exportCSV([job], `job-${job.id}`);
      toastManager?.success(`Job exportado`);
      break;
  }
  logger?.info?.("job-action", { action, jobId: job.id });
}
function handleBulkAction(action, selectedJobs, allJobs, handlers) {
  const { toastManager, exportManager, logger } = handlers;
  const selectedIds = Array.from(selectedJobs);
  const jobs = allJobs.filter((j) => selectedIds.includes(String(j.id)));
  switch (action) {
    case "run":
      toastManager?.info(`Executando ${jobs.length} jobs...`);
      break;
    case "pause":
      toastManager?.warning(`Pausando ${jobs.length} jobs...`);
      break;
    case "export":
      exportManager?.exportCSV(jobs, "jobs-selecionados");
      toastManager?.success(`${jobs.length} jobs exportados`);
      break;
  }
  logger?.info?.("bulk-action", { action, count: jobs.length });
}
function handleInlineAction(action, job, handlers) {
  switch (action) {
    case "run":
      handleJobAction("run-job", job, handlers);
      break;
    case "pause":
      handleJobAction("pause-job", job, handlers);
      break;
    case "logs":
      handleJobAction("view-logs", job, handlers);
      break;
  }
}
var actions_default = { handleJobAction, handleBulkAction, handleInlineAction };
const MODULE_ID = "panel-02/ui/actions";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { actionsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  actions_default as default,
  handleBulkAction,
  handleInlineAction,
  handleJobAction,
  healthCheck,
  info
};
