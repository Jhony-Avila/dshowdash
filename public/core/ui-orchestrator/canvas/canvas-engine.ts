// UI Orchestrator - Canvas Engine
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.1.0-ENTERPRISE - Logger fallback pattern
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'core.ui-orchestrator.canvas.canvas-engine';
const VERSION = '2.0.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null;
  const fn = logger?.[level];
  if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args);
};

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let isInitialized = false;
let animationFrameId: number | null = null;
let renderQueue: { render: (ctx: CanvasRenderingContext2D) => void }[] = [];
let _portsInitialized = false;

const defaultConfig = { width: 800, height: 600, backgroundColor: '#1a1a2e', pixelRatio: window.devicePixelRatio || 1 };
let config = { ...defaultConfig };

const init = (canvasElement: HTMLCanvasElement, options: Record<string, unknown> = {}) => {
  if (isInitialized) { _log('warn', 'Já inicializado'); return false; }
  _initPorts();
  _portsInitialized = true;
  if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
    _log('error', 'Elemento canvas inválido');
    return false;
  }
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  config = { ...defaultConfig, ...options };
  setupCanvas();
  isInitialized = true;
  return true;
};

const setupCanvas = () => {
  const { width, height, pixelRatio } = config;
  canvas!.width = (width as number) * (pixelRatio as number);
  canvas!.height = (height as number) * (pixelRatio as number);
  canvas!.style.width = `${width}px`;
  canvas!.style.height = `${height}px`;
  ctx!.scale(pixelRatio as number, pixelRatio as number);
};

const clear = () => {
  if (!ctx) return;
  ctx.fillStyle = config.backgroundColor as string;
  ctx.fillRect(0, 0, config.width as number, config.height as number);
};

const render = () => {
  if (!isInitialized) return;
  clear();
  for (const item of renderQueue) {
    try { item.render(ctx!); }
    catch (err) { _log('error', 'Erro ao renderizar item:', err); }
  }
};

const addToQueue = (renderItem: { render: (ctx: CanvasRenderingContext2D) => void }) => {
  if (!renderItem || typeof renderItem.render !== 'function') return false;
  renderQueue.push(renderItem);
  return true;
};

const removeFromQueue = (renderItem: { render: (ctx: CanvasRenderingContext2D) => void }) => {
  const index = renderQueue.indexOf(renderItem);
  if (index > -1) { renderQueue.splice(index, 1); return true; }
  return false;
};

const clearQueue = () => { renderQueue = []; };

const startLoop = () => {
  if (animationFrameId) return;
  const loop = () => { render(); animationFrameId = requestAnimationFrame(loop); };
  loop();
};

const stopLoop = () => {
  if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
};

const resize = (width: number, height: number) => { config.width = width; config.height = height; setupCanvas(); render(); };
const getContext = () => ctx;
const getCanvas = () => canvas;
const getConfig = () => ({ ...config });

const destroy = () => {
  stopLoop();
  clearQueue();
  canvas = null;
  ctx = null;
  isInitialized = false;
  config = { ...defaultConfig };
};

const healthCheck = () => ({
  status: isInitialized ? 'HEALTHY' : 'NOT_INITIALIZED',
  hasCanvas: !!canvas, hasContext: !!ctx, queueSize: renderQueue.length, isLooping: !!animationFrameId,
  version: VERSION, moduleId: MODULE_ID, portsInitialized: _portsInitialized
});

const info = () => ({ moduleId: MODULE_ID, version: VERSION, initialized: isInitialized, config: getConfig(), queueSize: renderQueue.length, portsInitialized: _portsInitialized });

export { init, destroy, clear, render, addToQueue, removeFromQueue, clearQueue, startLoop, stopLoop, resize, getContext, getCanvas, getConfig, healthCheck, info, MODULE_ID, VERSION };
