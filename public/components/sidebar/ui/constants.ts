// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-NCS-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-ui-constants
// PURPOSE: Sidebar UI - Constants & NCS (Naming Convention System)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CAPABILITIES — exported value
//   SECTION_ICONS — exported value
//   SECTION_COLORS — exported value
//   CSS_CLASSES — exported value
//   STORAGE_KEYS — exported value
//   TELEMETRY_EVENTS — exported value
//   SELECTORS — exported value
//   FALLBACK_NAV_HTML — exported value
//   FALLBACK_SIDEBAR_HTML — exported value
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '6.0.0-NCS';
export const MODULE_ID = 'sidebar-ui-constants';

// ═══════════════════════════════════════════════════════════════
// CAPABILITIES
// ═══════════════════════════════════════════════════════════════

export const CAPABILITIES = Object.freeze({ accordion: true, badges: true, search: true, keyboard: true, mobile: true, persistence: true, tooltips: true, skeleton: true, ripple: true });

// ═══════════════════════════════════════════════════════════════
// SECTION CONFIG
// ═══════════════════════════════════════════════════════════════

export const SECTION_ICONS = Object.freeze({ main: 'dashboard', operacional: 'cog', analytics: 'chart', management: 'settings', admin: 'shield', financeiro: 'money', comercial: 'chart', default: 'nav' });
export const SECTION_COLORS = Object.freeze({ main: 'var(--sidebar-accent-primary, #7B6EF6)', operacional: 'var(--sidebar-accent-primary, #7B6EF6)', admin: 'var(--sidebar-admin-color, #F59E0B)', default: 'var(--sidebar-text-muted, #6B7280)' });

// ═══════════════════════════════════════════════════════════════
// CSS_CLASSES - NCS Dictionary
// ═══════════════════════════════════════════════════════════════

const _P = 'dsd-sidebar';

