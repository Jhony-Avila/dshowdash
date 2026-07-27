// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-NEW-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: features-toolbar
// PURPOSE: Features Toolbar - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BUTTON_IDS — exported value
//   DROPDOWN_IDS — exported value
//   ALL_BUTTON_IDS — exported value
//   ALL_DROPDOWN_IDS — exported value
//   GROUPS — exported value
//   GROUP_ORDER — exported value
//   getConfig() — exported function
//   setConfig() — exported function
//   getAllConfig() — exported function
//   STATE_PROVIDER_FIELDS — exported value
//   validateStateProviderResult() — exported function
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

export const VERSION = '6.0.0-NEW-FEATURES';
export const MODULE_ID = 'features-toolbar';

// ============================================================================
// #2 — BUTTON_IDS: Catálogo centralizado de IDs de botões
// Elimina strings mágicas dispersas no ecossistema.
// Qualquer novo botão DEVE ser adicionado aqui primeiro.
// ============================================================================

export const BUTTON_IDS = Object.freeze({
  // Grupo 1: Navegação (Violet)
  BACK:       'back',
  FORWARD:    'forward',
  REFRESH:    'refresh',
  HISTORY:    'history',

  // Grupo 2: Busca (Blue)
  SEARCH:     'search',
  COMMAND:    'command',

  // Grupo 3: Layout (Emerald)
  SPLIT:      'split',
  FULLSCREEN: 'fullscreen',

  // Grupo 4: Zoom (Amber)
  ZOOM_OUT:   'zoomOut',
  ZOOM_RESET: 'zoomReset',
  ZOOM_IN:    'zoomIn',

  // Grupo 5: Ações (Pink)
  BOOKMARK:   'bookmark',
  EXPORT:     'export',
  PRINT:      'print',

  // Grupo 6: Config (Cyan)
  THEME:      'theme',
  A11Y:       'a11y',
  TOUR:       'tour',

  // Grupo 7: Ferramentas (Orange)
  OFFLINE:    'offline',
  TABS:       'tabs',
  LAYOUT:     'layout',
  DEVTOOLS:   'devtools',

  // Grupo 8: Utilidades (Rose)
  CLIPBOARD:   'clipboard',
  SCREENSHOT:  'screenshot',
  WAKE_LOCK:   'wakeLock'
});

// IDs compostos para dropdown items
export const DROPDOWN_IDS = Object.freeze({
  // Export (Pink)
  EXPORT_PNG:  'export-png',
  EXPORT_JPEG: 'export-jpeg',
  EXPORT_PDF:  'export-pdf',
  EXPORT_SVG:  'export-svg',

  // #19: History dropdown items (Violet)
  HISTORY_BACK_ALL: 'history-back-all',
  HISTORY_CLEAR:    'history-clear',

  // #17: Layout dropdown items (Orange)
  LAYOUT_DEFAULT: 'layout-default',
  LAYOUT_COMPACT: 'layout-compact',
  LAYOUT_WIDE:    'layout-wide',

  // #18: Accessibility dropdown items (Cyan)
  A11Y_FONT_INCREASE: 'a11y-font-increase',
  A11Y_FONT_DECREASE: 'a11y-font-decrease',
  A11Y_HIGH_CONTRAST: 'a11y-high-contrast',
  A11Y_FOCUS_MODE:    'a11y-focus-mode',

  // Clipboard dropdown items (Rose)
  CLIPBOARD_COPY_URL:     'clipboard-copy-url',
  CLIPBOARD_COPY_CONTENT: 'clipboard-copy-content',

  // Screenshot dropdown items (Rose)
  SCREENSHOT_PNG: 'screenshot-png',
  SCREENSHOT_PDF: 'screenshot-pdf'
});

// Lista flat de todos os IDs (útil para iteração)
export const ALL_BUTTON_IDS = Object.freeze(Object.values(BUTTON_IDS));
export const ALL_DROPDOWN_IDS = Object.freeze(Object.values(DROPDOWN_IDS));

// ============================================================================
// #3 — GROUPS: Catálogo de metadados dos grupos
// Define a estrutura oficial dos grupos da toolbar.
// Usado por builder.js, registerGroup (#28), healthCheck (#29), e overflow (#23).
// ============================================================================

