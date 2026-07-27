// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.ui.html-builders
// PURPOSE: HTML builders for accordion view rendering
// ───────────────────────────────────────────────────────────────
// @contract buildIcon - Build icon HTML with resolver or fallback
// @contract buildBadge - Build badge HTML (dot, count, alert, etc.)
// @contract buildItem - Build single accordion item HTML
// @contract buildItems - Build multiple accordion items HTML
// @contract buildSection - Build accordion section HTML
// @contract buildEmptyState - Build empty state HTML
// @contract buildSkeleton - Build loading skeleton HTML
// @contract buildErrorState - Build error state HTML
// @contract buildHTML - Build complete accordion HTML
// @contract setIconResolver - Set external icon resolver function
// @contract getIconResolver - Get current icon resolver function
// @contract setUarpsRegion - Set UARPS region for triggers
// @contract getUarpsRegion - Get current UARPS region
// @contract healthCheck - Health check for observability
// @contract info - Module info for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: constants.js, uarps-triggers.js, visibility.js, accordion.contracts.js
// PROVIDES: buildIcon, buildBadge, buildItem, buildItems, buildSection,
//           buildEmptyState, buildSkeleton, buildErrorState, buildHTML,
//           setIconResolver, getIconResolver, setUarpsRegion, getUarpsRegion,
//           healthCheck, info
// @changelog v2.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.2.0 - P0.1: Removido import do Sidebar (getIconSvg), usa iconResolver injetado
// @changelog v2.2.0 - P0.2: buildRegionAttr usa uarpsRegion configurável
// @changelog v2.2.0 - P0.3: IDs unificados (sempre usa section.id canônico)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.ui.html-builders';

import { FALLBACK_ICONS } from './constants.js';
import { buildItemTrigger, buildSectionTrigger, buildRegionAttr } from './uarps-triggers.js';
import { isSectionVisible, isSectionDisabled, isItemVisible, isItemDisabled, escapeHTML } from './visibility.js';
import { LOADING_STATE } from '../domain/accordion.contracts.js';

// ═══════════════════════════════════════════════════════════════
// ICON RESOLVER (Injected via setIconResolver)
// ═══════════════════════════════════════════════════════════════

let _iconResolver: ((iconName: string) => string) | null = null;

export function setIconResolver(resolver: ((iconName: string) => string) | null) {
    _iconResolver = resolver;
}

export function getIconResolver() {
    return _iconResolver;
}

// ═══════════════════════════════════════════════════════════════
// UARPS REGION CONFIGURATION
// ═══════════════════════════════════════════════════════════════

let _uarpsRegion: string | null = null;

export function setUarpsRegion(region: string | null) {
    _uarpsRegion = region;
}

export function getUarpsRegion() {
    return _uarpsRegion;
}

// ═══════════════════════════════════════════════════════════════
// ICON BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildIcon(iconName: string, className: string) {
    let iconSvg = null;

    // Try injected resolver first
    if (_iconResolver && typeof _iconResolver === 'function') {
        try {
            iconSvg = _iconResolver(iconName);
        } catch (e) {
            // Silent fallback
        }
    }

    // Validate icon (reject generic placeholder)
    if (!iconSvg || iconSvg.includes('circle cx="12" cy="12" r="10"')) {
        iconSvg = (FALLBACK_ICONS as Record<string, string>)[iconName] || FALLBACK_ICONS.file;
    }

    return `<span class="${className}" aria-hidden="true">${iconSvg}</span>`;
}

// ═══════════════════════════════════════════════════════════════
// BADGE BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildBadge(badge: Record<string, unknown>) {
    if (!badge || badge.type === 'none') return '';

    let badgeClass = 'dsd-sidebar__badge';
    let badgeContent = '';

    if (badge.type === 'dot') {
        badgeClass += ' dsd-sidebar__badge--dot';
        if (badge.pulse) badgeClass += ' dsd-sidebar__badge--pulse';
        return `<span class="${badgeClass}" aria-hidden="true"></span>`;
    }

    if (badge.type === 'count' && badge.value != null) {
        badgeClass += ' dsd-sidebar__badge--count';
        badgeContent = badge.value as string;
    } else if (badge.type === 'alert') {
        badgeClass += ' dsd-sidebar__badge--alert';
        badgeContent = (badge.value as string) || (badge.label as string) || '';
    } else if (badge.type === 'success') {
        badgeClass += ' dsd-sidebar__badge--success';
        badgeContent = (badge.value as string) || (badge.label as string) || '';
    } else if (badge.type === 'info') {
        badgeClass += ' dsd-sidebar__badge--info';
        badgeContent = (badge.value as string) || (badge.label as string) || '';
    } else if (badge.type === 'label' && badge.label) {
        badgeContent = escapeHTML(badge.label as string);
    }

    if (badge.pulse) badgeClass += ' dsd-sidebar__badge--pulse';

    return `<span class="${badgeClass}" aria-label="${badgeContent} notificações">${badgeContent}</span>`;
}

