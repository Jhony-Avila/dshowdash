/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/core/constants.ts
 * @version 1.0.0
 * Constantes, classes CSS e seletores
 * Visão especializada da sidebar (ui_nav_items / contexto sidebar).
 * ═══════════════════════════════════════════════════════════════ */

export const PANEL_ID = 'panel-criacao-botoes';
export const MODULE_ID = 'panels.panel-criacao-botoes';
export const VERSION = '1.0.0';

export const CSS_PREFIX = 'pcb';

/** Contexto fixo: este painel opera SOMENTE sobre a sidebar. */
export const CONTEXT = 'sidebar' as const;

/** Tabela-fonte real (prova de escrita única em ui_nav_items). */
export const SOURCE_TABLE = 'ui_nav_items' as const;

/** Endpoint dos painéis reais (lê panel_registry) — usado no dropdown de rota/panel_id. */
export const PANELS_API = '/api/admin/panels';

/** Categoria usada ao filtrar painéis reais administrativos no dropdown. */
export const PANELS_API_QUERY = '?per_page=200&sort=title&order=asc';

/** Valor explícito de placeholder ("painel ainda não construído"). */
export const STUB_PANEL_ID = 'panel-stub-dev';

export const SELECTORS = {
  container: `[data-panel="${PANEL_ID}"]`,
  root: `.${CSS_PREFIX}`,
  list: `.${CSS_PREFIX}-list`,
  group: `.${CSS_PREFIX}-group`,
  item: `.${CSS_PREFIX}-item`,
  form: `.${CSS_PREFIX}-form`,
  preview: `.${CSS_PREFIX}-preview`,
  skeleton: `.${CSS_PREFIX}-skeleton`,
  emptyState: `.${CSS_PREFIX}-empty`,
  error: `.${CSS_PREFIX}-error`,
} as const;

export const CLASSES = {
  itemActive: `${CSS_PREFIX}-item--active`,
  itemInactive: `${CSS_PREFIX}-item--inactive`,
  loading: `${CSS_PREFIX}--loading`,
  hidden: `${CSS_PREFIX}--hidden`,
} as const;

export const DATA_ATTRS = {
  action: 'data-action',
  itemId: 'data-item-id',
  groupKey: 'data-group-key',
} as const;
