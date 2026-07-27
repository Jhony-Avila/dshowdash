// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-10.ui.renderer
// PURPOSE: HTML template rendering for Card 10 states (Performance)
// ───────────────────────────────────────────────────────────────
// @contract RENDER_SKELETON - renderSkeleton() returns loading placeholder HTML
// @contract RENDER_CARD - renderCard() returns main card structure HTML
// @contract RENDER_ERROR - renderError(message) returns error state HTML
// @contract XSS_SAFE - escapeHtml() sanitizes text content
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (DOM-based escaping)
// PROVIDES: renderSkeleton, renderCard, renderError, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.0-ENTERPRISE: ES6 arrow functions, template literals
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-10.ui.renderer';

function escapeHtml(text: string) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function renderSkeleton() {
  return '<div class="card-header skeleton-header">' +
    '<div class="skeleton skeleton-header-icon"></div>' +
    '<div class="skeleton skeleton-header-text"></div>' +
  '</div>' +
  '<div class="card-body">' +
    '<div class="skeleton skeleton-value"></div>' +
    '<div class="skeleton skeleton-label"></div>' +
  '</div>' +
  '<span class="sr-only">Carregando performance score...</span>';
}

export function renderCard() {
  return '<div class="card-header">' +
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">' +
      '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>' +
      '<line x1="8" y1="21" x2="16" y2="21"></line>' +
      '<line x1="12" y1="17" x2="12" y2="21"></line>' +
    '</svg>' +
    '<span>Performance</span>' +
  '</div>' +
  '<div class="card-body">' +
    '<div class="card-value" data-el="score">--</div>' +
    '<div class="card-label">Score geral</div>' +
  '</div>' +
  '<div class="card-status" data-el="status" role="status" aria-live="polite"></div>';
}

export function renderError(message: string) {
  return '<div class="card-error-state">' +
    '<svg viewBox="0 0 24 24" class="error-icon-small">' +
      '<circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/>' +
      '<path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>' +
    '<span class="error-text">' + escapeHtml(message) + '</span>' +
  '</div>';
}

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, exports: ['renderSkeleton', 'renderCard', 'renderError'], timestamp: Date.now() }; }

export default { renderSkeleton, renderCard, renderError };
