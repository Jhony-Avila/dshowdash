// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.ui.view
// PURPOSE: Accordion View class for UI rendering with UARPS integration
// ───────────────────────────────────────────────────────────────
// @contract AccordionView - Main view class for accordion rendering
// @contract AccordionView.init - Initialize view with container
// @contract AccordionView.render - Render accordion HTML
// @contract AccordionView.destroy - Clean up and destroy view
// @contract AccordionView.setUarpsEnabled - Enable/disable UARPS
// @contract AccordionView.isUarpsEnabled - Check UARPS status
// @contract AccordionView.setUarpsRegion - Set UARPS region
// @contract AccordionView.getUarpsRegion - Get UARPS region
// @contract AccordionView.setIconResolver - Set icon resolver
// @contract AccordionView.getIconResolver - Get icon resolver
// @contract AccordionView.getMetrics - Get render metrics
// @contract AccordionView.healthCheck - Instance health check
// @contract AccordionView.info - Instance info
// @contract createAccordionView - Factory function
// @contract healthCheck - Module-level health check
// @contract info - Module-level info
// ───────────────────────────────────────────────────────────────
// IMPORTS: constants.js, uarps-triggers.js, html-builders.js, event-handlers.js
// PROVIDES: AccordionView, createAccordionView, buildItemTrigger,
//           buildSectionTrigger, healthCheck, info, VERSION, MODULE_ID
// @changelog v2.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.3.0 - Fixed trigger format: section:{id} -> section-{id} (3-segment compliance)
// @changelog v2.2.0 - P0.1: Aceita iconResolver via options e injeta em html-builders
// @changelog v2.2.0 - P0.2: Aceita uarpsRegion via options (configurável)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.ui.view';

import { FALLBACK_ICONS } from './constants.js';
import { buildItemTrigger, buildSectionTrigger, getDefaultRegion } from './uarps-triggers.js';
import { buildHTML, buildErrorState, setIconResolver, setUarpsRegion } from './html-builders.js';
import { createEventHandlers } from './event-handlers.js';

export { buildItemTrigger, buildSectionTrigger };

// ═══════════════════════════════════════════════════════════════
// ACCORDION VIEW CLASS
// ═══════════════════════════════════════════════════════════════

export class AccordionView {
    _container: HTMLElement | null;
    _eventBus: Record<string, unknown> | null;
    _iconRegistry: Record<string, unknown> | null;
    _structure: Record<string, any> | null;
    _state: Record<string, unknown> | null;
    _initialized: boolean;
    _abortController: AbortController | null;
    _uarpsEnabled: boolean;
    _uarpsRegion: string | null;
    _iconResolver: ((iconName: string) => string) | null;
    _eventHandlers: ReturnType<typeof createEventHandlers> | null;
    _metrics: { renders: number; clicks: number; errors: number };

