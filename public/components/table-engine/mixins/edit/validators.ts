// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:validators
// PURPOSE: Table Engine - Cell Validators
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   validators — exported value
//   compose() — exported function
//   createValidatorForType() — exported function
//   validate() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:validators';

// Validadores built-in
export const validators: Record<string, ((...args: unknown[]) => unknown)> = {
  required: (value: unknown) => {
    if (value == null || value === '') return 'Campo obrigatório';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) return `Mínimo ${min} caracteres`;
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) return `Máximo ${max} caracteres`;
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  min: (minVal: number) => (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num < minVal) return `Valor mínimo: ${minVal}`;
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  max: (maxVal: number) => (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > maxVal) return `Valor máximo: ${maxVal}`;
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  range: (min: number, max: number) => (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && (num < min || num > max)) return `Valor deve estar entre ${min} e ${max}`;
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  number: (value: string) => {
    if (value && isNaN(parseFloat(value))) return 'Deve ser um número';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  integer: (value: string) => {
    if (value && !Number.isInteger(parseFloat(value))) return 'Deve ser um número inteiro';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  positive: (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num < 0) return 'Deve ser um valor positivo';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  url: (value: string) => {
    if (value && !/^https?:\/\/.+/.test(value)) return 'URL inválida';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  phone: (value: string) => {
    if (value && !/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/.test(value.replace(/\D/g, ''))) {
      return 'Telefone inválido';
    }
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  cpf: (value: string) => {
    if (!value) return true;
    const cpf = value.replace(/\D/g, '');
    if (cpf.length !== 11) return 'CPF deve ter 11 dígitos';
    if (/^(\d)\1+$/.test(cpf)) return 'CPF inválido';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  cnpj: (value: string) => {
    if (!value) return true;
    const cnpj = value.replace(/\D/g, '');
    if (cnpj.length !== 14) return 'CNPJ deve ter 14 dígitos';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  cep: (value: string) => {
    if (value && !/^\d{5}-?\d{3}$/.test(value)) return 'CEP inválido';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  date: (value: string) => {
    if (value && isNaN(Date.parse(value))) return 'Data inválida';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  futureDate: (value: string) => {
    if (value && new Date(value) <= new Date()) return 'Data deve ser futura';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  pastDate: (value: string) => {
    if (value && new Date(value) >= new Date()) return 'Data deve ser passada';
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  pattern: (regex: RegExp, message: string = 'Formato inválido') => (value: string) => {
    if (value && !regex.test(value)) return message;
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  oneOf: (options: string[]) => (value: string) => {
    if (value && !options.includes(value)) return `Valor deve ser: ${options.join(', ')}`;
    return true;
  },

  // @ts-expect-error strict migration — TS2322
  custom: (fn: (v: unknown) => boolean, message: string = 'Valor inválido') => (value: unknown) => {
    if (!fn(value)) return message;
    return true;
  }
};

// Combinar múltiplos validadores
export function compose(...fns: Array<(value: unknown) => unknown>) {
  return (value: unknown) => {
    for (const fn of fns) {
      const result = fn(value);
      if (result !== true) return result;
    }
    return true;
  };
}

// Criar validador para coluna baseado em tipo
export function createValidatorForType(type: string, options: { required?: boolean; min?: number; max?: number; positive?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp; patternMessage?: string } = {}) {
  const validatorList: Array<(value: unknown) => unknown> = [];

  if (options.required) {
    validatorList.push(validators.required);
  }

  switch (type) {
    case 'number':
    case 'currency':
    case 'percent':
      validatorList.push(validators.number);
      if (options.min !== undefined) validatorList.push(validators.min(options.min) as (value: unknown) => unknown);
      if (options.max !== undefined) validatorList.push(validators.max(options.max) as (value: unknown) => unknown);
      if (options.positive) validatorList.push(validators.positive);
      break;

    case 'integer':
      validatorList.push(validators.integer);
      break;

    case 'email':
      validatorList.push(validators.email);
      break;

    case 'url':
      validatorList.push(validators.url);
      break;

    case 'phone':
      validatorList.push(validators.phone);
      break;

    case 'cpf':
      validatorList.push(validators.cpf);
      break;

    case 'cnpj':
      validatorList.push(validators.cnpj);
      break;

    case 'cep':
      validatorList.push(validators.cep);
      break;

    case 'date':
    case 'datetime':
      validatorList.push(validators.date);
      break;

    case 'text':
    case 'string':
    default:
      if (options.minLength) validatorList.push(validators.minLength(options.minLength) as (value: unknown) => unknown);
      if (options.maxLength) validatorList.push(validators.maxLength(options.maxLength) as (value: unknown) => unknown);
      if (options.pattern) validatorList.push(validators.pattern(options.pattern, options.patternMessage) as (value: unknown) => unknown);
      break;
  }

  return compose(...validatorList);
}

// Validar valor
export function validate(value: unknown, validator: ((v: unknown) => unknown) | null) {
  if (!validator) return { valid: true };

  const result = typeof validator === 'function' ? validator(value) : true;

  if (result === true) return { valid: true };
  return { valid: false, message: result };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, validators: Object.keys(validators) };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { validators, compose, createValidatorForType, validate, info, healthCheck, VERSION, MODULE_ID };
