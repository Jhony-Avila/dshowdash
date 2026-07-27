/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/render/empty-state.ts
 * @version 1.0.0
 * Estados vazio e erro.
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../core/constants.js';

function _escape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderEmptyState(message = 'Nenhum botão encontrado na sidebar.'): string {
  return `
    <div class="${CSS_PREFIX}-empty" role="status">
      <div class="${CSS_PREFIX}-empty__icon">◻</div>
      <p class="${CSS_PREFIX}-empty__text">${_escape(message)}</p>
    </div>`;
}

export function renderErrorState(message = 'Falha ao carregar.'): string {
  return `
    <div class="${CSS_PREFIX}-error" role="alert">
      <div class="${CSS_PREFIX}-error__icon">⚠</div>
      <p class="${CSS_PREFIX}-error__text">${_escape(message)}</p>
    </div>`;
}
