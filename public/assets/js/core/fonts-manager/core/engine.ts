// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: fonts-manager-engine
// PURPOSE: Fonts Manager - Engine v8.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Store from ../state/store.js
//   normalizeFontFamily, pxToRem, deepClone from ../utils/helpers.js
//   normalizeFontRoles, createDefaultTypography, createSourceFromTokens from ./contracts.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   resolveFamilyForRole() — exported function
//   resolveAllFamilies() — exported function
//   generateTypography() — exported function
//   generateMUITypography() — exported function
//   configureFromTokens() — exported function
//   configure() — exported function
//   getConfig() — exported function
//   getResolvedFamilies() — exported function
//   getFamilyForRole() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   global.tokens
// ═══════════════════════════════════════════════════════════════
'use strict';

import Store from '../state/store.js';
import { normalizeFontFamily, pxToRem, deepClone } from '../utils/helpers.js';
import { normalizeFontRoles, createDefaultTypography, createSourceFromTokens } from './contracts.js';

export var MODULE_ID = 'fonts-manager-engine';
export var VERSION = '8.1.0-ENTERPRISE';

var DEFAULT_CONFIG = { htmlFontSize: 16, baseFontSize: 14, respectTokens: true, autoLoadSources: true };
var engineConfig = { htmlFontSize: 16, baseFontSize: 14, respectTokens: true, autoLoadSources: true };
var resolvedFamilies: Record<string, string> = {};

export function resolveFamilyForRole(role: string) {
  var state = Store.getState();
  var roleConfig = state.roles[role];
  if (!roleConfig || !roleConfig.family) return 'inherit';
  var source = null;
  for (var i = 0; i < state.sources.length; i++) {
    if (state.sources[i].family === roleConfig.family || state.sources[i].id === roleConfig.family) { source = state.sources[i]; break; }
  }
  if (source) return normalizeFontFamily(source.family, source.fallbacks);
  return roleConfig.family;
}

export function resolveAllFamilies() {
  var state = Store.getState();
  var resolved: Record<string, string> = {};
  for (var role in state.roles) { if (state.roles.hasOwnProperty(role)) resolved[role] = resolveFamilyForRole(role); }
  resolvedFamilies = resolved;
  return resolved;
}

export function generateTypography(customVariants: unknown) {
  var state = Store.getState();
  var families = resolveAllFamilies();
  var typography = createDefaultTypography(engineConfig.baseFontSize, engineConfig.htmlFontSize);
  for (var variantName in typography.variants) {
    if (typography.variants.hasOwnProperty(variantName)) {
      // @ts-expect-error strict migration — TS7053
      var variantConfig = typography.variants[variantName];
      var role = variantConfig.role || 'body';
      var family = families[role] || families.body || 'inherit';
      // @ts-expect-error strict migration — TS7053
      typography.variants[variantName].fontFamily = family;
    }
  }
  if (customVariants && typeof customVariants === 'object') {
    for (var name in customVariants) {
      if (customVariants.hasOwnProperty(name)) {
        // @ts-expect-error strict migration — TS7053
        if (typography.variants[name]) {
          // @ts-expect-error strict migration — TS7053
          for (var k in customVariants[name]) { if (customVariants[name].hasOwnProperty(k)) typography.variants[name][k] = customVariants[name][k]; }
        // @ts-expect-error strict migration — TS7053
        } else { typography.variants[name] = customVariants[name]; }
      }
    }
  }
  Store.setTypography(typography);
  return typography;
}

export function generateMUITypography() {
  var state = Store.getState();
  var typography = state.typography;
  var families = resolvedFamilies;
  var pxToRemFn = function(px: unknown) { return pxToRem(px, engineConfig.htmlFontSize); };
  var muiTypography = { htmlFontSize: engineConfig.htmlFontSize, fontSize: engineConfig.baseFontSize, fontFamily: families.body || 'system-ui, sans-serif', fontWeightLight: 300, fontWeightRegular: 400, fontWeightMedium: 500, fontWeightBold: 700, pxToRem: pxToRemFn };
  for (var name in typography.variants) {
    if (typography.variants.hasOwnProperty(name)) {
      var config = typography.variants[name];
      // @ts-expect-error strict migration — TS7053
      muiTypography[name] = { fontFamily: config.fontFamily || muiTypography.fontFamily, fontSize: pxToRemFn(config.fontSize), fontWeight: config.fontWeight || 400, lineHeight: config.lineHeight || 1.5, letterSpacing: config.letterSpacing ? config.letterSpacing + 'em' : undefined, textTransform: config.textTransform || 'none' };
    }
  }
  return muiTypography;
}

export function configureFromTokens(tokens: Record<string, unknown>) {
  if (!tokens || typeof tokens !== 'object') return false;
  var globalTokens = (tokens['global.tokens'] || tokens) as Record<string, unknown>;
  var sources = createSourceFromTokens(globalTokens);
  if (sources.length > 0) Store.setSources(sources);
  var roles = { heading: { family: 'system-ui', weight: 700 }, body: { family: 'system-ui', weight: 400 }, mono: { family: 'monospace', weight: 400 }, label: { family: 'system-ui', weight: 500 }, caption: { family: 'system-ui', weight: 400 } };
  if ((globalTokens as Record<string, unknown>)['--font-primary']) {
    // @ts-expect-error TS migration - TS7053
    var primary = globalTokens['--font-primary'].split(',')[0].trim().replace(/['"]/g, '');
    roles.heading.family = primary; roles.body.family = primary; roles.label.family = primary; roles.caption.family = primary;
  }
  // @ts-expect-error TS migration - TS7053
  if (globalTokens['--font-mono']) { roles.mono.family = globalTokens['--font-mono'].split(',')[0].trim().replace(/['"]/g, ''); }
  Store.setRoles(normalizeFontRoles(roles));
  return true;
}

export function configure(config: Record<string, unknown>) {
  config = config || {};
  // @ts-expect-error strict migration — TS7053
  for (var k in config) { if (config.hasOwnProperty(k)) engineConfig[k] = config[k]; }
  return engineConfig;
}

// @ts-expect-error strict migration — TS7053
export function getConfig() { var c = {}; for (var k in engineConfig) { if (engineConfig.hasOwnProperty(k)) c[k] = engineConfig[k]; } return c; }
// @ts-expect-error strict migration — TS7053
export function getResolvedFamilies() { var r = {}; for (var k in resolvedFamilies) { if (resolvedFamilies.hasOwnProperty(k)) r[k] = resolvedFamilies[k]; } return r; }
export function getFamilyForRole(role: string) { return resolvedFamilies[role] || resolveFamilyForRole(role); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID: MODULE_ID, VERSION: VERSION, DEFAULT_CONFIG: DEFAULT_CONFIG, resolveFamilyForRole: resolveFamilyForRole, resolveAllFamilies: resolveAllFamilies, generateTypography: generateTypography, generateMUITypography: generateMUITypography, configureFromTokens: configureFromTokens, configure: configure, getConfig: getConfig, getResolvedFamilies: getResolvedFamilies, getFamilyForRole: getFamilyForRole, info: info, healthCheck: healthCheck };
