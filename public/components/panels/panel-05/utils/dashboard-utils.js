import { VERSION as _VERSION, MODULE_ID as _MODULE_ID } from "./constants.js";
const VERSION = _VERSION;
const MODULE_ID = _MODULE_ID;
import { formatCurrency, formatNumber, formatCompact, formatPercent, formatDelta } from "./number-formatters.js";
import { formatDate, formatRelativeTime } from "./date-formatters.js";
import { truncate, capitalize, titleCase, slugify, formatCNPJ, formatPhone } from "./string-formatters.js";
import { generateSparkline, generateMiniBar } from "./charts.js";
import { getStatusColor, getRiscoColor, getTrendColor, hexToRgba } from "./colors.js";
import { groupBy, sortBy, sumBy, avgBy, minBy, maxBy, unique } from "./data-utils.js";
import { isValidCNPJ, isValidEmail, isValidPhone } from "./validators.js";
import { debounce, throttle, deepClone, deepMerge } from "./helpers.js";
import { formatCurrency as formatCurrency2, formatNumber as formatNumber2, formatCompact as formatCompact2, formatPercent as formatPercent2, formatDelta as formatDelta2 } from "./number-formatters.js";
import { formatDate as formatDate2, formatRelativeTime as formatRelativeTime2 } from "./date-formatters.js";
import { truncate as truncate2, capitalize as capitalize2, titleCase as titleCase2, slugify as slugify2, formatCNPJ as formatCNPJ2, formatPhone as formatPhone2 } from "./string-formatters.js";
import { generateSparkline as generateSparkline2, generateMiniBar as generateMiniBar2 } from "./charts.js";
import { getStatusColor as getStatusColor2, getRiscoColor as getRiscoColor2, getTrendColor as getTrendColor2, hexToRgba as hexToRgba2 } from "./colors.js";
import { groupBy as groupBy2, sortBy as sortBy2, sumBy as sumBy2, avgBy as avgBy2, minBy as minBy2, maxBy as maxBy2, unique as unique2 } from "./data-utils.js";
import { isValidCNPJ as isValidCNPJ2, isValidEmail as isValidEmail2, isValidPhone as isValidPhone2 } from "./validators.js";
import { debounce as debounce2, throttle as throttle2, deepClone as deepClone2, deepMerge as deepMerge2 } from "./helpers.js";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { dashboardUtilsReady: true } };
}
var dashboard_utils_default = {
  VERSION,
  MODULE_ID,
  formatCurrency: formatCurrency2,
  formatNumber: formatNumber2,
  formatCompact: formatCompact2,
  formatPercent: formatPercent2,
  formatDelta: formatDelta2,
  formatDate: formatDate2,
  formatRelativeTime: formatRelativeTime2,
  truncate: truncate2,
  capitalize: capitalize2,
  titleCase: titleCase2,
  slugify: slugify2,
  formatCNPJ: formatCNPJ2,
  formatPhone: formatPhone2,
  generateSparkline: generateSparkline2,
  generateMiniBar: generateMiniBar2,
  getStatusColor: getStatusColor2,
  getRiscoColor: getRiscoColor2,
  getTrendColor: getTrendColor2,
  hexToRgba: hexToRgba2,
  groupBy: groupBy2,
  sortBy: sortBy2,
  sumBy: sumBy2,
  avgBy: avgBy2,
  minBy: minBy2,
  maxBy: maxBy2,
  unique: unique2,
  isValidCNPJ: isValidCNPJ2,
  isValidEmail: isValidEmail2,
  isValidPhone: isValidPhone2,
  debounce: debounce2,
  throttle: throttle2,
  deepClone: deepClone2,
  deepMerge: deepMerge2,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  avgBy,
  capitalize,
  debounce,
  deepClone,
  deepMerge,
  dashboard_utils_default as default,
  formatCNPJ,
  formatCompact,
  formatCurrency,
  formatDate,
  formatDelta,
  formatNumber,
  formatPercent,
  formatPhone,
  formatRelativeTime,
  generateMiniBar,
  generateSparkline,
  getRiscoColor,
  getStatusColor,
  getTrendColor,
  groupBy,
  healthCheck,
  hexToRgba,
  info,
  isValidCNPJ,
  isValidEmail,
  isValidPhone,
  maxBy,
  minBy,
  slugify,
  sortBy,
  sumBy,
  throttle,
  titleCase,
  truncate,
  unique
};
