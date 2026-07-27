// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-05.utils.formatters
// PURPOSE: Number formatting and API data parsing for Card 05
// ───────────────────────────────────────────────────────────────
// @contract FORMAT_NUMBER - formatNumber(value) returns formatted pt-BR number
// @contract PARSE_API - parseApiData(data) extracts completed count from API
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: Intl.NumberFormat (native)
// PROVIDES: formatNumber, parseApiData, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.0-ENTERPRISE: ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-05.utils.formatters';

const numberFormatter = new Intl.NumberFormat('pt-BR');

export const formatNumber = (value: unknown) => {
  if (value === null || value === undefined) return '--';
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return numberFormatter.format(num);
};

export const parseApiData = (data: unknown) => {
  if (!data) return { completed: null };
  const _d = data as Record<string, any>;
  const apiData = _d.data || _d;
  const count = apiData.value !== undefined ? parseInt(apiData.value) : 0;
  return { completed: count };
};

export const healthCheck = () => ({
  status: 'HEALTHY',
  moduleId: MODULE_ID,
  version: VERSION,
  timestamp: Date.now()
});

export const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  exports: ['formatNumber', 'parseApiData'],
  timestamp: Date.now()
});

export default { formatNumber, parseApiData };
