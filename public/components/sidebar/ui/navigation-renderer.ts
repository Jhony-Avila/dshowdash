
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-renderer
// PURPOSE: Sidebar UI - Navigation Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   SECTION_ICONS, FALLBACK_NAV_HTML, FALLBACK_SIDEBAR_HTML, MODULE_ID, CSS_CLASSES as C from ./constants.js
//   getIconSvg from ./template.js
//   SidebarRegistry from ../registry/registry.js
//   NavigationModelLoader from ../integration/navigation-model-loader.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   renderNavigation() — exported function
//   renderFallback() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.DEGRADED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { SECTION_ICONS, FALLBACK_NAV_HTML, FALLBACK_SIDEBAR_HTML, MODULE_ID, CSS_CLASSES as C } from './constants.js';
import { getIconSvg } from './template.js';
import SidebarRegistry from '../registry/registry.js';
import NavigationModelLoader from '../integration/navigation-model-loader.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.1.0-ES6';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _metrics = { renders: 0, fallbacks: 0, errors: 0, modelLoaderRenders: 0, registryFallbacks: 0 };

function _buildItemTrigger(itemId: string) {
    return `trigger:navigation:item-${itemId}`;
}

function _buildSectionTrigger(sectionId: string) {
    return `trigger:navigation:section-${sectionId}`;
}

function emitDegraded(component: DynObj, error: DynObj, degradedComponents: DynObj) {
    try {
        if (!degradedComponents.includes(component)) degradedComponents.push(component);
        const bus = _getPort('eventBus');
        if (bus?.emit) bus.emit(SIDEBAR_EVENTS.DEGRADED, { source: MODULE_ID, component, error, degradedComponents, timestamp: Date.now() });
    } catch { /* emit silent */ }
}

function _createElement(tag: string, options: { className?: string; id?: string; attributes?: Record<string, string | null>; style?: string; textContent?: string } = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.id) el.id = options.id;
    if (options.attributes) Object.entries(options.attributes).forEach(([k, v]) => { if (v != null) el.setAttribute(k, v as string); });
    if (options.style) el.style.cssText = options.style;
    if (options.textContent) el.textContent = options.textContent;
    return el;
}

function _createIconElement(iconName: string) {
    const span = _createElement('span', { className: C.GROUP_ICON });
    span.innerHTML = getIconSvg(iconName);
    return span;
}

function _createChevron() {
    const span = _createElement('span', { className: C.GROUP_CHEVRON });
    span.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
    return span;
}

function _createGroupButton(section: DynObj, isCollapsible: boolean, isExpanded: boolean, sectionIcon: DynObj) {
    const sectionId = section.id.replace(/^sec-/, '');
    const sectionTrigger = _buildSectionTrigger(sectionId);
    const btn = _createElement('button', {
        className: C.GROUP_BUTTON + (isCollapsible ? ` ${C.GROUP_BUTTON_COLLAPSIBLE}` : ''),
        attributes: {
            'type': 'button',
            'data-section-toggle': sectionId,
            'data-uarps-trigger': sectionTrigger,
            ...(isCollapsible && { 'aria-expanded': String(isExpanded) }),
            ...(isCollapsible && { 'aria-controls': `section-items-${sectionId}` })
        }
    });
    btn.appendChild(_createIconElement(sectionIcon));
    const title = _createElement('span', { className: C.GROUP_TITLE, textContent: section.label || section.title || section.id });
    btn.appendChild(title);
    if (isCollapsible) btn.appendChild(_createChevron());
    return btn;
}

function _createNavItem(item: DynObj, isActive: boolean, badge: DynObj) {
    const itemTitle = item.label || item.title || item.id;
    const uarpsTrigger = item.uarps?.trigger_id || _buildItemTrigger(item.id);
    const route = item.route || `#${item.id}`;

    const li = _createElement('li', {
        className: C.ITEM + (isActive ? ` ${C.ITEM_ACTIVE}` : '') + (item.state?.disabled ? ` ${C.ITEM_DISABLED}` : ''),
        attributes: {
            'data-item-id': item.id,
            'data-panel-id': item.panelId || null,
            'data-label': itemTitle,
            'data-display-title': item.displayTitle || null,
            'data-uarps-trigger': uarpsTrigger,
            'role': 'listitem'
        }
    });

    const link = _createElement('a', {
        className: C.LINK,
        attributes: {
            'href': route,
            'data-panel': item.panelId || item.id,
            'data-tooltip': itemTitle,
            'aria-current': isActive ? 'page' : 'false',
            ...(item.state?.disabled && { 'aria-disabled': 'true', 'tabindex': '-1' })
        }
    });

    const iconSpan = _createElement('span', { className: C.ITEM_ICON });
    iconSpan.innerHTML = getIconSvg(item.icon || 'file');
    link.appendChild(iconSpan);

    const textSpan = _createElement('span', { className: C.ITEM_TEXT, textContent: itemTitle });
    link.appendChild(textSpan);

    if (badge) {
        const badgeType = badge.type || 'count';
        const badgeValue = badge.value ?? badge.text ?? badge.count ?? '';
        const isPulse = badge.pulse === true;
        const badgeSpan = _createElement('span', {
            className: `${C.BADGE} ${C.BADGE}--${badgeType}${isPulse ? ` ${C.BADGE_PULSE}` : ''}`,
            attributes: {
                'aria-label': `${badgeValue} ${badgeType === 'alert' ? 'alertas' : 'notificações'}`,
                ...(isPulse && { 'data-pulse': 'true' })
            },
            textContent: badgeType !== 'dot' ? String(badgeValue) : ''
        });
        link.appendChild(badgeSpan);
    }

    li.appendChild(link);
    return li;
}

