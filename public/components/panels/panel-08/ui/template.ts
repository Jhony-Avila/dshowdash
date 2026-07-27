// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08-template
// PURPOSE: Panel-08 Template Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CSS_PREFIX from ../core/contracts.js
//   formatRelativeTime, formatDateTime, formatSeverity from ../utils/formatters.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   render() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
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

import { CSS_PREFIX } from '../core/contracts.js';
import { formatRelativeTime, formatDateTime, formatSeverity } from '../utils/formatters.js';

export const MODULE_ID = 'panel-08-template';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const ICONS = {
  error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  chevron: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
};

function escapeHtml(str: string | number | boolean | null | undefined) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function getAlertIcon(type: string) {
  const t = (type || 'info').toLowerCase();
  if (t === 'error') return ICONS.error;
  if (t === 'warning') return ICONS.warning;
  return ICONS.info;
}

function renderSkeleton() {
  return `<div class="${CSS_PREFIX}__skeleton"><div class="${CSS_PREFIX}__skeleton-summary"><div class="${CSS_PREFIX}__skeleton-card"></div><div class="${CSS_PREFIX}__skeleton-card"></div><div class="${CSS_PREFIX}__skeleton-card"></div><div class="${CSS_PREFIX}__skeleton-card"></div></div><div class="${CSS_PREFIX}__skeleton-list">${Array(5).fill(`<div class="${CSS_PREFIX}__skeleton-item"></div>`).join('')}</div></div>`;
}

function renderError(message: string) {
  return `<div class="${CSS_PREFIX}__error">${ICONS.error}<p>${escapeHtml(message || 'Erro ao carregar dados')}</p><button type="button" class="${CSS_PREFIX}__btn ${CSS_PREFIX}__btn--primary" data-action="refresh">Tentar novamente</button></div>`;
}

function renderEmpty() {
  return `<div class="${CSS_PREFIX}__empty">${ICONS.check}<p>Nenhum alerta no momento</p></div>`;
}

function renderSummary(alerts: Record<string, unknown>[], meta: Record<string, unknown>) {
  const total = alerts.length;
  const errors = alerts.filter((a: Record<string, unknown>) => a.alert_type === 'ERROR').length;
  const warnings = alerts.filter((a: Record<string, unknown>) => a.alert_type === 'WARNING').length;
  const period = (meta && meta.period) ? meta.period : '24h';
  return `<div class="${CSS_PREFIX}__summary"><div class="${CSS_PREFIX}__summary-card ${CSS_PREFIX}__summary-card--total"><span class="${CSS_PREFIX}__summary-value">${total}</span><span class="${CSS_PREFIX}__summary-label">Total</span></div><div class="${CSS_PREFIX}__summary-card ${CSS_PREFIX}__summary-card--error"><span class="${CSS_PREFIX}__summary-value">${errors}</span><span class="${CSS_PREFIX}__summary-label">Erros</span></div><div class="${CSS_PREFIX}__summary-card ${CSS_PREFIX}__summary-card--warning"><span class="${CSS_PREFIX}__summary-value">${warnings}</span><span class="${CSS_PREFIX}__summary-label">Avisos</span></div><div class="${CSS_PREFIX}__summary-card ${CSS_PREFIX}__summary-card--period"><span class="${CSS_PREFIX}__summary-value">${period}</span><span class="${CSS_PREFIX}__summary-label">Período</span></div></div>`;
}

