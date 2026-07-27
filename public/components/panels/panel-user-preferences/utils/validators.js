const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences/utils/validators";
const VALID_THEMES = ["light", "dark", "system", "auto"];
const VALID_DENSITIES = ["compact", "comfortable", "spacious"];
const VALID_LANGUAGES = ["pt-BR", "en-US", "es-ES"];
const VALID_FONT_SIZES = ["small", "medium", "large", "x-large"];
const VALID_TIMEZONES = ["America/Sao_Paulo", "America/New_York", "Europe/London", "Asia/Tokyo", "UTC"];
function isValidTheme(theme) {
  return VALID_THEMES.includes(theme);
}
function isValidDensity(density) {
  return VALID_DENSITIES.includes(density);
}
function isValidLanguage(lang) {
  return VALID_LANGUAGES.includes(lang);
}
function isValidFontSize(size) {
  return VALID_FONT_SIZES.includes(size);
}
function isValidTimezone(tz) {
  return VALID_TIMEZONES.includes(tz);
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
function isBoolean(value) {
  return typeof value === "boolean";
}
function sanitizeString(str, maxLength = 500) {
  if (!str) return "";
  return String(str).trim().slice(0, maxLength).replace(/[<>]/g, "");
}
function validatePreferences(prefs) {
  const errors = [];
  if (prefs.theme && !isValidTheme(prefs.theme)) errors.push("Tema inv\xE1lido");
  if (prefs.density && !isValidDensity(prefs.density)) errors.push("Densidade inv\xE1lida");
  if (prefs.language && !isValidLanguage(prefs.language)) errors.push("Idioma inv\xE1lido");
  if (prefs.accessibility && prefs.accessibility.fontSize && !isValidFontSize(prefs.accessibility.fontSize)) errors.push("Tamanho de fonte inv\xE1lido");
  if (prefs.timezone && !isValidTimezone(prefs.timezone)) errors.push("Fuso hor\xE1rio inv\xE1lido");
  return { valid: errors.length === 0, errors };
}
function validateNotifications(notifs) {
  const errors = [];
  if (notifs.email !== void 0 && !isBoolean(notifs.email)) errors.push("Prefer\xEAncia de email inv\xE1lida");
  if (notifs.push !== void 0 && !isBoolean(notifs.push)) errors.push("Prefer\xEAncia de push inv\xE1lida");
  if (notifs.sound !== void 0 && !isBoolean(notifs.sound)) errors.push("Prefer\xEAncia de som inv\xE1lida");
  return { valid: errors.length === 0, errors };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var validators_default = { isValidTheme, isValidDensity, isValidLanguage, isValidFontSize, isValidTimezone, isValidEmail, isNotEmpty, isBoolean, sanitizeString, validatePreferences, validateNotifications, VALID_THEMES, VALID_DENSITIES, VALID_LANGUAGES, VALID_FONT_SIZES, VALID_TIMEZONES };
export {
  MODULE_ID,
  VALID_DENSITIES,
  VALID_FONT_SIZES,
  VALID_LANGUAGES,
  VALID_THEMES,
  VALID_TIMEZONES,
  VERSION,
  validators_default as default,
  healthCheck,
  info,
  isBoolean,
  isNotEmpty,
  isValidDensity,
  isValidEmail,
  isValidFontSize,
  isValidLanguage,
  isValidTheme,
  isValidTimezone,
  sanitizeString,
  validateNotifications,
  validatePreferences
};
