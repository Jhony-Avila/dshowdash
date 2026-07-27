// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences/utils/validators
// PURPOSE: Panel User Preferences - Validators
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   VALID_THEMES — exported value
//   VALID_DENSITIES — exported value
//   VALID_LANGUAGES — exported value
//   VALID_FONT_SIZES — exported value
//   VALID_TIMEZONES — exported value
//   isValidTheme() — exported function
//   isValidDensity() — exported function
//   isValidLanguage() — exported function
//   isValidFontSize() — exported function
//   isValidTimezone() — exported function
//   isValidEmail() — exported function
//   isNotEmpty() — exported function
//   isBoolean() — exported function
//   ... and 5 more exports
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
export const MODULE_ID = 'panel-user-preferences/utils/validators';

export const VALID_THEMES = ['light', 'dark', 'system', 'auto'];
export const VALID_DENSITIES = ['compact', 'comfortable', 'spacious'];
export const VALID_LANGUAGES = ['pt-BR', 'en-US', 'es-ES'];
export const VALID_FONT_SIZES = ['small', 'medium', 'large', 'x-large'];
export const VALID_TIMEZONES = ['America/Sao_Paulo', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'UTC'];

export function isValidTheme(theme: string) { return VALID_THEMES.includes(theme); }
export function isValidDensity(density: string) { return VALID_DENSITIES.includes(density); }
export function isValidLanguage(lang: string) { return VALID_LANGUAGES.includes(lang); }
export function isValidFontSize(size: string) { return VALID_FONT_SIZES.includes(size); }
export function isValidTimezone(tz: string) { return VALID_TIMEZONES.includes(tz); }
export function isValidEmail(email: string) { if (!email) return false; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
export function isNotEmpty(value: unknown) { if (value === null || value === undefined) return false; if (typeof value === 'string') return value.trim().length > 0; if (Array.isArray(value)) return value.length > 0; return true; }
export function isBoolean(value: unknown) { return typeof value === 'boolean'; }

export function sanitizeString(str: string, maxLength = 500) { if (!str) return ''; return String(str).trim().slice(0, maxLength).replace(/[<>]/g, ''); }

export function validatePreferences(prefs: Record<string, unknown>) {
  const errors = [];
  if (prefs.theme && !isValidTheme(prefs.theme as string)) errors.push('Tema inválido');
  if (prefs.density && !isValidDensity(prefs.density as string)) errors.push('Densidade inválida');
  if (prefs.language && !isValidLanguage(prefs.language as string)) errors.push('Idioma inválido');
  if (prefs.accessibility && (prefs.accessibility as Record<string, unknown>).fontSize && !isValidFontSize((prefs.accessibility as Record<string, unknown>).fontSize as string)) errors.push('Tamanho de fonte inválido');
  if (prefs.timezone && !isValidTimezone(prefs.timezone as string)) errors.push('Fuso horário inválido');
  return { valid: errors.length === 0, errors };
}

export function validateNotifications(notifs: Record<string, unknown>) {
  const errors = [];
  if (notifs.email !== undefined && !isBoolean(notifs.email)) errors.push('Preferência de email inválida');
  if (notifs.push !== undefined && !isBoolean(notifs.push)) errors.push('Preferência de push inválida');
  if (notifs.sound !== undefined && !isBoolean(notifs.sound)) errors.push('Preferência de som inválida');
  return { valid: errors.length === 0, errors };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { isValidTheme, isValidDensity, isValidLanguage, isValidFontSize, isValidTimezone, isValidEmail, isNotEmpty, isBoolean, sanitizeString, validatePreferences, validateNotifications, VALID_THEMES, VALID_DENSITIES, VALID_LANGUAGES, VALID_FONT_SIZES, VALID_TIMEZONES };