function _createSectionFromModel(section: DynObj, expandedSections: DynObj, activeItemId: string, degradedComponents: DynObj) {
    const sectionId = section.id.replace(/^sec-/, '');
    const isCollapsible = section.accordion?.collapsible !== false;
    const isExpanded = !isCollapsible || expandedSections.has(sectionId) || section.accordion?.default_open === true;
    const sectionIcon = section.icon || (SECTION_ICONS as DynObj)[sectionId] || SECTION_ICONS.default;

    const sectionEl = _createElement('div', {
        className: C.SECTION + (isCollapsible ? ` ${C.SECTION_COLLAPSIBLE}` : '') + (isExpanded ? ` ${C.SECTION_EXPANDED}` : ''),
        attributes: {
            'data-section-id': sectionId,
            'data-collapsible': String(isCollapsible),
            'data-source': 'navigation-model-v1'
        }
    });

    if (section.label) {
        sectionEl.appendChild(_createGroupButton(section, isCollapsible, isExpanded, sectionIcon));
    }

    const ul = _createElement('ul', {
        className: C.SECTION_ITEMS,
        id: `section-items-${sectionId}`,
        attributes: { 'role': 'list' },
        style: !isExpanded ? 'height:0;overflow:hidden;' : ''
    });

    const items = section.items || [];
    items.forEach((item: DynObj) => {
        try {
            if (item.state?.hidden) return;
            const isActive = item.id === activeItemId;
            ul.appendChild(_createNavItem(item, isActive, item.badge));
        } catch (itemError: any) {
            emitDegraded(`item:${item.id}`, itemError.message, degradedComponents);
        }
    });

    sectionEl.appendChild(ul);
    return sectionEl;
}

function _createSectionFromRegistry(section: DynObj, items: DynObj[], expandedSections: DynObj, activeItemId: string, degradedComponents: DynObj) {
    const isCollapsible = section.collapsible !== false;
    const isExpanded = !isCollapsible || expandedSections.has(section.id);
    const sectionIcon = section.icon || (SECTION_ICONS as DynObj)[section.id] || SECTION_ICONS.default;

    const sectionEl = _createElement('div', {
        className: C.SECTION + (isCollapsible ? ` ${C.SECTION_COLLAPSIBLE}` : '') + (isExpanded ? ` ${C.SECTION_EXPANDED}` : ''),
        attributes: {
            'data-section-id': section.id,
            'data-collapsible': String(isCollapsible),
            'data-source': 'sidebar-registry'
        }
    });

    const sectionTitle = section.label || section.title;
    if (sectionTitle) {
        sectionEl.appendChild(_createGroupButton(section, isCollapsible, isExpanded, sectionIcon));
    }

    const ul = _createElement('ul', {
        className: C.SECTION_ITEMS,
        id: `section-items-${section.id}`,
        attributes: { 'role': 'list' },
        style: !isExpanded ? 'height:0;overflow:hidden;' : ''
    });

    items.forEach((item: DynObj) => {
        try {
            const badge = SidebarRegistry.getBadge(item.id);
            const isActive = item.id === activeItemId;
            const modelItem = {
                id: item.id,
                label: item.label || item.title || item.id,
                icon: item.icon || 'file',
                route: item.route,
                panelId: item.panelId || null,
                state: { disabled: item.disabled || false },
                uarps: { trigger_id: _buildItemTrigger(item.id) }
            };
            ul.appendChild(_createNavItem(modelItem, isActive, badge));
        } catch (itemError: any) {
            emitDegraded(`item:${item.id}`, itemError.message, degradedComponents);
        }
    });

    sectionEl.appendChild(ul);
    return sectionEl;
}

function _renderFromModel(navSlot: DynObj, expandedSections: DynObj, activeItemId: string, degradedComponents: DynObj) {
    const model = NavigationModelLoader.getModel();

    if (!model || !(model as DynObj).sections || (model as DynObj).sections.length === 0) {
        return null;
    }

    navSlot.textContent = '';
    let itemsRendered = 0;

    (model as DynObj).sections.forEach((section: DynObj) => {
        try {
            if (section.visible === false) return;
            const items = section.items || [];
            const visibleItems = items.filter((i: DynObj) => i.state?.hidden !== true);
            if (visibleItems.length === 0) return;

            const sectionEl = _createSectionFromModel(section, expandedSections, activeItemId, degradedComponents);
            navSlot.appendChild(sectionEl);
            itemsRendered += visibleItems.length;
        } catch (sectionError: any) {
            emitDegraded(`section:${section.id}`, sectionError.message, degradedComponents);
        }
    });

    if (itemsRendered === 0) {
        return null;
    }

    _metrics.modelLoaderRenders++;
    return { success: true, itemsRendered, source: 'navigation-model-v1' };
}

