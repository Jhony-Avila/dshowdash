// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-resize
// PURPOSE: Entry point do sistema de resize de regiões
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID
//   ./core.js — init, getSize, getSizes, setSize, resetSize, resetAllSizes,
//               getConfig, isResizable, getResizableRegions
//   ./drag.js — startDragResize, isDragging, getDraggingRegion
//   ./subscription.js — subscribe
//   ./health.js — getMetrics, healthCheck, info
// SIDE EFFECTS: Auto-init on DOMContentLoaded
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionResize
 * @description Redimensionamento de regiões (sidebar, footer)
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// Constants
export { VERSION, MODULE_ID } from './constants.js';

// Core
export {
    init,
    getSize,
    getSizes,
    setSize,
    resetSize,
    resetAllSizes,
    getConfig,
    isResizable,
    getResizableRegions
} from './core.js';

// Drag
export { startDragResize, isDragging, getDraggingRegion } from './drag.js';

// Subscription
export { subscribe } from './subscription.js';

// Health
export { getMetrics, healthCheck, info } from './health.js';

// Imports for default export
import { VERSION, MODULE_ID } from './constants.js';
import { init, getSize, getSizes, setSize, resetSize, resetAllSizes, getConfig, isResizable, getResizableRegions } from './core.js';
import { startDragResize, isDragging, getDraggingRegion } from './drag.js';
import { subscribe } from './subscription.js';
import { getMetrics, healthCheck, info } from './health.js';

// Auto-init
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { init(); });
    } else {
        init();
    }
}

export default {
    VERSION, MODULE_ID,
    init, getSize, getSizes, setSize, resetSize, resetAllSizes,
    getConfig, isResizable, getResizableRegions,
    startDragResize, isDragging, getDraggingRegion,
    subscribe, getMetrics, healthCheck, info
};