export const CSS_CLASSES = Object.freeze({
  // Root
  ROOT: _P,
  // Root modifiers
  MOD_ANIMATE_IN: `${_P}--animate-in`,
  MOD_COLLAPSED: `${_P}--collapsed`,
  MOD_COMPACT: `${_P}--compact`,
  MOD_DARK: `${_P}--dark`,
  MOD_FALLBACK: `${_P}--fallback`,
  MOD_HIGH_CONTRAST: `${_P}--high-contrast`,
  MOD_LARGE_TEXT: `${_P}--large-text`,
  MOD_LIGHT: `${_P}--light`,
  MOD_LOADING: `${_P}--loading`,
  MOD_LOADING_SKELETON: `${_P}--loading-skeleton`,
  MOD_MINI: `${_P}--mini`,
  MOD_MINI_HOVER: `${_P}--mini-hover`,
  MOD_MOBILE: `${_P}--mobile`,
  MOD_MOBILE_OPEN: `${_P}--mobile-open`,
  MOD_PARALLAX: `${_P}--parallax`,
  MOD_RESIZING: `${_P}--resizing`,
  MOD_SEARCHING: `${_P}--searching`,
  // Header
  HEADER: `${_P}__header`,
  HEADER_WITH_SEARCH: `${_P}__header--with-search`,
  BRAND_TEXT: `${_P}__brand-text`,
  LOGO: `${_P}__logo`,
  TOGGLE: `${_P}__toggle`,
  // Navigation
  NAV: `${_P}__nav`,
  NAV_CONTENT: `${_P}__nav-content`,
  NAV_SECTION: `${_P}__nav-section`,
  // Sections
  SECTION: `${_P}__section`,
  SECTION_COLLAPSIBLE: `${_P}__section--collapsible`,
  SECTION_EXPANDED: `${_P}__section--expanded`,
  SECTION_CONTENT: `${_P}__section-content`,
  SECTION_HEADER: `${_P}__section-header`,
  SECTION_ITEMS: `${_P}__section-items`,
  SECTION_TITLE: `${_P}__section-title`,
  SECTION_TOGGLE: `${_P}__section-toggle`,
  // Groups
  GROUP_BUTTON: `${_P}__group-button`,
  GROUP_BUTTON_COLLAPSIBLE: `${_P}__group-button--collapsible`,
  GROUP_CHEVRON: `${_P}__group-chevron`,
  GROUP_ICON: `${_P}__group-icon`,
  GROUP_ITEMS: `${_P}__group-items`,
  GROUP_TITLE: `${_P}__group-title`,
  // Items
  ITEM: `${_P}__item`,
  ITEM_ACTIVE: `${_P}__item--active`,
  ITEM_DISABLED: `${_P}__item--disabled`,
  ITEM_EXPANDED: `${_P}__item--expanded`,
  ITEM_FAVORITE: `${_P}__item--favorite`,
  ITEM_HAS_SUBMENU: `${_P}__item--has-submenu`,
  ITEM_HIDDEN: `${_P}__item--hidden`,
  ITEM_MATCH: `${_P}__item--match`,
  ITEM_PLACEHOLDER: `${_P}__item--placeholder`,
  ITEM_SUBMENU_OPEN: `${_P}__item--submenu-open`,
  ITEM_ICON: `${_P}__item-icon`,
  ITEM_LABEL: `${_P}__item-label`,
  ITEM_TEXT: `${_P}__item-text`,
  ITEM_PLACEHOLDER_EL: `${_P}__item-placeholder`,
  ITEM_PLACEHOLDER_ICON: `${_P}__item-placeholder-icon`,
  ITEM_PLACEHOLDER_TEXT: `${_P}__item-placeholder-text`,
  LINK: `${_P}__link`,
  CHILDREN: `${_P}__children`,
  // Accordion
  ACCORDION_CONTAINER: `${_P}__accordion-container`,
  // Badges
  BADGE: `${_P}__badge`,
  BADGE_PULSE: `${_P}__badge--pulse`,
  // Search
  SEARCH: `${_P}__search`,
  SEARCH_WRAPPER: `${_P}__search-wrapper`,
  SEARCH_INPUT: `${_P}__search-input`,
  SEARCH_ICON: `${_P}__search-icon`,
  SEARCH_CLEAR: `${_P}__search-clear`,
  SEARCH_EMPTY: `${_P}__search-empty`,
  SEARCH_EMPTY_ICON: `${_P}__search-empty-icon`,
  SEARCH_EMPTY_TEXT: `${_P}__search-empty-text`,
  // Favorites
  FAVORITE_BTN: `${_P}__favorite-btn`,
  FAVORITE_BTN_ACTIVE: `${_P}__favorite-btn--active`,
  // Context menu
  CONTEXT_MENU: `${_P}__context-menu`,
  CONTEXT_MENU_VISIBLE: `${_P}__context-menu--visible`,
  CONTEXT_MENU_ITEM: `${_P}__context-menu-item`,
  CONTEXT_MENU_ICON: `${_P}__context-menu-icon`,
  CONTEXT_MENU_LABEL: `${_P}__context-menu-label`,
  CONTEXT_MENU_SEPARATOR: `${_P}__context-menu-separator`,
  // Submenu
  SUBMENU: `${_P}__submenu`,
  SUBMENU_ITEM: `${_P}__submenu-item`,
  SUBMENU_LINK: `${_P}__submenu-link`,
  // Resize
  RESIZE_HANDLE: `${_P}__resize-handle`,
  RESIZE_HANDLE_ACTIVE: `${_P}__resize-handle--active`,
  // Skeleton
  SKELETON: `${_P}__skeleton`,
  SKELETON_GROUP: `${_P}__skeleton-group`,
  SKELETON_ICON: `${_P}__skeleton-icon`,
  SKELETON_ITEM: `${_P}__skeleton-item`,
  SKELETON_TEXT: `${_P}__skeleton-text`,
  SKELETON_TEXT_SHORT: `${_P}__skeleton-text--short`,
  // Accessibility
  ANNOUNCE: `${_P}__announce`,
  SKIP_LINK: `${_P}__skip-link`,
  KEYBOARD_HINTS: `${_P}__keyboard-hints`,
  // Overlay
  OVERLAY: `${_P}-overlay`,
  OVERLAY_VISIBLE: `${_P}-overlay--visible`,
  // Visual
  RIPPLE: `${_P}__ripple`,
  FOOTER: `${_P}__footer`,
  // Empty state
  EMPTY: `${_P}__empty`,
  EMPTY_ICON: `${_P}__empty-icon`,
  EMPTY_TEXT: `${_P}__empty-text`
});

// ═══════════════════════════════════════════════════════════════
// STORAGE_KEYS - localStorage/sessionStorage keys
// ═══════════════════════════════════════════════════════════════

