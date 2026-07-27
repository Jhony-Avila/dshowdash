// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-security-validator
// PURPOSE: Login Modal - Input Validator (Code-based, I18n-ready)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   VALIDATION_ERROR_CODES — exported value
//   InputValidator — exported class
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

export const VERSION = '5.5.0-ENTERPRISE';
export const MODULE_ID = 'login-modal-security-validator';

export const VALIDATION_ERROR_CODES = { REQUIRED: 'REQUIRED', EMPTY: 'EMPTY', TOO_SHORT: 'TOO_SHORT', TOO_LONG: 'TOO_LONG', INVALID_EMAIL: 'INVALID_EMAIL', INVALID_CHARACTERS: 'INVALID_CHARACTERS', NO_UPPERCASE: 'NO_UPPERCASE', NO_LOWERCASE: 'NO_LOWERCASE', NO_NUMBER: 'NO_NUMBER', NO_SPECIAL: 'NO_SPECIAL', COMMON_PASSWORD: 'COMMON_PASSWORD', UNKNOWN_ERROR: 'UNKNOWN_ERROR' };

const DEFAULT_ERROR_MESSAGES = { REQUIRED: 'Campo obrigatório', EMPTY: 'Campo não pode estar vazio', TOO_SHORT: 'Valor muito curto', TOO_LONG: 'Valor muito longo', INVALID_EMAIL: 'E-mail inválido', INVALID_CHARACTERS: 'Contém caracteres inválidos', NO_UPPERCASE: 'Deve conter letras maiúsculas', NO_LOWERCASE: 'Deve conter letras minúsculas', NO_NUMBER: 'Deve conter números', NO_SPECIAL: 'Deve conter caracteres especiais', COMMON_PASSWORD: 'Senha muito comum', UNKNOWN_ERROR: 'Erro desconhecido' };
const COMMON_PASSWORDS = new Set(['password', '123456', '12345678', 'qwerty', 'abc123', 'password123', 'admin', 'letmein', 'welcome', 'monkey']);

export class InputValidator {
  [key: string]: any;
  constructor(config: Record<string, any> = {}) {
    const security = config.security || {};
    this.maxUsernameLength = security.maxUsernameLength || 128; this.maxPasswordLength = Math.min(security.maxPasswordLength || 256, 256); this.minPasswordLength = security.minPasswordLength || 4;
    this.usernameNormalize = security.usernameNormalize ?? true; this.passwordNormalize = security.passwordNormalize ?? false; this.passwordTrim = security.passwordTrim ?? false;
    this.usernameEmailValidation = security.usernameEmailValidation ?? true;
    this.passwordComplexity = security.passwordComplexity || { requireUppercase: false, requireLowercase: false, requireNumber: false, requireSpecial: false, blacklistCommon: false };
    this.failFast = security.failFast ?? false; this.profile = security.profile || 'default';
    this.errorMessages = { ...DEFAULT_ERROR_MESSAGES, ...(config.i18n?.errors || {}) };
    this.emailRegex = security.emailRegex || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.invalidCharsRegex = security.invalidCharsRegex || /[<>"'`]/;
    this._metrics = { usernameValidations: 0, passwordValidations: 0, credentialValidations: 0, errors: 0 };
  }

  _normalize(str: string, shouldNormalize: boolean) { if (!shouldNormalize || !str || typeof str !== 'string') return str || ''; let normalized = str.normalize('NFKC'); normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, ''); normalized = normalized.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); return normalized; }
  _createError(code: string, params: Record<string, string> = {}) { this._metrics.errors++; let message = this.errorMessages[code] || this.errorMessages.UNKNOWN_ERROR; Object.keys(params).forEach(key => { message = message.replace(`{${key}}`, params[key]); }); return { code, message, params }; }

  validateUsername(username: string) { this._metrics.usernameValidations++; const errors = []; if (!username || typeof username !== 'string') return { valid: false, errors: [this._createError('REQUIRED')], value: '' }; let processed = this._normalize(username, this.usernameNormalize); processed = processed.trim(); if (processed.length === 0) { errors.push(this._createError('EMPTY')); if (this.failFast) return { valid: false, errors, value: '' }; } if (processed.length > this.maxUsernameLength) errors.push(this._createError('TOO_LONG', { max: this.maxUsernameLength })); if (this.invalidCharsRegex.test(processed)) errors.push(this._createError('INVALID_CHARACTERS')); if (this.usernameEmailValidation && processed.includes('@')) { if (!this.emailRegex.test(processed)) errors.push(this._createError('INVALID_EMAIL')); } return { valid: errors.length === 0, errors, value: processed }; }

  validatePassword(password: string) { this._metrics.passwordValidations++; const errors = []; if (!password || typeof password !== 'string') return { valid: false, errors: [this._createError('REQUIRED')], value: '' }; let processed = this._normalize(password, this.passwordNormalize); if (this.passwordTrim) processed = processed.trim(); if (processed.length === 0) { errors.push(this._createError('EMPTY')); if (this.failFast) return { valid: false, errors, value: '' }; } if (processed.length < this.minPasswordLength) errors.push(this._createError('TOO_SHORT', { min: this.minPasswordLength })); if (processed.length > this.maxPasswordLength) errors.push(this._createError('TOO_LONG', { max: this.maxPasswordLength })); const complexity = this.passwordComplexity; if (complexity.requireUppercase && !/[A-Z]/.test(processed)) errors.push(this._createError('NO_UPPERCASE')); if (complexity.requireLowercase && !/[a-z]/.test(processed)) errors.push(this._createError('NO_LOWERCASE')); if (complexity.requireNumber && !/[0-9]/.test(processed)) errors.push(this._createError('NO_NUMBER')); if (complexity.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(processed)) errors.push(this._createError('NO_SPECIAL')); if (complexity.blacklistCommon && COMMON_PASSWORDS.has(processed.toLowerCase())) errors.push(this._createError('COMMON_PASSWORD')); return { valid: errors.length === 0, errors, value: processed }; }

  validateCredentials(username: string, password: string) { this._metrics.credentialValidations++; const usernameResult = this.validateUsername(username); const passwordResult = this.validatePassword(password); return { valid: usernameResult.valid && passwordResult.valid, errors: [...usernameResult.errors, ...passwordResult.errors], username: usernameResult.value, password: passwordResult.value }; }

  info() { return { moduleId: MODULE_ID, version: VERSION, metrics: { ...this._metrics }, config: { maxUsernameLength: this.maxUsernameLength, maxPasswordLength: this.maxPasswordLength, minPasswordLength: this.minPasswordLength, profile: this.profile }, timestamp: Date.now() }; }
  healthCheck() { const checks = { configValid: this.minPasswordLength > 0 && this.maxPasswordLength > this.minPasswordLength, regexValid: this.emailRegex instanceof RegExp && this.invalidCharsRegex instanceof RegExp, messagesComplete: Object.keys(DEFAULT_ERROR_MESSAGES).every(k => this.errorMessages[k]) }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed >= 2, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
}

export default InputValidator;