// ═══════════════════════════════════════════════════════════════
// ITEM BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildItem(item: Record<string, any>, state: Record<string, any>, sectionId: string, uarpsEnabled: boolean) {
    const isActive = state?.activeItemId === item.id;
    const isDisabled = item.disabled === true || isItemDisabled(item);

    const activeClass = isActive ? ' dsd-sidebar__item--active' : '';
    const disabledClass = isDisabled ? ' dsd-sidebar__item--disabled' : '';

    const iconHTML = buildIcon(item.icon, 'dsd-sidebar__item-icon');
    const badgeHTML = item.badge ? buildBadge(item.badge) : '';

    const ariaCurrent = isActive ? 'aria-current="page"' : '';
    const tabIndex = isDisabled ? 'tabindex="-1"' : 'tabindex="0"';

    const itemTrigger = uarpsEnabled ? `data-uarps-trigger="${buildItemTrigger(item.id)}"` : '';
    const itemTitle = escapeHTML(item.label);

    return `<li class="dsd-sidebar__item${activeClass}${disabledClass}" role="listitem" data-item-id="${item.id}" ${itemTrigger}><a href="${item.target?.path || `#${item.id}`}" class="dsd-sidebar__link" data-action="select-item" data-item-id="${item.id}" data-section-id="${sectionId}" data-item-type="${item.type}" data-panel="${item.id}" data-tooltip="${itemTitle}" ${ariaCurrent} ${tabIndex} ${isDisabled ? 'aria-disabled="true"' : ''}>${iconHTML}<span class="dsd-sidebar__item-text">${itemTitle}</span>${badgeHTML}</a></li>`;
}

// ═══════════════════════════════════════════════════════════════
// ITEMS BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildItems(items: Array<Record<string, unknown>>, state: Record<string, any>, sectionId: string, uarpsEnabled: boolean) {
    if (!items || items.length === 0) return '';

    return items
        .filter(item => isItemVisible(item))
        .sort((a, b) => Number(a.order ?? 100) - Number(b.order ?? 100))
        .map(item => buildItem(item, state, sectionId, uarpsEnabled))
        .join('');
}

// ═══════════════════════════════════════════════════════════════
// SECTION BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildSection(section: Record<string, any>, state: Record<string, any>, uarpsEnabled: boolean) {
    const isExpanded = state?.openSections?.includes(section.id) ?? section.defaultOpen ?? false;
    const isCollapsible = section.collapsible !== false;
    const isPinned = section.pinned === true;
    const isDisabled = isSectionDisabled(section);

    const sectionId = section.id;

    const expandedClass = isExpanded ? ' dsd-sidebar__section--expanded' : '';
    const collapsibleClass = isCollapsible ? ' dsd-sidebar__section--collapsible' : '';
    const pinnedClass = isPinned ? ' dsd-sidebar__section--pinned' : '';
    const disabledClass = isDisabled ? ' dsd-sidebar__section--disabled' : '';

    const iconHTML = buildIcon(section.icon, 'dsd-sidebar__group-icon');
    const chevronHTML = isCollapsible ? `<span class="dsd-sidebar__group-chevron" aria-hidden="true">${FALLBACK_ICONS.chevronDown}</span>` : '';

    const ariaExpanded = isCollapsible ? `aria-expanded="${isExpanded}"` : '';
    const ariaControls = isCollapsible ? `aria-controls="section-items-${sectionId}"` : '';

    const sectionTrigger = uarpsEnabled ? `data-uarps-trigger="${buildSectionTrigger(sectionId)}"` : '';
    const itemsHTML = buildItems(section.items ?? [], state, sectionId, uarpsEnabled);
    const itemsStyle = !isExpanded ? 'style="height:0;overflow:hidden;"' : '';

    return `<div class="dsd-sidebar__section${collapsibleClass}${expandedClass}${pinnedClass}${disabledClass}" data-section-id="${sectionId}" data-collapsible="${isCollapsible}"><button class="dsd-sidebar__group-button${isCollapsible ? ' dsd-sidebar__group-button--collapsible' : ''}" type="button" ${ariaExpanded} ${ariaControls} data-action="toggle-section" data-section-id="${sectionId}" ${sectionTrigger} ${isDisabled ? 'disabled' : ''}>${iconHTML}<span class="dsd-sidebar__group-title">${escapeHTML(section.label)}</span>${chevronHTML}</button><ul class="dsd-sidebar__section-items" id="section-items-${sectionId}" role="list" ${itemsStyle} ${!isExpanded ? 'aria-hidden="true"' : ''}>${itemsHTML}</ul></div>`;
}

// ═══════════════════════════════════════════════════════════════
// STATE BUILDERS (Empty, Skeleton, Error)
// ═══════════════════════════════════════════════════════════════

