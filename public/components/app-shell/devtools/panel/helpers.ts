// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/panel/helpers
// PURPOSE: Funções utilitárias compartilhadas do debug panel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Icons from ../../ui/icons.js
// EXPORTS:
//   VERSION — Versão do módulo
//   icon — Renderiza ícone SVG
//   formatBytes, formatTime, formatDate — Formatadores
//   sanitizeAttr — Sanitiza atributos HTML
//   statusClass, networkQualityClass — Classes CSS de status
//   getAppShell, getBootstrap — Referências globais
//   makeSectionHtml — Builder de seções colapsáveis
//   setCollapsedSections, getCollapsedSections — Estado de collapse
// ═══════════════════════════════════════════════════════════════
/**
 * @module DevtoolsPanelHelpers
 * @description Utilitários do debug panel
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

import Icons from '../../ui/icons.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'app-shell.devtools.panel.helpers';

export const VERSION = '1.1.0-AAA';

export function icon(name: string, size?: DynObj) {
    return Icons.icon(name, size || 16);
}

export function formatBytes(bytes: DynObj) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatTime(ms: number) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

export function formatDate(ts: DynObj) {
    return new Date(ts).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function sanitizeAttr(str: DynObj) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function statusClass(status: DynObj) {
    switch (status) {
        case 'HEALTHY': return 'dsd-ui-status--healthy';
        case 'DEGRADED': return 'dsd-ui-status--degraded';
        case 'UNHEALTHY': return 'dsd-ui-status--unhealthy';
        default: return '';
    }
}

export function networkQualityClass(quality: DynObj) {
    switch (quality) {
        case 'excellent': return 'dsd-ui-status--healthy';
        case 'good': return 'dsd-ui-status--healthy';
        case 'fair': return 'dsd-ui-status--degraded';
        case 'poor': return 'dsd-ui-status--unhealthy';
        default: return '';
    }
}

export function getAppShell() {
    return typeof window !== 'undefined' ? (window as any).AppShell : null;
}

export function getBootstrap() {
    return typeof window !== 'undefined' && (window as any).BootstrapV2 ? (window as any).BootstrapV2 : null;
}

let _collapsedSections = {};

export function setCollapsedSections(obj: DynObj) { _collapsedSections = obj || {}; }
export function getCollapsedSections() { return _collapsedSections; }

export function makeSectionHtml(id: DynObj, titleIcon: DynObj, titleText: string, innerHtml?: DynObj, defaultCollapsed?: DynObj) {
    const isCollapsed = (_collapsedSections as DynObj)[id] !== undefined ? (_collapsedSections as DynObj)[id] : (defaultCollapsed || false);
    const chevron = isCollapsed ? 'chevronRight' : 'chevronDown';
    return `<div class="dsd-ui-section${isCollapsed ? ' collapsed' : ''}" data-section-id="${sanitizeAttr(id)}"><div class="dsd-ui-section__title dsd-ui-section__title--collapsible" data-toggle-section="${sanitizeAttr(id)}"><span class="dsd-ui-section__chevron">${icon(chevron, 12)}</span> ${icon(titleIcon)} ${titleText}</div><div class="dsd-ui-section__body"${isCollapsed ? ' style="display:none"' : ''}>${innerHtml}</div></div>`;
}

export default {
    VERSION, icon, formatBytes, formatTime, formatDate,
    sanitizeAttr, statusClass, networkQualityClass,
    getAppShell, getBootstrap,
    makeSectionHtml, setCollapsedSections, getCollapsedSections
};
