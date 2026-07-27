const PANEL_ID = "panel-gestao-paineis";
const MODULE_ID = "panels.panel-gestao-paineis";
const VERSION = "1.0.0";
const CSS_PREFIX = "pgp";
const SELECTORS = {
  container: `[data-panel="${PANEL_ID}"]`,
  grid: `.${CSS_PREFIX}-grid`,
  card: `.${CSS_PREFIX}-card`,
  filterBar: `.${CSS_PREFIX}-filter-bar`,
  searchInput: `.${CSS_PREFIX}-search-input`,
  categoryFilter: `.${CSS_PREFIX}-category-filter`,
  statusFilter: `.${CSS_PREFIX}-status-filter`,
  kpiBar: `.${CSS_PREFIX}-kpi-bar`,
  modal: `.${CSS_PREFIX}-modal`,
  modalOverlay: `.${CSS_PREFIX}-modal-overlay`,
  skeleton: `.${CSS_PREFIX}-skeleton`,
  emptyState: `.${CSS_PREFIX}-empty-state`
};
const CLASSES = {
  cardActive: `${CSS_PREFIX}-card--active`,
  cardInactive: `${CSS_PREFIX}-card--inactive`,
  cardPending: `${CSS_PREFIX}-card--pending`,
  cardHover: `${CSS_PREFIX}-card--hover`,
  badgeActive: `${CSS_PREFIX}-badge--active`,
  badgeInactive: `${CSS_PREFIX}-badge--inactive`,
  modalOpen: `${CSS_PREFIX}-modal--open`,
  loading: `${CSS_PREFIX}--loading`,
  hidden: `${CSS_PREFIX}--hidden`
};
const DATA_ATTRS = {
  action: "data-action",
  panelId: "data-panel-id",
  category: "data-category",
  status: "data-status"
};
const CATEGORY_COLORS = {
  admin: "#7c3aed",
  producao: "#10b981",
  financeiro: "#f59e0b",
  integracao: "#3b82f6",
  status: "#06b6d4",
  media: "#ec4899",
  monitoramento: "#8b5cf6",
  dashboard: "#6366f1",
  default: "#64748b"
};
const REFRESH_INTERVAL = 12e4;
const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PER_PAGE = 200;
export {
  CATEGORY_COLORS,
  CLASSES,
  CSS_PREFIX,
  DATA_ATTRS,
  DEFAULT_PER_PAGE,
  MODULE_ID,
  PANEL_ID,
  REFRESH_INTERVAL,
  SEARCH_DEBOUNCE_MS,
  SELECTORS,
  VERSION
};