function renderAlertItem(alert: Record<string, unknown>, isExpanded: boolean, isAcknowledged: boolean) {
  const alertType = String(alert.alert_type || 'info');
  const type = alertType.toLowerCase();
  const alertSeverity = String(alert.severity || 'low');
  const severity = alertSeverity.toLowerCase();
  const expandedClass = isExpanded ? ` ${CSS_PREFIX}__alert--expanded` : '';
  const acknowledgedClass = isAcknowledged ? ` ${CSS_PREFIX}__alert--acknowledged` : '';
  let detailsHtml = '';
  if (isExpanded) {
    detailsHtml = `<div class="${CSS_PREFIX}__alert-details"><div class="${CSS_PREFIX}__detail-grid"><div class="${CSS_PREFIX}__detail-item"><span class="${CSS_PREFIX}__detail-label">ID</span><span class="${CSS_PREFIX}__detail-value">${alert.id}</span></div><div class="${CSS_PREFIX}__detail-item"><span class="${CSS_PREFIX}__detail-label">Tipo</span><span class="${CSS_PREFIX}__detail-value">${escapeHtml(alertType)}</span></div><div class="${CSS_PREFIX}__detail-item"><span class="${CSS_PREFIX}__detail-label">Severidade</span><span class="${CSS_PREFIX}__detail-value">${formatSeverity(severity)}</span></div><div class="${CSS_PREFIX}__detail-item"><span class="${CSS_PREFIX}__detail-label">Data/Hora</span><span class="${CSS_PREFIX}__detail-value">${formatDateTime(String(alert.created_at || ''))}</span></div></div><div class="${CSS_PREFIX}__detail-message"><span class="${CSS_PREFIX}__detail-label">Mensagem Completa</span><pre class="${CSS_PREFIX}__detail-pre">${escapeHtml(String(alert.message || ''))}</pre></div></div>`;
  }
  const ackBtn = !isAcknowledged ? `<button type="button" class="${CSS_PREFIX}__btn-icon ${CSS_PREFIX}__btn-icon--success" data-action="acknowledge" data-alert-id="${alert.id}" title="Reconhecer">${ICONS.check}</button>` : '';
  return `<div class="${CSS_PREFIX}__alert ${CSS_PREFIX}__alert--${type}${expandedClass}${acknowledgedClass}" data-alert-id="${alert.id}"><div class="${CSS_PREFIX}__alert-main"><div class="${CSS_PREFIX}__alert-icon">${getAlertIcon(alertType)}</div><div class="${CSS_PREFIX}__alert-content"><div class="${CSS_PREFIX}__alert-header"><span class="${CSS_PREFIX}__alert-job">${escapeHtml(String(alert.job_name || '-'))}</span><span class="${CSS_PREFIX}__alert-badge ${CSS_PREFIX}__alert-badge--${severity}">${formatSeverity(severity)}</span></div><div class="${CSS_PREFIX}__alert-message">${escapeHtml(String(alert.message || '-'))}</div><div class="${CSS_PREFIX}__alert-time">${formatRelativeTime(String(alert.created_at || ''))}</div></div><div class="${CSS_PREFIX}__alert-actions"><button type="button" class="${CSS_PREFIX}__btn-icon" data-action="toggle-expand" data-alert-id="${alert.id}" title="Expandir">${ICONS.chevron}</button>${ackBtn}</div></div>${detailsHtml}</div>`;
}

export function render(container: HTMLElement, state: Record<string, unknown>, config: Record<string, unknown>) {
  if (!container) return;
  const loading = state.loading as boolean | undefined;
  const error = state.error as string | undefined;
  const alerts = (state.alerts || []) as Record<string, unknown>[];
  const meta = (state.meta || {}) as Record<string, unknown>;
  const expandedIds = (state.expandedIds || new Set()) as Set<unknown>;
  const acknowledgedIds = (state.acknowledgedIds || new Set()) as Set<unknown>;
  const autoRefreshEnabled = state.autoRefreshEnabled as boolean | undefined;
  const countdown = state.countdown as number | undefined;
  const lastUpdate = state.lastUpdate as number | undefined;
  const panelEl = container.closest('[data-panel-id]');
  const countdownEl = panelEl ? panelEl.querySelector('[data-countdown]') : null;
  if (countdownEl) countdownEl.textContent = autoRefreshEnabled ? (`${countdown}s`) : 'Off';
  const timestampEl = panelEl ? panelEl.querySelector('[data-timestamp]') : null;
  if (timestampEl && lastUpdate) {
    timestampEl.textContent = `Atualizado: ${new Date(lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (loading && alerts.length === 0) { container.innerHTML = renderSkeleton(); return; }
  if (error && alerts.length === 0) { container.innerHTML = renderError(error); return; }
  if (alerts.length === 0) { container.innerHTML = renderEmpty(); return; }
  const alertsHtml = alerts.slice(0, 15).map((alert: Record<string, unknown>) => renderAlertItem(alert, expandedIds.has(alert.id), acknowledgedIds.has(alert.id))).join('');
  container.innerHTML = `${renderSummary(alerts, meta)}<div class="${CSS_PREFIX}__list">${alertsHtml}</div>`;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export function getVersion() { return VERSION; }
export default { MODULE_ID, VERSION, render, getVersion, info, healthCheck };
