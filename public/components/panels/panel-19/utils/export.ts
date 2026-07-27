// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-19/utils/export
// PURPOSE: Panel-19 - Export Manager Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
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
export const MODULE_ID = 'panel-19/utils/export';

export class ExportManager {
  [key: string]: any;
  constructor(logger: Record<string, unknown>) {
    this.logger = logger;
  }

  exportCSV(jobs: Record<string, unknown>[], filename: string) {
    if (filename === undefined) filename = 'jobs-export';
    if (!jobs || !jobs.length) {
      if (this.logger && this.logger.warn) this.logger.warn('export.empty-data');
      return { success: false, error: 'NO_DATA' };
    }

    try {
      const headers = ['ID', 'Nome', 'Tipo', 'Status', 'Última Execução', 'Execuções', 'Taxa Sucesso', 'Tempo Médio', 'Erros', 'Ativo'];
      const self = this;
      const rows = jobs.map((job: Record<string, unknown>) => [
        job.id || '',
        self.escapeCSV(String(job.job_name || job.name || '')),
        job.job_type || job.type || '',
        job.health_status || 'inactive',
        job.last_execution || '',
        job.total_executions || 0,
        self.formatPercent(job.success_rate as number | string | null | undefined),
        self.formatDuration(job.avg_execution_time as number | string),
        job.error_count || 0,
        job.is_active == 1 ? 'Sim' : 'Não'
      ]);

      const csvContent = [headers.join(';')].concat(rows.map((r: unknown[]) => r.join(';'))).join('\n');
      const result = this.downloadFile(csvContent, filename, 'csv', 'text/csv;charset=utf-8;');

      if (result.success && this.logger && this.logger.info) {
        this.logger.info('export.success', { rows: jobs.length, filename: result.filename, size: csvContent.length });
      }
      return result;
    } catch (error: any) {
      if (this.logger && this.logger.error) this.logger.error('export.failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  exportJSON(jobs: Record<string, unknown>[], filename: string) {
    if (filename === undefined) filename = 'jobs-export';
    if (!jobs || !jobs.length) {
      if (this.logger && this.logger.warn) this.logger.warn('export.empty-data');
      return { success: false, error: 'NO_DATA' };
    }

    try {
      const data = {
        exportedAt: new Date().toISOString(),
        totalJobs: jobs.length,
        jobs: jobs.map((job: Record<string, unknown>) => ({
          id: job.id,
          name: job.job_name || job.name,
          type: job.job_type || job.type,
          status: job.health_status,
          lastExecution: job.last_execution,
          totalExecutions: job.total_executions,
          successRate: job.success_rate,
          avgExecutionTime: job.avg_execution_time,
          errorCount: job.error_count,
          isActive: job.is_active == 1
        }))
      };

      const content = JSON.stringify(data, null, 2);
      const result = this.downloadFile(content, filename, 'json', 'application/json');

      if (result.success && this.logger && this.logger.info) {
        this.logger.info('export.json.success', { rows: jobs.length });
      }
      return result;
    } catch (error: any) {
      if (this.logger && this.logger.error) this.logger.error('export.json.failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  downloadFile(content: string, filename: string, extension: string, mimeType: string) {
    try {
      const BOM = extension === 'csv' ? '\uFEFF' : '';
      const blob = new Blob([BOM + content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const fullFilename = `${filename}-${this.getDateString()}.${extension}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = fullFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
      return { success: true, filename: fullFilename, size: content.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  escapeCSV(text: string | null | undefined) {
    if (!text) return '';
    const str = String(text);
    if (str.indexOf(';') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  formatDuration(seconds: number | string) {
    if (!seconds) return '--';
    const num = parseFloat(String(seconds));
    if (isNaN(num)) return '--';
    if (num < 1) return `${(num * 1000).toFixed(0)}ms`;
    if (num < 60) return `${num.toFixed(1)}s`;
    return `${Math.floor(num / 60)}m ${Math.round(num % 60)}s`;
  }

  formatPercent(value: number | string | null | undefined) {
    if (value === null || value === undefined) return '--';
    const num = parseFloat(String(value));
    if (isNaN(num)) return '--';
    return `${num.toFixed(1)}%`;
  }

  getDateString() {
    return new Date().toISOString().slice(0, 10);
  }

  info() {
    return { supportedFormats: ['csv', 'json'], moduleId: MODULE_ID, version: VERSION };
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { exportReady: true } }; }

export default ExportManager;
