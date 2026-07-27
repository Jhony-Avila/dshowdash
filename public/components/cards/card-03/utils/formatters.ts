// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-03.utils.formatters
// PURPOSE: Score formatting and API data parsing for Card 03 (Performance)
// ───────────────────────────────────────────────────────────────
// @contract FORMAT_SCORE - formatScore(value) returns rounded score string
// @contract PARSE_API - parseApiData(data) extracts score from API
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: formatScore, parseApiData, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.0-ENTERPRISE: ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-03.utils.formatters';

export const formatScore = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return Math.round(num).toString();
};

export const parseApiData = (data: Record<string, any>) => {
  if (!data) return { score: null };
  const apiData = data.data || data;
  const score = apiData.score !== undefined ? apiData.score : (apiData.value || 0);
  return { score: parseFloat(score) };
};

export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, exports: ['formatScore', 'parseApiData'], timestamp: Date.now() });

export default { formatScore, parseApiData };