export const STORAGE_KEYS = Object.freeze({
  COLLAPSED: `${_P}-collapsed`,
  COMPACT: `${_P}-compact`,
  MINI: `${_P}-mini`,
  THEME: `${_P}-theme`,
  WIDTH: `${_P}-width`,
  STATE: `${_P}-state`,
  FAVORITES: `${_P}-favorites`,
  RECENT: `${_P}-recent`,
  ORDER: `${_P}-order`,
  FEATURE_FLAGS: `${_P}-feature-flags`,
  EXPANDED_SECTIONS: 'dsd:sidebar:sections',
  CRITICAL_CSS: `${_P}-critical-css`,
  AUTO_THEME: `${_P}-auto-theme`
});

// ═══════════════════════════════════════════════════════════════
// TELEMETRY_EVENTS - Telemetry event names
// ═══════════════════════════════════════════════════════════════

export const TELEMETRY_EVENTS = Object.freeze({
  ERROR: 'sidebar:error',
  NAVIGATION: 'sidebar:navigation',
  TOGGLE: 'sidebar:toggle',
  SECTION_TOGGLE: 'sidebar:section:toggle',
  SEARCH: 'sidebar:search',
  ITEMS_UPDATED: 'sidebar:items-updated',
  LAZY_RENDER: 'sidebar:lazy-render',
  INITIALIZED: 'sidebar:intersection-observer:initialized'
});

// ═══════════════════════════════════════════════════════════════
// SELECTORS - Query selector helpers
// ═══════════════════════════════════════════════════════════════

export const SELECTORS = Object.freeze({
  ROOT: `.${_P}`,
  ITEM: `.${_P}__item`,
  ITEM_ACTIVE: `.${_P}__item--active`,
  LINK: `.${_P}__link`,
  SECTION: `.${_P}__section`,
  SECTION_EXPANDED: `.${_P}__section--expanded`,
  NAV: `.${_P}__nav`,
  NAV_CONTENT: `.${_P}__nav-content`,
  SEARCH_INPUT: `.${_P}__search-input`,
  TOGGLE: `.${_P}__toggle`,
  SUBMENU: `.${_P}__submenu`
});

// ═══════════════════════════════════════════════════════════════
// FALLBACKS
// ═══════════════════════════════════════════════════════════════

export const FALLBACK_NAV_HTML = `<div class="${CSS_CLASSES.EMPTY}"><span class="${CSS_CLASSES.EMPTY_ICON}">📋</span><span class="${CSS_CLASSES.EMPTY_TEXT}">Nenhum item disponível</span></div>`;
export const FALLBACK_SIDEBAR_HTML = `<aside class="${CSS_CLASSES.ROOT} ${CSS_CLASSES.MOD_FALLBACK}" id="sidebar" role="navigation"><div class="${CSS_CLASSES.HEADER}"><span class="${CSS_CLASSES.BRAND_TEXT}">Menu</span></div><nav class="${CSS_CLASSES.NAV}"><div class="${CSS_CLASSES.NAV_CONTENT}">${FALLBACK_NAV_HTML}</div></nav></aside>`;

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  return {
    capabilitiesCount: Object.keys(CAPABILITIES).length,
    sectionIconsCount: Object.keys(SECTION_ICONS).length,
    sectionColorsCount: Object.keys(SECTION_COLORS).length,
    cssClassesCount: Object.keys(CSS_CLASSES).length,
    storageKeysCount: Object.keys(STORAGE_KEYS).length,
    telemetryEventsCount: Object.keys(TELEMETRY_EVENTS).length,
    selectorsCount: Object.keys(SELECTORS).length
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }

export function healthCheck() {
  return {
    status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID,
    checks: { hasCapabilities: true, hasFallbacks: true, hasSectionIcons: true, hasSectionColors: true, hasCssClasses: Object.keys(CSS_CLASSES).length > 0, hasStorageKeys: Object.keys(STORAGE_KEYS).length > 0 },
    metrics: getMetrics()
  };
}

export default { VERSION, MODULE_ID, CAPABILITIES, SECTION_ICONS, SECTION_COLORS, CSS_CLASSES, STORAGE_KEYS, TELEMETRY_EVENTS, SELECTORS, FALLBACK_NAV_HTML, FALLBACK_SIDEBAR_HTML, getMetrics, info, healthCheck };
