// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: fonts-manager-helpers
// PURPOSE: Fonts Manager - Helpers v8.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   generateId() — exported function
//   deepClone() — exported function
//   pxToRem() — exported function
//   remToPx() — exported function
//   normalizeFontFamily() — exported function
//   extractFontFamily() — exported function
//   isValidFontWeight() — exported function
//   normalizeFontWeight() — exported function
//   isValidLineHeight() — exported function
//   normalizeLineHeight() — exported function
//   buildGoogleFontsUrl() — exported function
//   buildFontFaceCSS() — exported function
//   getFormatFromUrl() — exported function
//   debounce() — exported function
//   measureTime() — exported function
//   supportsFontDisplay() — exported function
//   supportsVariableFonts() — exported function
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

export var MODULE_ID = 'fonts-manager-helpers';
export var VERSION = '8.1.0-ENTERPRISE';

export function generateId(prefix: string) {
  prefix = prefix || 'font';
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export function deepClone(obj: Record<string, unknown>) {
  if (obj === null || typeof obj !== 'object') return obj;
  try { return JSON.parse(JSON.stringify(obj)); }
  catch (e) { return obj; }
}

export function pxToRem(px: unknown, baseFontSize: number) {
  baseFontSize = baseFontSize || 16;
  if (typeof px === 'string') {
    var num = parseFloat(px);
    if (isNaN(num)) return px;
    px = num;
  }
  return ((px as number) / baseFontSize).toFixed(4) + 'rem';
}

export function remToPx(rem: unknown, baseFontSize: number) {
  baseFontSize = baseFontSize || 16;
  if (typeof rem === 'string') {
    var num = parseFloat(rem);
    if (isNaN(num)) return rem;
    rem = num;
  }
  return (rem as number) * baseFontSize;
}

export function normalizeFontFamily(family: unknown, fallbacks: unknown) {
  fallbacks = fallbacks || [];
  if (!family) return 'inherit';
  var parts = [family].concat(fallbacks as string[]).filter(Boolean) as string[];
  return parts.map(function(f: string) {
    f = f.trim();
    if (f.indexOf(' ') !== -1 && !f.startsWith("'") && !f.startsWith('"')) return "'" + f + "'";
    return f;
  }).join(', ');
}

export function extractFontFamily(cssValue: unknown) {
  if (!cssValue || typeof cssValue !== 'string') return null;
  var first = cssValue.split(',')[0].trim();
  return first.replace(/['"]/g, '');
}

export function isValidFontWeight(weight: unknown) {
  var validWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900, 'normal', 'bold', 'lighter', 'bolder'];
  return validWeights.indexOf(weight as string | number) !== -1 || validWeights.indexOf(Number(weight)) !== -1;
}

export function normalizeFontWeight(weight: unknown) {
  if (weight === 'normal') return 400;
  if (weight === 'bold') return 700;
  var num = Number(weight);
  return isNaN(num) ? 400 : Math.min(900, Math.max(100, Math.round(num / 100) * 100));
}

export function isValidLineHeight(lh: unknown) {
  if (typeof lh === 'number') return lh > 0 && lh < 10;
  if (typeof lh === 'string') { var num = parseFloat(lh); return !isNaN(num) && num > 0; }
  return false;
}

export function normalizeLineHeight(lh: unknown) {
  if (typeof lh === 'number') return lh;
  var num = parseFloat(lh as string);
  return isNaN(num) ? 1.5 : num;
}

export function buildGoogleFontsUrl(families: unknown) {
  if (!Array.isArray(families) || families.length === 0) return null;
  var params = families.map(function(f) {
    var ff = f as Record<string, unknown>;
    var weights = (ff.weights && (ff.weights as unknown[]).length) ? ':wght@' + (ff.weights as unknown[]).join(';') : '';
    return 'family=' + encodeURIComponent(ff.family as string) + weights;
  }).join('&');
  return 'https://fonts.googleapis.com/css2?' + params + '&display=swap';
}

export function buildFontFaceCSS(source: Record<string, unknown>) {
  if (!source || !source.family || !source.url) return '';
  var weights = (source.weights || [400]) as unknown[];
  var styles = (source.styles || ['normal']) as unknown[];
  var display = source.display || 'swap';
  var css = '';
  for (var i = 0; i < weights.length; i++) {
    for (var j = 0; j < styles.length; j++) {
      // @ts-expect-error TS migration - TS7053
      css += '@font-face { font-family: "' + source.family + '"; font-style: ' + styles[j] + '; font-weight: ' + weights[i] + '; font-display: ' + display + '; src: url("' + source.url + '") format("' + getFormatFromUrl(source.url) + '"); }\n';
    }
  }
  return css.trim();
}

export function getFormatFromUrl(url: string) {
  if (!url) return 'woff2';
  if (url.indexOf('.woff2') !== -1) return 'woff2';
  if (url.indexOf('.woff') !== -1) return 'woff';
  if (url.indexOf('.ttf') !== -1) return 'truetype';
  if (url.indexOf('.otf') !== -1) return 'opentype';
  if (url.indexOf('.eot') !== -1) return 'embedded-opentype';
  return 'woff2';
}

export function debounce(this: any, fn: (...args: unknown[]) => void, delay: unknown) {
  delay = delay || 300;
  var timer: unknown | null = null;
  return function() {
    var args = arguments;
    // @ts-expect-error strict migration — TS2683
    var self = this;
    clearTimeout(timer as ReturnType<typeof setTimeout>);
    timer = setTimeout(function() { fn.apply(self, Array.prototype.slice.call(args)); }, delay as number);
  };
}

export async function measureTime(fn: (...args: unknown[]) => void) {
  var start = performance.now();
  var result = await fn();
  var duration = performance.now() - start;
  return { result: result, duration: duration };
}

export function supportsFontDisplay() {
  if (typeof document === 'undefined') return false;
  try { return CSS.supports('font-display', 'swap'); }
  catch (e) { return false; }
}

export function supportsVariableFonts() {
  if (typeof document === 'undefined') return false;
  try { return CSS.supports('font-variation-settings', '"wght" 400'); }
  catch (e) { return false; }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID: MODULE_ID, VERSION: VERSION, generateId: generateId, deepClone: deepClone, pxToRem: pxToRem, remToPx: remToPx, normalizeFontFamily: normalizeFontFamily, extractFontFamily: extractFontFamily, isValidFontWeight: isValidFontWeight, normalizeFontWeight: normalizeFontWeight, isValidLineHeight: isValidLineHeight, normalizeLineHeight: normalizeLineHeight, buildGoogleFontsUrl: buildGoogleFontsUrl, buildFontFaceCSS: buildFontFaceCSS, getFormatFromUrl: getFormatFromUrl, debounce: debounce, measureTime: measureTime, supportsFontDisplay: supportsFontDisplay, supportsVariableFonts: supportsVariableFonts, info: info, healthCheck: healthCheck };
