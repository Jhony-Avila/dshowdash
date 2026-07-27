/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/render/skeleton.ts
 * @version 1.0.0
 * Loading skeleton with shimmer
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../core/constants.js';

function renderSkeletonCard(): string {
  return `
    <div class="${CSS_PREFIX}-skeleton-card">
      <div class="${CSS_PREFIX}-skeleton-thumb ${CSS_PREFIX}-shimmer"></div>
      <div class="${CSS_PREFIX}-skeleton-body">
        <div class="${CSS_PREFIX}-skeleton-line ${CSS_PREFIX}-shimmer" style="width:70%"></div>
        <div class="${CSS_PREFIX}-skeleton-line ${CSS_PREFIX}-shimmer" style="width:40%"></div>
        <div class="${CSS_PREFIX}-skeleton-line ${CSS_PREFIX}-shimmer" style="width:55%"></div>
      </div>
    </div>`;
}

export function renderSkeleton(count: number = 8): string {
  return `
    <div class="${CSS_PREFIX}-grid">
      ${Array.from({ length: count }, () => renderSkeletonCard()).join('')}
    </div>`;
}
