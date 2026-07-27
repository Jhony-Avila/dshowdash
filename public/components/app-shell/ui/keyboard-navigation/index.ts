// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation
// PURPOSE: Entry point da navegação por teclado entre regiões
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID
//   ./api.js — init, destroy, enable, disable, isEnabled,
//     navigateToRegion, navigateNext, navigatePrevious, navigateToMain,
//     getCurrentRegion, getNavigationOrder, setNavigationOrder,
//     setTabTrap, releaseTabTrap, isTabTrapped, getTabTrapRegion,
//     subscribe, getMetrics, healthCheck, info
// SIDE EFFECTS: Auto-init on DOMContentLoaded
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigation
 * @description Navegação por teclado entre regiões
 * @version 1.0.1-FIX-AAA
 * @since 2025-02-02
 */
'use strict';

export { VERSION, MODULE_ID } from './constants.js';

export {
    init,
    destroy,
    enable,
    disable,
    isEnabled,
    navigateToRegion,
    navigateNext,
    navigatePrevious,
    navigateToMain,
    getCurrentRegion,
    getNavigationOrder,
    setNavigationOrder,
    setTabTrap,
    releaseTabTrap,
    isTabTrapped,
    getTabTrapRegion,
    subscribe,
    getMetrics,
    healthCheck,
    info
} from './api.js';

// Auto-init
import { init as _autoInit } from './api.js';

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { _autoInit(); });
    } else {
        _autoInit();
    }
}

// Default export
import { VERSION, MODULE_ID } from './constants.js';
import {
    init,
    destroy,
    enable,
    disable,
    isEnabled,
    navigateToRegion,
    navigateNext,
    navigatePrevious,
    navigateToMain,
    getCurrentRegion,
    getNavigationOrder,
    setNavigationOrder,
    setTabTrap,
    releaseTabTrap,
    isTabTrapped,
    getTabTrapRegion,
    subscribe,
    getMetrics,
    healthCheck,
    info
} from './api.js';

export default {
    VERSION, MODULE_ID,
    init, destroy, enable, disable, isEnabled,
    navigateToRegion, navigateNext, navigatePrevious, navigateToMain,
    getCurrentRegion, getNavigationOrder, setNavigationOrder,
    setTabTrap, releaseTabTrap, isTabTrapped, getTabTrapRegion,
    subscribe, getMetrics, healthCheck, info
};