export function buildEmptyState(uarpsEnabled: boolean) {
    const regionAttr = buildRegionAttr(uarpsEnabled, _uarpsRegion);
    return `<div class="dsd-sidebar__nav-content" role="navigation" aria-label="Accordion navigation" ${regionAttr}><div class="dsd-sidebar__search-empty"><span class="dsd-sidebar__search-empty-icon">${FALLBACK_ICONS.empty}</span><span class="dsd-sidebar__search-empty-text">Nenhum item disponível</span></div></div>`;
}

export function buildSkeleton(count: number, uarpsEnabled: boolean) {
    count = count || 3;
    let skeletons = '';
    for (let i = 0; i < count; i++) {
        skeletons += '<div class="dsd-sidebar__skeleton-item"><div class="dsd-sidebar__skeleton-icon"></div><div class="dsd-sidebar__skeleton-text"></div></div>';
    }

    const regionAttr = buildRegionAttr(uarpsEnabled, _uarpsRegion);
    return `<div class="dsd-sidebar__nav-content dsd-sidebar--loading" role="navigation" aria-label="Loading" ${regionAttr}><div class="dsd-sidebar__skeleton">${skeletons}</div></div>`;
}

export function buildErrorState(uarpsEnabled: boolean) {
    const regionAttr = buildRegionAttr(uarpsEnabled, _uarpsRegion);
    return `<div class="dsd-sidebar__nav-content dsd-sidebar--error" role="navigation" ${regionAttr}><div class="dsd-sidebar__search-empty"><span class="dsd-sidebar__search-empty-icon">${FALLBACK_ICONS.empty}</span><span class="dsd-sidebar__search-empty-text">Erro ao carregar navegação</span></div></div>`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN HTML BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildHTML(structure: Record<string, any>, state: Record<string, any>, uarpsEnabled: boolean) {
    if (!structure?.sections || structure.sections.length === 0) {
        return buildEmptyState(uarpsEnabled);
    }

    if (state?.loadingState === LOADING_STATE.LOADING) {
        return buildSkeleton(3, uarpsEnabled);
    }

    const sectionsHTML = structure.sections
        .filter((section: Record<string, any>) => isSectionVisible(section))
        .sort((a: Record<string, any>, b: Record<string, any>) => Number(a.order ?? 100) - Number(b.order ?? 100))
        .map((section: Record<string, any>) => buildSection(section, state, uarpsEnabled))
        .join('');

    const loadingClass = state?.loadingState === LOADING_STATE.RESTORING ? 'dsd-sidebar--loading' : '';
    const errorClass = state?.loadingState === LOADING_STATE.ERROR ? 'dsd-sidebar--error' : '';
    const regionAttr = buildRegionAttr(uarpsEnabled, _uarpsRegion);

    return `<div class="dsd-sidebar__nav-content ${loadingClass} ${errorClass}" role="navigation" aria-label="Accordion navigation" ${regionAttr}>${sectionsHTML}</div>`;
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK & INFO
// ═══════════════════════════════════════════════════════════════

export function healthCheck() {
    const checks = {
        versionDefined: !!VERSION,
        moduleIdDefined: !!MODULE_ID,
        buildIconAvailable: typeof buildIcon === 'function',
        buildBadgeAvailable: typeof buildBadge === 'function',
        buildItemAvailable: typeof buildItem === 'function',
        buildItemsAvailable: typeof buildItems === 'function',
        buildSectionAvailable: typeof buildSection === 'function',
        buildEmptyStateAvailable: typeof buildEmptyState === 'function',
        buildSkeletonAvailable: typeof buildSkeleton === 'function',
        buildErrorStateAvailable: typeof buildErrorState === 'function',
        buildHTMLAvailable: typeof buildHTML === 'function',
        setIconResolverAvailable: typeof setIconResolver === 'function',
        getIconResolverAvailable: typeof getIconResolver === 'function',
        setUarpsRegionAvailable: typeof setUarpsRegion === 'function',
        getUarpsRegionAvailable: typeof getUarpsRegion === 'function'
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
        iconResolverConfigured: _iconResolver !== null,
        uarpsRegionConfigured: _uarpsRegion !== null,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        builderFunctions: [
            'buildIcon',
            'buildBadge',
            'buildItem',
            'buildItems',
            'buildSection',
            'buildEmptyState',
            'buildSkeleton',
            'buildErrorState',
            'buildHTML'
        ],
        configFunctions: [
            'setIconResolver',
            'getIconResolver',
            'setUarpsRegion',
            'getUarpsRegion'
        ],
        iconResolverConfigured: _iconResolver !== null,
        uarpsRegionConfigured: _uarpsRegion !== null,
        cssSource: 'sidebar/styles/ (Single Source of Truth)',
        healthCheck: healthCheck(),
        timestamp: Date.now()
    };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
    VERSION,
    MODULE_ID,
    buildIcon,
    buildBadge,
    buildItem,
    buildItems,
    buildSection,
    buildEmptyState,
    buildSkeleton,
    buildErrorState,
    buildHTML,
    setIconResolver,
    getIconResolver,
    setUarpsRegion,
    getUarpsRegion,
    healthCheck,
    info
};
