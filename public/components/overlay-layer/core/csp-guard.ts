// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.csp-guard
// PURPOSE: Overlay Layer CSP Guard - Content Security Policy validation
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract CHECK - check() validates content against CSP
// @contract SANITIZE - sanitize() removes dangerous content
// @contract CHECK_AND_SANITIZE - checkAndSanitize() validates and cleans
// @contract VALIDATE_URL - validateUrl() validates URL safety
// @contract VALIDATE_STYLE - validateStyle() validates CSS safety
// @contract GET_VIOLATIONS - getViolations() returns violation log
// @contract CLEAR_VIOLATIONS - clearViolations() clears violation log
// @contract GET_CONFIG - getConfig() returns CSP config
// @contract SET_CONFIG - setConfig() updates CSP config
// @contract GET_METRICS - getMetrics() returns CSP metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   OVERLAY_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   check() — exported function
//   sanitize() — exported function
//   checkAndSanitize() — exported function
//   validateUrl() — exported function
//   validateStyle() — exported function
//   getViolations() — exported function
//   clearViolations() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): overlay:csp-violation
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v2.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.4.1-ENTERPRISE: ES5 conversion (forEach/some to for loops)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { OVERLAY_EVENTS } from '/core/runtime/events/catalog/overlay.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.csp-guard';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: DynObj, msg: string, data: DynObj) => { const logger = _getPort('logger'); if (!logger) return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.call(logger, `[${MODULE_ID}]`, msg, data || ''); };

