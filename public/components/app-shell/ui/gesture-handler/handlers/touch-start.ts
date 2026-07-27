// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/handlers/touch-start
// PURPOSE: Handler para evento touchstart
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   GESTURES from ../constants.js
//   touchState, config, isEnabled, incrementMetric from ../state.js
//   getDistance, getAngle from ../helpers/math.js
//   triggerHandlers from ../helpers/notify.js
// EXPORTS:
//   handleTouchStart — Handler para touchstart
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerTouchStart
 * @description Processamento de início de toque
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { GESTURES } from '../constants.js';
import { touchState, config, isEnabled, incrementMetric } from '../state.js';
import { getDistance, getAngle } from '../helpers/math.js';
import { triggerHandlers } from '../helpers/notify.js';

type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.handlers.touch-start';

/**
 * Handler para evento touchstart
 * @param {TouchEvent} event - Evento de touch
 */
export function handleTouchStart(event: DynObj) {
    if (!isEnabled()) return;
    
    const touches = event.touches;
    
    touchState.startTime = Date.now();
    touchState.startX = touches[0].clientX;
    touchState.startY = touches[0].clientY;
    touchState.isPanning = false;
    
    // Multi-touch detection
    if (touches.length === 2) {
        touchState.isMultiTouch = true;
        touchState.initialDistance = getDistance(touches[0], touches[1]);
        touchState.initialAngle = getAngle(touches[0], touches[1]);
    } else {
        touchState.isMultiTouch = false;
    }
    
    // Long press detection
    touchState.longPressTimer = setTimeout(() => {
        const dx = Math.abs(touches[0].clientX - touchState.startX);
        const dy = Math.abs(touches[0].clientY - touchState.startY);
        
        if (dx < config.tapThreshold && dy < config.tapThreshold) {
            triggerHandlers(GESTURES.LONG_PRESS, {
                x: touchState.startX,
                y: touchState.startY,
                target: event.target,
                originalEvent: event
            });
            incrementMetric('longPresses');
        }
    }, config.longPressDelay);
}
