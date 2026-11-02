// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: fonts-manager-contracts
// PURPOSE: Fonts Manager - Contracts v8.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   normalizeFontWeight, normalizeLineHeight from ../utils/helpers.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   VALID_SOURCE_TYPES — exported value
//   VALID_FONT_ROLES — exported value
//   TYPOGRAPHY_VARIANTS — exported value
//   DEFAULT_FONT_SOURCE — exported value
//   DEFAULT_FONT_ROLES — exported value
//   DEFAULT_TYPOGRAPHY_VARIANT — exported value
//   validateFontSource() — exported function
//   normalizeFontSource() — exported function
//   validateFontRoles() — exported function
//   normalizeFontRoles() — exported function
//   validateTypographyVariant() — exported function
//   normalizeTypographyVariant() — exported function
//   createDefaultTypography() — exported function
//   createSourceFromTokens() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { normalizeFontWeight, normalizeLineHeight } from '../utils/helpers.js';

export var MODULE_ID = 'fonts-manager-contracts';
export var VERSION = '8.1.0-ENTERPRISE';

export var VALID_SOURCE_TYPES = ['local', 'google', 'file', 'variable', 'system'];
export var VALID_FONT_ROLES = ['heading', 'body', 'mono', 'label', 'caption', 'code', 'meta'];
export var TYPOGRAPHY_VARIANTS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'button', 'caption', 'overline', 'tag', 'chip', 'tableHeader'];

export var DEFAULT_FONT_SOURCE = { type: 'system', id: '', family: '', fallbacks: [] as unknown[], weights: [400], styles: ['normal'], display: 'swap', url: null as unknown | null, axes: [] as unknown[] };
export var DEFAULT_FONT_ROLES = { heading: { family: 'system-ui', weight: 700 }, body: { family: 'system-ui', weight: 400 }, mono: { family: 'monospace', weight: 400 }, label: { family: 'system-ui', weight: 500 }, caption: { family: 'system-ui', weight: 400 } };
export var DEFAULT_TYPOGRAPHY_VARIANT = { role: 'body', fontSize: 14, lineHeight: 1.5, fontWeight: 400, letterSpacing: 0, textTransform: 'none' };

export function validateFontSource(source: Record<string, unknown>) {
  var errors = [];
  var warnings = [];
  if (!source || typeof source !== 'object') return { valid: false, errors: ['Source must be an object'], warnings: [], normalized: null };
  if (!source.type || VALID_SOURCE_TYPES.indexOf(source.type as string) === -1) errors.push('Invalid source type: ' + source.type);
  if (!source.family || typeof source.family !== 'string') errors.push('Font family is required');
  if (['file', 'google'].indexOf(source.type as string) !== -1 && !source.url) warnings.push('Source type "' + source.type + '" usually requires a URL');
  if (source.weights && !Array.isArray(source.weights)) errors.push('Weights must be an array');
  if (errors.length === 0) return { valid: true, errors: [] as unknown[], warnings: warnings, normalized: normalizeFontSource(source) };
  return { valid: false, errors: errors, warnings: warnings, normalized: null };
}

export function normalizeFontSource(source: Record<string, unknown>) {
  var result: Record<string, unknown> = {};
  // @ts-expect-error strict migration — TS7053
  for (var k in DEFAULT_FONT_SOURCE) { if (DEFAULT_FONT_SOURCE.hasOwnProperty(k)) result[k] = DEFAULT_FONT_SOURCE[k]; }
  for (var k2 in source) { if (source.hasOwnProperty(k2)) result[k2] = source[k2]; }
  result.id = source.id || (source.type as string) + '-' + (source.family ? (source.family as string).toLowerCase().replace(/\s+/g, '-') : 'unknown');
  result.weights = Array.isArray(source.weights) ? source.weights.map(function(w: unknown) { return normalizeFontWeight(w); }) : [400];
  result.styles = Array.isArray(source.styles) ? source.styles : ['normal'];
  result.fallbacks = Array.isArray(source.fallbacks) ? source.fallbacks : [];
  return result;
}

export function validateFontRoles(roles: Record<string, unknown>) {
  var errors = [];
  var warnings = [];
  if (!roles || typeof roles !== 'object') return { valid: false, errors: ['Roles must be an object'], warnings: [], normalized: null };
  var requiredRoles = ['heading', 'body'];
  for (var i = 0; i < requiredRoles.length; i++) { if (!roles[requiredRoles[i]]) warnings.push('Missing recommended role: ' + requiredRoles[i]); }
  for (var roleName in roles) {
    if (roles.hasOwnProperty(roleName)) {
      if (VALID_FONT_ROLES.indexOf(roleName) === -1) warnings.push('Unknown role: ' + roleName);
      if (roles[roleName] && typeof roles[roleName] === 'object' && !(roles[roleName] as Record<string, unknown>).family) errors.push('Role "' + roleName + '" missing family');
    }
  }
  if (errors.length === 0) return { valid: true, errors: [] as unknown[], warnings: warnings, normalized: normalizeFontRoles(roles) };
  return { valid: false, errors: errors, warnings: warnings, normalized: null };
}

