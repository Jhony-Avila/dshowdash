import { CSS_PREFIX, COLUMNS, TABS } from "./template-constants.js";
import { formatTimestamp, escapeHtml } from "./template-utils.js";
const MODULE_ID = "panel-audit-trail-ui-template-expanded";
const VERSION = "9.3.0-P2-ENTERPRISE";
function buildExpandedRow(log, colspan = 8) {
  const ts = log.created_at || log.timestamp;
  const actionType = log.action_type || "default";
  return `<tr class="${CSS_PREFIX}-row-expanded" data-expanded-id="${log.id}"><td colspan="${colspan}"><div class="${CSS_PREFIX}-expanded-content"><div class="${CSS_PREFIX}-expanded-grid"><div class="${CSS_PREFIX}-expanded-section"><div class="${CSS_PREFIX}-expanded-section-title">Informa\xE7\xF5es Gerais</div><div class="${CSS_PREFIX}-expanded-item"><span class="${CSS_PREFIX}-expanded-label">ID</span><span class="${CSS_PREFIX}-expanded-value mono">${log.id}</span></div><div class="${CSS_PREFIX}-expanded-item"><span class="${CSS_PREFIX}-expanded-label">Data/Hora</span><span class="${CSS_PREFIX}-expanded-value">${formatTimestamp(ts)}</span></div><div class="${CSS_PREFIX}-expanded-item"><span class="${CSS_PREFIX}-expanded-label">Usu\xE1rio</span><span class="${CSS_PREFIX}-expanded-value">${escapeHtml(log.username || log.user_id || "-")}</span></div></div><div class="${CSS_PREFIX}-expanded-section"><div class="${CSS_PREFIX}-expanded-section-title">Detalhes da A\xE7\xE3o</div><div class="${CSS_PREFIX}-expanded-item"><span class="${CSS_PREFIX}-expanded-label">Tipo</span><span class="${CSS_PREFIX}-expanded-value badge"><span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-badge-${actionType.toLowerCase().replace(/[^a-z]/g, "")}">${escapeHtml(actionType || "-")}</span></span></div><div class="${CSS_PREFIX}-expanded-item"><span class="${CSS_PREFIX}-expanded-label">M\xF3dulo</span><span class="${CSS_PREFIX}-expanded-value">${escapeHtml(log.module || "-")}</span></div><div class="${CSS_PREFIX}-expanded-item"><span class="${CSS_PREFIX}-expanded-label">Recurso</span><span class="${CSS_PREFIX}-expanded-value mono">${log.resource_type ? `${log.resource_type}:${log.resource_id || ""}` : "-"}</span></div></div>${log.details || log.metadata ? `<div class="${CSS_PREFIX}-expanded-section" style="grid-column: span 2;"><div class="${CSS_PREFIX}-expanded-section-title">Dados Adicionais</div><div class="${CSS_PREFIX}-expanded-json"><pre>${escapeHtml(JSON.stringify(log.details || log.metadata || {}, null, 2))}</pre></div></div>` : ""}</div><div class="${CSS_PREFIX}-expanded-actions"><button class="${CSS_PREFIX}-expanded-btn" data-action="copy-log" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar JSON</button><button class="${CSS_PREFIX}-expanded-btn" data-action="show-details" data-log-id="${log.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Ver Modal</button></div></div></td></tr>`;
}
function buildGroupHeader(groupKey, groupValue, count, colspan = 8) {
  const type = (groupValue || "").toLowerCase().replace(/[^a-z]/g, "");
  return `<tr class="${CSS_PREFIX}-group-header" data-group="${groupKey}:${groupValue}" data-group-type="${type}"><td colspan="${colspan}"><div class="${CSS_PREFIX}-group-header-content"><span class="${CSS_PREFIX}-group-toggle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></span><span class="${CSS_PREFIX}-group-title">${escapeHtml(groupValue || "Sem valor")}</span><span class="${CSS_PREFIX}-group-badge">${count}</span><div class="${CSS_PREFIX}-group-stats"><span class="${CSS_PREFIX}-group-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> ${count} registros</span></div></div></td></tr>`;
}
function buildEmptyRow(colspan = 8) {
  return `<tr><td colspan="${colspan}" class="${CSS_PREFIX}-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="opacity:0.3;margin-bottom:0.5rem;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/></svg><span>Nenhum registro encontrado</span></td></tr>`;
}
function buildColumnsMenu(tab, visibleColumns) {
  const columns = COLUMNS[tab] || COLUMNS[TABS.AUDIT];
  return columns.filter((col) => col.label).map((col) => `<div class="${CSS_PREFIX}-columns-menu-item" data-column="${col.key}"><div class="${CSS_PREFIX}-columns-checkbox${visibleColumns.includes(col.key) ? " checked" : ""}" data-toggle-column="${col.key}"></div><span class="${CSS_PREFIX}-columns-label">${col.label}</span></div>`).join("");
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
var template_expanded_default = { buildExpandedRow, buildGroupHeader, buildEmptyRow, buildColumnsMenu, info, healthCheck, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  buildColumnsMenu,
  buildEmptyRow,
  buildExpandedRow,
  buildGroupHeader,
  template_expanded_default as default,
  healthCheck,
  info
};
