
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:form-validator
// PURPOSE: Form Validator - Validação de formulários com regras
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RULES — exported value
//   createFormValidator() — exported function
//   getFormValidator() — exported function
//   resetFormValidator() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'blur'
//   'input'
//   'submit'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:form-validator';

// Regras built-in
export const RULES = Object.freeze({
  REQUIRED: 'required',
  EMAIL: 'email',
  URL: 'url',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  MIN: 'min',
  MAX: 'max',
  PATTERN: 'pattern',
  MATCH: 'match',
  NUMERIC: 'numeric',
  ALPHA: 'alpha',
  ALPHANUMERIC: 'alphanumeric',
  DATE: 'date',
  PHONE: 'phone',
  CPF: 'cpf',
  CNPJ: 'cnpj',
  CEP: 'cep',
  CREDIT_CARD: 'creditCard',
  CUSTOM: 'custom'
});

// Mensagens padrão
const DEFAULT_MESSAGES = {
  required: 'Este campo é obrigatório',
  email: 'Email inválido',
  url: 'URL inválida',
  minLength: 'Mínimo de {min} caracteres',
  maxLength: 'Máximo de {max} caracteres',
  min: 'Valor mínimo é {min}',
  max: 'Valor máximo é {max}',
  pattern: 'Formato inválido',
  match: 'Os campos não coincidem',
  numeric: 'Apenas números são permitidos',
  alpha: 'Apenas letras são permitidas',
  alphanumeric: 'Apenas letras e números são permitidos',
  date: 'Data inválida',
  phone: 'Telefone inválido',
  cpf: 'CPF inválido',
  cnpj: 'CNPJ inválido',
  cep: 'CEP inválido',
  creditCard: 'Cartão de crédito inválido'
};

// Patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
  numeric: /^\d+$/,
  alpha: /^[a-zA-ZÀ-ÿ\s]+$/,
  alphanumeric: /^[a-zA-Z0-9À-ÿ\s]+$/,
  phone: /^(\+55\s?)?(\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}$/,
  cpf: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  cnpj: /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/,
  cep: /^\d{5}-?\d{3}$/,
  creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  date: /^\d{2}\/\d{2}\/\d{4}$/
};

