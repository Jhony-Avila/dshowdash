// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15:ui:actions
// PURPOSE: Panel-15 - Actions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   exportActivity() — exported function
//   exportTopJobs() — exported function
//   downloadCSV() — exported function
//   showJobDetails() — exported function
//   handleAction() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-15:ui:actions';

type ToastMgr = { warning?: (msg: string) => void; success?: (msg: string) => void; info?: (msg: string) => void };
type DrawerComp = { open?: (data: Record<string, unknown>) => void };
type Logger = { debug?: (...args: unknown[]) => void };

export function exportActivity(recentActivity: Record<string, unknown>[], toastManager: ToastMgr) {
  if (!recentActivity.length) {
    toastManager?.warning?.('Nenhum dado para exportar');
    return;
  }

  const headers = ['Job', 'Status', 'Execução', 'Duração (s)'];
  const rows = recentActivity.map((item: Record<string, unknown>) => [item.job_name, item.status, item.execution_start, item.execution_time_seconds]);

  downloadCSV(headers, rows, 'atividade-recente');
  toastManager?.success?.(`${recentActivity.length} registros exportados`);
}

export function exportTopJobs(topJobs: Record<string, unknown>[], toastManager: ToastMgr) {
  if (!topJobs.length) {
    toastManager?.warning?.('Nenhum dado para exportar');
    return;
  }

  const headers = ['Job', 'Execuções', 'Taxa de Sucesso (%)', 'Tempo Médio (s)'];
  const rows = topJobs.map((job: Record<string, unknown>) => [job.job_name, job.total_executions, job.success_rate, job.avg_execution_time]);

  downloadCSV(headers, rows, 'top-jobs');
  toastManager?.success?.(`${topJobs.length} registros exportados`);
}

export function downloadCSV(headers: string[], rows: unknown[][], filename: string) {
  const csvContent = [
    headers.join(';'),
    ...rows.map((row: unknown[]) => row.map((v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');
  
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function showJobDetails(jobName: string, topJobs: Record<string, unknown>[], recentActivity: Record<string, unknown>[], drawerComponent: DrawerComp) {
  const job = topJobs.find((j: Record<string, unknown>) => j.job_name === jobName) ||
            recentActivity.find((a: Record<string, unknown>) => a.job_name === jobName);

  if (job && drawerComponent) {
    drawerComponent.open?.({ ...job, id: jobName, name: jobName });
  }
}

export function handleAction(action: string, item: unknown, logger: Logger, toastManager: ToastMgr) {
  logger?.debug?.('action', { action, item });
  toastManager?.info?.(`Ação: ${action}`);
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { exportActivity, exportTopJobs, downloadCSV, showJobDetails, handleAction };
