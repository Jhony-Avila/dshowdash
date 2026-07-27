const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-16/utils/validators";
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
function isValidId(id) {
  if (!id) return false;
  const num = parseInt(id);
  return !isNaN(num) && num > 0;
}
function isValidCurrency(value) {
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
}
function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isNotEmpty(value) {
  if (value === null || value === void 0) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
function isValidCNPJ(cnpj) {
  if (!cnpj) return false;
  const clean = String(cnpj).replace(/\D/g, "");
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;
  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  let digits = clean.substring(size);
  let sum = 0, pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  return result === parseInt(digits.charAt(1));
}
function isValidUF(uf) {
  if (!uf) return false;
  const ufs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  return ufs.includes(String(uf).toUpperCase());
}
function isValidPhone(phone) {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, "");
  return clean.length >= 10 && clean.length <= 11;
}
function sanitizeString(str, maxLength = 500) {
  if (!str) return "";
  return String(str).trim().slice(0, maxLength).replace(/[<>]/g, "");
}
function sanitizeNumber(value, defaultValue = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}
function sanitizeCNPJ(cnpj) {
  if (!cnpj) return "";
  return String(cnpj).replace(/\D/g, "").slice(0, 14);
}
function validateFornecedor(data) {
  const errors = [];
  if (!isNotEmpty(data.razao_social)) errors.push("Raz\xE3o Social \xE9 obrigat\xF3ria");
  if (data.cnpj && !isValidCNPJ(data.cnpj)) errors.push("CNPJ inv\xE1lido");
  if (data.email && !isValidEmail(data.email)) errors.push("E-mail inv\xE1lido");
  if (data.uf && !isValidUF(data.uf)) errors.push("UF inv\xE1lido");
  if (data.telefone && !isValidPhone(data.telefone)) errors.push("Telefone inv\xE1lido");
  return { valid: errors.length === 0, errors };
}
function validateFilters(filters) {
  const errors = [];
  if (filters.dataInicio && !isValidDate(filters.dataInicio)) errors.push("Data inicial inv\xE1lida");
  if (filters.dataFim && !isValidDate(filters.dataFim)) errors.push("Data final inv\xE1lida");
  if (filters.dataInicio && filters.dataFim) {
    const s = new Date(filters.dataInicio), e = new Date(filters.dataFim);
    if (s > e) errors.push("Data inicial deve ser anterior \xE0 final");
  }
  return { valid: errors.length === 0, errors };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var validators_default = { isValidDate, isValidId, isValidCurrency, isValidEmail, isNotEmpty, isValidCNPJ, isValidUF, isValidPhone, sanitizeString, sanitizeNumber, sanitizeCNPJ, validateFornecedor, validateFilters };
export {
  MODULE_ID,
  VERSION,
  validators_default as default,
  healthCheck,
  info,
  isNotEmpty,
  isValidCNPJ,
  isValidCurrency,
  isValidDate,
  isValidEmail,
  isValidId,
  isValidPhone,
  isValidUF,
  sanitizeCNPJ,
  sanitizeNumber,
  sanitizeString,
  validateFilters,
  validateFornecedor
};
