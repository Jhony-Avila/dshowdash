// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-tokens-helpers
// PURPOSE: utils   helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TokensHelpers — exported value
//   getVersion() — exported function
//   safeFetch() — exported function
//   mergeTokenMaps() — exported function
//   normalizeThemeName() — exported function
//   normalizeGroupName() — exported function
//   generateId() — exported function
//   isValidUrl() — exported function
//   extractFileName() — exported function
//   flattenTokens() — exported function
//   unflattenTokens() — exported function
//   countTokens() — exported function
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
// Theme Tokens Loader - Helpers v1.0.0-ENTERPRISE
// Funções auxiliares puras

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'theme-tokens-helpers';

export function getVersion() {
  return VERSION;
}

// Fetch seguro com timeout
export async function safeFetch(url: string, options: Record<string, unknown> = {}) {
  const { timeout = 5000, ...fetchOptions } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout as number);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}`, status: response.status };
    }

    const text = await response.text();
    return { ok: true, data: text, status: response.status };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { ok: false, error: 'timeout', status: 0 };
    }
    return { ok: false, error: error.message, status: 0 };
  }
}

// Merge de mapas de tokens
export function mergeTokenMaps(...maps: unknown[]) {
  const result = {};
  for (const map of maps) {
    if (map && typeof map === 'object') {
      Object.assign(result, map);
    }
  }
  return result;
}

// Normalizar nome de tema
export function normalizeThemeName(theme: unknown) {
  if (!theme || typeof theme !== 'string') return 'dark';
  return theme.toLowerCase().trim();
}

// Normalizar nome de grupo
export function normalizeGroupName(group: unknown) {
  if (!group || typeof group !== 'string') return 'unknown';
  return group.toLowerCase().trim().replace(/\s+/g, '.');
}

// Gerar ID único
export function generateId(prefix = 'token') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `${prefix}-${timestamp}-${random}`;
}

// Verificar se é URL válida
export function isValidUrl(str: string) {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('/') || str.startsWith('http://') || str.startsWith('https://');
}

// Extrair nome do arquivo de um path
export function extractFileName(path: string) {
  if (!path || typeof path !== 'string') return '';
  const parts = path.split('/');
  return parts[parts.length - 1] || '';
}

// Converter objeto aninhado em flat tokens
export function flattenTokens(obj: Record<string, unknown>, prefix = '', separator = '.') {
  const result = {};

  function recurse(current: Record<string, unknown>, currentPrefix: string) {
    for (const key in current) {
      if (!Object.prototype.hasOwnProperty.call(current, key)) continue;
      
      const value = current[key];
      const newKey = currentPrefix ? `${currentPrefix}${separator}${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        recurse(value as Record<string, unknown>, newKey);
      } else {
        // @ts-expect-error strict migration — TS7053
        result[newKey] = value;
      }
    }
  }

  recurse(obj, prefix);
  return result;
}

// Converter flat tokens em objeto aninhado
export function unflattenTokens(flat: Record<string, unknown>, separator = '.') {
  const result = {};

  for (const key in flat) {
    if (!Object.prototype.hasOwnProperty.call(flat, key)) continue;

    const parts = key.split(separator);
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        // @ts-expect-error strict migration — TS7053
        current[part] = {};
      }
      // @ts-expect-error strict migration — TS7053
      current = current[part];
    }

    // @ts-expect-error strict migration — TS7053
    current[parts[parts.length - 1]] = flat[key];
  }

  return result;
}

// Contar tokens em um objeto (recursivo)
export function countTokens(obj: Record<string, unknown>) {
  if (!obj || typeof obj !== 'object') return 0;
  
  let count = 0;
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      count += countTokens(value as Record<string, unknown>);
    } else {
      count++;
    }
  }
  return count;
}

// Helpers API
export const TokensHelpers = {
  safeFetch,
  mergeTokenMaps,
  normalizeThemeName,
  normalizeGroupName,
  generateId,
  isValidUrl,
  extractFileName,
  flattenTokens,
  unflattenTokens,
  countTokens,
  getVersion,
  healthCheck() {
    return {
      healthy: true,
      version: VERSION,
      moduleId: MODULE_ID,
      issues: null as unknown | null
    };
  }
};

export default TokensHelpers;
