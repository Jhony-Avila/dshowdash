// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/table/render/row
// PURPOSE: Panel-02 Table Render Row
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   GROUP_LABELS from ../constants.js
//   escapeHtml, formatNumber, formatDateTime, formatDuration from ../helpers.js
//   getTypeIcon, getTypeClass, getStatusFromHealth, getRateClass, getRowClass, in...
//
// PROVIDES:
//   createJobRow() — exported function
//   renderRows() — exported function
//   renderGroupedRows() — exported function
//   renderEmpty() — exported function
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
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { GROUP_LABELS } from '../constants.js';
import { escapeHtml, formatNumber, formatDateTime, formatDuration } from '../helpers.js';
import { getTypeIcon, getTypeClass, getStatusFromHealth, getRateClass, getRowClass, inferHealthStatus } from '../formatters.js';

export function createJobRow(job: Record<string, unknown>, index: number, columns: Record<string, unknown>[], expandedRows: Set<string>, groupKey: string | null = null, isHidden = false) {
  const jobId = job.id || '';
  const jobName = escapeHtml(job.job_name || job.name || 'N/A');
  const jobType = String(job.job_type || job.type || 'api').toUpperCase();
  const healthStatus = String(job.health_status || inferHealthStatus(job));

  const lastExec = formatDateTime(String(job.last_execution || job.last_success || ''));
  const totalExec = parseInt(String(job.total_executions || job.executions || 0));
  const successRate = parseFloat(String(job.success_rate || job.avg_success_rate || 0));
  const avgTime = formatDuration(String(job.avg_execution_time || job.avg_time || ''));
  const errors = parseInt(String(job.error_count || job.errors || 0));

  const typeClass = getTypeClass(jobType);
  const typeIcon = getTypeIcon(jobType);
  const statusData = getStatusFromHealth(healthStatus, job.is_running == 1);
  const rateClass = getRateClass(successRate, job.sla as Record<string, Record<string, number>> | null | undefined);
  const errorClass = errors > 0 ? 'has-errors' : 'no-errors';
  const rowClass = getRowClass(healthStatus);
  const isExpanded = expandedRows.has(String(jobId));
  const groupAttr = groupKey ? `data-group="${groupKey}"` : '';
  const hiddenClass = isHidden ? 'p02-group-row hidden' : 'p02-group-row';

  const visibleCols = columns.filter((c: Record<string, unknown>) => c.visible);
  const colCount = visibleCols.length;

  const cells = visibleCols.map((col: Record<string, unknown>) => {
    switch(col.id) {
      case 'select': return `<td class="p02-checkbox-col" role="cell"><input type="checkbox" class="p02-row-checkbox" data-job-id="${jobId}" aria-label="Selecionar job ${jobName}"></td>`;
      case 'expand': return `<td class="p02-expand-col" role="cell"><button class="p02-expand-btn ${isExpanded ? 'expanded' : ''}" aria-expanded="${isExpanded}" aria-label="Expandir detalhes" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button></td>`;
      case 'job_name': return `<td class="p02-job-name" title="${jobName}" role="cell">${jobName}</td>`;
      case 'job_type': return `<td role="cell"><span class="p02-job-type ${typeClass}">${typeIcon}${jobType}</span></td>`;
      case 'health_status': return `<td class="center" role="cell"><span class="p02-status-indicator ${statusData.className}"><span class="p02-status-dot" aria-hidden="true"></span>${statusData.text}</span></td>`;
      case 'last_execution': return `<td class="p02-datetime" role="cell">${lastExec}</td>`;
      case 'total_executions': return `<td class="p02-executions right" role="cell">${formatNumber(totalExec)}</td>`;
      case 'success_rate': return `<td class="center" role="cell"><span class="p02-success-rate ${rateClass}">${successRate.toFixed(1)}%</span></td>`;
      case 'avg_execution_time': return `<td class="p02-avg-time right" role="cell">${avgTime}</td>`;
      case 'error_count': return `<td class="p02-errors ${errorClass} right" role="cell">${errors}</td>`;
      case 'actions': return `<td class="p02-actions-col" role="cell"><div class="p02-inline-actions">
        <button class="p02-inline-btn play" data-action="run" data-job-id="${jobId}" title="Executar" aria-label="Executar job" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
        <button class="p02-inline-btn pause" data-action="pause" data-job-id="${jobId}" title="Pausar" aria-label="Pausar job" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></button>
        <button class="p02-inline-btn logs" data-action="logs" data-job-id="${jobId}" title="Ver Logs" aria-label="Ver logs" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></button>
      </div></td>`;
      default: return `<td role="cell">--</td>`;
    }
  }).join('');

  const expandedContent = `<tr class="p02-expanded-row ${isExpanded ? 'open' : ''}" aria-hidden="${!isExpanded}"><td colspan="${colCount}">
    <div class="p02-expanded-content"><div class="p02-expanded-grid">
      <div class="p02-expanded-item"><span class="p02-expanded-label">ID</span><span class="p02-expanded-value">${jobId}</span></div>
      <div class="p02-expanded-item"><span class="p02-expanded-label">Tipo</span><span class="p02-expanded-value">${jobType}</span></div>
      <div class="p02-expanded-item"><span class="p02-expanded-label">Status</span><span class="p02-expanded-value">${statusData.text}</span></div>
      <div class="p02-expanded-item"><span class="p02-expanded-label">Ultima Execucao</span><span class="p02-expanded-value">${lastExec}</span></div>
      <div class="p02-expanded-item"><span class="p02-expanded-label">Total Execucoes</span><span class="p02-expanded-value">${formatNumber(totalExec)}</span></div>
      <div class="p02-expanded-item"><span class="p02-expanded-label">Taxa Sucesso</span><span class="p02-expanded-value">${successRate.toFixed(1)}%</span></div>
      <div class="p02-expanded-item"><span class="p02-expanded-label">Tempo Medio</span><span class="p02-expanded-value">${avgTime}</span></div>
      <div class="p02-expanded-item"><span class="p02-expanded-label">Erros</span><span class="p02-expanded-value">${errors}</span></div>
    </div></div>
  </td></tr>`;

  return `<tr class="${rowClass} ${hiddenClass}" data-job-id="${jobId}" data-health="${healthStatus}" ${groupAttr} tabindex="0" role="row" aria-rowindex="${index + 1}">${cells}</tr>${expandedContent}`;
}

