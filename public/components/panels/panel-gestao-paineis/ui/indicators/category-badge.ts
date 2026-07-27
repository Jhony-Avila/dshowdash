/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/indicators/category-badge.ts
 * @version 1.0.0
 * Category badge with color
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX, CATEGORY_COLORS } from '../../core/constants.js';

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category?.toLowerCase()] || CATEGORY_COLORS.default;
}

export function renderCategoryBadge(category: string): string {
  if (!category) return '';
  const color = getCategoryColor(category);
  return `<span class="${CSS_PREFIX}-category-badge" style="--cat-color: ${color}">${category}</span>`;
}
