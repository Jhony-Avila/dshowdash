

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-tokens-loader-core
// PURPOSE: core   loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TokensRegistry, TOKEN_GROUPS from ./registry.js
//   CssParser, parseCssToTokens from ../utils/css-parser.js
//   safeFetch, flattenTokens from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TokensLoader — exported value
//   getVersion() — exported function
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
// Theme Tokens Loader - Loader v1.0.0-ENTERPRISE
// Carregamento e normalização de tokens

import { TokensRegistry, TOKEN_GROUPS } from './registry.js';
import { CssParser, parseCssToTokens } from '../utils/css-parser.js';
import { safeFetch, flattenTokens } from '../utils/helpers.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'theme-tokens-loader-core';

export function getVersion() {
  return VERSION;
}

// Configuração de fontes
const TOKEN_SOURCES = {
  css: [
    {
      path: '/assets/css/theme.tokens.css',
      group: TOKEN_GROUPS.GLOBAL_TOKENS,
      description: 'Global theme tokens'
    },
    {
      path: '/assets/css/design-system/01-tokens-extended.css',
      group: TOKEN_GROUPS.GLOBAL_EXTENDED,
      description: 'Extended design system tokens'
    },
    {
      path: '/components/main/styles/main.tokens.css',
      group: TOKEN_GROUPS.COMPONENT_MAIN,
      description: 'Main component tokens'
    },
    {
      path: '/components/login-modal/styles/tokens.css',
      group: TOKEN_GROUPS.COMPONENT_LOGIN,
      description: 'Login modal tokens'
    },
    {
      path: '/components/sidebar/styles/tokens.css',
      group: TOKEN_GROUPS.COMPONENT_SIDEBAR,
      description: 'Sidebar tokens'
    }
  ],
  js: [
    {
      path: '/components/header/components/ticker/config/design-tokens.js',
      group: TOKEN_GROUPS.COMPONENT_TICKER,
      exportName: 'TICKER_TOKENS',
      description: 'Ticker design tokens'
    }
  ]
};

// Estado do loader
const _loaderState = {
  loading: false,
  lastLoadAt: null as unknown | null,
  errors: [] as unknown[]
};

// Carregar um arquivo CSS
async function loadCssSource(source: Record<string, unknown>) {
  try {
    const result = await safeFetch(source.path as string);
    
    if (!result.ok) {
      return {
        success: false,
        source: source.path,
        group: source.group,
        error: result.error
      };
    }

    const parsed = parseCssToTokens(result.data, {
      group: source.group,
      source: source.path
    });

    // Registrar no registry
    TokensRegistry.registerTokens(source.group, parsed.tokens, {
      type: 'css',
      path: source.path,
      description: source.description
    });

    return {
      success: true,
      source: source.path,
      group: source.group,
      tokenCount: parsed.count
    };

  } catch (error: any) {
    return {
      success: false,
      source: source.path,
      group: source.group,
      error: (error as Error).message
    };
  }
}

// Carregar um arquivo JS
async function loadJsSource(source: Record<string, unknown>) {
  try {
    // @ts-expect-error TS migration - TS7036
    const module = await import(source.path);
    const tokens = module[source.exportName as string] || module.default;

    if (!tokens) {
      return {
        success: false,
        source: source.path,
        group: source.group,
        error: `Export "${source.exportName}" not found`
      };
    }

    // Flatten se for objeto aninhado
    const flatTokens = flattenTokens(tokens);

    // Registrar no registry
    TokensRegistry.registerTokens(source.group, flatTokens, {
      type: 'js',
      path: source.path,
      description: source.description,
      exportName: source.exportName
    });

    return {
      success: true,
      source: source.path,
      group: source.group,
      tokenCount: Object.keys(flatTokens).length
    };

  } catch (error: any) {
    return {
      success: false,
      source: source.path,
      group: source.group,
      error: (error as Error).message
    };
  }
}

// Loader API
export const TokensLoader = {
  // Carregar todos os tokens CSS
  async loadCssTokens() {
    const results = [];

    for (const source of TOKEN_SOURCES.css) {
      const result = await loadCssSource(source);
      results.push(result);
      
      if (!result.success) {
        _loaderState.errors.push({
          type: 'css',
          source: source.path,
          error: result.error,
          at: Date.now()
        });
      }
    }

    return {
      type: 'css',
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  },

  // Carregar todos os tokens JS
  async loadJsTokens() {
    const results = [];

    for (const source of TOKEN_SOURCES.js) {
      const result = await loadJsSource(source);
      results.push(result);
      
      if (!result.success) {
        _loaderState.errors.push({
          type: 'js',
          source: source.path,
          error: result.error,
          at: Date.now()
        });
      }
    }

    return {
      type: 'js',
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  },

  // Carregar todas as fontes
  async loadAllSources() {
    if (_loaderState.loading) {
      return { ok: false, error: 'already-loading' };
    }

    _loaderState.loading = true;
    _loaderState.errors = [];

    const startTime = performance.now();

    try {
      const [cssResults, jsResults] = await Promise.all([
        this.loadCssTokens(),
        this.loadJsTokens()
      ]);

      _loaderState.lastLoadAt = Date.now();
      _loaderState.loading = false;

      const duration = performance.now() - startTime;

      return {
        ok: true,
        duration: Math.round(duration),
        sources: {
          css: cssResults,
          js: jsResults
        },
        summary: {
          totalSources: cssResults.total + jsResults.total,
          successfulSources: cssResults.success + jsResults.success,
          failedSources: cssResults.failed + jsResults.failed,
          totalTokens: TokensRegistry.getSummary().totalTokens
        }
      };

    } catch (error: any) {
      _loaderState.loading = false;
      return {
        ok: false,
        error: error.message,
        duration: performance.now() - startTime
      };
    }
  },

  // Recarregar todas as fontes
  async reload() {
    TokensRegistry.clearRegistry();
    return this.loadAllSources();
  },

  // Obter estado do loader
  getState() {
    return {
      loading: _loaderState.loading,
      lastLoadAt: _loaderState.lastLoadAt,
      errorCount: _loaderState.errors.length,
      errors: [..._loaderState.errors]
    };
  },

  // Obter configuração de fontes
  getSources() {
    return {
      css: TOKEN_SOURCES.css.map(s => ({ path: s.path, group: s.group })),
      js: TOKEN_SOURCES.js.map(s => ({ path: s.path, group: s.group }))
    };
  },

  // Health check
  healthCheck() {
    return {
      healthy: !_loaderState.loading && _loaderState.errors.length === 0,
      version: VERSION,
      moduleId: MODULE_ID,
      state: this.getState(),
      issues: _loaderState.errors.length > 0 ? `${_loaderState.errors.length} load errors` : null
    };
  }
};

export default TokensLoader;
