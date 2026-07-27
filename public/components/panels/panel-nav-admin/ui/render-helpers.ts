// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.6.0-KPI-DATA-ATTRS)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.render-helpers
// PURPOSE: Render helpers for skeleton, empty state, error, toast, KPIs
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./icons.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   renderSkeleton() — exported function
//   renderEmptyState() — exported function
//   renderError() — exported function
//   renderToast() — exported function
//   renderKPIs() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// @changelog v9.6.0-KPI-DATA-ATTRS: Added data-kpi-value attributes to KPI spans
//   so _rebuildRefsFromContainer and _ensureKpiRefs can find them via querySelector.
//   Without these, refs.kpiTotalItems etc are always null and animateCountUp never
//   updates the displayed values (KPIs stuck at 0).
// @changelog v9.3.0-P2-ENTERPRISE: Previous version
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

import { ICONS } from './icons.js';

export const MODULE_ID = 'panel-nav-admin.ui.render-helpers';
export const VERSION = '9.6.1-SVG-DIMENSIONS';

// ═══════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════

export function renderSkeleton(count?: number) {
    if (count === undefined) count = 5;
    let items = '';
    for (let i = 0; i < count; i++) {
        items += '<div class="pna-skeleton-item">' +
            '<div class="pna-skeleton-line pna-skeleton-short"></div>' +
            '<div class="pna-skeleton-line pna-skeleton-long"></div>' +
            '<div class="pna-skeleton-line pna-skeleton-medium"></div>' +
        '</div>';
    }
    return '<div class="pna-skeleton-list">' + items + '</div>';
}

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════

export function renderEmptyState(title: string, message: string) {
    // v9.6.1: Force width/height=24 to prevent giant-icon flash if CSS loads late
    const icon = ICONS.nav.replace('<svg ', '<svg width="24" height="24" ');
    return '<div class="pna-empty-state"><div class="pna-empty-icon">' + icon + '</div><h3 class="pna-empty-title">' + title + '</h3><p class="pna-empty-message">' + message + '</p></div>';
}

// ═══════════════════════════════════════════════════════════════
// ERROR BANNER
// ═══════════════════════════════════════════════════════════════

export function renderError(error: Error | string) {
    var msg = error && typeof error !== 'string' && error.message ? error.message : error;
    return '<div class="pna-error-banner"><span class="pna-error-icon">' + ICONS.alert + '</span><span class="pna-error-message">' + msg + '</span><button type="button" class="pna-btn-icon" data-action="dismiss-error">' + ICONS.x + '</button></div>';
}

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════

export function renderToast(message: string, type?: string) {
    if (type === undefined) type = 'success';
    var icon = type === 'success' ? ICONS.check : type === 'error' ? ICONS.alert : ICONS.nav;
    return '<div class="pna-toast pna-toast-' + type + '"><span class="pna-toast-icon">' + icon + '</span><span class="pna-toast-message">' + message + '</span></div>';
}

// ═══════════════════════════════════════════════════════════════
// KPIs
// v9.6.0-KPI-DATA-ATTRS: Each .pna-kpi-value now has data-kpi-value="xxx"
// so refs can be built via querySelector('[data-kpi-value="totalItems"]')
// ═══════════════════════════════════════════════════════════════

export function renderKPIs(kpis: Record<string, unknown>, totalItems: number, totalSections: number) {
    var data = kpis || {};
    return '<div class="pna-kpis" data-region="kpis">'
        + '<div class="pna-kpi pna-kpi-primary"><div class="pna-kpi-icon">' + ICONS.link + '</div><div class="pna-kpi-content"><span class="pna-kpi-label">Total Itens</span><span class="pna-kpi-value" data-kpi-value="totalItems">' + (totalItems || data.totalItems || 0) + '</span></div></div>'
        + '<div class="pna-kpi pna-kpi-secondary"><div class="pna-kpi-icon">' + ICONS.folder + '</div><div class="pna-kpi-content"><span class="pna-kpi-label">Seções</span><span class="pna-kpi-value" data-kpi-value="totalSections">' + (totalSections || data.totalSections || 0) + '</span></div></div>'
        + '<div class="pna-kpi pna-kpi-tertiary"><div class="pna-kpi-icon">' + ICONS.check + '</div><div class="pna-kpi-content"><span class="pna-kpi-label">Ativos</span><span class="pna-kpi-value" data-kpi-value="activeItems">' + (data.activeItems || totalItems || 0) + '</span></div></div>'
        + '<div class="pna-kpi pna-kpi-info"><div class="pna-kpi-icon">' + ICONS.shield + '</div><div class="pna-kpi-content"><span class="pna-kpi-label">Admin</span><span class="pna-kpi-value" data-kpi-value="adminItems">' + (data.adminItems || 0) + '</span></div></div>'
        + '</div>';
}

// ═══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ═══════════════════════════════════════════════════════════════

export function info() {
    return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
    return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default {
    renderSkeleton,
    renderEmptyState,
    renderError,
    renderToast,
    renderKPIs,
    info,
    healthCheck
};
