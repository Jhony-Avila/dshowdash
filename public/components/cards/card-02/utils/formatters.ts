// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-02.utils.formatters
// PURPOSE: Percent formatting and API data parsing for Card 02 (Global Rate)
// ───────────────────────────────────────────────────────────────
// @contract FORMAT_PERCENT - formatPercent(value) returns percentage string
// @contract PARSE_API - parseApiData(data) extracts successRate from API
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: formatPercent, parseApiData, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.0-ENTERPRISE: ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-02.utils.formatters';

export const formatPercent = (value: unknown) => {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return `${Math.round(num)}%`;
};

export const parseApiData = (data: unknown) => {
  if (!data) return { successRate: null };
  const _d = data as Record<string, any>;
  const apiData = _d.data || _d;
  const rate = apiData.success_rate !== undefined ? apiData.success_rate : (apiData.rate || 0);
  return { successRate: parseFloat(rate) };
};

export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, exports: ['formatPercent', 'parseApiData'], timestamp: Date.now() });

export default { formatPercent, parseApiData };
