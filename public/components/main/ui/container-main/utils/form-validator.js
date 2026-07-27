import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:form-validator";
const RULES = Object.freeze({
  REQUIRED: "required",
  EMAIL: "email",
  URL: "url",
  MIN_LENGTH: "minLength",
  MAX_LENGTH: "maxLength",
  MIN: "min",
  MAX: "max",
  PATTERN: "pattern",
  MATCH: "match",
  NUMERIC: "numeric",
  ALPHA: "alpha",
  ALPHANUMERIC: "alphanumeric",
  DATE: "date",
  PHONE: "phone",
  CPF: "cpf",
  CNPJ: "cnpj",
  CEP: "cep",
  CREDIT_CARD: "creditCard",
  CUSTOM: "custom"
});
const DEFAULT_MESSAGES = {
  required: "Este campo \xE9 obrigat\xF3rio",
  email: "Email inv\xE1lido",
  url: "URL inv\xE1lida",
  minLength: "M\xEDnimo de {min} caracteres",
  maxLength: "M\xE1ximo de {max} caracteres",
  min: "Valor m\xEDnimo \xE9 {min}",
  max: "Valor m\xE1ximo \xE9 {max}",
  pattern: "Formato inv\xE1lido",
  match: "Os campos n\xE3o coincidem",
  numeric: "Apenas n\xFAmeros s\xE3o permitidos",
  alpha: "Apenas letras s\xE3o permitidas",
  alphanumeric: "Apenas letras e n\xFAmeros s\xE3o permitidos",
  date: "Data inv\xE1lida",
  phone: "Telefone inv\xE1lido",
  cpf: "CPF inv\xE1lido",
  cnpj: "CNPJ inv\xE1lido",
  cep: "CEP inv\xE1lido",
  creditCard: "Cart\xE3o de cr\xE9dito inv\xE1lido"
};
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
function validateCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0, remainder;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf[i - 1]) * (11 - i);
  remainder = sum * 10 % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf[i - 1]) * (12 - i);
  remainder = sum * 10 % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf[10]);
}
function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, "");
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i]) * weights1[i];
  let digit = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (digit !== parseInt(cnpj[12])) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i]) * weights2[i];
  digit = sum % 11 < 2 ? 0 : 11 - sum % 11;
  return digit === parseInt(cnpj[13]);
}
function validateCreditCard(number) {
  number = number.replace(/\D/g, "");
  if (number.length < 13 || number.length > 19) return false;
  let sum = 0, isEven = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}
