// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter
// PURPOSE: Entry point do Responsive Adapter
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID
//   ./lifecycle.js — init, destroy, enable, disable, isEnabled
//   ./breakpoints.js — getCurrentBreakpoint, getBreakpointInfo, getBreakpoints, getCurrentPolicy, reapplyPolicy
//   ./device.js — isMobile, isTablet, isDesktop
//   ./overrides.js — setUserOverride, clearUserOverride, clearAllOverrides, getUserOverrides, setAutoApply
//   ./subscription.js — subscribe
//   ./health.js — getMetrics, healthCheck, info
// SIDE EFFECTS: Auto-init on DOMContentLoaded
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapter
 * @description Gerenciamento responsivo baseado em breakpoints
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// Constants
export { VERSION, MODULE_ID } from './constants.js';

// Lifecycle
export { init, destroy, enable, disable, isEnabled } from './lifecycle.js';

// Breakpoints
export { getCurrentBreakpoint, getBreakpointInfo, getBreakpoints, getCurrentPolicy, reapplyPolicy } from './breakpoints.js';

// Device
export { isMobile, isTablet, isDesktop } from './device.js';

// Overrides
export { setUserOverride, clearUserOverride, clearAllOverrides, getUserOverrides, setAutoApply } from './overrides.js';

// Subscription
export { subscribe } from './subscription.js';

// Health
export { getMetrics, healthCheck, info } from './health.js';

// Auto-init
import { init } from './lifecycle.js';

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { init(); });
    } else {
        init();
    }
}

// Default export
import { VERSION, MODULE_ID } from './constants.js';
import { destroy, enable, disable, isEnabled } from './lifecycle.js';
import { getCurrentBreakpoint, getBreakpointInfo, getBreakpoints, getCurrentPolicy, reapplyPolicy } from './breakpoints.js';
import { isMobile, isTablet, isDesktop } from './device.js';
import { setUserOverride, clearUserOverride, clearAllOverrides, getUserOverrides, setAutoApply } from './overrides.js';
import { subscribe } from './subscription.js';
import { getMetrics, healthCheck, info } from './health.js';

export default {
    VERSION, MODULE_ID,
    init, destroy, enable, disable, isEnabled,
    getCurrentBreakpoint, getBreakpointInfo, getBreakpoints, getCurrentPolicy, reapplyPolicy,
    isMobile, isTablet, isDesktop,
    setUserOverride, clearUserOverride, clearAllOverrides, getUserOverrides, setAutoApply,
    subscribe, getMetrics, healthCheck, info
};
