// UI Orchestrator - Canvas Module Index
// DEPENDENCY CONTRACT — BARREL FILE
// Ponto de entrada do módulo canvas

'use strict';

const MODULE_ID = 'canvas-module';
const VERSION = '1.0.1-P2-ENTERPRISE';

import * as CanvasEngine from './canvas-engine.js';

let isReady = false;

const init = (canvasElement: HTMLCanvasElement, options: Record<string, unknown> = {}) => {
    const result = CanvasEngine.init(canvasElement, options);
    if (result) {
        isReady = true;
    }
    return result;
};

const destroy = () => {
    CanvasEngine.destroy();
    isReady = false;
};

const getEngine = () => CanvasEngine;

const isInitialized = () => isReady;

const healthCheck = () => ({
    healthy: isReady,
    engine: CanvasEngine.healthCheck()
});

const info = () => ({
    moduleId: MODULE_ID,
    version: VERSION,
    ready: isReady,
    engine: CanvasEngine.info()
});

export {
    init,
    destroy,
    getEngine,
    isInitialized,
    healthCheck,
    info,
    CanvasEngine,
    MODULE_ID,
    VERSION
};
