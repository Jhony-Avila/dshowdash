function isValidCNPJ(cnpj) {
  if (!cnpj) return false;
  const clean = String(cnpj).replace(/\D/g, "");
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;
  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  return result === parseInt(digits.charAt(1));
}
function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}
function isValidPhone(phone) {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, "");
  return clean.length >= 10 && clean.length <= 11;
}
var validators_default = { isValidCNPJ, isValidEmail, isValidPhone };
const MODULE_ID = "panel-05:utils:validators";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { validatorsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  validators_default as default,
  healthCheck,
  info,
  isValidCNPJ,
  isValidEmail,
  isValidPhone
};
