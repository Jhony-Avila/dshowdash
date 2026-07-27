// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12/ui/header
// PURPOSE: Panel-12 - UI Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../../../_shared/icons.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderHeader() — exported function
//   updateCountdown() — exported function
//   bindHeaderEvents() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ICONS } from '../../../_shared/icons.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-12/ui/header';

export const renderHeader = (options: { title?: string; subtitle?: string; onRefresh?: Function; onToggleAutoRefresh?: Function; autoRefreshEnabled?: boolean; countdown?: number } = {}) => {
  const { title = 'Cron Jobs', subtitle = 'Monitoramento de Jobs', onRefresh, onToggleAutoRefresh, autoRefreshEnabled = true, countdown = 0 } = options;
  
  return `<div class="painel-12-header"><div class="painel-12-header__title-group"><h2 class="painel-12-header__title">${ICONS.clock || ''} ${title}</h2><span class="painel-12-header__subtitle">${subtitle}</span></div><div class="painel-12-header__actions"><div class="painel-12-header__auto-refresh"><label class="painel-12-toggle"><input type="checkbox" ${autoRefreshEnabled ? 'checked' : ''} data-action="toggle-auto-refresh"><span class="painel-12-toggle__slider"></span></label><span class="painel-12-header__countdown" data-countdown>${countdown}s</span></div><button class="painel-12-btn painel-12-btn--icon" data-action="refresh" title="Atualizar agora">${ICONS.refresh || '↻'}</button></div></div>`;
};

export const updateCountdown = (container: HTMLElement, value: number) => {
  const el = container?.querySelector('[data-countdown]');
  if (el) el.textContent = `${value}s`;
};

export const bindHeaderEvents = (container: HTMLElement, callbacks: { onRefresh?: Function; onToggleAutoRefresh?: Function } = {}) => {
  if (!container) return;
  
  const refreshBtn = container.querySelector('[data-action="refresh"]');
  if (refreshBtn && callbacks.onRefresh) {
    (refreshBtn as HTMLElement).addEventListener('click', callbacks.onRefresh as EventListener);
  }
  
  const autoRefreshToggle = container.querySelector('[data-action="toggle-auto-refresh"]');
  if (autoRefreshToggle && callbacks.onToggleAutoRefresh) {
    // @ts-expect-error strict migration — TS2722
    autoRefreshToggle.addEventListener('change', (e) => callbacks.onToggleAutoRefresh((e.target as HTMLInputElement).checked));
  }
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });
export default { renderHeader, updateCountdown, bindHeaderEvents, info, healthCheck };

export const showRefreshIndicator = (container: HTMLElement) => {};
export const hideRefreshIndicator = (container: HTMLElement) => {};
export const updateFilterCounts = (container: HTMLElement) => {};
export const applyDensity = (container: HTMLElement) => {};
