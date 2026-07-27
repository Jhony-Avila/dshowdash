// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-11.utils.formatters
// PURPOSE: Duration formatting and API data parsing for Card 11 (Average Time)
// ───────────────────────────────────────────────────────────────
// @contract FORMAT_DURATION - formatDuration(seconds) returns human-readable duration
// @contract PARSE_API - parseApiData(data) extracts averageTime from API
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (native Number methods)
// PROVIDES: formatDuration, parseApiData, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.0-ENTERPRISE: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-11.utils.formatters';

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function parseApiData(data: unknown) {
  if (!data) return { averageTime: null };
  const _d = data as Record<string, any>;
  const apiData = _d.data || _d;
  const value = apiData.value !== undefined ? parseFloat(apiData.value) : 0;
  return { averageTime: value };
}

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, exports: ['formatDuration', 'parseApiData'], timestamp: Date.now() }; }

export default { formatDuration, parseApiData };
