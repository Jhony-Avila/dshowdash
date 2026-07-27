/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/grid/panel-grid.ts
 * @version 1.0.0
 * Responsive grid of panel cards
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../../core/constants.js';
import type { PanelData, ScreenshotRequest } from '../../core/types.js';
import { renderPanelCard } from './panel-card.js';

export function renderGrid(panels: PanelData[], pendingScreenshots: Map<string, ScreenshotRequest>): string {
  if (panels.length === 0) return '';

  const cards = panels.map(panel => {
    const isPending = pendingScreenshots.has(panel.panel_id);
    return renderPanelCard(panel, isPending);
  }).join('');

  return `<div class="${CSS_PREFIX}-grid">${cards}</div>`;
}

export function updateGrid(container: HTMLElement, panels: PanelData[], pendingScreenshots: Map<string, ScreenshotRequest>): void {
  const gridEl = container.querySelector(`.${CSS_PREFIX}-grid`);
  if (!gridEl) return;
  const html = panels.map(panel => {
    const isPending = pendingScreenshots.has(panel.panel_id);
    return renderPanelCard(panel, isPending);
  }).join('');
  gridEl.innerHTML = html;
}
