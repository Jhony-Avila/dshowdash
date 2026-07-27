
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:responsive-manager
// PURPOSE: Responsive Manager - Gerenciamento de layouts responsivos e breakpoints
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LAYOUTS — exported value
//   BREAKPOINTS — exported value
//   injectEventBus() — exported function
//   init() — exported function
//   setLayout() — exported function
//   getLayout() — exported function
//   getBreakpoint() — exported function
//   getContainerWidth() — exported function
//   isBreakpoint() — exported function
//   isBreakpointUp() — exported function
//   isBreakpointDown() — exported function
//   isBreakpointBetween() — exported function
//   isMobile() — exported function
//   isTablet() — exported function
//   isDesktop() — exported function
//   onLayoutChange() — exported function
//   onBreakpointChange() — exported function
//   onAnyBreakpointChange() — exported function
//   ... and 7 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '2.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-main:responsive-manager';

const logger = createLogger(MODULE_ID);

// Layouts disponíveis
export const LAYOUTS = Object.freeze({
  FULL: 'full',
  SPLIT: 'split',
  COMPACT: 'compact',
  MINIMAL: 'minimal',
  DASHBOARD: 'dashboard'
});

// Breakpoints padrão
export const BREAKPOINTS = Object.freeze({
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
});

// Ordem dos breakpoints
const BREAKPOINT_ORDER = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

// Estado interno
let _state = {
  currentLayout: LAYOUTS.FULL,
  currentBreakpoint: 'lg',
  containerWidth: 0,
  initialized: false
};

// Observers e listeners
let _resizeObserver: Record<string, unknown> | null = null;
let _layoutListeners = new Set<Function>();
let _breakpointListeners = new Map();
let _eventBus: Record<string, unknown> | null = null;

// Emite evento
function _emit(event: string, data: Record<string, unknown>) {
  if (_eventBus?.emit) {
    (_eventBus.emit as (...args: unknown[]) => unknown)(event, { source: MODULE_ID, timestamp: Date.now(), ...data });
  }
}

