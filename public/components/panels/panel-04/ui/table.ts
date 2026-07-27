// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04-ui-table
// PURPOSE: Panel-04 UI - Table Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getAlertConfig, truncateText, formatDate, isRecent, escapeHtml from ./helpers.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   renderTable() — exported function
//   showLoading() — exported function
//   showError() — exported function
//   clearTable() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';


// @ts-expect-error TS migration - TS2614, TS2724
import { getAlertConfig, truncateText, formatDate, isRecent, escapeHtml } from './helpers.js';

export const MODULE_ID = 'panel-04-ui-table';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const EXPAND_SVGS = {
  up: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:4px;"><polyline points="18 15 12 9 6 15"/></svg>',
  down: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:4px;"><polyline points="6 9 12 15 18 9"/></svg>'
};

const EMPTY_SVG = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg>';
const ERROR_SVG = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';

export function renderTable(container: HTMLElement, data: Record<string, unknown>[], options: { expandedRows?: Set<number>; currentPage?: number; pageSize?: number; onRowClick?: (id: number) => void } = {}) {
  if (!container) return;
  const expandedRows = (options && options.expandedRows) || new Set<number>();
  const currentPage = (options && options.currentPage) || 1;
  const pageSize = (options && options.pageSize) || 30;
  const onRowClick = options && options.onRowClick;
  const tbody = container.querySelector('[data-tbody]');
  const countEl = container.querySelector('[data-count]');
  if (!tbody) return;

  const totalCount = (data && data.length) || 0;
  const startIdx = (currentPage - 1) * pageSize;
  const pageData = (data || []).slice(startIdx, startIdx + pageSize);

  if (countEl) { countEl.textContent = `${totalCount} registro${totalCount !== 1 ? 's' : ''}`; }

  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:40px;text-align:center;color:#606070;"><div style="display:flex;flex-direction:column;align-items:center;gap:8px;">${EMPTY_SVG}<span>Nenhum incidente encontrado</span></div></td></tr>`;
    return;
  }

  const rows = pageData.map((d: Record<string, unknown>) => {
    const alertConfig = getAlertConfig(d.type as string);
    const isExpanded = expandedRows.has(d.id as number);
    const message = (d.message as string) || '';
    const msgDisplay = isExpanded ? escapeHtml(message) : escapeHtml(truncateText(message, 50));
    const date = formatDate(d.created_at as string | Date | number);
    const recent = isRecent(d.created_at as string, 5);
    const jobName = escapeHtml((d.job_name as string) || '--');
    const expandIcon = message.length > 50 ? `<span style="font-size:10px;color:#6366f1;">${isExpanded ? EXPAND_SVGS.up : EXPAND_SVGS.down}</span>` : '';

    return `<tr data-row="${d.id}" class="p04-table-row ${recent ? 'p04-row-recent' : ''}" style="border-bottom:1px solid #2a2a3a;cursor:pointer;transition:background 0.15s ease;${recent ? 'background:rgba(99,102,241,0.05);' : ''}"><td style="padding:10px 14px;"><span class="p04-severity-badge" style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:${alertConfig.bg};color:${alertConfig.color};border-radius:4px;font-size:10px;font-weight:500;"><span>${alertConfig.icon}</span><span>${alertConfig.label}</span></span></td><td style="padding:10px 14px;"><span style="font-size:11px;color:#f0f0f5;font-family:'JetBrains Mono',monospace;">${jobName}</span></td><td style="padding:10px 14px;"><span style="font-size:11px;color:#a0a0b0;line-height:1.4;${isExpanded ? '' : 'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;'}" title="${escapeHtml(message)}">${msgDisplay}</span>${expandIcon}</td><td style="padding:10px 14px;white-space:nowrap;"><span style="font-size:10px;color:#606070;display:flex;align-items:center;gap:4px;">${recent ? '<span style="width:6px;height:6px;background:#6366f1;border-radius:50%;animation:p04-pulse 1s infinite;"></span>' : ''}${date}</span></td></tr>`;
  }).join('');

  tbody.innerHTML = rows;

  if (onRowClick) {
    tbody.querySelectorAll('[data-row]').forEach((el: Element) => {
      const row = el as HTMLElement;
      row.addEventListener('click', () => { const id = parseInt((row as HTMLElement & { dataset: DOMStringMap }).dataset.row ?? ''); if (!isNaN(id)) onRowClick!(id); });
      row.addEventListener('mouseenter', () => { row.style.background = '#1a1a24'; });
      row.addEventListener('mouseleave', () => { const recent = row.classList.contains('p04-row-recent'); row.style.background = recent ? 'rgba(99,102,241,0.05)' : 'transparent'; });
    });
  }
}

export function showLoading(container: HTMLElement) {
  if (!container) return;
  const tbody = container.querySelector('[data-tbody]');
  if (!tbody) return;
  let skeletonRows = '';
  for (let i = 0; i < 5; i++) { skeletonRows += '<tr><td style="padding:10px 14px;"><div class="p04-skeleton" style="width:60px;height:20px;"></div></td><td style="padding:10px 14px;"><div class="p04-skeleton" style="width:100px;height:16px;"></div></td><td style="padding:10px 14px;"><div class="p04-skeleton" style="width:200px;height:16px;"></div></td><td style="padding:10px 14px;"><div class="p04-skeleton" style="width:60px;height:16px;"></div></td></tr>'; }
  tbody.innerHTML = skeletonRows;
}

export function showError(container: HTMLElement, message: string) {
  if (!container) return;
  const tbody = container.querySelector('[data-tbody]');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" style="padding:40px;text-align:center;"><div style="display:flex;flex-direction:column;align-items:center;gap:8px;color:#ef4444;">${ERROR_SVG}<span>${escapeHtml(message || 'Erro ao carregar dados')}</span></div></td></tr>`;
}

export function clearTable(container: HTMLElement) { if (!container) return; const tbody = container.querySelector('[data-tbody]'); if (tbody) tbody.innerHTML = ''; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { renderTable, showLoading, showError, clearTable };
