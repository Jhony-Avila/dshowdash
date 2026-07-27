// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin/ui/renderer
// PURPOSE: Panel Feature Flags Admin - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   formatDate() — exported function
//   renderFlagCard() — exported function
//   renderFlags() — exported function
//   renderLoading() — exported function
//   renderError() — exported function
//   renderEmpty() — exported function
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

export const MODULE_ID = 'panel-feature-flags-admin/ui/renderer';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('pt-BR');
}

export function renderFlagCard(flag: Record<string, unknown>) {
  const isActive = flag.is_enabled;
  return `
    <div class="pfa-flag-card ${isActive ? 'pfa-flag-card--active' : 'pfa-flag-card--inactive'}" data-flag="${flag.flag_key}">
      <div class="pfa-flag-header">
        <div class="pfa-flag-info">
          <span class="pfa-flag-name">${flag.flag_name || flag.flag_key}</span>
          <code class="pfa-flag-key">${flag.flag_key}</code>
        </div>
        <label class="pfa-toggle-switch">
          <input type="checkbox" data-action="toggle" data-flag="${flag.flag_key}" ${isActive ? 'checked' : ''}>
          <span class="pfa-slider"></span>
        </label>
      </div>
      ${flag.description ? `<p class="pfa-flag-description">${flag.description}</p>` : ''}
      <div class="pfa-flag-meta">
        <span class="pfa-badge pfa-badge--${flag.environment || 'all'}">${flag.environment || 'all'}</span>
        <span class="pfa-rollout">Rollout: ${flag.rollout_percentage ?? 100}%</span>
        ${flag.starts_at ? `<span class="pfa-date">Início: ${formatDate(flag.starts_at as string)}</span>` : ''}
        ${flag.ends_at ? `<span class="pfa-date">Fim: ${formatDate(flag.ends_at as string)}</span>` : ''}
      </div>
      <div class="pfa-flag-actions">
        <button data-action="edit" data-flag="${flag.flag_key}" class="pfa-btn pfa-btn--sm">Editar</button>
        <button data-action="delete" data-flag="${flag.flag_key}" class="pfa-btn pfa-btn--sm pfa-btn--danger">Remover</button>
      </div>
    </div>
  `;
}

export function renderFlags(flags: Record<string, unknown>[]) {
  if (!flags || flags.length === 0) return renderEmpty();
  return `<div class="pfa-flags-grid">${flags.map((f: Record<string, unknown>) => renderFlagCard(f)).join('')}</div>`;
}

export function renderLoading() {
  return `
    <div class="pfa-loading">
      <div class="pfa-loading-spinner"></div>
      <span>Carregando flags...</span>
    </div>
  `;
}

export function renderError(message: string) {
  return `
    <div class="pfa-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
      <span>${message || 'Erro ao carregar dados'}</span>
    </div>
  `;
}

export function renderEmpty() {
  return `
    <div class="pfa-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
        <line x1="4" y1="22" x2="4" y2="15"/>
      </svg>
      <span>Nenhum flag encontrado</span>
    </div>
  `;
}

export default { renderFlagCard, renderFlags, renderLoading, renderError, renderEmpty, formatDate };
