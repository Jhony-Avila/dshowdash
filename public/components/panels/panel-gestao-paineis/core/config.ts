/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/core/config.ts
 * @version 1.0.0
 * API URLs and configuration
 * ═══════════════════════════════════════════════════════════════ */

export const API = {
  panels: '/api/admin/panels',
  categories: '/api/admin/panels/categories',
  screenshot: (panelId: string) => `/api/admin/panels/${encodeURIComponent(panelId)}/screenshot`,
  thumbnailBase: '/storage/media/images/thumbnails/panels',
  screenshotBase: '/storage/media/images/screenshots',
} as const;

export const CONFIG = {
  refreshInterval: 120000,
  searchDebounceMs: 300,
  defaultPerPage: 50,
  maxPerPage: 200,
  screenshotPollInterval: 3000,
  screenshotPollMaxAttempts: 20,
  thumbnailWidth: 400,
  thumbnailHeight: 225,
  cardMinWidth: 260,
  cardMaxWidth: 400,
} as const;