// Valida CPF
function validateCPF(cpf: Record<string, unknown>) {
  cpf = (cpf.replace as (...args: unknown[]) => unknown)(/\D/g, '') as Record<string, unknown>;
  // @ts-expect-error TS migration - TS2345
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0, remainder;
  // @ts-expect-error TS migration - TS2345
  for (let i = 1; i <= 9; i++) sum += parseInt((cpf as Record<string, unknown>)[i - 1]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  // @ts-expect-error TS migration - TS2345
  if (remainder !== parseInt((cpf as Record<string, unknown>)[9])) return false;
  sum = 0;
  // @ts-expect-error TS migration - TS2345
  for (let i = 1; i <= 10; i++) sum += parseInt((cpf as Record<string, unknown>)[i - 1]) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  // @ts-expect-error TS migration - TS2345
  return remainder === parseInt((cpf as Record<string, unknown>)[10]);
}

// Valida CNPJ
function validateCNPJ(cnpj: Record<string, unknown>) {
  cnpj = (cnpj.replace as (...args: unknown[]) => unknown)(/\D/g, '') as Record<string, unknown>;
  // @ts-expect-error TS migration - TS2345
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  // @ts-expect-error TS migration - TS2345
  for (let i = 0; i < 12; i++) sum += parseInt((cnpj as Record<string, unknown>)[i]) * weights1[i];
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  // @ts-expect-error TS migration - TS2345
  if (digit !== parseInt((cnpj as Record<string, unknown>)[12])) return false;
  sum = 0;
  // @ts-expect-error TS migration - TS2345
  for (let i = 0; i < 13; i++) sum += parseInt((cnpj as Record<string, unknown>)[i]) * weights2[i];
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  // @ts-expect-error TS migration - TS2345
  return digit === parseInt((cnpj as Record<string, unknown>)[13]);
}

// Valida cartão (Luhn)
function validateCreditCard(number: number) {
  // @ts-expect-error TS migration - TS2339
  number = number.replace(/\D/g, '');
  // @ts-expect-error TS migration - TS2339
  if (number.length < 13 || number.length > 19) return false;
  let sum = 0, isEven = false;
  // @ts-expect-error TS migration - TS2339
  for (let i = number.length - 1; i >= 0; i--) {
    // @ts-expect-error TS migration - TS2345
    let digit = parseInt((number as unknown as Record<string, unknown>)[i]);
    if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

// Cria o Form Validator
export function createFormValidator(options: Record<string, any> = {}) {
  const { customMessages = {}, customRules = {}, validateOnBlur = true, validateOnInput = false, showErrorsInline = true, errorClass = 'cm-field-error', errorMessageClass = 'cm-error-message', validClass = 'cm-field-valid' } = options;

  const _logger = createLogger(MODULE_ID);
  const _messages = { ...DEFAULT_MESSAGES, ...customMessages };
  const _customRules = { ...customRules };
  const _forms = new Map();
  let _metrics = { validated: 0, passed: 0, failed: 0 };

  // Estilos
  const STYLES = `
    .cm-field-error { border-color: #ef4444 !important; background-color: rgba(239, 68, 68, 0.05) !important; }
    .cm-field-valid { border-color: #22c55e !important; }
    .cm-error-message { color: #ef4444; font-size: 12px; margin-top: 4px; display: block; }
    .cm-form-errors { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
    .cm-form-errors ul { margin: 0; padding-left: 20px; }
    .cm-form-errors li { color: #dc2626; font-size: 13px; margin: 4px 0; }
  `;

  // Injeta estilos
  function _injectStyles() {
    if (document.getElementById('cm-form-validator-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-form-validator-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // Formata mensagem
  function _formatMessage(message: string, params = {}) {
    // @ts-expect-error TS migration - TS2769
    return message.replace(/\{(\w+)\}/g, (_: unknown, key: string) => (params as Record<string, unknown>)[key] ?? '');
  }

  // Valida campo individual
  function _validateField(value: unknown, rules: Record<string, unknown>, formData = {}) {
    const errors = [];
    const val = value?.toString().trim() ?? '';

    for (const rule of (rules as unknown as unknown[])) {
      const ruleName = typeof rule === 'string' ? rule : (rule as Record<string, unknown>).rule;
      const ruleParams = typeof rule === 'object' ? rule : {};
      // @ts-expect-error TS migration - TS2339
      const customMessage = ruleParams.message;

      let isValid = true;
      let message = customMessage || _messages[ruleName as string] || 'Valor inválido';

      switch (ruleName) {
        case RULES.REQUIRED:
          isValid = val.length > 0;
          break;
        case RULES.EMAIL:
          isValid = !val || PATTERNS.email.test(val);
          break;
        case RULES.URL:
          isValid = !val || PATTERNS.url.test(val);
          break;
        case RULES.MIN_LENGTH:
          // @ts-expect-error TS migration - TS2339
          isValid = !val || val.length >= ruleParams.min;
          // @ts-expect-error TS migration - TS2339
          message = _formatMessage(message, { min: ruleParams.min });
          break;
        case RULES.MAX_LENGTH:
          // @ts-expect-error TS migration - TS2339
          isValid = !val || val.length <= ruleParams.max;
          // @ts-expect-error TS migration - TS2339
          message = _formatMessage(message, { max: ruleParams.max });
          break;
        case RULES.MIN:
          // @ts-expect-error TS migration - TS2339
          isValid = !val || parseFloat(val) >= ruleParams.min;
          // @ts-expect-error TS migration - TS2339
          message = _formatMessage(message, { min: ruleParams.min });
          break;
        case RULES.MAX:
          // @ts-expect-error TS migration - TS2339
          isValid = !val || parseFloat(val) <= ruleParams.max;
          // @ts-expect-error TS migration - TS2339
          message = _formatMessage(message, { max: ruleParams.max });
          break;
        case RULES.PATTERN:
          // @ts-expect-error TS migration - TS2339
          isValid = !val || new RegExp(ruleParams.pattern).test(val);
          break;
        case RULES.MATCH:
          // @ts-expect-error TS migration - TS2339
          isValid = val === (formData as Record<string, unknown>)[ruleParams.field];
          break;
        case RULES.NUMERIC:
          isValid = !val || PATTERNS.numeric.test(val);
          break;
        case RULES.ALPHA:
          isValid = !val || PATTERNS.alpha.test(val);
          break;
        case RULES.ALPHANUMERIC:
          isValid = !val || PATTERNS.alphanumeric.test(val);
          break;
        case RULES.DATE:
          isValid = !val || PATTERNS.date.test(val);
          break;
        case RULES.PHONE:
          isValid = !val || PATTERNS.phone.test(val);
          break;
        case RULES.CPF:
          // @ts-expect-error TS migration - TS2345
          isValid = !val || validateCPF(val);
          break;
        case RULES.CNPJ:
          // @ts-expect-error TS migration - TS2345
          isValid = !val || validateCNPJ(val);
          break;
        case RULES.CEP:
          isValid = !val || PATTERNS.cep.test(val);
          break;
        case RULES.CREDIT_CARD:
          // @ts-expect-error TS migration - TS2345
          isValid = !val || validateCreditCard(val);
          break;
        case RULES.CUSTOM:
          // @ts-expect-error TS migration - TS2339
          if (typeof ruleParams.validator === 'function') {
            // @ts-expect-error TS migration - TS2339
            const result = ruleParams.validator(val, formData);
            isValid = result === true;
            if (typeof result === 'string') message = result;
          }
          break;
        default:
          if (_customRules[ruleName as string]) {
            const result = _customRules[ruleName as string](val, ruleParams, formData);
            isValid = result === true;
            if (typeof result === 'string') message = result;
          }
      }

      if (!isValid) {
        errors.push({ rule: ruleName, message });
        // @ts-expect-error TS migration - TS2339
        if (!ruleParams.continueOnError) break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Mostra erro inline
  function _showFieldError(field: HTMLElement, message: string) {
    _clearFieldError(field);
    field.classList.add(errorClass);
    field.classList.remove(validClass);
    if (showErrorsInline) {
      const errorEl = document.createElement('span');
      errorEl.className = errorMessageClass;
      errorEl.textContent = message;
      // @ts-expect-error strict migration — TS18047
      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }
  }

  // Limpa erro inline
  function _clearFieldError(field: HTMLElement) {
    field.classList.remove(errorClass);
    const errorEl = field.parentNode?.querySelector(`.${errorMessageClass}`);
    if (errorEl) errorEl.remove();
  }

  // Marca campo válido
  function _markFieldValid(field: HTMLElement) {
    _clearFieldError(field);
    field.classList.add(validClass);
  }

  const validator = {
    // Registra formulário
    register(form: Record<string, unknown>, schema: Record<string, unknown>, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof form === 'string') form = document.querySelector(form);
      if (!form) return null;

      _injectStyles();

      const formId = form.id || `form-${Date.now()}`;
      const config = { form, schema, options, listeners: [] as unknown[] };

      // Listeners de campo
      for (const [fieldName, rules] of Object.entries(schema)) {
        const field = (form.querySelector as (...args: unknown[]) => unknown)(`[name="${fieldName}"]`);
        if (!field) continue;

        if (validateOnBlur) {
          const blurHandler = () => this.validateField(formId, fieldName);
          (field as HTMLElement).addEventListener('blur', blurHandler);
          config.listeners.push({ field, event: 'blur', handler: blurHandler });
        }

        if (validateOnInput) {
          const inputHandler = () => this.validateField(formId, fieldName);
          (field as HTMLElement).addEventListener('input', inputHandler);
          config.listeners.push({ field, event: 'input', handler: inputHandler });
        }
      }

      // Submit handler
      const submitHandler = (e: Event) => {
        const result = this.validate(formId);
        if (!result.valid) {
          e.preventDefault();
          options.onError?.(result.errors);
        } else {
          options.onSuccess?.(result.data);
          if (options.preventDefault) e.preventDefault();
        }
      };
      (form.addEventListener as (...args: unknown[]) => unknown)('submit', submitHandler);
      config.listeners.push({ field: form, event: 'submit', handler: submitHandler });

      _forms.set(formId, config);
      return formId;
    },

    // Valida campo específico
    validateField(formId: unknown, fieldName: unknown) {
      const config = _forms.get(formId);
      if (!config) return { valid: false, errors: [] };

      const field = config.form.querySelector(`[name="${fieldName}"]`);
      const rules = config.schema[fieldName as string];
      if (!field || !rules) return { valid: true, errors: [] };

      const formData = this.getFormData(formId);
      const result = _validateField(field.value, rules, formData);

      if (result.valid) {
        _markFieldValid(field);
      } else {
        _showFieldError(field, result.errors[0]?.message);
      }

      return result;
    },

    // Valida formulário completo
    validate(formId: unknown) {
      const config = _forms.get(formId);
      if (!config) return { valid: false, errors: {}, data: {} };

      const formData = this.getFormData(formId);
      const errors = {};
      let isValid = true;

      _metrics.validated++;

      for (const [fieldName, rules] of Object.entries(config.schema)) {
        const field = config.form.querySelector(`[name="${fieldName}"]`);
        // @ts-expect-error strict migration — TS7053
        const value = formData[fieldName];
        const result = _validateField(value, (rules as Record<string, unknown>), formData);

        if (!result.valid) {
          isValid = false;
          (errors as Record<string, unknown>)[fieldName] = result.errors;
          if (field) _showFieldError(field, result.errors[0]?.message);
        } else if (field) {
          _markFieldValid(field);
        }
      }

      if (isValid) {
        _metrics.passed++;
      } else {
        _metrics.failed++;
      }

      return { valid: isValid, errors, data: formData };
    },

    // Obtém dados do formulário
    getFormData(formId: unknown) {
      const config = _forms.get(formId);
      if (!config) return {};

      const formData = new FormData(config.form);
      const data = {};
      for (const [key, value] of formData.entries()) {
        (data as Record<string, unknown>)[key] = value;
      }
      return data;
    },

    // Limpa erros
    clearErrors(formId: unknown) {
      const config = _forms.get(formId);
      if (!config) return;

      for (const fieldName of Object.keys(config.schema)) {
        const field = config.form.querySelector(`[name="${fieldName}"]`);
        if (field) _clearFieldError(field);
      }
    },

    // Reseta formulário
    reset(formId: unknown) {
      const config = _forms.get(formId);
      if (!config) return;

      config.form.reset();
      this.clearErrors(formId);
    },

    // Remove registro
    unregister(formId: unknown) {
      const config = _forms.get(formId);
      if (!config) return;

      for (const { field, event, handler } of config.listeners) {
        field.removeEventListener(event, handler);
      }
      _forms.delete(formId);
    },

    // Valida valor avulso
    validateValue(value: unknown, rules: Record<string, unknown>) {
      return _validateField(value, rules);
    },

    // Adiciona regra customizada
    addRule(name: string, validator: (...args: unknown[]) => void) {
      _customRules[name] = validator;
    },

    // Getters
    getMetrics() { return { ..._metrics }; },
    resetMetrics() { _metrics = { validated: 0, passed: 0, failed: 0 }; },

    healthCheck() {
      return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, registeredForms: _forms.size, metrics: _metrics };
    },

    info() {
      return { moduleId: MODULE_ID, version: VERSION, rules: Object.keys(RULES), registeredForms: _forms.size };
    },

    destroy() {
      for (const formId of _forms.keys()) {
        this.unregister(formId);
      }
      const styles = document.getElementById('cm-form-validator-styles');
      if (styles) styles.remove();
    }
  };

  return validator;
}

// Singleton
let _instance: Record<string, unknown> | null = null;
export function getFormValidator(options = {}) { if (!_instance) _instance = createFormValidator(options); return _instance; }
export function resetFormValidator() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function info() { return { moduleId: MODULE_ID, version: VERSION, rules: Object.keys(RULES) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, RULES, createFormValidator, getFormValidator, resetFormValidator, info, healthCheck };
