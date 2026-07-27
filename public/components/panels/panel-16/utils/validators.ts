// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16/utils/validators
// PURPOSE: Panel-16 Validators - Fornecedores 360º
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isValidDate() — exported function
//   isValidId() — exported function
//   isValidCurrency() — exported function
//   isValidEmail() — exported function
//   isNotEmpty() — exported function
//   isValidCNPJ() — exported function
//   isValidUF() — exported function
//   isValidPhone() — exported function
//   sanitizeString() — exported function
//   sanitizeNumber() — exported function
//   sanitizeCNPJ() — exported function
//   validateFornecedor() — exported function
//   validateFilters() — exported function
//   ... and 2 more exports
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-16/utils/validators';

export function isValidDate(dateStr: unknown) { if (!dateStr) return false; const date = new Date(dateStr as string); return !isNaN(date.getTime()); }
export function isValidId(id: unknown) { if (!id) return false; const num = parseInt(id as string); return !isNaN(num) && num > 0; }
export function isValidCurrency(value: unknown) { const num = parseFloat(value as string); return !isNaN(num) && isFinite(num); }
export function isValidEmail(email: unknown) { if (!email) return false; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email as string); }
export function isNotEmpty(value: unknown) { if (value === null || value === undefined) return false; if (typeof value === 'string') return value.trim().length > 0; if (Array.isArray(value)) return value.length > 0; return true; }

export function isValidCNPJ(cnpj: unknown) {
  if (!cnpj) return false;
  const clean = String(cnpj).replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;
  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  let digits = clean.substring(size);
  let sum = 0, pos = size - 7;
  for (let i = size; i >= 1; i--) { sum += parseInt(numbers.charAt(size - i)) * pos--; if (pos < 2) pos = 9; }
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0; pos = size - 7;
  for (let i = size; i >= 1; i--) { sum += parseInt(numbers.charAt(size - i)) * pos--; if (pos < 2) pos = 9; }
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  return result === parseInt(digits.charAt(1));
}

export function isValidUF(uf: unknown) {
  if (!uf) return false;
  const ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  return ufs.includes(String(uf).toUpperCase());
}

export function isValidPhone(phone: unknown) {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, '');
  return clean.length >= 10 && clean.length <= 11;
}

export function sanitizeString(str: unknown, maxLength = 500) { if (!str) return ''; return String(str).trim().slice(0, maxLength).replace(/[<>]/g, ''); }
export function sanitizeNumber(value: unknown, defaultValue = 0) { const num = parseFloat(value as string); return isNaN(num) ? defaultValue : num; }
export function sanitizeCNPJ(cnpj: unknown) { if (!cnpj) return ''; return String(cnpj).replace(/\D/g, '').slice(0, 14); }

export function validateFornecedor(data: Record<string, unknown>) {
  const errors = [];
  if (!isNotEmpty(data.razao_social)) errors.push('Razão Social é obrigatória');
  if (data.cnpj && !isValidCNPJ(data.cnpj)) errors.push('CNPJ inválido');
  if (data.email && !isValidEmail(data.email)) errors.push('E-mail inválido');
  if (data.uf && !isValidUF(data.uf)) errors.push('UF inválido');
  if (data.telefone && !isValidPhone(data.telefone)) errors.push('Telefone inválido');
  return { valid: errors.length === 0, errors };
}

export function validateFilters(filters: Record<string, unknown>) {
  const errors = [];
  if (filters.dataInicio && !isValidDate(filters.dataInicio)) errors.push('Data inicial inválida');
  if (filters.dataFim && !isValidDate(filters.dataFim)) errors.push('Data final inválida');
  if (filters.dataInicio && filters.dataFim) { const s = new Date(filters.dataInicio as string | number), e = new Date(filters.dataFim as string | number); if (s > e) errors.push('Data inicial deve ser anterior à final'); }
  return { valid: errors.length === 0, errors };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { isValidDate, isValidId, isValidCurrency, isValidEmail, isNotEmpty, isValidCNPJ, isValidUF, isValidPhone, sanitizeString, sanitizeNumber, sanitizeCNPJ, validateFornecedor, validateFilters };
