
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE5-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:sanitizer
// PURPOSE: Input Sanitizer - Sanitização de entradas para segurança
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createSanitizer() — exported function
//   getSanitizer() — exported function
//   resetSanitizer() — exported function
//   escapeHtml() — exported function
//   sanitizeText() — exported function
//   sanitizeHtml() — exported function
//   sanitizeUrl() — exported function
//   sanitizeEmail() — exported function
//   isSafe() — exported function
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

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE5';
export const MODULE_ID = 'container-main:sanitizer';

// Padrões perigosos
const DANGEROUS_PATTERNS = {
  script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  event: /\bon\w+\s*=/gi,
  javascript: /javascript\s*:/gi,
  data: /data\s*:/gi,
  vbscript: /vbscript\s*:/gi,
  expression: /expression\s*\(/gi,
  iframe: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  object: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  embed: /<embed\b[^>]*>/gi,
  form: /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  meta: /<meta\b[^>]*>/gi,
  link: /<link\b[^>]*>/gi,
  style: /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  base: /<base\b[^>]*>/gi
};

// Entidades HTML
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

// Caracteres de controle
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;

// Cria o sanitizer
export function createSanitizer(options: Record<string, any> = {}) {
  const {
    allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span', 'div', 'a', 'ul', 'ol', 'li'],
    allowedAttributes = ['href', 'title', 'class', 'id', 'target'],
    allowedProtocols = ['http', 'https', 'mailto'],
    maxLength = 10000,
    stripControlChars = true,
    logAttempts = true
  } = options;

  const _logger = createLogger(MODULE_ID) as any;
  let _metrics = { sanitized: 0, blocked: 0, truncated: 0 };

  // Escapa HTML
  function _escapeHtml(str: string) {
    // @ts-expect-error TS migration - TS2769
    return String(str).replace(/[&<>"'`=\/]/g, char => (HTML_ENTITIES as Record<string, unknown>)[char]);
  }

  // Remove caracteres de controle
  function _stripControl(str: string) {
    return str.replace(CONTROL_CHARS, '');
  }

  // Verifica e sanitiza URL
  function _sanitizeUrl(url: string) {
    if (!url) return '';
    
    const trimmed = url.trim().toLowerCase();
    
    // Verifica protocolo
    const protocolMatch = trimmed.match(/^(\w+):/);
    if (protocolMatch) {
      const protocol = protocolMatch[1];
      if (!allowedProtocols.includes(protocol)) {
        _metrics.blocked++;
        if (logAttempts) _logger.warn('Blocked URL protocol:', protocol);
        return '';
      }
    }
    
    // Verifica padrões perigosos
    if (DANGEROUS_PATTERNS.javascript.test(trimmed) || DANGEROUS_PATTERNS.data.test(trimmed)) {
      _metrics.blocked++;
      if (logAttempts) _logger.warn('Blocked dangerous URL:', url.substring(0, 50));
      return '';
    }
    
    return url;
  }

  // Sanitiza atributos
  function _sanitizeAttributes(tag: string, attrs: Record<string, unknown>) {
    const result = {};
    
    for (const [key, value] of Object.entries(attrs)) {
      const lowerKey = key.toLowerCase();
      
      // Verifica se atributo é permitido
      if (!allowedAttributes.includes(lowerKey)) continue;
      
      // Verifica event handlers
      if (lowerKey.startsWith('on')) continue;
      
      // Sanitiza URLs em href/src
      if (lowerKey === 'href' || lowerKey === 'src') {
        const sanitizedUrl = _sanitizeUrl((value as string));
        if (sanitizedUrl) (result as Record<string, unknown>)[lowerKey] = sanitizedUrl;
      } else {
        (result as Record<string, unknown>)[lowerKey] = _escapeHtml((value as string));
      }
    }
    
    return result;
  }

  const sanitizer = {
    // Sanitiza string simples (escapa HTML)
    escapeHtml(input: HTMLInputElement) {
      if (typeof input !== 'string') return '';
      _metrics.sanitized++;
      return _escapeHtml(input);
    },

    // Sanitiza texto (remove tags, escapa)
    text(input: HTMLInputElement) {
      if (typeof input !== 'string') return '';
      
      let result = input;
      
      // Trunca se muito longo
      // @ts-expect-error TS migration - TS2339
      if (result.length > maxLength) {
        // @ts-expect-error TS migration - TS2322, TS2339
        result = result.substring(0, maxLength);
        _metrics.truncated++;
      }
      
      // Remove caracteres de controle
      if (stripControlChars) {
        // @ts-expect-error TS migration - TS2322
        result = _stripControl(result);
      }
      
      // Remove todas as tags HTML
      // @ts-expect-error TS migration - TS2322, TS2339
      result = result.replace(/<[^>]*>/g, '');
      
      // Escapa caracteres especiais
      // @ts-expect-error TS migration - TS2322
      result = _escapeHtml(result);
      
      _metrics.sanitized++;
      return result;
    },

    // Sanitiza HTML (permite tags seguras)
    html(input: HTMLInputElement) {
      if (typeof input !== 'string') return '';
      
      let result = input;
      
      // Trunca se muito longo
      // @ts-expect-error TS migration - TS2339
      if (result.length > maxLength) {
        // @ts-expect-error TS migration - TS2322, TS2339
        result = result.substring(0, maxLength);
        _metrics.truncated++;
      }
      
      // Remove scripts e tags perigosas
      for (const [name, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
        if (pattern.test(result)) {
          _metrics.blocked++;
          if (logAttempts) _logger.warn(`Blocked ${name} pattern`);
        }
        // @ts-expect-error TS migration - TS2322, TS2339
        result = result.replace(pattern, '');
      }
      
      // Remove event handlers
      // @ts-expect-error TS migration - TS2322, TS2339
      result = result.replace(DANGEROUS_PATTERNS.event, '');
      
      // Remove caracteres de controle
      if (stripControlChars) {
        // @ts-expect-error TS migration - TS2322
        result = _stripControl(result);
      }
      
      _metrics.sanitized++;
      return result;
    },

    // Sanitiza URL
    url(input: HTMLInputElement) {
      if (typeof input !== 'string') return '';
      _metrics.sanitized++;
      return _sanitizeUrl(input);
    },

    // Sanitiza número
    number(input: unknown, options: Record<string, any> = {}) {
      const { min = -Infinity, max = Infinity, default: defaultValue = 0 } = options;
      
      const num = parseFloat(String(input));
      if (isNaN(num)) return defaultValue;
      
      _metrics.sanitized++;
      return Math.max(min, Math.min(max, num));
    },

    // Sanitiza inteiro
    integer(input: unknown, options: Record<string, any> = {}) {
      const { min = -Infinity, max = Infinity, default: defaultValue = 0 } = options;
      
      const num = parseInt(String(input), 10);
      if (isNaN(num)) return defaultValue;
      
      _metrics.sanitized++;
      return Math.max(min, Math.min(max, num));
    },

    // Sanitiza boolean
    boolean(input: HTMLInputElement) {
      _metrics.sanitized++;
      if (typeof input === 'boolean') return input;
      if (typeof input === 'string') {
        // @ts-expect-error TS migration - TS2339
        const lower = input.toLowerCase().trim();
        return lower === 'true' || lower === '1' || lower === 'yes';
      }
      return Boolean(input);
    },

    // Sanitiza email
    email(input: HTMLInputElement) {
      if (typeof input !== 'string') return '';
      
      // @ts-expect-error TS migration - TS2339
      const trimmed = input.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      _metrics.sanitized++;
      
      if (!emailRegex.test(trimmed)) {
        return '';
      }
      
      return _escapeHtml(trimmed);
    },

    // Sanitiza JSON
    json(input: HTMLInputElement) {
      if (typeof input === 'object') return input;
      
      if (typeof input !== 'string') return null;
      
      try {
        _metrics.sanitized++;
        return JSON.parse(input);
      } catch (e) {
        _logger.warn('Invalid JSON input');
        return null;
      }
    },

    // Sanitiza array
    array(input: HTMLInputElement, itemSanitizer: unknown = null) {
      if (!Array.isArray(input)) return [];
      
      _metrics.sanitized++;
      
      if (itemSanitizer && typeof itemSanitizer === 'function') {
        return input.map(item => itemSanitizer(item));
      }
      
      return input.map(item => {
        // @ts-expect-error strict migration — TS2345
        if (typeof item === 'string') return this.text(item);
        return item;
      });
    },

    // Sanitiza objeto
    object(input: HTMLInputElement, schema = {}) {
      if (typeof input !== 'object' || input === null) return {};
      
      const result = {};
      _metrics.sanitized++;
      
      for (const [key, sanitizerFn] of Object.entries(schema)) {
        if (key in input) {
          if (typeof sanitizerFn === 'function') {
            // @ts-expect-error TS migration - TS2352
            (result as unknown as Record<string, unknown>)[key] = sanitizerFn((input as Record<string, unknown>)[key]);
          // @ts-expect-error strict migration — TS7053
          } else if (typeof sanitizerFn === 'string' && this[sanitizerFn]) {
            // @ts-expect-error TS migration - TS2352
            (result as unknown as Record<string, unknown>)[key] = this[sanitizerFn]((input as Record<string, unknown>)[key]);
          } else {
            // @ts-expect-error TS migration - TS2352
            (result as unknown as Record<string, unknown>)[key] = (input as Record<string, unknown>)[key];
          }
        }
      }
      
      return result;
    },

    // Sanitiza filename
    filename(input: HTMLInputElement) {
      if (typeof input !== 'string') return '';
      
      _metrics.sanitized++;
      
      // Remove caracteres perigosos para filenames
      return input
        // @ts-expect-error TS migration - TS2339
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/^\.+/, '')
        .substring(0, 255);
    },

    // Sanitiza slug
    slug(input: HTMLInputElement) {
      if (typeof input !== 'string') return '';
      
      _metrics.sanitized++;
      
      return input
        // @ts-expect-error TS migration - TS2339
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
    },

    // Verifica se input é seguro
    isSafe(input: HTMLInputElement) {
      if (typeof input !== 'string') return true;
      
      for (const pattern of Object.values(DANGEROUS_PATTERNS)) {
        if (pattern.test(input)) return false;
      }
      
      return true;
    },

    // Métricas
    getMetrics() {
      return { ..._metrics };
    },

    resetMetrics() {
      _metrics = { sanitized: 0, blocked: 0, truncated: 0 };
    },

    // Health check
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        metrics: _metrics,
        allowedTags: allowedTags.length,
        allowedAttributes: allowedAttributes.length
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        allowedTags,
        allowedAttributes,
        allowedProtocols,
        maxLength
      };
    }
  };

  return sanitizer;
}

// Singleton
let _instance: Record<string, unknown> | null = null;

export function getSanitizer(options = {}) {
  if (!_instance) {
    _instance = createSanitizer(options);
  }
  return _instance;
}

export function resetSanitizer() {
  _instance = null;
}

// Quick access functions
export const escapeHtml = (input: HTMLInputElement) => (getSanitizer().escapeHtml as (...args: unknown[]) => unknown)(input);
export const sanitizeText = (input: HTMLInputElement) => (getSanitizer().text as (...args: unknown[]) => unknown)(input);
export const sanitizeHtml = (input: HTMLInputElement) => (getSanitizer().html as (...args: unknown[]) => unknown)(input);
export const sanitizeUrl = (input: HTMLInputElement) => (getSanitizer().url as (...args: unknown[]) => unknown)(input);
export const sanitizeEmail = (input: HTMLInputElement) => (getSanitizer().email as (...args: unknown[]) => unknown)(input);
export const isSafe = (input: HTMLInputElement) => (getSanitizer().isSafe as (...args: unknown[]) => unknown)(input);

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  createSanitizer, getSanitizer, resetSanitizer,
  escapeHtml, sanitizeText, sanitizeHtml, sanitizeUrl, sanitizeEmail, isSafe,
  info, healthCheck
};
