// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/actions
// PURPOSE: Panel-02 UI Actions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   handleJobAction() — exported function
//   handleBulkAction() — exported function
//   handleInlineAction() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.open
// ═══════════════════════════════════════════════════════════════
'use strict';

interface DrawerHandler { open(job: Record<string, unknown>): void; }
interface ToastHandler { info(msg: string): void; warning(msg: string): void; success(msg: string): void; error?(msg: string): void; }
interface ExportHandler { exportCSV(data: Record<string, unknown>[], filename: string): void; }
interface LoggerHandler { info(...args: unknown[]): void; debug?(...args: unknown[]): void; }

interface ActionHandlers {
  drawerComponent?: DrawerHandler;
  toastManager?: ToastHandler;
  exportManager?: ExportHandler;
  logger?: LoggerHandler;
  [key: string]: unknown;
}

export function handleJobAction(action: string, job: Record<string, unknown>, handlers: ActionHandlers) {
  const { drawerComponent, toastManager, exportManager, logger } = handlers;
  const jobName = job.job_name || job.name || `Job ${job.id}`;
  
  switch (action) {
    case 'view-details':
      drawerComponent?.open(job);
      break;
    case 'view-logs':
      toastManager?.info(`Abrindo logs de ${jobName}...`);
      window.open(`/logs/jobs/${job.id}`, '_blank');
      break;
    case 'run-job':
      toastManager?.info(`Executando ${jobName}...`);
      break;
    case 'pause-job':
      toastManager?.warning(`Pausando ${jobName}...`);
      break;
    case 'activate-job':
      toastManager?.success(`Ativando ${jobName}...`);
      break;
    case 'copy-id':
      navigator.clipboard?.writeText(String(job.id));
      toastManager?.success(`ID ${job.id} copiado`);
      break;
    case 'export-job':
      exportManager?.exportCSV([job], `job-${job.id}`);
      toastManager?.success(`Job exportado`);
      break;
  }

  logger?.info?.('job-action', { action, jobId: job.id });
}

export function handleBulkAction(action: string, selectedJobs: Set<string>, allJobs: Record<string, unknown>[], handlers: ActionHandlers) {
  const { toastManager, exportManager, logger } = handlers;
  const selectedIds = Array.from(selectedJobs);
  const jobs = allJobs.filter((j: Record<string, unknown>) => selectedIds.includes(String(j.id)));

  switch (action) {
    case 'run':
      toastManager?.info(`Executando ${jobs.length} jobs...`);
      break;
    case 'pause':
      toastManager?.warning(`Pausando ${jobs.length} jobs...`);
      break;
    case 'export':
      exportManager?.exportCSV(jobs, 'jobs-selecionados');
      toastManager?.success(`${jobs.length} jobs exportados`);
      break;
  }

  logger?.info?.('bulk-action', { action, count: jobs.length });
}

export function handleInlineAction(action: string, job: Record<string, unknown>, handlers: ActionHandlers) {
  switch (action) {
    case 'run':
      handleJobAction('run-job', job, handlers);
      break;
    case 'pause':
      handleJobAction('pause-job', job, handlers);
      break;
    case 'logs':
      handleJobAction('view-logs', job, handlers);
      break;
  }
}

export default { handleJobAction, handleBulkAction, handleInlineAction };

export const MODULE_ID = 'panel-02/ui/actions';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { actionsReady: true } }; }