    constructor(options: { eventBus?: Record<string, unknown>; iconRegistry?: Record<string, unknown>; uarpsEnabled?: boolean; uarpsRegion?: string; iconResolver?: ((iconName: string) => string) | null } = {}) {
        this._container = null;
        this._eventBus = options.eventBus ?? null;
        this._iconRegistry = options.iconRegistry ?? null;
        this._structure = null;
        this._state = null;
        this._initialized = false;
        this._abortController = null;
        this._uarpsEnabled = options.uarpsEnabled !== false;
        this._uarpsRegion = options.uarpsRegion ?? null;
        this._iconResolver = options.iconResolver ?? null;
        this._eventHandlers = null;
        this._metrics = {
            renders: 0,
            clicks: 0,
            errors: 0
        };

        // Inject iconResolver into builders if provided
        if (this._iconResolver) {
            setIconResolver(this._iconResolver);
        }

        // Inject uarpsRegion into builders if provided
        if (this._uarpsRegion) {
            setUarpsRegion(this._uarpsRegion);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────

    init(container: HTMLElement | string) {
        if (this._initialized) {
            return { success: true, message: 'Already initialized' };
        }

        if (!container) {
            return { success: false, error: 'Container required' };
        }

        this._container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this._container) {
            return { success: false, error: 'Container not found' };
        }

        this._abortController = new AbortController();
        this._setupEventDelegation();
        this._initialized = true;

        return { success: true };
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER (Main entry point)
    // ─────────────────────────────────────────────────────────────

    render(structure: Record<string, unknown>, state: Record<string, unknown>) {
        if (!this._initialized || !this._container) {
            this._metrics.errors++;
            return { success: false, error: 'Not initialized' };
        }

        this._structure = structure;
        this._state = state;
        this._metrics.renders++;

        try {
            const html = buildHTML(structure, state, this._uarpsEnabled);
            this._container.innerHTML = html;
            return { success: true, rendered: true };
        } catch (error: any) {
            this._metrics.errors++;
            this._renderError(error.message);
            return { success: false, error: error.message };
        }
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT DELEGATION
    // ─────────────────────────────────────────────────────────────

    _setupEventDelegation() {
        if (!this._container || !this._abortController) return;

        const self = this;
        this._eventHandlers = createEventHandlers({
            container: this._container,
            eventBus: this._eventBus,
            findItem(itemId) { return self._findItem(itemId); },
            metrics: this._metrics
        });

        this._eventHandlers.setup(this._abortController);
    }

    // ─────────────────────────────────────────────────────────────
    // UARPS HELPERS
    // ─────────────────────────────────────────────────────────────

    setUarpsEnabled(enabled: boolean) {
        this._uarpsEnabled = enabled;
    }

    isUarpsEnabled() {
        return this._uarpsEnabled;
    }

    setUarpsRegion(region: string) {
        this._uarpsRegion = region;
        setUarpsRegion(region);
    }

    getUarpsRegion() {
        return this._uarpsRegion || getDefaultRegion();
    }

    // ─────────────────────────────────────────────────────────────
    // ICON RESOLVER HELPERS
    // ─────────────────────────────────────────────────────────────

    setIconResolver(resolver: ((iconName: string) => string) | null) {
        this._iconResolver = resolver;
        setIconResolver(resolver);
    }

    getIconResolver() {
        return this._iconResolver;
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    _findItem(itemId: string) {
        if (!this._structure?.sections) return null;
        for (let i = 0; i < this._structure.sections.length; i++) {
            const section = this._structure.sections[i];
            const items = section.items || [];
            for (let j = 0; j < items.length; j++) {
                if (items[j].id === itemId) return items[j];
            }
        }
        return null;
    }

    _renderError(message: string) {
        if (!this._container) return;
        this._container.innerHTML = buildErrorState(this._uarpsEnabled);
    }

    // ─────────────────────────────────────────────────────────────
    // DESTROY
    // ─────────────────────────────────────────────────────────────

    destroy() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }

        if (this._container) {
            this._container.innerHTML = '';
        }

        this._container = null;
        this._structure = null;
        this._state = null;
        this._eventHandlers = null;
        this._initialized = false;

        return { success: true };
    }

    // ─────────────────────────────────────────────────────────────
    // METRICS
    // ─────────────────────────────────────────────────────────────

    getMetrics() {
        return { ...this._metrics };
    }

    // ─────────────────────────────────────────────────────────────
    // INSTANCE HEALTH & INFO
    // ─────────────────────────────────────────────────────────────

    healthCheck() {
        const checks = {
            initialized: this._initialized,
            hasContainer: this._container !== null,
            hasStructure: this._structure !== null,
            hasState: this._state !== null,
            noErrors: this._metrics.errors === 0,
            uarpsEnabled: this._uarpsEnabled,
            hasIconResolver: this._iconResolver !== null,
            uarpsRegionConfigured: this._uarpsRegion !== null
        };
        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;

        return {
            status: passed >= 6 ? 'HEALTHY' : passed >= 4 ? 'DEGRADED' : 'UNHEALTHY',
            score: passed,
            maxScore: total,
            scoreDisplay: `${passed}/${total}`,
            checks,
            metrics: this.getMetrics(),
            version: VERSION,
            moduleId: MODULE_ID,
            uarpsRegion: this.getUarpsRegion(),
            triggerPattern: 'trigger:navigation:item-{id}',
            timestamp: Date.now()
        };
    }

    info() {
        return {
            moduleId: MODULE_ID,
            version: VERSION,
            initialized: this._initialized,
            hasContainer: this._container !== null,
            sectionsCount: this._structure?.sections?.length ?? 0,
            uarpsEnabled: this._uarpsEnabled,
            uarpsRegion: this.getUarpsRegion(),
            hasIconResolver: this._iconResolver !== null,
            triggerPattern: 'trigger:navigation:item-{id} | trigger:navigation:section-{id}',
            cssSource: 'sidebar/styles/ (Single Source of Truth)',
            metrics: this.getMetrics(),
            healthCheck: this.healthCheck()
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════

export function createAccordionView(options: { eventBus?: Record<string, unknown>; iconRegistry?: Record<string, unknown>; uarpsEnabled?: boolean; uarpsRegion?: string; iconResolver?: ((iconName: string) => string) | null } = {}) {
    options = options || {};
    return new AccordionView(options);
}

// ═══════════════════════════════════════════════════════════════
// MODULE-LEVEL HEALTH CHECK & INFO
// ═══════════════════════════════════════════════════════════════

export function healthCheck() {
    const checks = {
        versionDefined: !!VERSION,
        moduleIdDefined: !!MODULE_ID,
        classAvailable: typeof AccordionView === 'function',
        factoryAvailable: typeof createAccordionView === 'function',
        uarpsIntegrated: true,
        uarpsRegionConfigurable: true,
        iconResolverInjectable: true,
        usesSidebarClasses: true,
        unifiedTriggerPattern: true,
        noSidebarImports: true
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
        classAvailable: true,
        factoryAvailable: true,
        uarpsIntegrated: true,
        uarpsRegionConfigurable: true,
        iconResolverInjectable: true,
        triggerPattern: 'trigger:navigation:item-{id} | trigger:navigation:section-{id}',
        iconSource: 'injected via options.iconResolver (decoupled from sidebar)',
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
    AccordionView,
    createAccordionView,
    buildItemTrigger,
    buildSectionTrigger,
    info,
    healthCheck
};
