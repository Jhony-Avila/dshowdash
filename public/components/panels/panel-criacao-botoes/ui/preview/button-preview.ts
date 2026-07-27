/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/ui/preview/button-preview.ts
 * @version 1.0.0
 * Render PURO de como o botão aparece na sidebar. Sem I/O.
 * Reflete label, ícone e estado ativo; sinaliza placeholder (stub).
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX, STUB_PANEL_ID } from '../../core/constants.js';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PreviewValues {
  label?: string;
  icon?: string;
  panel_id?: string;
  is_active?: boolean;
}

export function renderSidebarPreview(v: PreviewValues): string {
  const p = CSS_PREFIX;
  const label = (v.label && v.label.trim()) || 'Novo botão';
  const icon = (v.icon && v.icon.trim()) || '•';
  const stateClass = v.is_active ? `${p}-pv__btn--active` : `${p}-pv__btn--inactive`;
  const stub = v.panel_id === STUB_PANEL_ID;
  const hint = stub
    ? `<span class="${p}-pv__hint">placeholder (em desenvolvimento)</span>`
    : '';

  return `
    <div class="${p}-pv" aria-label="Pré-visualização do botão">
      <span class="${p}-pv__caption">Pré-visualização na sidebar</span>
      <div class="${p}-pv__sidebar">
        <div class="${p}-pv__btn ${stateClass}">
          <span class="${p}-pv__icon" aria-hidden="true">${esc(icon)}</span>
          <span class="${p}-pv__label">${esc(label)}</span>
        </div>
      </div>
      ${hint}
    </div>`;
}
