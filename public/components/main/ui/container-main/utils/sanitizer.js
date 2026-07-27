import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE5";
const MODULE_ID = "container-main:sanitizer";
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
const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;
function createSanitizer(options = {}) {
  const {
    allowedTags = ["b", "i", "u", "strong", "em", "br", "p", "span", "div", "a", "ul", "ol", "li"],
    allowedAttributes = ["href", "title", "class", "id", "target"],
    allowedProtocols = ["http", "https", "mailto"],
    maxLength = 1e4,
    stripControlChars = true,
    logAttempts = true
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _metrics = { sanitized: 0, blocked: 0, truncated: 0 };
  function _escapeHtml(str) {
    return String(str).replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char]);
  }
  function _stripControl(str) {
    return str.replace(CONTROL_CHARS, "");
  }
  function _sanitizeUrl(url) {
    if (!url) return "";
    const trimmed = url.trim().toLowerCase();
    const protocolMatch = trimmed.match(/^(\w+):/);
    if (protocolMatch) {
      const protocol = protocolMatch[1];
      if (!allowedProtocols.includes(protocol)) {
        _metrics.blocked++;
        if (logAttempts) _logger.warn("Blocked URL protocol:", protocol);
        return "";
      }
    }
    if (DANGEROUS_PATTERNS.javascript.test(trimmed) || DANGEROUS_PATTERNS.data.test(trimmed)) {
      _metrics.blocked++;
      if (logAttempts) _logger.warn("Blocked dangerous URL:", url.substring(0, 50));
      return "";
    }
    return url;
  }
  function _sanitizeAttributes(tag, attrs) {
    const result = {};
    for (const [key, value] of Object.entries(attrs)) {
      const lowerKey = key.toLowerCase();
      if (!allowedAttributes.includes(lowerKey)) continue;
      if (lowerKey.startsWith("on")) continue;
      if (lowerKey === "href" || lowerKey === "src") {
        const sanitizedUrl = _sanitizeUrl(value);
        if (sanitizedUrl) result[lowerKey] = sanitizedUrl;
      } else {
        result[lowerKey] = _escapeHtml(value);
      }
    }
    return result;
  }
  const sanitizer = {
    // Sanitiza string simples (escapa HTML)
    escapeHtml(input) {
      if (typeof input !== "string") return "";
      _metrics.sanitized++;
      return _escapeHtml(input);
    },
    // Sanitiza texto (remove tags, escapa)
    text(input) {
      if (typeof input !== "string") return "";
      let result = input;
      if (result.length > maxLength) {
        result = result.substring(0, maxLength);
        _metrics.truncated++;
      }
      if (stripControlChars) {
        result = _stripControl(result);
      }
      result = result.replace(/<[^>]*>/g, "");
      result = _escapeHtml(result);
      _metrics.sanitized++;
      return result;
    },
    // Sanitiza HTML (permite tags seguras)
    html(input) {
      if (typeof input !== "string") return "";
      let result = input;
      if (result.length > maxLength) {
        result = result.substring(0, maxLength);
        _metrics.truncated++;
      }
      for (const [name, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
        if (pattern.test(result)) {
          _metrics.blocked++;
          if (logAttempts) _logger.warn(`Blocked ${name} pattern`);
        }
        result = result.replace(pattern, "");
      }
      result = result.replace(DANGEROUS_PATTERNS.event, "");
      if (stripControlChars) {
        result = _stripControl(result);
      }
      _metrics.sanitized++;
      return result;
    },
    // Sanitiza URL
    url(input) {
      if (typeof input !== "string") return "";
      _metrics.sanitized++;
      return _sanitizeUrl(input);
    },
    // Sanitiza número
    number(input, options2 = {}) {
      const { min = -Infinity, max = Infinity, default: defaultValue = 0 } = options2;
      const num = parseFloat(String(input));
      if (isNaN(num)) return defaultValue;
      _metrics.sanitized++;
      return Math.max(min, Math.min(max, num));
    },
    // Sanitiza inteiro
    integer(input, options2 = {}) {
      const { min = -Infinity, max = Infinity, default: defaultValue = 0 } = options2;
      const num = parseInt(String(input), 10);
      if (isNaN(num)) return defaultValue;
      _metrics.sanitized++;
      return Math.max(min, Math.min(max, num));
    },
    // Sanitiza boolean
    boolean(input) {
      _metrics.sanitized++;
      if (typeof input === "boolean") return input;
      if (typeof input === "string") {
        const lower = input.toLowerCase().trim();
        return lower === "true" || lower === "1" || lower === "yes";
      }
      return Boolean(input);
    },
    // Sanitiza email
    email(input) {
      if (typeof input !== "string") return "";
      const trimmed = input.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      _metrics.sanitized++;
      if (!emailRegex.test(trimmed)) {
        return "";
      }
      return _escapeHtml(trimmed);
    },
    // Sanitiza JSON
    json(input) {
      if (typeof input === "object") return input;
      if (typeof input !== "string") return null;
      try {
        _metrics.sanitized++;
        return JSON.parse(input);
      } catch (e) {
        _logger.warn("Invalid JSON input");
        return null;
      }
    },
    // Sanitiza array
    array(input, itemSanitizer = null) {
      if (!Array.isArray(input)) return [];
      _metrics.sanitized++;
      if (itemSanitizer && typeof itemSanitizer === "function") {
        return input.map((item) => itemSanitizer(item));
      }
      return input.map((item) => {
        if (typeof item === "string") return this.text(item);
        return item;
      });
    },
    // Sanitiza objeto
    object(input, schema = {}) {
      if (typeof input !== "object" || input === null) return {};
      const result = {};
      _metrics.sanitized++;
      for (const [key, sanitizerFn] of Object.entries(schema)) {
        if (key in input) {
          if (typeof sanitizerFn === "function") {
            result[key] = sanitizerFn(input[key]);
          } else if (typeof sanitizerFn === "string" && this[sanitizerFn]) {
            result[key] = this[sanitizerFn](input[key]);
          } else {
            result[key] = input[key];
          }
        }
      }
      return result;
    },
    // Sanitiza filename
    filename(input) {
      if (typeof input !== "string") return "";
      _metrics.sanitized++;
      return input.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/^\.+/, "").substring(0, 255);
    },
    // Sanitiza slug
    slug(input) {
      if (typeof input !== "string") return "";
      _metrics.sanitized++;
      return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 100);
    },
    // Verifica se input é seguro
    isSafe(input) {
      if (typeof input !== "string") return true;
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
        status: "HEALTHY",
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
let _instance = null;
function getSanitizer(options = {}) {
  if (!_instance) {
    _instance = createSanitizer(options);
  }
  return _instance;
}
function resetSanitizer() {
  _instance = null;
}
const escapeHtml = (input) => getSanitizer().escapeHtml(input);
const sanitizeText = (input) => getSanitizer().text(input);
const sanitizeHtml = (input) => getSanitizer().html(input);
const sanitizeUrl = (input) => getSanitizer().url(input);
const sanitizeEmail = (input) => getSanitizer().email(input);
const isSafe = (input) => getSanitizer().isSafe(input);
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var sanitizer_default = {
  VERSION,
  MODULE_ID,
  createSanitizer,
  getSanitizer,
  resetSanitizer,
  escapeHtml,
  sanitizeText,
  sanitizeHtml,
  sanitizeUrl,
  sanitizeEmail,
  isSafe,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  createSanitizer,
  sanitizer_default as default,
  escapeHtml,
  getSanitizer,
  healthCheck,
  info,
  isSafe,
  resetSanitizer,
  sanitizeEmail,
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl
};
