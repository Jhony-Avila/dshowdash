/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/modal/screenshot-viewer.ts
 * @version 1.0.0
 * Full-size screenshot viewer
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../../core/constants.js';

export function openScreenshotViewer(imageUrl: string, title: string): void {
  const existing = document.querySelector(`.${CSS_PREFIX}-viewer-overlay`);
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = `${CSS_PREFIX}-viewer-overlay`;
  overlay.innerHTML = `
    <div class="${CSS_PREFIX}-viewer">
      <div class="${CSS_PREFIX}-viewer__header">
        <span>${title}</span>
        <button class="${CSS_PREFIX}-viewer__close">&times;</button>
      </div>
      <img src="${imageUrl}" alt="${title}" class="${CSS_PREFIX}-viewer__img" />
    </div>`;

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).closest(`.${CSS_PREFIX}-viewer__close`)) {
      close();
    }
  });
  document.addEventListener('keydown', function handler(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handler);
    }
  });

  document.body.appendChild(overlay);
}