export function renderRows(jobs: Record<string, unknown>[], columns: Record<string, unknown>[], expandedRows: Set<string>) {
  return jobs.map((job: Record<string, unknown>, idx: number) => createJobRow(job, idx, columns, expandedRows)).join('');
}

export function renderGroupedRows(jobs: Record<string, unknown>[], columns: Record<string, unknown>[], expandedRows: Set<string>, collapsedGroups: Set<string>, groupBy: string) {
  const groups = new Map<string, Record<string, unknown>[]>();
  jobs.forEach((job: Record<string, unknown>) => {
    const key = String(groupBy === 'job_type' ? (job.job_type || job.type || 'other') : (job.health_status || 'inactive'));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(job);
  });
  
  let html = '';
  const colCount = columns.filter((c: Record<string, unknown>) => c.visible).length;
  
  groups.forEach((groupJobs, key) => {
    const isCollapsed = collapsedGroups.has(key);
    const attrType = groupBy === 'job_type' ? 'data-group-type' : 'data-group-status';
    const label = (GROUP_LABELS as Record<string, string>)[key] || key;
    
    html += `<tr class="p02-group-header" ${attrType}="${key}" role="row"><td colspan="${colCount}" role="cell">
      <button class="p02-group-toggle ${isCollapsed ? 'collapsed' : ''}" data-group="${key}" aria-expanded="${!isCollapsed}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        ${label}
        <span class="p02-group-badge">${groupJobs.length}</span>
      </button>
    </td></tr>`;
    
    groupJobs.forEach((job: Record<string, unknown>, idx: number) => {
      html += createJobRow(job, idx, columns, expandedRows, key, isCollapsed);
    });
  });
  
  return html;
}

export function renderEmpty(colCount: number) {
  return `<tr><td colspan="${colCount}" class="p02-empty" role="cell">Nenhum job encontrado</td></tr>`;
}

export default { createJobRow, renderRows, renderGroupedRows, renderEmpty };

export const MODULE_ID = 'panel-02/ui/table/render/row';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { rowReady: true } }; }
