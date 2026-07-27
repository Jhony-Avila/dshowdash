import { CSS_PREFIX } from "./template-constants.js";
import { formatTimestamp, escapeHtml, truncate } from "./template-utils.js";
function buildAuditRow(log, options = {}) {
  const { showSelection = false, selected = false, showExpand = true, expanded = false, visibleColumns = null } = options;
  const actionClass = (log.action_type || "default").toLowerCase().replace(/[^a-z]/g, "");
  const isHidden = (key) => visibleColumns && !visibleColumns.includes(key) ? " col-hidden" : "";
  let html = `<tr class="${CSS_PREFIX}-row ${CSS_PREFIX}-row-expandable${selected ? " selected" : ""}${expanded ? " expanded" : ""}" data-log-id="${log.id}">`;
  if (showExpand) html += `<td class="pat-expand-col"><span class="${CSS_PREFIX}-expand-trigger" data-action="toggle-expand" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></td>`;
  if (showSelection) html += `<td class="${CSS_PREFIX}-select-cell"><input type="checkbox" class="${CSS_PREFIX}-row-checkbox" data-row-select="${log.id}"${selected ? " checked" : ""}></td>`;
  const auditTs = log.created_at || log.timestamp;
  html += `<td class="${CSS_PREFIX}-col-date${isHidden("created_at")}" data-col="created_at">${formatTimestamp(auditTs)}</td><td${isHidden("username")} data-col="username">${escapeHtml(log.username || log.user_id || "-")}</td><td${isHidden("action_type")} data-col="action_type"><span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-badge-${actionClass}">${escapeHtml(log.action_type || log.action_key || "-")}</span></td><td${isHidden("resource_type")} data-col="resource_type">${log.resource_type ? `${escapeHtml(log.resource_type)}${log.resource_id ? `:${log.resource_id}` : ""}` : "-"}</td><td${isHidden("module")} data-col="module">${escapeHtml(log.module || "-")}</td><td${isHidden("actions")} data-col="actions"><button class="${CSS_PREFIX}-btn-xs" data-action="show-details" data-log-id="${log.id}" type="button">Ver</button></td></tr>`;
  return html;
}
function buildPermissionRow(log, options = {}) {
  const { showSelection = false, selected = false, showExpand = true, visibleColumns = null } = options;
  const actionClass = (log.action || "default").toLowerCase().replace(/[^a-z]/g, "");
  const isHidden = (key) => visibleColumns && !visibleColumns.includes(key) ? " col-hidden" : "";
  let html = `<tr class="${CSS_PREFIX}-row ${CSS_PREFIX}-row-expandable${selected ? " selected" : ""}" data-log-id="${log.id}">`;
  if (showExpand) html += `<td class="pat-expand-col"><span class="${CSS_PREFIX}-expand-trigger" data-action="toggle-expand" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></td>`;
  if (showSelection) html += `<td class="${CSS_PREFIX}-select-cell"><input type="checkbox" class="${CSS_PREFIX}-row-checkbox" data-row-select="${log.id}"${selected ? " checked" : ""}></td>`;
  html += `<td class="${CSS_PREFIX}-col-date${isHidden("created_at")}">${formatTimestamp(log.created_at)}</td><td${isHidden("username")}>${escapeHtml(log.username || "-")}</td><td${isHidden("permission_key")}>${escapeHtml(log.permission_key || "-")}</td><td${isHidden("action")}><span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-badge-${actionClass}">${escapeHtml(log.action || "-")}</span></td><td${isHidden("resource_type")}>${log.resource_type || "-"}</td><td${isHidden("ip_address")}>${escapeHtml(log.ip_address || "-")}</td><td${isHidden("actions")}><button class="${CSS_PREFIX}-btn-xs" data-action="show-details" data-log-id="${log.id}">Ver</button></td></tr>`;
  return html;
}
function buildFrontendRow(log, options = {}) {
  const { showSelection = false, selected = false, showExpand = true, visibleColumns = null } = options;
  const levelClass = (log.log_level || "info").toLowerCase().replace(/[^a-z]/g, "");
  const isHidden = (key) => visibleColumns && !visibleColumns.includes(key) ? " col-hidden" : "";
  let html = `<tr class="${CSS_PREFIX}-row ${CSS_PREFIX}-row-expandable ${CSS_PREFIX}-log-${levelClass}${selected ? " selected" : ""}" data-log-id="${log.id}">`;
  if (showExpand) html += `<td class="pat-expand-col"><span class="${CSS_PREFIX}-expand-trigger" data-action="toggle-expand" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></td>`;
  if (showSelection) html += `<td class="${CSS_PREFIX}-select-cell"><input type="checkbox" class="${CSS_PREFIX}-row-checkbox" data-row-select="${log.id}"${selected ? " checked" : ""}></td>`;
  html += `<td class="${CSS_PREFIX}-col-date${isHidden("created_at")}">${formatTimestamp(log.created_at)}</td><td${isHidden("log_level")}><span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-badge-${levelClass}">${escapeHtml(log.log_level || "-")}</span></td><td${isHidden("logger_name")}>${escapeHtml(log.logger_name || "-")}</td><td class="${CSS_PREFIX}-col-message${isHidden("message")}">${escapeHtml(truncate(log.message, 100))}</td><td${isHidden("page_url")}>${escapeHtml(truncate(log.page_url, 50))}</td><td${isHidden("actions")}><button class="${CSS_PREFIX}-btn-xs" data-action="show-details" data-log-id="${log.id}">Ver</button></td></tr>`;
  return html;
}
function buildSecurityRow(log, options = {}) {
  const { showSelection = false, selected = false, showExpand = true, visibleColumns = null } = options;
  const severityClass = (log.severity || "info").toLowerCase().replace(/[^a-z]/g, "");
  const isHidden = (key) => visibleColumns && !visibleColumns.includes(key) ? " col-hidden" : "";
  let html = `<tr class="${CSS_PREFIX}-row ${CSS_PREFIX}-row-expandable ${CSS_PREFIX}-severity-${severityClass}${selected ? " selected" : ""}" data-log-id="${log.id}">`;
  if (showExpand) html += `<td class="pat-expand-col"><span class="${CSS_PREFIX}-expand-trigger" data-action="toggle-expand" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span></td>`;
  if (showSelection) html += `<td class="${CSS_PREFIX}-select-cell"><input type="checkbox" class="${CSS_PREFIX}-row-checkbox" data-row-select="${log.id}"${selected ? " checked" : ""}></td>`;
  html += `<td class="${CSS_PREFIX}-col-date${isHidden("created_at")}">${formatTimestamp(log.created_at)}</td><td${isHidden("severity")}><span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-severity-${severityClass}">${escapeHtml(log.severity || "-")}</span></td><td${isHidden("event_type")}>${escapeHtml(log.event_type || "-")}</td><td${isHidden("username")}>${escapeHtml(log.username || "-")}</td><td${isHidden("resource")}>${escapeHtml(log.resource || "-")}</td><td${isHidden("details")}>${escapeHtml(truncate(log.details || log.message, 80))}</td><td${isHidden("actions")}><button class="${CSS_PREFIX}-btn-xs" data-action="show-details" data-log-id="${log.id}">Ver</button></td></tr>`;
  return html;
}
var template_rows_default = { buildAuditRow, buildPermissionRow, buildFrontendRow, buildSecurityRow };
const MODULE_ID = "panels-panel-audit-trail-ui-template-rows";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { templateRowsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  buildAuditRow,
  buildFrontendRow,
  buildPermissionRow,
  buildSecurityRow,
  template_rows_default as default,
  healthCheck,
  info
};
