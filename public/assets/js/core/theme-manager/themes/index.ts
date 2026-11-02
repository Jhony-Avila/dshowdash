// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-catalog
// PURPOSE: themes   index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DARK_THEME from ./dark.js
//   LIGHT_THEME from ./light.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   THEMES_MAP — exported value
//   AVAILABLE_THEME_IDS — exported value
//   DEFAULT_THEME_ID — exported value
//   ThemeCatalog — exported value
//   getVersion() — exported function
//   getThemeById() — exported function
//   getAllThemes() — exported function
//   isValidThemeId() — exported function
//   getDefaultTheme() — exported function
//   DARK_THEME — exported value
//   LIGHT_THEME — exported value
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
// Theme Manager - Themes Catalog v4.0.0-ENTERPRISE
// Catálogo central de temas disponíveis

import { DARK_THEME } from './dark.js';
import { LIGHT_THEME } from './light.js';

export const VERSION = '4.0.0-ENTERPRISE';
export const MODULE_ID = 'theme-catalog';

export function getVersion(): string {
  return VERSION;
}

// Mapa de temas disponíveis
export const THEMES_MAP: Record<string, unknown> = {
  dark: DARK_THEME,
  light: LIGHT_THEME
};

// Lista de IDs disponíveis
export const AVAILABLE_THEME_IDS: string[] = Object.keys(THEMES_MAP);

// Tema default
export const DEFAULT_THEME_ID = 'dark';

// Obter tema por ID
export function getThemeById(themeId: string): unknown {
  return THEMES_MAP[themeId] || null;
}

// Obter todos os temas
export function getAllThemes(): unknown[] {
  return Object.values(THEMES_MAP);
}

// Verificar se tema existe
export function isValidThemeId(themeId: string): boolean {
  return themeId in THEMES_MAP;
}

// Obter tema default
export function getDefaultTheme(): unknown {
  return THEMES_MAP[DEFAULT_THEME_ID];
}

// Catalog API
export const ThemeCatalog = {
  THEMES_MAP,
  AVAILABLE_THEME_IDS,
  DEFAULT_THEME_ID,
  getThemeById,
  getAllThemes,
  isValidThemeId,
  getDefaultTheme,
  getVersion,
  healthCheck(): Record<string, unknown> {
    return {
      healthy: true,
      version: VERSION,
      moduleId: MODULE_ID,
      availableThemes: AVAILABLE_THEME_IDS,
      defaultTheme: DEFAULT_THEME_ID,
      issues: null as null
    };
  }
};

// Re-export temas individuais
export { DARK_THEME, LIGHT_THEME };

export default ThemeCatalog;
