// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.ui.visibility
// PURPOSE: Visibility check functions for accordion sections and items
// ───────────────────────────────────────────────────────────────
// @contract IS_SECTION_VISIBLE - isSectionVisible(section) checks visibility
// @contract IS_SECTION_DISABLED - isSectionDisabled(section) checks disabled
// @contract IS_ITEM_VISIBLE - isItemVisible(item) checks visibility
// @contract IS_ITEM_DISABLED - isItemDisabled(item) checks disabled
// @contract ESCAPE_HTML - escapeHTML(str) escapes HTML characters
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: isSectionVisible, isSectionDisabled, isItemVisible,
//           isItemDisabled, escapeHTML, healthCheck, info, VERSION, MODULE_ID
// @changelog v2.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.1.0-UNIFIED-TRIGGERS: Initial visibility utilities
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.ui.visibility';

export function isSectionVisible(section: Record<string, any>) {
  if (section.visible === false) return false;
  if (section.visibilityPolicy?.mode === 'hide') return false;
  return true;
}

export function isSectionDisabled(section: Record<string, any>) {
  if (section.visibilityPolicy?.mode === 'disable') return true;
  return false;
}

export function isItemVisible(item: Record<string, any>) {
  if (item.visible === false) return false;
  if (item.visibilityPolicy?.mode === 'hide') return false;
  return true;
}

export function isItemDisabled(item: Record<string, any>) {
  if (item.visibilityPolicy?.mode === 'disable') return true;
  return false;
}

export function escapeHTML(str: string) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function healthCheck() {
  const checks = {
    isSectionVisibleAvailable: typeof isSectionVisible === 'function',
    isSectionDisabledAvailable: typeof isSectionDisabled === 'function',
    isItemVisibleAvailable: typeof isItemVisible === 'function',
    isItemDisabledAvailable: typeof isItemDisabled === 'function',
    escapeHTMLAvailable: typeof escapeHTML === 'function'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    functions: ['isSectionVisible', 'isSectionDisabled', 'isItemVisible', 'isItemDisabled', 'escapeHTML'],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  isSectionVisible,
  isSectionDisabled,
  isItemVisible,
  isItemDisabled,
  escapeHTML,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
