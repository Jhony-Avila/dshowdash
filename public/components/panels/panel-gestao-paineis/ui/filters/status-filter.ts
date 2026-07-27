/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/filters/status-filter.ts
 * @version 2.0.0
 * Status toggle filter — custom select trigger (replaces native <select>)
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../../core/constants.js';

const STATUS_LABELS: Record<string, string> = {
  all: 'Todos',
  active: 'Ativos',
  inactive: 'Inativos',
};

const CHEVRON_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

export function renderStatusFilter(selected: string): string {
  const label = STATUS_LABELS[selected] || 'Todos';

  return `
    <button type="button" class="${CSS_PREFIX}-status-filter pgp-cs-trigger" data-action="open-status-select" data-current-value="${selected}">
      <span class="${CSS_PREFIX}-status-filter__label">${label}</span>
      <span class="${CSS_PREFIX}-status-filter__chevron">${CHEVRON_SVG}</span>
    </button>`;
}
