// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-audit-trail-ui-template-rows
// PURPOSE: Panel Audit Trail - Template Rows
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CSS_PREFIX from ./template-constants.js
//   formatTimestamp, escapeHtml, truncate from ./template-utils.js
//
// PROVIDES:
//   buildAuditRow() — exported function
//   buildPermissionRow() — exported function
//   buildFrontendRow() — exported function
//   buildSecurityRow() — exported function
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

import { CSS_PREFIX } from './template-constants.js';
import { formatTimestamp, escapeHtml, truncate } from './template-utils.js';

export function buildAuditRow(log: Record<string, unknown>, options: { showSelection?: boolean; selected?: boolean; showExpand?: boolean; expanded?: boolean; visibleColumns?: string[] | null } = {}) {
  const { showSelection = false, selected = false, showExpand = true, expanded = false, visibleColumns = null } = options;
  const actionClass = ((log.action_type as string) || 'default').toLowerCase().replace(/[^a-z]/g, '');
  const isHidden = (key: string) => visibleColumns && !visibleColumns.includes(key) ? ' col-hidden' : '';
  
  let html = `<tr class="${CSS_PREFIX}-row ${CSS_PREFIX}-row-expandable${selected ? ' selected' : ''}${expanded ? ' expanded' : ''}" data-log-id="${log.id}">`;
  if (showExpand) html += `<td class="pat-expand-col"><span class="${CSS_PREFIX}-expand-trigger" data-action="toggle-expand" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></td>`;
  if (showSelection) html += `<td class="${CSS_PREFIX}-select-cell"><input type="checkbox" class="${CSS_PREFIX}-row-checkbox" data-row-select="${log.id}"${selected ? ' checked' : ''}></td>`;
  const auditTs = (log.created_at || log.timestamp) as string | number | Date | undefined;
  html += `<td class="${CSS_PREFIX}-col-date${isHidden('created_at')}" data-col="created_at">${formatTimestamp(auditTs)}</td><td${isHidden('username')} data-col="username">${escapeHtml((log.username || log.user_id || '-') as string)}</td><td${isHidden('action_type')} data-col="action_type"><span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-badge-${actionClass}">${escapeHtml((log.action_type || log.action_key || '-') as string)}</span></td><td${isHidden('resource_type')} data-col="resource_type">${log.resource_type ? `${escapeHtml(log.resource_type as string)}${log.resource_id ? `:${log.resource_id}` : ''}` : '-'}</td><td${isHidden('module')} data-col="module">${escapeHtml((log.module || '-') as string)}</td><td${isHidden('actions')} data-col="actions"><button class="${CSS_PREFIX}-btn-xs" data-action="show-details" data-log-id="${log.id}" type="button">Ver</button></td></tr>`;
  return html;
}

export function buildPermissionRow(log: Record<string, unknown>, options: { showSelection?: boolean; selected?: boolean; showExpand?: boolean; expanded?: boolean; visibleColumns?: string[] | null } = {}) {
  const { showSelection = false, selected = false, showExpand = true, visibleColumns = null } = options;
  const actionClass = ((log.action as string) || 'default').toLowerCase().replace(/[^a-z]/g, '');
  const isHidden = (key: string) => visibleColumns && !visibleColumns.includes(key) ? ' col-hidden' : '';
  let html = `<tr class="${CSS_PREFIX}-row ${CSS_PREFIX}-row-expandable${selected ? ' selected' : ''}" data-log-id="${log.id}">`;
  if (showExpand) html += `<td class="pat-expand-col"><span class="${CSS_PREFIX}-expand-trigger" data-action="toggle-expand" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></td>`;
  if (showSelection) html += `<td class="${CSS_PREFIX}-select-cell"><input type="checkbox" class="${CSS_PREFIX}-row-checkbox" data-row-select="${log.id}"${selected ? ' checked' : ''}></td>`;
  html += `<td class="${CSS_PREFIX}-col-date${isHidden('created_at')}">${formatTimestamp(log.created_at as string | number | Date | undefined)}</td><td${isHidden('username')}>${escapeHtml((log.username || '-') as string)}</td><td${isHidden('permission_key')}>${escapeHtml((log.permission_key || '-') as string)}</td><td${isHidden('action')}><span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-badge-${actionClass}">${escapeHtml((log.action || '-') as string)}</span></td><td${isHidden('resource_type')}>${log.resource_type || '-'}</td><td${isHidden('ip_address')}>${escapeHtml((log.ip_address || '-') as string)}</td><td${isHidden('actions')}><button class="${CSS_PREFIX}-btn-xs" data-action="show-details" data-log-id="${log.id}">Ver</button></td></tr>`;
  return html;
}

