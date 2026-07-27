const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "table-engine:validators";
const validators = {
  required: (value) => {
    if (value == null || value === "") return "Campo obrigat\xF3rio";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  minLength: (min) => (value) => {
    if (value && value.length < min) return `M\xEDnimo ${min} caracteres`;
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  maxLength: (max) => (value) => {
    if (value && value.length > max) return `M\xE1ximo ${max} caracteres`;
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  min: (minVal) => (value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num < minVal) return `Valor m\xEDnimo: ${minVal}`;
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  max: (maxVal) => (value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > maxVal) return `Valor m\xE1ximo: ${maxVal}`;
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  range: (min, max) => (value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && (num < min || num > max)) return `Valor deve estar entre ${min} e ${max}`;
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  number: (value) => {
    if (value && isNaN(parseFloat(value))) return "Deve ser um n\xFAmero";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  integer: (value) => {
    if (value && !Number.isInteger(parseFloat(value))) return "Deve ser um n\xFAmero inteiro";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  positive: (value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num < 0) return "Deve ser um valor positivo";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inv\xE1lido";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  url: (value) => {
    if (value && !/^https?:\/\/.+/.test(value)) return "URL inv\xE1lida";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  phone: (value) => {
    if (value && !/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/.test(value.replace(/\D/g, ""))) {
      return "Telefone inv\xE1lido";
    }
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  cpf: (value) => {
    if (!value) return true;
    const cpf = value.replace(/\D/g, "");
    if (cpf.length !== 11) return "CPF deve ter 11 d\xEDgitos";
    if (/^(\d)\1+$/.test(cpf)) return "CPF inv\xE1lido";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  cnpj: (value) => {
    if (!value) return true;
    const cnpj = value.replace(/\D/g, "");
    if (cnpj.length !== 14) return "CNPJ deve ter 14 d\xEDgitos";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  cep: (value) => {
    if (value && !/^\d{5}-?\d{3}$/.test(value)) return "CEP inv\xE1lido";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  date: (value) => {
    if (value && isNaN(Date.parse(value))) return "Data inv\xE1lida";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  futureDate: (value) => {
    if (value && new Date(value) <= /* @__PURE__ */ new Date()) return "Data deve ser futura";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  pastDate: (value) => {
    if (value && new Date(value) >= /* @__PURE__ */ new Date()) return "Data deve ser passada";
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  pattern: (regex, message = "Formato inv\xE1lido") => (value) => {
    if (value && !regex.test(value)) return message;
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  oneOf: (options) => (value) => {
    if (value && !options.includes(value)) return `Valor deve ser: ${options.join(", ")}`;
    return true;
  },
  // @ts-expect-error strict migration — TS2322
  custom: (fn, message = "Valor inv\xE1lido") => (value) => {
    if (!fn(value)) return message;
    return true;
  }
};
function compose(...fns) {
  return (value) => {
    for (const fn of fns) {
      const result = fn(value);
      if (result !== true) return result;
    }
    return true;
  };
}
function createValidatorForType(type, options = {}) {
  const validatorList = [];
  if (options.required) {
    validatorList.push(validators.required);
  }
  switch (type) {
    case "number":
    case "currency":
    case "percent":
      validatorList.push(validators.number);
      if (options.min !== void 0) validatorList.push(validators.min(options.min));
      if (options.max !== void 0) validatorList.push(validators.max(options.max));
      if (options.positive) validatorList.push(validators.positive);
      break;
    case "integer":
      validatorList.push(validators.integer);
      break;
    case "email":
      validatorList.push(validators.email);
      break;
    case "url":
      validatorList.push(validators.url);
      break;
    case "phone":
      validatorList.push(validators.phone);
      break;
    case "cpf":
      validatorList.push(validators.cpf);
      break;
    case "cnpj":
      validatorList.push(validators.cnpj);
      break;
    case "cep":
      validatorList.push(validators.cep);
      break;
    case "date":
    case "datetime":
      validatorList.push(validators.date);
      break;
    case "text":
    case "string":
    default:
      if (options.minLength) validatorList.push(validators.minLength(options.minLength));
      if (options.maxLength) validatorList.push(validators.maxLength(options.maxLength));
      if (options.pattern) validatorList.push(validators.pattern(options.pattern, options.patternMessage));
      break;
  }
  return compose(...validatorList);
}
function validate(value, validator) {
  if (!validator) return { valid: true };
  const result = typeof validator === "function" ? validator(value) : true;
  if (result === true) return { valid: true };
  return { valid: false, message: result };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, validators: Object.keys(validators) };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var validators_default = { validators, compose, createValidatorForType, validate, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  compose,
  createValidatorForType,
  validators_default as default,
  healthCheck,
  info,
  validate,
  validators
};
