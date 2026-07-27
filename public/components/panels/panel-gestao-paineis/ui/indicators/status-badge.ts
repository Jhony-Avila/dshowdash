/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/indicators/status-badge.ts
 * @version 1.0.0
 * Status badge (active/inactive)
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../../core/constants.js';

export function renderStatusBadge(isActive: boolean): string {
  const cls = isActive ? `${CSS_PREFIX}-badge--active` : `${CSS_PREFIX}-badge--inactive`;
  const label = isActive ? 'Ativo' : 'Inativo';
  return `<span class="${CSS_PREFIX}-badge ${cls}">${label}</span>`;
}
