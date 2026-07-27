// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE5)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.security.escape-html
// PURPOSE: HTML Escape — Proteção XSS para inputs do admin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION, MODULE_ID
//   escapeHtml() — Escape HTML entities in strings
//   escapeAttr() — Escape HTML attribute values
//   sanitizeInput() — Sanitize user input (strip tags + escape)
//   escapeForRegex() — Escape regex special characters
//   info(), healthCheck()
//
// @origin Adapted from panel-01 escapeHtml utility
// @changelog
//   10.2.0-MIGRATION-PHASE5: Initial creation — FASE 5 F.1
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '10.2.0-MIGRATION-PHASE5';
export const MODULE_ID = 'panel-nav-admin.security.escape-html';

/**
 * Map of characters to HTML entities.
 * @private
 * @type {Object<string, string>}
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

/**
 * Regex for matching characters that need HTML escaping.
 * @private
 * @type {RegExp}
 */
const HTML_ESCAPE_RE = /[&<>"'`]/g;

/**
 * Regex for matching characters that need attribute escaping.
 * @private
 * @type {RegExp}
 */
const ATTR_ESCAPE_RE = /[&<>"'`\n\r\t]/g;

/**
 * Map for attribute escaping (includes whitespace characters).
 * @private
 * @type {Object<string, string>}
 */
const ATTR_ENTITIES = {
  ...HTML_ENTITIES,
  '\n': '&#10;',
  '\r': '&#13;',
  '\t': '&#9;'
};

/**
 * Escape HTML special characters in a string.
 * Use for text content that will be inserted into HTML.
 *
 * @param {*} input — Value to escape (will be coerced to string)
 * @returns {string} Escaped string
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(input: unknown) {
  if (input == null) return '';
  const str = String(input);
  if (str.length === 0) return '';
  return str.replace(HTML_ESCAPE_RE, (ch) => (HTML_ENTITIES as Record<string, string>)[ch] || ch);
}

/**
 * Escape a string for use in an HTML attribute value.
 * More aggressive than escapeHtml — also escapes newlines and tabs.
 *
 * @param {*} input — Value to escape
 * @returns {string} Escaped string
 *
 * @example
 * escapeAttr('value with "quotes" and\nnewline')
 * // 'value with &quot;quotes&quot; and&#10;newline'
 */
export function escapeAttr(input: unknown) {
  if (input == null) return '';
  const str = String(input);
  if (str.length === 0) return '';
  return str.replace(ATTR_ESCAPE_RE, (ch) => (ATTR_ENTITIES as Record<string, string>)[ch] || ch);
}

/**
 * Sanitize user input: strip HTML tags and escape remaining content.
 * Suitable for text inputs like labels, tooltips, etc.
 *
 * @param {*} input — Value to sanitize
 * @param {Object} [options]
 * @param {number} [options.maxLength=500] — Maximum string length
 * @param {boolean} [options.trim=true] — Trim whitespace
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input: unknown, options: Record<string, unknown> = {}) {
  const { maxLength = 500, trim = true } = options;

  if (input == null) return '';
  let str = String(input);

  // Strip HTML tags
  str = str.replace(/<[^>]*>/g, '');

  // Trim if requested
  if (trim) str = str.trim();

  // Truncate
  if (str.length > Number(maxLength)) str = str.substring(0, Number(maxLength));

  // Escape remaining HTML entities
  return escapeHtml(str);
}

/**
 * Escape special regex characters in a string.
 * Useful for building dynamic regex patterns from user input.
 *
 * @param {string} str — String to escape for regex
 * @returns {string}
 */
export function escapeForRegex(str: string) {
  if (!str) return '';
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a string contains potentially dangerous HTML.
 * @param {string} str
 * @returns {boolean}
 */
export function containsHtml(str: string) {
  if (!str) return false;
  return /<[a-z/!][^>]*>/i.test(String(str));
}

/** @returns {Object} Module info */
export function info() {
  return { moduleId: MODULE_ID, version: VERSION, functions: ['escapeHtml', 'escapeAttr', 'sanitizeInput', 'escapeForRegex', 'containsHtml'] };
}

/** @returns {Object} Health check */
export function healthCheck() {
  const testResult = escapeHtml('<script>') === '&lt;script&gt;';
  return { status: testResult ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, selfTestPassed: testResult };
}

export default { escapeHtml, escapeAttr, sanitizeInput, escapeForRegex, containsHtml, info, healthCheck, VERSION, MODULE_ID };