export const GROUPS = Object.freeze({
  navigation: {
    id: 'navigation',
    label: 'Navegação',
    colorToken: 'nav',
    color: '#a78bfa',
    order: 1,
    buttonIds: ['back', 'forward', 'refresh', 'history']
  },
  search: {
    id: 'search',
    label: 'Busca',
    colorToken: 'search',
    color: '#60a5fa',
    order: 2,
    buttonIds: ['search', 'command']
  },
  layout: {
    id: 'layout',
    label: 'Layout',
    colorToken: 'layout',
    color: '#34d399',
    order: 3,
    buttonIds: ['split', 'fullscreen']
  },
  zoom: {
    id: 'zoom',
    label: 'Zoom',
    colorToken: 'zoom',
    color: '#fbbf24',
    order: 4,
    buttonIds: ['zoomOut', 'zoomReset', 'zoomIn']
  },
  actions: {
    id: 'actions',
    label: 'Ações',
    colorToken: 'action',
    color: '#f472b6',
    order: 5,
    buttonIds: ['bookmark', 'export', 'print']
  },
  config: {
    id: 'config',
    label: 'Configuração',
    colorToken: 'config',
    color: '#22d3ee',
    order: 6,
    buttonIds: ['theme', 'a11y', 'tour']
  },
  tools: {
    id: 'tools',
    label: 'Ferramentas',
    colorToken: 'tools',
    color: '#fb923c',
    order: 7,
    buttonIds: ['offline', 'tabs', 'layout', 'devtools']
  },
  utilities: {
    id: 'utilities',
    label: 'Utilidades',
    colorToken: 'util',
    color: '#fb7185',
    order: 8,
    buttonIds: ['clipboard', 'screenshot', 'wakeLock']
  }
});

// Lista ordenada de IDs de grupo (para iteração sequencial)
export const GROUP_ORDER = Object.freeze(
  Object.values(GROUPS)
    .sort((a, b) => a.order - b.order)
    .map(g => g.id)
);

// ============================================================================
// #24 — CONFIG: Tokens configuráveis em runtime
// Permite ajustar comportamentos via setConfig() na API pública.
// ============================================================================

const _config = {
  tooltipDelay: 300,
  tooltipEnabled: true
};

/**
 * Retorna o valor atual de uma config.
 * @param {string} key
 * @returns {*}
 */
export function getConfig(key: string) {
  return (_config as Record<string, unknown>)[key];
}

/**
 * Define um valor de config. Retorna true se a chave é válida.
 * @param {string} key
 * @param {*} value
 * @returns {boolean}
 */
export function setConfig(key: string, value: unknown) {
  if (!(key in _config)) return false;
  (_config as Record<string, unknown>)[key] = value;
  return true;
}

/**
 * Retorna snapshot completo da config (para diagnóstico).
 * @returns {Object}
 */
export function getAllConfig() {
  return Object.assign({}, _config);
}

// ============================================================================
// #5 — STATE_PROVIDER_CONTRACT: Contrato formal para state providers
// #14: Expandido com badge (string|number) e dot (boolean)
// Documenta os campos aceitos pelo state-updater ao consultar providers.
// ============================================================================

/**
 * @typedef {Object} ButtonState
 * @property {boolean}         [disabled] - Se true, botão fica disabled. Se false/undefined, enabled.
 * @property {boolean}         [active]   - Se true, aplica classe --active (visual highlight).
 * @property {string}          [icon]     - SVG string para substituir o ícone atual do botão.
 * @property {string}          [tooltip]  - Texto para substituir o tooltip atual.
 * @property {string|number}   [badge]    - Texto/número para badge overlay (ex: count de tabs).
 * @property {boolean}         [dot]      - Se true, mostra dot-indicator (ex: offline ativo).
 */

// Campos válidos que o state-updater aceita
export const STATE_PROVIDER_FIELDS = Object.freeze([
  'disabled',
  'active',
  'icon',
  'tooltip',
  'badge',
  'dot'
]);

/**
 * Valida um retorno de state provider.
 * Retorna o objeto limpo (apenas campos válidos) ou null se inválido.
 * @param {*} state
 * @returns {ButtonState|null}
 */
export function validateStateProviderResult(state: Record<string, unknown>) {
  if (!state || typeof state !== 'object') return null;

  const clean: Record<string, unknown> = {};
  let hasValidField = false;

  for (let i = 0; i < STATE_PROVIDER_FIELDS.length; i++) {
    const field = STATE_PROVIDER_FIELDS[i];
    if (field in state) {
      clean[field] = state[field];
      hasValidField = true;
    }
  }

  return hasValidField ? clean : null;
}