const _config = { enabled: true, sanitizeContent: true, allowInlineStyles: true, allowDataUrls: false, logViolations: true };
let _violations: DynObj[] = [];
const _metrics = { checks: 0, violations: 0, sanitizations: 0 };
const DANGEROUS_PATTERNS = [ { pattern: /<script[\s>]/gi, name: 'inline-script', severity: 'critical' }, { pattern: /javascript:/gi, name: 'javascript-protocol', severity: 'critical' }, { pattern: /on\w+\s*=/gi, name: 'inline-event-handler', severity: 'high' }, { pattern: /<iframe[\s>]/gi, name: 'iframe', severity: 'high' }, { pattern: /<object[\s>]/gi, name: 'object-tag', severity: 'high' }, { pattern: /<embed[\s>]/gi, name: 'embed-tag', severity: 'high' }, { pattern: /<form[\s>]/gi, name: 'form-tag', severity: 'medium' }, { pattern: /data:text\/html/gi, name: 'data-html', severity: 'high' }, { pattern: /expression\s*\(/gi, name: 'css-expression', severity: 'critical' }, { pattern: /url\s*\(\s*["']?data:/gi, name: 'data-url-in-css', severity: 'medium' } ];
const ALLOWED_TAGS = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'b', 'i', 'u', 'br', 'hr', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'button', 'input', 'label', 'select', 'option', 'textarea', 'header', 'footer', 'nav', 'main', 'section', 'article', 'aside', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon'];

export function check(content: DynObj, options: DynObj) { if (!options) options = {}; if (!_config.enabled || typeof content !== 'string') return { ok: true, skipped: true }; _metrics.checks++; const foundViolations = []; for (let i = 0; i < DANGEROUS_PATTERNS.length; i++) { const item = DANGEROUS_PATTERNS[i]; if (item.pattern.test(content)) foundViolations.push({ name: item.name, severity: item.severity, pattern: item.pattern.toString() }); item.pattern.lastIndex = 0; } if (!_config.allowDataUrls && /data:/gi.test(content)) foundViolations.push({ name: 'data-url', severity: 'medium' }); if (foundViolations.length > 0) { _metrics.violations += foundViolations.length; if (_config.logViolations) _logViolations(foundViolations, options.source); let hasCritical = false; for (let j = 0; j < foundViolations.length; j++) { if (foundViolations[j].severity === 'critical') { hasCritical = true; break; } } return { ok: false, violations: foundViolations, hasCritical }; } return { ok: true, violations: [] as DynObj }; }

export function sanitize(content: DynObj, options: DynObj) { if (!options) options = {}; if (!_config.sanitizeContent || typeof content !== 'string') return { ok: true, content, sanitized: false }; _metrics.sanitizations++; let sanitized = content; const removed: DynObj[] = []; sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, () => { removed.push('script'); return ''; }); sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, () => { removed.push('event-handler'); return ''; }); sanitized = sanitized.replace(/javascript:[^"'\s]*/gi, () => { removed.push('javascript-protocol'); return '#'; }); sanitized = sanitized.replace(/<(iframe|object|embed)\b[^>]*>.*?<\/\1>/gi, () => { removed.push('embedded-content'); return ''; }); sanitized = sanitized.replace(/<(iframe|object|embed)\b[^>]*\/?>/gi, () => { removed.push('embedded-content'); return ''; }); if (!_config.allowDataUrls) sanitized = sanitized.replace(/\s(src|href)\s*=\s*["']data:[^"']*["']/gi, () => { removed.push('data-url'); return ''; }); return { ok: true, content: sanitized, sanitized: removed.length > 0, removed }; }

export function checkAndSanitize(content: DynObj, options: DynObj) { if (!options) options = {}; const checkResult = check(content, options); if (!checkResult.ok && checkResult.hasCritical && !options.forceSanitize) return { ok: false, blocked: true, reason: 'critical-violation', violations: checkResult.violations }; const sanitizeResult = sanitize(content, options); return { ok: true, content: sanitizeResult.content, hadViolations: !checkResult.ok, violations: checkResult.violations, sanitized: sanitizeResult.sanitized, removed: sanitizeResult.removed }; }

export function validateUrl(url: string) { if (!url || typeof url !== 'string') return { ok: false, reason: 'invalid-url' }; if (/^javascript:/i.test(url)) return { ok: false, reason: 'javascript-protocol', blocked: true }; if (!_config.allowDataUrls && /^data:/i.test(url)) return { ok: false, reason: 'data-url', blocked: true }; if (/^(https?:\/\/|\/|#|\?|\.)/i.test(url)) return { ok: true, url }; return { ok: false, reason: 'unknown-protocol' }; }

export function validateStyle(style: DynObj) { if (!_config.allowInlineStyles) return { ok: false, reason: 'inline-styles-disabled' }; if (!style || typeof style !== 'string') return { ok: true }; if (/expression\s*\(/i.test(style)) return { ok: false, reason: 'css-expression', blocked: true }; if (!_config.allowDataUrls && /url\s*\(\s*["']?data:/i.test(style)) return { ok: false, reason: 'data-url-in-style', blocked: true }; if (/url\s*\(\s*["']?javascript:/i.test(style)) return { ok: false, reason: 'javascript-in-style', blocked: true }; return { ok: true }; }

function _logViolations(violations: DynObj, source: DynObj) { const names = []; for (let i = 0; i < violations.length; i++) names.push(violations[i].name); const entry = { violations, source: source || 'unknown', timestamp: Date.now() }; _violations.push(entry); if (_violations.length > 100) _violations = _violations.slice(-100); _log('warn', 'Violations detected:', names.join(', ')); const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.CSP_VIOLATION, entry); }

export function getViolations() { return _violations.slice(); }
export function clearViolations() { const count = _violations.length; _violations = []; return { ok: true, cleared: count }; }
export function getConfig() { return Object.assign({}, _config); }
export function setConfig(newConfig: DynObj) { if (newConfig.enabled !== undefined) _config.enabled = newConfig.enabled; if (newConfig.sanitizeContent !== undefined) _config.sanitizeContent = newConfig.sanitizeContent; if (newConfig.allowInlineStyles !== undefined) _config.allowInlineStyles = newConfig.allowInlineStyles; if (newConfig.allowDataUrls !== undefined) _config.allowDataUrls = newConfig.allowDataUrls; if (newConfig.logViolations !== undefined) _config.logViolations = newConfig.logViolations; return { ok: true, config: Object.assign({}, _config) }; }
export function getMetrics() { return Object.assign({}, _metrics, { violationLogSize: _violations.length }); }
export function healthCheck() { const logger = _getPort('logger'); const eb = _getPort('eventBus'); const checks = { enabled: _config.enabled, lowViolationRate: _metrics.checks === 0 || (_metrics.violations / _metrics.checks) < 0.1, logNotOverflowing: _violations.length < 80, loggerAvailable: !!logger, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() }; let passed = 0; const checkKeys = Object.keys(checks); for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; } return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, checks, metrics: getMetrics(), recentViolations: _violations.slice(-5), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), config: getConfig(), metrics: getMetrics(), allowedTags: ALLOWED_TAGS, timestamp: Date.now() }; }

export default { check, sanitize, checkAndSanitize, validateUrl, validateStyle, getViolations, clearViolations, getConfig, setConfig, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
