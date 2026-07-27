// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/policies
// PURPOSE: Aplicação de políticas de layout por breakpoint
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RegionVisibility from ../../core/region-visibility.js
//   LayoutPersistence from ../../state/layout-persistence.js
//   BREAKPOINTS, LAYOUT_POLICIES from ./constants.js
//   autoApplyPolicies, userOverrides, metrics from ./state.js
//   findRegion, REGION_IDS from /platform/shell/layout-regions.ts
// EXPORTS:
//   applyLayoutPolicy — Aplica política de layout para breakpoint
// BROWSER APIs: document.body
// @changelog v1.1.0-REGION-RESOLVER - Migrado para Region Resolver Service (findRegion/REGION_IDS)
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterPolicies
 * @description Aplicação de políticas de layout responsivo
 * @version 1.1.0-REGION-RESOLVER
 * @since 2025-02-02
 */
'use strict';

import RegionVisibility from '../../core/region-visibility.js';
import LayoutPersistence from '../../state/layout-persistence.js';
import { BREAKPOINTS, LAYOUT_POLICIES } from './constants.js';
import { autoApplyPolicies, userOverrides, metrics } from './state.js';
import { findRegion, REGION_IDS } from '/platform/shell/layout-regions.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.responsive-adapter.policies';

/**
 * Aplica política de layout para um breakpoint
 * @param {string} breakpoint - Nome do breakpoint
 * @param {Object} options - Opções { force, animate }
 * @returns {boolean} Sucesso
 */
export function applyLayoutPolicy(breakpoint: DynObj, options: DynObj) {
    if (!autoApplyPolicies.value && !(options && options.force)) return false;

    const policy = (LAYOUT_POLICIES as DynObj)[breakpoint];
    if (!policy) return false;

    const animate = options && options.animate !== false;
    const animateOptions = { animate, duration: 200 };

    // Sidebar
    if (!(userOverrides as any).sidebar) {
        if (policy.sidebar) {
            if (policy.sidebar.visible === false) {
                RegionVisibility.hide('sidebar', animateOptions);
            } else {
                RegionVisibility.show('sidebar', animateOptions);
            }

            if (policy.sidebar.collapsed !== undefined) {
                LayoutPersistence.setSidebarCollapsed(policy.sidebar.collapsed);
            }
        }
    }

    // NavRail
    if (!(userOverrides as any).navRail && policy.navRail) {
        if (policy.navRail.visible === false) {
            RegionVisibility.hide('nav-rail', animateOptions);
        } else {
            RegionVisibility.show('nav-rail', animateOptions);
        }
    }

    // Header compact mode - v1.1.0: Using Region Resolver Service
    if (policy.header && policy.header.compact !== undefined) {
        const header = findRegion(REGION_IDS.HEADER);
        if (header) {
            if (policy.header.compact) {
                header.classList.add('dsd-shell__region--compact');
            } else {
                header.classList.remove('dsd-shell__region--compact');
            }
        }
    }

    // Body classes
    if (typeof document !== 'undefined' && document.body) {
        const bpKeys = Object.keys(BREAKPOINTS);
        for (let j = 0; j < bpKeys.length; j++) {
            document.body.classList.remove(`dsd-bp-${bpKeys[j]}`);
        }
        document.body.classList.add(`dsd-bp-${breakpoint}`);

        const deviceType = (BREAKPOINTS as DynObj)[breakpoint].device;
        document.body.setAttribute('data-device', deviceType);

        if (breakpoint === 'xs' || breakpoint === 'sm') {
            document.body.classList.add('dsd-mobile');
            document.body.classList.remove('dsd-tablet', 'dsd-desktop');
        } else if (breakpoint === 'md') {
            document.body.classList.add('dsd-tablet');
            document.body.classList.remove('dsd-mobile', 'dsd-desktop');
        } else {
            document.body.classList.add('dsd-desktop');
            document.body.classList.remove('dsd-mobile', 'dsd-tablet');
        }
    }

    metrics.policyApplications++;
    return true;
}