export function normalizeFontRoles(roles: Record<string, unknown>) {
  var normalized = {};
  // @ts-expect-error strict migration — TS7053
  for (var k in DEFAULT_FONT_ROLES) { if (DEFAULT_FONT_ROLES.hasOwnProperty(k)) normalized[k] = { family: DEFAULT_FONT_ROLES[k].family, weight: DEFAULT_FONT_ROLES[k].weight }; }
  for (var roleName in roles) {
    if (roles.hasOwnProperty(roleName) && roles[roleName] && typeof roles[roleName] === 'object') {
      // @ts-expect-error strict migration — TS7053
      var defRole = DEFAULT_FONT_ROLES[roleName];
      // @ts-expect-error TS migration - TS7053
      normalized[roleName] = { family: roles[roleName].family || (defRole ? defRole.family : 'system-ui'), weight: normalizeFontWeight(roles[roleName].weight || 400) };
    }
  }
  return normalized;
}

export function validateTypographyVariant(variant: Record<string, unknown>) {
  var errors = [];
  if (!variant || typeof variant !== 'object') return { valid: false, errors: ['Variant must be an object'], normalized: null as unknown | null };
  if (typeof variant.fontSize !== 'number' || variant.fontSize <= 0) errors.push('fontSize must be a positive number');
  if (errors.length === 0) return { valid: true, errors: [], normalized: normalizeTypographyVariant(variant) };
  return { valid: false, errors: errors, normalized: null };
}

export function normalizeTypographyVariant(variant: Record<string, unknown>) {
  var result: Record<string, unknown> = {};
  // @ts-expect-error strict migration — TS7053
  for (var k in DEFAULT_TYPOGRAPHY_VARIANT) { if (DEFAULT_TYPOGRAPHY_VARIANT.hasOwnProperty(k)) result[k] = DEFAULT_TYPOGRAPHY_VARIANT[k]; }
  for (var k2 in variant) { if (variant.hasOwnProperty(k2)) result[k2] = variant[k2]; }
  result.fontWeight = normalizeFontWeight(variant.fontWeight || 400);
  result.lineHeight = normalizeLineHeight(variant.lineHeight || 1.5);
  return result;
}

export function createDefaultTypography(baseFontSize: number, htmlFontSize: number) {
  baseFontSize = baseFontSize || 14;
  htmlFontSize = htmlFontSize || 16;
  return {
    htmlFontSize: htmlFontSize, baseFontSize: baseFontSize,
    variants: {
      h1: { role: 'heading', fontSize: 36, lineHeight: 1.2, fontWeight: 700 },
      h2: { role: 'heading', fontSize: 32, lineHeight: 1.25, fontWeight: 700 },
      h3: { role: 'heading', fontSize: 24, lineHeight: 1.3, fontWeight: 700 },
      h4: { role: 'heading', fontSize: 20, lineHeight: 1.35, fontWeight: 700 },
      h5: { role: 'heading', fontSize: 16, lineHeight: 1.4, fontWeight: 700 },
      h6: { role: 'heading', fontSize: 14, lineHeight: 1.45, fontWeight: 700 },
      subtitle1: { role: 'body', fontSize: 16, lineHeight: 1.5, fontWeight: 500 },
      subtitle2: { role: 'body', fontSize: 14, lineHeight: 1.5, fontWeight: 500 },
      body1: { role: 'body', fontSize: 14, lineHeight: 1.5, fontWeight: 400 },
      body2: { role: 'body', fontSize: 13, lineHeight: 1.5, fontWeight: 400 },
      button: { role: 'label', fontSize: 14, lineHeight: 1.4, fontWeight: 500, textTransform: 'none' },
      caption: { role: 'caption', fontSize: 12, lineHeight: 1.4, fontWeight: 400 },
      overline: { role: 'label', fontSize: 11, lineHeight: 1.5, fontWeight: 500, letterSpacing: 0.08, textTransform: 'uppercase' }
    }
  };
}

export function createSourceFromTokens(tokens: Record<string, unknown>) {
  var sources = [];
  if (tokens['--font-primary']) {
    var parts = (tokens['--font-primary'] as string).split(',');
    sources.push({ type: 'system', id: 'primary', family: parts[0].trim().replace(/['"]/g, ''), fallbacks: parts.slice(1).map(function(f: string) { return f.trim().replace(/['"]/g, ''); }), weights: [400, 500, 600, 700] });
  }
  if (tokens['--font-mono']) {
    var mparts = (tokens['--font-mono'] as string).split(',');
    sources.push({ type: 'system', id: 'mono', family: mparts[0].trim().replace(/['"]/g, ''), fallbacks: mparts.slice(1).map(function(f: string) { return f.trim().replace(/['"]/g, ''); }), weights: [400] });
  }
  return sources;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID: MODULE_ID, VERSION: VERSION, VALID_SOURCE_TYPES: VALID_SOURCE_TYPES, VALID_FONT_ROLES: VALID_FONT_ROLES, TYPOGRAPHY_VARIANTS: TYPOGRAPHY_VARIANTS, validateFontSource: validateFontSource, normalizeFontSource: normalizeFontSource, validateFontRoles: validateFontRoles, normalizeFontRoles: normalizeFontRoles, validateTypographyVariant: validateTypographyVariant, normalizeTypographyVariant: normalizeTypographyVariant, createDefaultTypography: createDefaultTypography, createSourceFromTokens: createSourceFromTokens, info: info, healthCheck: healthCheck };
