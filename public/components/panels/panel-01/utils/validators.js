const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/validators";
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(String(dateStr));
  return !isNaN(date.getTime());
}
function isValidId(id) {
  if (!id) return false;
  const num = parseInt(String(id));
  return !isNaN(num) && num > 0;
}
function isValidCurrency(value) {
  const num = parseFloat(String(value));
  return !isNaN(num) && isFinite(num);
}
function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}
function isNotEmpty(value) {
  if (value === null || value === void 0) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
function sanitizeString(str, maxLength = 500) {
  if (!str) return "";
  return String(str).trim().slice(0, maxLength).replace(/[<>]/g, "");
}
function sanitizeNumber(value, defaultValue = 0) {
  const num = parseFloat(String(value));
  return isNaN(num) ? defaultValue : num;
}
function validateFilters(filters) {
  const errors = [];
  if (filters.dataInicio && !isValidDate(filters.dataInicio)) {
    errors.push("Data inicial inv\xE1lida");
  }
  if (filters.dataFim && !isValidDate(filters.dataFim)) {
    errors.push("Data final inv\xE1lida");
  }
  if (filters.dataInicio && filters.dataFim) {
    const start = new Date(String(filters.dataInicio));
    const end = new Date(String(filters.dataFim));
    if (start > end) {
      errors.push("Data inicial deve ser anterior \xE0 data final");
    }
  }
  return { valid: errors.length === 0, errors };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var validators_default = { isValidDate, isValidId, isValidCurrency, isValidEmail, isNotEmpty, sanitizeString, sanitizeNumber, validateFilters };
export {
  MODULE_ID,
  VERSION,
  validators_default as default,
  healthCheck,
  info,
  isNotEmpty,
  isValidCurrency,
  isValidDate,
  isValidEmail,
  isValidId,
  sanitizeNumber,
  sanitizeString,
  validateFilters
};
