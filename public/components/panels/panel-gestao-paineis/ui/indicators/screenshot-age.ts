/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/indicators/screenshot-age.ts
 * @version 1.0.0
 * Relative time indicator for screenshot age
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../../core/constants.js';

interface AgeResult {
  text: string;
  colorClass: string;
}

export function getScreenshotAge(isoDate: string | null): AgeResult {
  if (!isoDate) {
    return { text: 'Sem screenshot', colorClass: `${CSS_PREFIX}-age--none` };
  }
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  if (isNaN(then)) {
    return { text: 'Data inválida', colorClass: `${CSS_PREFIX}-age--none` };
  }
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 60) {
    return { text: `há ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`, colorClass: `${CSS_PREFIX}-age--fresh` };
  }
  if (diffHours < 24) {
    return { text: `há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`, colorClass: `${CSS_PREFIX}-age--fresh` };
  }
  if (diffDays <= 3) {
    return { text: `há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`, colorClass: `${CSS_PREFIX}-age--warning` };
  }
  if (diffDays <= 7) {
    return { text: `há ${diffDays} dias`, colorClass: `${CSS_PREFIX}-age--old` };
  }
  return { text: `há ${diffDays} dias`, colorClass: `${CSS_PREFIX}-age--stale` };
}

export function renderScreenshotAge(isoDate: string | null): string {
  const { text, colorClass } = getScreenshotAge(isoDate);
  return `<span class="${CSS_PREFIX}-age ${colorClass}">${text}</span>`;
}
