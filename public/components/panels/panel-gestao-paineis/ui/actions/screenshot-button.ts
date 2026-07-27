/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/actions/screenshot-button.ts
 * @version 1.1.0
 * Screenshot capture — icon-only button (pna-btn-icon style)
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../../core/constants.js';

const CAMERA_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;

export function renderScreenshotButton(panelId: string, isPending: boolean): string {
  if (isPending) {
    return `<button class="${CSS_PREFIX}-btn-icon ${CSS_PREFIX}-btn-icon--pending" data-panel-id="${panelId}" disabled title="Capturando..."><span class="${CSS_PREFIX}-spinner"></span></button>`;
  }
  return `<button class="${CSS_PREFIX}-btn-icon" data-action="screenshot" data-panel-id="${panelId}" title="Capturar screenshot">${CAMERA_ICON}</button>`;
}