export function buildFrontendRow(log: Record<string, unknown>, options: { showSelection?: boolean; selected?: boolean; showExpand?: boolean; expanded?: boolean; visibleColumns?: string[] | null } = {}) {
  const { showSelection = false, selected = false, showExpand = true, visibleColumns = null } = options;
  const levelClass = ((log.log_level as string) || 'info').toLowerCase().replace(/[^a-z]/g, '');
  const isHidden = (key: string) => visibleColumns && !visibleColumns.includes(key) ? ' col-hidden' : '';
  let html = `<tr class="${CSS_PREFIX}-row ${CSS_PREFIX}-row-expandable ${CSS_PREFIX}-log-${levelClass}${selected ? ' selected' : ''}" data-log-id="${log.id}">`;
  if (showExpand) html += `<td class="pat-expand-col"><span class="${CSS_PREFIX}-expand-trigger" data-action="toggle-expand" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></td>`;
  if (showSelection) html += `<td class="${CSS_PREFIX}-select-cell"><input type="checkbox" class="${CSS_PREFIX}-row-checkbox" data-row-select="${log.id}"${selected ? ' checked' : ''}></td>`;
  html += `<td class="${CSS_PREFIX}-col-date${isHidden('created_at')}">${formatTimestamp(log.created_at as string | number | Date | undefined)}</td><td${isHidden('log_level')}><span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-badge-${levelClass}">${escapeHtml((log.log_level || '-') as string)}</span></td><td${isHidden('logger_name')}>${escapeHtml((log.logger_name || '-') as string)}</td><td class="${CSS_PREFIX}-col-message${isHidden('message')}">${escapeHtml(truncate(log.message as string | null | undefined, 100))}</td><td${isHidden('page_url')}>${escapeHtml(truncate(log.page_url as string | null | undefined, 50))}</td><td${isHidden('actions')}><button class="${CSS_PREFIX}-btn-xs" data-action="show-details" data-log-id="${log.id}">Ver</button></td></tr>`;
  return html;
}

export function buildSecurityRow(log: Record<string, unknown>, options: { showSelection?: boolean; selected?: boolean; showExpand?: boolean; expanded?: boolean; visibleColumns?: string[] | null } = {}) {
  const { showSelection = false, selected = false, showExpand = true, visibleColumns = null } = options;
  const severityClass = ((log.severity as string) || 'info').toLowerCase().replace(/[^a-z]/g, '');
  const isHidden = (key: string) => visibleColumns && !visibleColumns.includes(key) ? ' col-hidden' : '';
  let html = `<tr class="${CSS_PREFIX}-row ${CSS_PREFIX}-row-expandable ${CSS_PREFIX}-severity-${severityClass}${selected ? ' selected' : ''}" data-log-id="${log.id}">`;
  if (showExpand) html += `<td class="pat-expand-col"><span class="${CSS_PREFIX}-expand-trigger" data-action="toggle-expand" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></td>`;
  if (showSelection) html += `<td class="${CSS_PREFIX}-select-cell"><input type="checkbox" class="${CSS_PREFIX}-row-checkbox" data-row-select="${log.id}"${selected ? ' checked' : ''}></td>`;
  html += `<td class="${CSS_PREFIX}-col-date${isHidden('created_at')}">${formatTimestamp(log.created_at as string | number | Date | undefined)}</td><td${isHidden('severity')}><span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-severity-${severityClass}">${escapeHtml((log.severity || '-') as string)}</span></td><td${isHidden('event_type')}>${escapeHtml((log.event_type || '-') as string)}</td><td${isHidden('username')}>${escapeHtml((log.username || '-') as string)}</td><td${isHidden('resource')}>${escapeHtml((log.resource || '-') as string)}</td><td${isHidden('details')}>${escapeHtml(truncate((log.details || log.message) as string | null | undefined, 80))}</td><td${isHidden('actions')}><button class="${CSS_PREFIX}-btn-xs" data-action="show-details" data-log-id="${log.id}">Ver</button></td></tr>`;
  return html;
}

export default { buildAuditRow, buildPermissionRow, buildFrontendRow, buildSecurityRow };

export const MODULE_ID = 'panels-panel-audit-trail-ui-template-rows';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateRowsReady: true } }; }
