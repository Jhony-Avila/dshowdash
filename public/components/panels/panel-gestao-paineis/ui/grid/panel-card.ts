/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/grid/panel-card.ts
 * @version 2.1.0
 * v2.1.0: Thumbnail click navigates to panel route
 *         Yellow DESATUALIZADO badge if screenshot > 7 days old
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../../core/constants.js';
import type { PanelData } from '../../core/types.js';
import { renderStatusBadge } from '../indicators/status-badge.js';
import { renderCategoryBadge } from '../indicators/category-badge.js';
import { renderScreenshotAge } from '../indicators/screenshot-age.js';
import { renderToggleButton } from '../actions/toggle-active.js';
import { renderScreenshotButton } from '../actions/screenshot-button.js';

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const PLACEHOLDER_SVG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isScreenshotOutdated(thumbnailUpdatedAt: string | null): boolean {
  if (!thumbnailUpdatedAt) return false;
  const updated = new Date(thumbnailUpdatedAt).getTime();
  if (isNaN(updated)) return false;
  return (Date.now() - updated) > SEVEN_DAYS_MS;
}

function getPanelRoute(panel: PanelData): string | null {
  if (panel.route) return panel.route;
  return null;
}

function renderThumbnail(panel: PanelData, isPending: boolean): string {
  const url = panel.thumbnail_url;
  const hasThumb = url != null && typeof url === 'string' && url.trim() !== '' && url !== 'null';

  const fallbackBlock = `
    <div class="${CSS_PREFIX}-card__thumb-fallback">
      ${PLACEHOLDER_SVG}
      <span class="${CSS_PREFIX}-card__thumb-label">${escapeHtml(panel.title)}</span>
    </div>`;

  /* ── Gradient overlays (top + bottom) ── */
  const overlayTop = `<div class="${CSS_PREFIX}-card__overlay-top"></div>`;
  const overlayBottom = `<div class="${CSS_PREFIX}-card__overlay-bottom"></div>`;

  /* ── Badges top-left: status + category ── */
  const outdatedBadge = isScreenshotOutdated(panel.thumbnail_updated_at)
    ? `<span class="${CSS_PREFIX}-badge ${CSS_PREFIX}-badge--outdated">DESATUALIZADO</span>`
    : '';

  const badges = `
    <div class="${CSS_PREFIX}-card__badges">
      ${renderStatusBadge(panel.is_active)}
      ${renderCategoryBadge(panel.category)}
      ${outdatedBadge}
    </div>`;

  /* ── Action icons center-top ── */
  const icons = `
    <div class="${CSS_PREFIX}-card__icons">
      ${renderToggleButton(panel.panel_id, panel.is_active)}
      ${renderScreenshotButton(panel.panel_id, isPending)}
    </div>`;

  /* ── Timestamp top-right ── */
  const timestamp = `
    <div class="${CSS_PREFIX}-card__timestamp">
      ${renderScreenshotAge(panel.last_screenshot_at)}
    </div>`;

  const imgTag = hasThumb
    ? `<img src="${escapeHtml(panel.thumbnail_url)}" alt="${escapeHtml(panel.title)}" loading="lazy"
        onerror="this.parentElement.classList.add('${CSS_PREFIX}-card__thumb--placeholder');this.remove();" />`
    : '';

  const placeholderClass = hasThumb ? '' : ` ${CSS_PREFIX}-card__thumb--placeholder`;

  /* ── MELHORIA 1: Thumbnail click navigates to panel ── */
  const route = getPanelRoute(panel);
  const thumbClick = route
    ? ` data-action="open-panel" data-panel-route="${escapeHtml(route)}"`
    : '';

  return `
    <div class="${CSS_PREFIX}-card__thumb${placeholderClass}"${thumbClick}>
      ${imgTag}
      ${fallbackBlock}
      ${overlayTop}
      ${overlayBottom}
      ${badges}
      ${icons}
      ${timestamp}
    </div>`;
}

export function renderPanelCard(panel: PanelData, isPending: boolean): string {
  const inactiveClass = !panel.is_active ? ` ${CSS_PREFIX}-card--inactive` : '';
  const pendingClass = isPending ? ` ${CSS_PREFIX}-card--pending` : '';
  const safeName = escapeHtml(panel.title);
  const version = panel.version ? `v${escapeHtml(panel.version)}` : '';

  return `
    <article class="${CSS_PREFIX}-card${inactiveClass}${pendingClass}" data-panel-id="${escapeHtml(panel.panel_id)}">
      ${renderThumbnail(panel, isPending)}
      <div class="${CSS_PREFIX}-card__footer">
        <span class="${CSS_PREFIX}-card__name" title="${safeName}">${safeName}</span>
        ${version ? `<span class="${CSS_PREFIX}-card__version">${version}</span>` : ''}
      </div>
    </article>`;
}