function createFormValidator(options = {}) {
  const { customMessages = {}, customRules = {}, validateOnBlur = true, validateOnInput = false, showErrorsInline = true, errorClass = "cm-field-error", errorMessageClass = "cm-error-message", validClass = "cm-field-valid" } = options;
  const _logger = createLogger(MODULE_ID);
  const _messages = { ...DEFAULT_MESSAGES, ...customMessages };
  const _customRules = { ...customRules };
  const _forms = /* @__PURE__ */ new Map();
  let _metrics = { validated: 0, passed: 0, failed: 0 };
  const STYLES = `
    .cm-field-error { border-color: #ef4444 !important; background-color: rgba(239, 68, 68, 0.05) !important; }
    .cm-field-valid { border-color: #22c55e !important; }
    .cm-error-message { color: #ef4444; font-size: 12px; margin-top: 4px; display: block; }
    .cm-form-errors { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
    .cm-form-errors ul { margin: 0; padding-left: 20px; }
    .cm-form-errors li { color: #dc2626; font-size: 13px; margin: 4px 0; }
  `;
  function _injectStyles() {
    if (document.getElementById("cm-form-validator-styles")) return;
    const style = document.createElement("style");
    style.id = "cm-form-validator-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  function _formatMessage(message, params = {}) {
    return message.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? "");
  }
  function _validateField(value, rules, formData = {}) {
    const errors = [];
    const val = value?.toString().trim() ?? "";
    for (const rule of rules) {
      const ruleName = typeof rule === "string" ? rule : rule.rule;
      const ruleParams = typeof rule === "object" ? rule : {};
      const customMessage = ruleParams.message;
      let isValid = true;
      let message = customMessage || _messages[ruleName] || "Valor inv\xE1lido";
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
          isValid = !val || val.length >= ruleParams.min;
          message = _formatMessage(message, { min: ruleParams.min });
          break;
        case RULES.MAX_LENGTH:
          isValid = !val || val.length <= ruleParams.max;
          message = _formatMessage(message, { max: ruleParams.max });
          break;
        case RULES.MIN:
          isValid = !val || parseFloat(val) >= ruleParams.min;
          message = _formatMessage(message, { min: ruleParams.min });
          break;
        case RULES.MAX:
          isValid = !val || parseFloat(val) <= ruleParams.max;
          message = _formatMessage(message, { max: ruleParams.max });
          break;
        case RULES.PATTERN:
          isValid = !val || new RegExp(ruleParams.pattern).test(val);
          break;
        case RULES.MATCH:
          isValid = val === formData[ruleParams.field];
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
          isValid = !val || validateCPF(val);
          break;
        case RULES.CNPJ:
          isValid = !val || validateCNPJ(val);
          break;
        case RULES.CEP:
          isValid = !val || PATTERNS.cep.test(val);
          break;
        case RULES.CREDIT_CARD:
          isValid = !val || validateCreditCard(val);
          break;
        case RULES.CUSTOM:
          if (typeof ruleParams.validator === "function") {
            const result = ruleParams.validator(val, formData);
            isValid = result === true;
            if (typeof result === "string") message = result;
          }
          break;
        default:
          if (_customRules[ruleName]) {
            const result = _customRules[ruleName](val, ruleParams, formData);
            isValid = result === true;
            if (typeof result === "string") message = result;
          }
      }
      if (!isValid) {
        errors.push({ rule: ruleName, message });
        if (!ruleParams.continueOnError) break;
      }
    }
    return { valid: errors.length === 0, errors };
  }
  function _showFieldError(field, message) {
    _clearFieldError(field);
    field.classList.add(errorClass);
    field.classList.remove(validClass);
    if (showErrorsInline) {
      const errorEl = document.createElement("span");
      errorEl.className = errorMessageClass;
      errorEl.textContent = message;
      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }
  }
  function _clearFieldError(field) {
    field.classList.remove(errorClass);
    const errorEl = field.parentNode?.querySelector(`.${errorMessageClass}`);
    if (errorEl) errorEl.remove();
  }
  function _markFieldValid(field) {
    _clearFieldError(field);
    field.classList.add(validClass);
  }
  const validator = {
    // Registra formulário
    register(form, schema, options2 = {}) {
      if (typeof form === "string") form = document.querySelector(form);
      if (!form) return null;
      _injectStyles();
      const formId = form.id || `form-${Date.now()}`;
      const config = { form, schema, options: options2, listeners: [] };
      for (const [fieldName, rules] of Object.entries(schema)) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field) continue;
        if (validateOnBlur) {
          const blurHandler = () => this.validateField(formId, fieldName);
          field.addEventListener("blur", blurHandler);
          config.listeners.push({ field, event: "blur", handler: blurHandler });
        }
        if (validateOnInput) {
          const inputHandler = () => this.validateField(formId, fieldName);
          field.addEventListener("input", inputHandler);
          config.listeners.push({ field, event: "input", handler: inputHandler });
        }
      }
      const submitHandler = (e) => {
        const result = this.validate(formId);
        if (!result.valid) {
          e.preventDefault();
          options2.onError?.(result.errors);
        } else {
          options2.onSuccess?.(result.data);
          if (options2.preventDefault) e.preventDefault();
        }
      };
      form.addEventListener("submit", submitHandler);
      config.listeners.push({ field: form, event: "submit", handler: submitHandler });
      _forms.set(formId, config);
      return formId;
    },
    // Valida campo específico
    validateField(formId, fieldName) {
      const config = _forms.get(formId);
      if (!config) return { valid: false, errors: [] };
      const field = config.form.querySelector(`[name="${fieldName}"]`);
      const rules = config.schema[fieldName];
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
    validate(formId) {
      const config = _forms.get(formId);
      if (!config) return { valid: false, errors: {}, data: {} };
      const formData = this.getFormData(formId);
      const errors = {};
      let isValid = true;
      _metrics.validated++;
      for (const [fieldName, rules] of Object.entries(config.schema)) {
        const field = config.form.querySelector(`[name="${fieldName}"]`);
        const value = formData[fieldName];
        const result = _validateField(value, rules, formData);
        if (!result.valid) {
          isValid = false;
          errors[fieldName] = result.errors;
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
    getFormData(formId) {
      const config = _forms.get(formId);
      if (!config) return {};
      const formData = new FormData(config.form);
      const data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      return data;
    },
    // Limpa erros
    clearErrors(formId) {
      const config = _forms.get(formId);
      if (!config) return;
      for (const fieldName of Object.keys(config.schema)) {
        const field = config.form.querySelector(`[name="${fieldName}"]`);
        if (field) _clearFieldError(field);
      }
    },
    // Reseta formulário
    reset(formId) {
      const config = _forms.get(formId);
      if (!config) return;
      config.form.reset();
      this.clearErrors(formId);
    },
    // Remove registro
    unregister(formId) {
      const config = _forms.get(formId);
      if (!config) return;
      for (const { field, event, handler } of config.listeners) {
        field.removeEventListener(event, handler);
      }
      _forms.delete(formId);
    },
    // Valida valor avulso
    validateValue(value, rules) {
      return _validateField(value, rules);
    },
    // Adiciona regra customizada
    addRule(name, validator2) {
      _customRules[name] = validator2;
    },
    // Getters
    getMetrics() {
      return { ..._metrics };
    },
    resetMetrics() {
      _metrics = { validated: 0, passed: 0, failed: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, registeredForms: _forms.size, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, rules: Object.keys(RULES), registeredForms: _forms.size };
    },
    destroy() {
      for (const formId of _forms.keys()) {
        this.unregister(formId);
      }
      const styles = document.getElementById("cm-form-validator-styles");
      if (styles) styles.remove();
    }
  };
  return validator;
}
let _instance = null;
function getFormValidator(options = {}) {
  if (!_instance) _instance = createFormValidator(options);
  return _instance;
}
function resetFormValidator() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, rules: Object.keys(RULES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var form_validator_default = { VERSION, MODULE_ID, RULES, createFormValidator, getFormValidator, resetFormValidator, info, healthCheck };
export {
  MODULE_ID,
  RULES,
  VERSION,
  createFormValidator,
  form_validator_default as default,
  getFormValidator,
  healthCheck,
  info,
  resetFormValidator
};
