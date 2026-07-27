// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: dashboard-utils
// PURPOSE: Panel-05 Dashboard Utils - Enterprise Premium AAA (Modular Re-export)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION as _VERSION, MODULE_ID as _MODULE_ID from ./constants.js
//   formatCurrency, formatNumber, formatCompact, formatPercent, formatDelta from ...
//   formatDate, formatRelativeTime from ./date-formatters.js
//   truncate, capitalize, titleCase, slugify, formatCNPJ, formatPhone from ./stri...
//   generateSparkline, generateMiniBar from ./charts.js
//   getStatusColor, getRiscoColor, getTrendColor, hexToRgba from ./colors.js
//   groupBy, sortBy, sumBy, avgBy, minBy, maxBy, unique from ./data-utils.js
//   isValidCNPJ, isValidEmail, isValidPhone from ./validators.js
//   debounce, throttle, deepClone, deepMerge from ./helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   formatCurrency — exported value
//   formatNumber — exported value
//   formatCompact — exported value
//   formatPercent — exported value
//   formatDelta — exported value
//   formatDate — exported value
//   formatRelativeTime — exported value
//   truncate — exported value
//   capitalize — exported value
//   titleCase — exported value
//   slugify — exported value
//   ... and 22 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION as _VERSION, MODULE_ID as _MODULE_ID } from './constants.js';

export const VERSION = _VERSION;
export const MODULE_ID = _MODULE_ID;

export { formatCurrency, formatNumber, formatCompact, formatPercent, formatDelta } from './number-formatters.js';
export { formatDate, formatRelativeTime } from './date-formatters.js';
export { truncate, capitalize, titleCase, slugify, formatCNPJ, formatPhone } from './string-formatters.js';
export { generateSparkline, generateMiniBar } from './charts.js';
export { getStatusColor, getRiscoColor, getTrendColor, hexToRgba } from './colors.js';
export { groupBy, sortBy, sumBy, avgBy, minBy, maxBy, unique } from './data-utils.js';
export { isValidCNPJ, isValidEmail, isValidPhone } from './validators.js';
export { debounce, throttle, deepClone, deepMerge } from './helpers.js';

import { formatCurrency, formatNumber, formatCompact, formatPercent, formatDelta } from './number-formatters.js';
import { formatDate, formatRelativeTime } from './date-formatters.js';
import { truncate, capitalize, titleCase, slugify, formatCNPJ, formatPhone } from './string-formatters.js';
import { generateSparkline, generateMiniBar } from './charts.js';
import { getStatusColor, getRiscoColor, getTrendColor, hexToRgba } from './colors.js';
import { groupBy, sortBy, sumBy, avgBy, minBy, maxBy, unique } from './data-utils.js';
import { isValidCNPJ, isValidEmail, isValidPhone } from './validators.js';
import { debounce, throttle, deepClone, deepMerge } from './helpers.js';

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { dashboardUtilsReady: true } }; }

export default {
  VERSION,
  MODULE_ID,
  formatCurrency,
  formatNumber,
  formatCompact,
  formatPercent,
  formatDelta,
  formatDate,
  formatRelativeTime,
  truncate,
  capitalize,
  titleCase,
  slugify,
  formatCNPJ,
  formatPhone,
  generateSparkline,
  generateMiniBar,
  getStatusColor,
  getRiscoColor,
  getTrendColor,
  hexToRgba,
  groupBy,
  sortBy,
  sumBy,
  avgBy,
  minBy,
  maxBy,
  unique,
  isValidCNPJ,
  isValidEmail,
  isValidPhone,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  info,
  healthCheck
};
