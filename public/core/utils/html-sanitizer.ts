// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.utils.html-sanitizer
// PURPOSE: Enterprise XSS Protection - Sanitização centralizada de HTML
// ───────────────────────────────────────────────────────────────
// @contract P04 - Security compliant
// ───────────────────────────────────────────────────────────────
// PROVIDES: escapeHtml, sanitizeHtml, sanitizeUrl, stripTags
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.0.0-P04-ENTERPRISE - Initial P04
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.utils.html-sanitizer';

// Entidades HTML para escape
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

// Regex para detectar padrões perigosos
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
  /vbscript:/gi,
  /expression\s*\(/gi
];

// Tags permitidas por padrão (whitelist)
const DEFAULT_ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'span', 'div', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'a', 'img'];

// Atributos permitidos por padrão
const DEFAULT_ALLOWED_ATTRS = ['class', 'id', 'style', 'href', 'src', 'alt', 'title', 'data-*'];

const _metrics = {
  escapeCount: 0,
  sanitizeCount: 0,
  dangerousBlocked: 0,
  lastSanitizeAt: null as number | null
};

// Escape básico de HTML (converte caracteres especiais)
export function escapeHtml(str: unknown) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);
  _metrics.escapeCount++;
  return (str as string).replace(/[&<>"'`=\/]/g, (char: string) => (HTML_ENTITIES as Record<string, string>)[char] || char);
}

// Unescape HTML (reverte escape)
export function unescapeHtml(str: string) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');
}

// Verifica se string contém padrões perigosos
export function containsDangerousContent(str: string) {
  if (!str || typeof str !== 'string') return false;
  for (let i = 0; i < DANGEROUS_PATTERNS.length; i++) {
    if (DANGEROUS_PATTERNS[i].test(str)) {
      _metrics.dangerousBlocked++;
      return true;
    }
  }
  return false;
}

// Remove tags HTML completamente
export function stripTags(str: string) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

// Sanitiza HTML mantendo apenas tags permitidas
export function sanitizeHtml(html: string, options: { allowedTags?: string[]; allowedAttrs?: string[]; stripAll?: boolean } | undefined) {
  if (!html || typeof html !== 'string') return '';
  options = options || {};

  _metrics.sanitizeCount++;
  _metrics.lastSanitizeAt = Date.now();

  const allowedTags = options.allowedTags || DEFAULT_ALLOWED_TAGS;
  const allowedAttrs = options.allowedAttrs || DEFAULT_ALLOWED_ATTRS;
  const stripAll = options.stripAll || false;

  // Se stripAll, remove todas as tags
  if (stripAll) return stripTags(html);

  // Remove padrões perigosos primeiro
  let sanitized = html;
  for (let i = 0; i < DANGEROUS_PATTERNS.length; i++) {
    sanitized = sanitized.replace(DANGEROUS_PATTERNS[i], '');
  }

  // Remove tags não permitidas (abordagem simplificada)
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    const lowerTag = tagName.toLowerCase();
    if (allowedTags.indexOf(lowerTag) === -1) {
      _metrics.dangerousBlocked++;
      return '';
    }
    // Remove atributos não permitidos (simplificado)
    return match.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  });

  return sanitized;
}

// Sanitiza para uso em atributos HTML
export function sanitizeAttribute(value: unknown) {
  if (value === null || value === undefined) return '';
  return escapeHtml(String(value)).replace(/"/g, '&quot;');
}

// Sanitiza URL (previne javascript:, data:, etc)
export function sanitizeUrl(url: string) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim().toLowerCase();
  if (trimmed.indexOf('javascript:') === 0 ||
      trimmed.indexOf('vbscript:') === 0 ||
      trimmed.indexOf('data:') === 0) {
    _metrics.dangerousBlocked++;
    return '';
  }
  return url;
}

// Cria elemento de texto seguro (alternativa a innerHTML)
export function createTextNode(text: string | null | undefined) {
  if (typeof document === 'undefined') return null;
  return document.createTextNode(text || '');
}

// Cria elemento HTML seguro
export function createElement(tag: string, attributes: Record<string, unknown> | null | undefined, textContent?: string | null) {
  if (typeof document === 'undefined') return null;
  const el = document.createElement(tag);
  if (attributes) {
    for (const attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        el.setAttribute(attr, sanitizeAttribute(attributes[attr]));
      }
    }
  }
  if (textContent) {
    el.textContent = textContent;
  }
  return el;
}

// Template literal tag para HTML seguro
export function safeHtml(strings: TemplateStringsArray, ...values: unknown[]) {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += escapeHtml(values[i]);
    result += strings[i + 1];
  }
  return result;
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function resetMetrics() {
  _metrics.escapeCount = 0;
  _metrics.sanitizeCount = 0;
  _metrics.dangerousBlocked = 0;
  _metrics.lastSanitizeAt = null;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p04Compliant: true,
    metrics: getMetrics(),
    allowedTagsDefault: DEFAULT_ALLOWED_TAGS.length,
    allowedAttrsDefault: DEFAULT_ALLOWED_ATTRS.length
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    p04Compliant: true,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  escapeHtml,
  unescapeHtml,
  sanitizeHtml,
  sanitizeAttribute,
  sanitizeUrl,
  stripTags,
  containsDangerousContent,
  createTextNode,
  createElement,
  safeHtml,
  getMetrics,
  resetMetrics,
  info,
  healthCheck
};