// Determina breakpoint baseado na largura
function _getBreakpoint(width: number) {
  if (width >= BREAKPOINTS.xxl) return 'xxl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

// Aplica layout ao container
function _applyLayout(layout: Record<string, unknown>, container: HTMLElement) {
  if (!container) return false;

  // Remove classes de layout anteriores
  Object.values(LAYOUTS).forEach(l => {
    container.classList.remove(`dsd-layout--${l}`);
  });

  // Aplica nova classe
  container.classList.add(`dsd-layout--${layout}`);
  // @ts-expect-error TS migration - TS2345
  container.setAttribute('data-layout', layout);

  const oldLayout = _state.currentLayout;
  // @ts-expect-error TS migration - TS2322
  _state.currentLayout = layout;

  // Notifica listeners
  // @ts-expect-error TS migration - TS2367
  if (oldLayout !== layout) {
    _layoutListeners.forEach(fn => {
      try { fn(layout, oldLayout); } catch (e) { logger.error('Listener error', { error: (e as Error).message }); }
    });
    _emit('responsive:layout-change', { layout, previous: oldLayout });
  }

  return true;
}

// Handler de resize
function _handleResize(entries: unknown) {
  const entry = (entries as Record<string, unknown>)[0];
  if (!entry) return;

  // @ts-expect-error TS migration - TS2339
  const width = (entry as Record<string, unknown>).contentRect.width;
  _state.containerWidth = width;

  const newBreakpoint = _getBreakpoint(width);

  if (newBreakpoint !== _state.currentBreakpoint) {
    const oldBreakpoint = _state.currentBreakpoint;
    _state.currentBreakpoint = newBreakpoint;

    // Notifica listeners específicos do breakpoint
    _breakpointListeners.forEach((callbacks, bp) => {
      if (bp === newBreakpoint || bp === '*') {
        callbacks.forEach((fn: (...args: unknown[]) => void) => {
          try { fn(newBreakpoint, oldBreakpoint, width); } catch (e) { logger.error('Breakpoint listener error', { error: (e as Error).message }); }
        });
      }
    });

    _emit('responsive:breakpoint-change', { breakpoint: newBreakpoint, previous: oldBreakpoint, width });
  }
}

// API Pública
export function injectEventBus(eventBus: unknown) {
  _eventBus = eventBus as Record<string, unknown>;
}

export function init(container: HTMLElement, options: Record<string, unknown> = {}) {
  if (_state.initialized) {
    return { ok: true, cached: true };
  }

  if (!container) {
    return { ok: false, error: 'Container required' };
  }

  const { eventBus, initialLayout = LAYOUTS.FULL } = options;

  if (eventBus) _eventBus = eventBus as Record<string, unknown>;

  // Configura ResizeObserver
  // @ts-expect-error TS migration - TS2352
  _resizeObserver = new ResizeObserver(_handleResize) as Record<string, unknown>;
  (_resizeObserver.observe as (...args: unknown[]) => unknown)(container);

  // Define breakpoint inicial
  _state.containerWidth = container.offsetWidth;
  _state.currentBreakpoint = _getBreakpoint(_state.containerWidth);
  _state.initialized = true;

  // Aplica layout inicial
  _applyLayout((initialLayout as Record<string, unknown>), container);

  _emit('responsive:initialized', { breakpoint: _state.currentBreakpoint, layout: _state.currentLayout });

  return { ok: true, breakpoint: _state.currentBreakpoint, layout: _state.currentLayout };
}

export function setLayout(layout: Record<string, unknown>, container: HTMLElement) {
  // @ts-expect-error TS migration - TS2345
  if (!Object.values(LAYOUTS).includes(layout)) {
    return false;
  }
  return _applyLayout(layout, container);
}

export function getLayout() {
  return _state.currentLayout;
}

export function getBreakpoint() {
  return _state.currentBreakpoint;
}

export function getContainerWidth() {
  return _state.containerWidth;
}

// Comparadores de breakpoint
export function isBreakpoint(bp: unknown) {
  return _state.currentBreakpoint === bp;
}

export function isBreakpointUp(bp: unknown) {
  return BREAKPOINT_ORDER.indexOf(_state.currentBreakpoint) >= BREAKPOINT_ORDER.indexOf((bp as string));
}

export function isBreakpointDown(bp: unknown) {
  return BREAKPOINT_ORDER.indexOf(_state.currentBreakpoint) <= BREAKPOINT_ORDER.indexOf((bp as string));
}

export function isBreakpointBetween(bpMin: unknown, bpMax: unknown) {
  const current = BREAKPOINT_ORDER.indexOf(_state.currentBreakpoint);
  // @ts-expect-error TS migration - TS2552, TS2304
  return current >= BREAKPOINT_ORDER.indexOf((bpMin as string)) && current <= BREAKPOINT_OR(DER.indexOf as string)(bpMax);
}

// Helpers de device
export function isMobile() {
  return isBreakpointDown('sm');
}

export function isTablet() {
  return isBreakpointBetween('md', 'lg');
}

export function isDesktop() {
  return isBreakpointUp('xl');
}

// Listeners
export function onLayoutChange(callback: (...args: unknown[]) => void) {
  _layoutListeners.add(callback);
  return () => _layoutListeners.delete(callback);
}

export function onBreakpointChange(breakpoint: unknown, callback: (...args: unknown[]) => void) {
  if (!_breakpointListeners.has(breakpoint)) {
    _breakpointListeners.set(breakpoint, new Set());
  }
  _breakpointListeners.get(breakpoint).add(callback);
  return () => _breakpointListeners.get(breakpoint)?.delete(callback);
}

export function onAnyBreakpointChange(callback: (...args: unknown[]) => void) {
  return onBreakpointChange('*', callback);
}

// Utilitário para valores responsivos
export function getResponsiveValue(values: Record<string, unknown>) {
  for (let i = BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    const bp = BREAKPOINT_ORDER[i];
    if ((values as Record<string, unknown>)[bp] !== undefined && isBreakpointUp(bp)) {
      return (values as Record<string, unknown>)[bp];
    }
  }
  return values.xs ?? values.default ?? null;
}

// CSS custom property helper
export function setCSSVariable(name: string, value: unknown, element = document.documentElement) {
  element.style.setProperty(`--dsd-${name}`, (value as string));
}

export function getCSSVariable(name: string, element = document.documentElement) {
  return getComputedStyle(element).getPropertyValue(`--dsd-${name}`).trim();
}

// Reset
export function reset() {
  _state.currentLayout = LAYOUTS.FULL;
  _layoutListeners.clear();
  _breakpointListeners.clear();
  _emit('responsive:reset', {});
}

// Destroy
export function destroy() {
  if (_resizeObserver) {
    (_resizeObserver.disconnect as (...args: unknown[]) => unknown)();
    _resizeObserver = null;
  }
  _layoutListeners.clear();
  _breakpointListeners.clear();
  _state.initialized = false;
  _emit('responsive:destroyed', {});
}

// Info
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    currentLayout: _state.currentLayout,
    currentBreakpoint: _state.currentBreakpoint,
    containerWidth: _state.containerWidth,
    initialized: _state.initialized,
    layouts: Object.keys(LAYOUTS),
    breakpoints: Object.keys(BREAKPOINTS)
  };
}

// Health check
export function healthCheck() {
  return {
    status: _state.initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
    version: VERSION,
    moduleId: MODULE_ID,
    currentLayout: _state.currentLayout,
    currentBreakpoint: _state.currentBreakpoint,
    observerActive: !!_resizeObserver,
    listenerCount: _layoutListeners.size + Array.from(_breakpointListeners.values()).reduce((sum, s) => sum + s.size, 0)
  };
}

export default {
  VERSION, MODULE_ID,
  LAYOUTS, BREAKPOINTS,
  init, destroy, reset,
  injectEventBus,
  setLayout, getLayout,
  getBreakpoint, getContainerWidth,
  isBreakpoint, isBreakpointUp, isBreakpointDown, isBreakpointBetween,
  isMobile, isTablet, isDesktop,
  onLayoutChange, onBreakpointChange, onAnyBreakpointChange,
  getResponsiveValue,
  setCSSVariable, getCSSVariable,
  info, healthCheck
};
