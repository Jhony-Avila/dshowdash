// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:cell-renderers
// PURPOSE: Table Engine - Cell Renderers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as formatters from ../utils/formatters.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   registerRenderer() — exported function
//   getRenderer() — exported function
//   renderCell() — exported function
//   listRenderers() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as formatters from '../utils/formatters.js';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:cell-renderers';

const CELL_SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

const _renderers = new Map();

function textRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const escaped = formatters.escapeHtml(value != null ? value as string | number : '');
  return `<span class="${p}cell-text">${escaped || '—'}</span>`;
}

function currencyRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const formatted = formatters.formatCurrency(value as string | number);
  const isNegative = parseFloat(value as string) < 0;
  return `<span class="${p}cell-currency ${isNegative ? `${p}negative` : ''}">${formatted}</span>`;
}

function numberRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const decimals = column.decimals != null ? column.decimals : 2;
  const formatted = formatters.formatNumber(value as string | number, 'pt-BR', decimals as number);
  return `<span class="${p}cell-number">${formatted}</span>`;
}

function percentRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const formatted = formatters.formatPercent(value as string | number);
  const colorClass = (value as number) >= 0 ? `${p}positive` : `${p}negative`;
  return `<span class="${p}cell-percent ${colorClass}">${formatted}</span>`;
}

function dateRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const formatted = formatters.formatDate(value as string | number | Date);
  return `<span class="${p}cell-date">${formatted}</span>`;
}

function datetimeRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const formatted = formatters.formatDateTime(value as string | number | Date);
  return `<span class="${p}cell-datetime">${formatted}</span>`;
}

function statusRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const statusMap: Record<string, { label: unknown; color: string }> = (column.statusMap || opts.statusMap || { ativo: { label: 'Ativo', color: 'success' }, inativo: { label: 'Inativo', color: 'danger' }, pendente: { label: 'Pendente', color: 'warning' }, default: { label: value, color: 'neutral' } }) as Record<string, { label: unknown; color: string }>;
  const key = value && (value as string).toLowerCase ? (value as string).toLowerCase() : 'default';
  const status = (statusMap as Record<string, Record<string, string>>)[key] || statusMap.default || { label: value, color: 'neutral' };
  return `<span class="${p}cell-status ${p}status-${status.color}">${formatters.escapeHtml(status.label as string | number)}</span>`;
}

function booleanRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const trueLabel = column.trueLabel || CELL_SVGS.check;
  const falseLabel = column.falseLabel || CELL_SVGS.x;
  const isTrue = value === true || value === 1 || value === '1' || value === 'true';
  return `<span class="${p}cell-boolean ${isTrue ? `${p}true` : `${p}false`}">${isTrue ? trueLabel : falseLabel}</span>`;
}

function progressRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const percent = Math.min(100, Math.max(0, parseFloat(value as string) || 0));
  const colorClass = percent >= 75 ? 'success' : percent >= 50 ? 'warning' : 'danger';
  return `<div class="${p}cell-progress"><div class="${p}progress-bar ${p}progress-${colorClass}" style="width: ${percent}%"></div><span class="${p}progress-label">${percent.toFixed(0)}%</span></div>`;
}

function ratingRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const max = (column.maxRating || 5) as number;
  const val = Math.min(max, Math.max(0, parseFloat(value as string) || 0));
  const fullStars = Math.floor(val);
  const halfStar = val % 1 >= 0.5;
  const emptyStars = max - fullStars - (halfStar ? 1 : 0);
  let html = `<span class="${p}cell-rating">`;
  for (let i = 0; i < fullStars; i++) html += '★';
  if (halfStar) html += '☆';
  for (let j = 0; j < emptyStars; j++) html += '☆';
  html += '</span>';
  return html;
}

function linkRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  if (!value) return `<span class="${p}cell-link">—</span>`;
  const href = column.hrefField ? row[column.hrefField as string] : value;
  const label = column.labelField ? row[column.labelField as string] : value;
  const target = column.target || '_blank';
  return `<a href="${formatters.escapeHtml(href as string | number)}" target="${target}" class="${p}cell-link">${formatters.escapeHtml(label as string | number)}</a>`;
}

function avatarRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  if (!value) {
    const initials = (String(row.nome || row.name || '?')).slice(0, 2).toUpperCase();
    return `<div class="${p}cell-avatar ${p}avatar-initials">${initials}</div>`;
  }
  return `<img src="${formatters.escapeHtml(value as string | number)}" alt="" class="${p}cell-avatar" loading="lazy" />`;
}

function tagsRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const tags = Array.isArray(value) ? value : ((value as string) || '').split(',').map((t: string) => t.trim()).filter(Boolean);
  if (!tags.length) return `<span class="${p}cell-tags">—</span>`;
  return `<div class="${p}cell-tags">${tags.map((t: string) => `<span class="${p}tag">${formatters.escapeHtml(t)}</span>`).join('')}</div>`;
}

function cnpjRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const formatted = formatters.formatCNPJ(value as string | number);
  return `<span class="${p}cell-cnpj">${formatted}</span>`;
}

function cpfRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const formatted = formatters.formatCPF(value as string | number);
  return `<span class="${p}cell-cpf">${formatted}</span>`;
}

function phoneRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const formatted = formatters.formatPhone(value as string | number);
  const clean = String(value || '').replace(/\D/g, '');
  if (!clean) return `<span class="${p}cell-phone">—</span>`;
  return `<a href="tel:+55${clean}" class="${p}cell-phone">${formatted}</a>`;
}

function actionsRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const actions = (column.actions || opts.defaultActions || [{ action: 'view', icon: '👁', title: 'Ver' }, { action: 'edit', icon: '✏️', title: 'Editar' }, { action: 'delete', icon: '🗑', title: 'Excluir', danger: true }]) as Record<string, unknown>[];
  return `<div class="${p}cell-actions">${actions.map((a: Record<string, unknown>) => `<button class="${p}action-btn ${a.danger ? `${p}action-danger` : ''}" data-action="${a.action}" data-id="${row.id}" title="${a.title || a.action}">${a.icon || a.action}</button>`).join('')}</div>`;
}

function customRenderer(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  if (typeof column.render === 'function') return column.render(value, column, row, options);
  return textRenderer(value, column, row, options);
}

_renderers.set('text', textRenderer);
_renderers.set('string', textRenderer);
_renderers.set('currency', currencyRenderer);
_renderers.set('money', currencyRenderer);
_renderers.set('number', numberRenderer);
_renderers.set('percent', percentRenderer);
_renderers.set('percentage', percentRenderer);
_renderers.set('date', dateRenderer);
_renderers.set('datetime', datetimeRenderer);
_renderers.set('status', statusRenderer);
_renderers.set('badge', statusRenderer);
_renderers.set('boolean', booleanRenderer);
_renderers.set('bool', booleanRenderer);
_renderers.set('progress', progressRenderer);
_renderers.set('progressbar', progressRenderer);
_renderers.set('rating', ratingRenderer);
_renderers.set('stars', ratingRenderer);
_renderers.set('link', linkRenderer);
_renderers.set('url', linkRenderer);
_renderers.set('avatar', avatarRenderer);
_renderers.set('image', avatarRenderer);
_renderers.set('tags', tagsRenderer);
_renderers.set('chips', tagsRenderer);
_renderers.set('cnpj', cnpjRenderer);
_renderers.set('cpf', cpfRenderer);
_renderers.set('phone', phoneRenderer);
_renderers.set('telefone', phoneRenderer);
_renderers.set('actions', actionsRenderer);
_renderers.set('custom', customRenderer);

export function registerRenderer(type: string, renderer: (value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) => string) { if (typeof renderer === 'function') _renderers.set(type.toLowerCase(), renderer); }
export function getRenderer(type: string | undefined) { return _renderers.get(type && type.toLowerCase ? type.toLowerCase() : 'text') || textRenderer; }
export function renderCell(value: unknown, column: Record<string, unknown>, row: Record<string, unknown>, options: Record<string, unknown>) {
  const type = (column.type || column.renderer || 'text') as string;
  const renderer = getRenderer(type);
  try { return renderer(value, column, row, options); }
  catch (e) { return textRenderer(value, column, row, options); }
}
export function listRenderers() { return Array.from(_renderers.keys()); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, renderers: listRenderers() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, renderersCount: _renderers.size }; }

export default { registerRenderer, getRenderer, renderCell, listRenderers, info, healthCheck, VERSION, MODULE_ID };
