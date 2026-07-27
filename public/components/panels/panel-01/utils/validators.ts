// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/validators
// PURPOSE: Panel-01 Validators
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
//   sanitizeString() — exported function
//   sanitizeNumber() — exported function
//   validateFilters() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
export const MODULE_ID = 'panel-01/utils/validators';

export function isValidDate(dateStr: unknown) {
  if (!dateStr) return false;
  const date = new Date(String(dateStr));
  return !isNaN(date.getTime());
}

export function isValidId(id: unknown) {
  if (!id) return false;
  const num = parseInt(String(id));
  return !isNaN(num) && num > 0;
}

export function isValidCurrency(value: unknown) {
  const num = parseFloat(String(value));
  return !isNaN(num) && isFinite(num);
}

export function isValidEmail(email: unknown) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

export function isNotEmpty(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function sanitizeString(str: unknown, maxLength = 500) {
  if (!str) return '';
  return String(str)
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '');
}

export function sanitizeNumber(value: unknown, defaultValue = 0) {
  const num = parseFloat(String(value));
  return isNaN(num) ? defaultValue : num;
}

export function validateFilters(filters: Record<string, unknown>) {
  const errors = [];
  
  if (filters.dataInicio && !isValidDate(filters.dataInicio)) {
    errors.push('Data inicial inválida');
  }
  
  if (filters.dataFim && !isValidDate(filters.dataFim)) {
    errors.push('Data final inválida');
  }
  
  if (filters.dataInicio && filters.dataFim) {
    const start = new Date(String(filters.dataInicio));
    const end = new Date(String(filters.dataFim));
    if (start > end) {
      errors.push('Data inicial deve ser anterior à data final');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { isValidDate, isValidId, isValidCurrency, isValidEmail, isNotEmpty, sanitizeString, sanitizeNumber, validateFilters };
