// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-templates-stats
// PURPOSE: UARPS Admin - Stats Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Icons from ./icons.js
//   formatTimeAgo, calculatePercentage from ./templates-helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   stats() — exported function
//   statsExpanded() — exported function
//   activityTimeline() — exported function
//   coverageBar() — exported function
//   lastEditBadge() — exported function
//   modalPreview() — exported function
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

import { Icons } from './icons.js';
import { formatTimeAgo, calculatePercentage } from './templates-helpers.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-templates-stats';

export const stats = (data: Record<string, unknown>) => `<div class="uarps-stats__item uarps-tooltip" data-tooltip="Total de usuários">${Icons.users}<span class="uarps-stats__value">${data.totalUsers}</span><span class="uarps-stats__label">Usuários</span></div><div class="uarps-stats__item uarps-tooltip" data-tooltip="Total de triggers">${Icons.zap}<span class="uarps-stats__value">${data.totalTriggers}</span><span class="uarps-stats__label">Triggers</span></div><div class="uarps-stats__item uarps-tooltip" data-tooltip="Total de regiões">${Icons.layout}<span class="uarps-stats__value">${data.totalRegions}</span><span class="uarps-stats__label">Regiões</span></div><div class="uarps-stats__divider"></div><div class="uarps-stats__item uarps-stats__item--highlight uarps-tooltip" data-tooltip="Triggers do usuário selecionado">${Icons.checkCircle}<span class="uarps-stats__value uarps-glow--green">${data.selectedTriggers}</span><span class="uarps-stats__label">Ativos</span></div><div class="uarps-stats__item uarps-stats__item--highlight uarps-tooltip" data-tooltip="Regiões do usuário selecionado">${Icons.eye}<span class="uarps-stats__value uarps-glow--purple">${data.selectedRegions}</span><span class="uarps-stats__label">Visíveis</span></div>`;

export const statsExpanded = (data: Record<string, unknown>) => {
  const triggerPct = calculatePercentage(Number(data.selectedTriggers), Number(data.totalTriggers));
  const regionPct = calculatePercentage(Number(data.selectedRegions), Number(data.totalRegions));
  return `<div class="uarps-stats__group"><div class="uarps-stats__item uarps-tooltip" data-tooltip="Total de usuários">${Icons.users}<span class="uarps-stats__value">${data.totalUsers}</span><span class="uarps-stats__label">Usuários</span></div></div><div class="uarps-stats__group"><div class="uarps-stats__item uarps-tooltip" data-tooltip="Triggers do usuário">${Icons.zap}<span class="uarps-stats__value uarps-glow--cyan">${data.selectedTriggers}</span><span class="uarps-stats__label">/${data.totalTriggers}</span></div><div class="uarps-progress uarps-tooltip" data-tooltip="${triggerPct}% de cobertura"><div class="uarps-progress__bar"><div class="uarps-progress__fill" style="width:${triggerPct}%"></div></div><span class="uarps-progress__text">${triggerPct}%</span></div></div><div class="uarps-stats__group"><div class="uarps-stats__item uarps-tooltip" data-tooltip="Regiões do usuário">${Icons.layout}<span class="uarps-stats__value uarps-glow--purple">${data.selectedRegions}</span><span class="uarps-stats__label">/${data.totalRegions}</span></div><div class="uarps-progress uarps-tooltip" data-tooltip="${regionPct}% de cobertura"><div class="uarps-progress__bar"><div class="uarps-progress__fill" style="width:${regionPct}%"></div></div><span class="uarps-progress__text">${regionPct}%</span></div></div><div class="uarps-stats__group"><span class="uarps-kbd">Ctrl+Z</span> Desfazer <span class="uarps-kbd">Ctrl+Y</span> Refazer</div>`;
};

export const activityTimeline = (activities: Array<Record<string, unknown>> = []) => {
  if (!activities.length) return '';
  let html = '<div class="uarps-focus__activity"><div class="uarps-focus__activity-title">Últimas Alterações</div><div class="uarps-focus__activity-list">';
  const max = Math.min(5, activities.length);
  for (let i = 0; i < max; i++) { const a = activities[i]; html += `<div class="uarps-focus__activity-item"><div class="uarps-focus__activity-icon uarps-focus__activity-icon--${a.action}">${a.action === 'grant' ? Icons.checkCircle : Icons.xCircle}</div><span class="uarps-focus__activity-text">${a.label || a.triggerId}</span><span class="uarps-focus__activity-time">${formatTimeAgo(a.timestamp as number | string)}</span></div>`; }
  html += '</div></div>';
  return html;
};

export const coverageBar = (granted: number, total: number, label = 'Cobertura') => { const pct = calculatePercentage(granted, total); return `<div class="uarps-focus__coverage"><div class="uarps-focus__coverage-label"><span>${label}</span><span>${granted}/${total} (${pct}%)</span></div><div class="uarps-focus__coverage-bar"><div class="uarps-focus__coverage-fill" style="width:${pct}%"></div></div></div>`; };

export const lastEditBadge = (timestamp: number) => { if (!timestamp) return ''; const isRecent = Date.now() - timestamp < 60000; return `<span class="uarps-last-edit ${isRecent ? 'uarps-last-edit--recent' : ''}">${Icons.clock || Icons.history} ${formatTimeAgo(timestamp)}</span>`; };

export const modalPreview = (data: Record<string, unknown>) => `<div class="uarps-modal__preview"><div class="uarps-modal__preview-title">Impacto da Operação</div><div class="uarps-modal__preview-grid"><div class="uarps-modal__preview-item"><span class="uarps-modal__preview-label">Triggers Afetados</span><span class="uarps-modal__preview-value uarps-modal__preview-value--${data.action === 'grant' ? 'add' : 'remove'}">${data.count}</span></div><div class="uarps-modal__preview-item"><span class="uarps-modal__preview-label">Áreas</span><span class="uarps-modal__preview-value uarps-modal__preview-value--neutral">${data.areas || 'Todas'}</span></div><div class="uarps-modal__preview-item"><span class="uarps-modal__preview-label">Antes</span><span class="uarps-modal__preview-value">${data.before}</span></div><div class="uarps-modal__preview-item"><span class="uarps-modal__preview-label">Depois</span><span class="uarps-modal__preview-value uarps-modal__preview-value--${data.action === 'grant' ? 'add' : 'remove'}">${data.after}</span></div></div></div>`;

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templatesReady: typeof stats === 'function' } });