function _renderFromRegistry(navSlot: DynObj, expandedSections: DynObj, activeItemId: string, degradedComponents: DynObj) {
    let sections = [];
    try {
        sections = SidebarRegistry.getSections();
    } catch (error: any) {
        emitDegraded('registry', error.message, degradedComponents);
        return null;
    }

    if (!sections || sections.length === 0) {
        return null;
    }

    navSlot.textContent = '';
    let itemsRendered = 0;

    sections.forEach(section => {
        try {
            const items = SidebarRegistry.getItemsBySection(section.id);
            if (items.length === 0) return;
            const sectionEl = _createSectionFromRegistry(section, items, expandedSections, activeItemId, degradedComponents);
            navSlot.appendChild(sectionEl);
            itemsRendered += items.length;
        } catch (sectionError: any) {
            emitDegraded(`section:${section.id}`, sectionError.message, degradedComponents);
        }
    });

    if (itemsRendered === 0) {
        return null;
    }

    _metrics.registryFallbacks++;
    return { success: true, itemsRendered, source: 'sidebar-registry' };
}

export function renderNavigation(sidebar: DynObj, expandedSections: DynObj, activeItemId: string, degradedComponents: DynObj) {
    _initPorts();

    try {
        const navSlot = sidebar?.querySelector('[data-slot="nav-items"]');
        if (!navSlot) {
            emitDegraded('nav-slot', 'Nav slot not found', degradedComponents);
            return { success: false, error: 'Nav slot not found' };
        }

        let result = _renderFromModel(navSlot, expandedSections, activeItemId, degradedComponents);

        if (!result) {
            console.info(`[${MODULE_ID}] Model not available, falling back to Registry`);
            result = _renderFromRegistry(navSlot, expandedSections, activeItemId, degradedComponents);
        }

        if (!result) {
            _metrics.fallbacks++;
            navSlot.innerHTML = FALLBACK_NAV_HTML;
            return { success: true, empty: true, fallback: true };
        }

        _metrics.renders++;
        return {
            success: true,
            itemsRendered: result.itemsRendered,
            source: result.source,
            triggerPattern: 'trigger:navigation:item-{id}'
        };

    } catch (error: any) {
        _metrics.errors++;
        emitDegraded('renderNavigation', error.message, degradedComponents);
        const navSlot = sidebar?.querySelector('[data-slot="nav-items"]');
        if (navSlot) navSlot.innerHTML = FALLBACK_NAV_HTML;
        return { success: false, error: error.message, fallback: true };
    }
}

export function renderFallback(container: HTMLElement) {
    try {
        if (container) {
            _metrics.fallbacks++;
            container.innerHTML = FALLBACK_SIDEBAR_HTML;
            return container.querySelector(`.${C.ROOT}`);
        }
        return null;
    } catch (error: any) {
        _metrics.errors++;
        return null;
    }
}

export function getMetrics() { return { ..._metrics }; }

export function info() {
    const modelSnapshot = (NavigationModelLoader as any).getSnapshot();
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        hasRegistry: !!SidebarRegistry,
        hasModelLoader: !!NavigationModelLoader,
        modelSource: modelSnapshot?.source || 'none',
        modelVersion: modelSnapshot?.version || null,
        portsInitialized: Ports.isInitialized(),
        triggerPattern: 'trigger:navigation:item-{id}',
        sectionTriggerPattern: 'trigger:navigation:section-{id}',
        phase: 'P1 - Shadow Mode (Model-First, 3-segment compliant)',
        metrics: getMetrics()
    };
}

export function healthCheck() {
    const modelHealth = NavigationModelLoader.healthCheck();
    let status = 'HEALTHY';
    if (_metrics.errors > 0) status = 'DEGRADED';
    if (_metrics.renders === 0 && _metrics.fallbacks > 0) status = 'DEGRADED';

    return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        checks: {
            hasRegistry: !!SidebarRegistry,
            hasModelLoader: !!NavigationModelLoader,
            modelLoaderHealthy: modelHealth.status === 'HEALTHY',
            rendersCompleted: _metrics.renders,
            modelLoaderRenders: _metrics.modelLoaderRenders,
            registryFallbacks: _metrics.registryFallbacks,
            fallbacksUsed: _metrics.fallbacks,
            portsInitialized: Ports.isInitialized(),
            unifiedTriggersActive: true,
            threeSegmentCompliant: true
        },
        modelLoader: modelHealth,
        portsInitialized: Ports.isInitialized(),
        triggerPattern: 'trigger:navigation:item-{id}',
        metrics: getMetrics()
    };
}

export default {
    renderNavigation,
    renderFallback,
    getMetrics,
    info,
    healthCheck,
    injectPorts,
    getPorts,
    VERSION,
    MODULE_ID
};
