// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.4.0-UARPS-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-reload
// PURPOSE: sidebar/core/navigation-reload.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   emitReloaded, findItemByRoute from ../features/router-sync.js
//   NavigationModelLoader from ../integration/navigation-model-loader.js
//
// PROVIDES:
//   (none)
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

import NavigationModelLoader from '../integration/navigation-model-loader.js';
import { emitReloaded, findItemByRoute } from '../features/router-sync.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.core.navigation-reload';

export async function reloadNavigation(deps: DynObj) {
    const { engine, renderer, registry, adapters, logger, metrics, modelLoaderInitialized, getCurrentHash } = deps;

    try {
        logger.info('Reloading navigation...');

        // P24: Reload NavigationModelLoader first
        if (modelLoaderInitialized) {
            try {
                const modelResult = await NavigationModelLoader.reload(true);
                if (metrics) metrics.modelLoaderCalls++;
                logger.info('P24: NavigationModel reloaded', { source: modelResult.source, success: modelResult.success });
            } catch (error: any) {
                logger.warn('P24: NavigationModel reload failed', { error: error.message });
            }
        }

        // Reload registry
        registry.invalidateCache?.();
        const result = await registry.loadFromAPI();
        if (!result.success) {
            logger.warn('Failed to reload navigation:', result.error);
            return { success: false, error: result.error };
        }

        // Apply permission filter (UARPS-only, no userLevel)
        registry.applyPermissionFilter();

        // Update engine
        engine.loadSections(registry.getSections());
        engine.loadItems(registry.getItems());

        // Re-render
        renderer.renderNavigation();

        // Sync active item with current route
        const route = adapters.router?.getCurrentRoute?.();
        const path = route?.path || route?.hash || getCurrentHash();
        const item = findItemByRoute(registry.getItems(), path);
        if (item) {
            engine.setActiveItem(item.id);
            renderer.setActiveItem(item.id);
        }

        logger.info('Navigation reloaded successfully');
        emitReloaded(registry.getSections().length, registry.getItems().length);

        return { success: true, sections: registry.getSections().length, items: registry.getItems().length };
    } catch (error: any) {
        logger.error('Reload navigation error:', error);
        return { success: false, error: error.message };
    }
}

export default { reloadNavigation };
