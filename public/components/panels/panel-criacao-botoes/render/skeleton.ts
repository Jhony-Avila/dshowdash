/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/render/skeleton.ts
 * @version 1.0.0
 * Estado de carregamento (shell).
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../core/constants.js';

export function renderSkeleton(rows = 5): string {
  const items = Array.from({ length: rows })
    .map(() => `<div class="${CSS_PREFIX}-skeleton__row"></div>`)
    .join('');
  return `
    <div class="${CSS_PREFIX}-skeleton" aria-busy="true" aria-label="Carregando botões">
      <div class="${CSS_PREFIX}-skeleton__group"></div>
      ${items}
    </div>`;
}
