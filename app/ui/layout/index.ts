// Migrado para TypeScript: 2026-02-25
// App UI: Layout Helpers
// Funções para manipulação de layout
// Versão: 1.0.0-ENTERPRISE

import { BREAKPOINTS, Z_LAYERS } from '../../shared/types/index.ts';

// --- Interfaces ---

type BreakpointName = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';

interface ViewportSize {
  width: number;
  height: number;
}

interface ElementSize {
  width: number;
  height: number;
}

interface ScrollToOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
}

interface BreakpointChangeEvent {
  current: BreakpointName;
  previous: BreakpointName;
}

// Obter breakpoint atual
export function getCurrentBreakpoint(): BreakpointName {
  const width = window.innerWidth;
  if (width >= BREAKPOINTS.XXL) return 'xxl';
  if (width >= BREAKPOINTS.XL) return 'xl';
  if (width >= BREAKPOINTS.LG) return 'lg';
  if (width >= BREAKPOINTS.MD) return 'md';
  if (width >= BREAKPOINTS.SM) return 'sm';
  return 'xs';
}

// Verificar se é mobile
export function isMobile(): boolean {
  return window.innerWidth < BREAKPOINTS.MD;
}

// Verificar se é tablet
export function isTablet(): boolean {
  const width = window.innerWidth;
  return width >= BREAKPOINTS.MD && width < BREAKPOINTS.LG;
}

// Verificar se é desktop
export function isDesktop(): boolean {
  return window.innerWidth >= BREAKPOINTS.LG;
}

// Obter dimensões da viewport
export function getViewportSize(): ViewportSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

// Obter dimensões de elemento
export function getElementSize(element: Element | null): ElementSize {
  if (!element) return { width: 0, height: 0 };
  const rect = element.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

// Scroll to element
export function scrollToElement(element: Element | null, options: ScrollToOptions = {}): void {
  const { behavior = 'smooth', block = 'start' } = options;
  element?.scrollIntoView({ behavior, block });
}

// Scroll to top
export function scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
  window.scrollTo({ top: 0, behavior });
}

// Lock body scroll
export function lockBodyScroll(): void {
  document.body.style.overflow = 'hidden';
  document.body.dataset.scrollLocked = 'true';
}

// Unlock body scroll
export function unlockBodyScroll(): void {
  document.body.style.overflow = '';
  delete document.body.dataset.scrollLocked;
}

// Toggle class
export function toggleClass(element: Element | null, className: string, force?: boolean): void {
  if (!element) return;
  if (force !== undefined) {
    element.classList.toggle(className, force);
  } else {
    element.classList.toggle(className);
  }
}

// Add class
export function addClass(element: Element | null, ...classNames: string[]): void {
  element?.classList.add(...classNames);
}

// Remove class
export function removeClass(element: Element | null, ...classNames: string[]): void {
  element?.classList.remove(...classNames);
}

// Has class
export function hasClass(element: Element | null, className: string): boolean {
  return element?.classList.contains(className) || false;
}

// Set CSS variable
export function setCssVar(name: string, value: string, element: HTMLElement = document.documentElement): void {
  element.style.setProperty(name, value);
}

// Get CSS variable
export function getCssVar(name: string, element: HTMLElement = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

// Obter z-index para layer
export function getZIndex(layer: string): number {
  return Z_LAYERS[layer.toUpperCase() as keyof typeof Z_LAYERS] || Z_LAYERS.BASE;
}

// Listener de resize com debounce
export function onResize(callback: (size: ViewportSize) => void, debounceMs: number = 150): () => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  const handler = (): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(getViewportSize()), debounceMs);
  };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}

// Listener de breakpoint change
export function onBreakpointChange(callback: (event: BreakpointChangeEvent) => void): () => void {
  let currentBreakpoint: BreakpointName = getCurrentBreakpoint();

  return onResize(() => {
    const newBreakpoint = getCurrentBreakpoint();
    if (newBreakpoint !== currentBreakpoint) {
      const previous = currentBreakpoint;
      currentBreakpoint = newBreakpoint;
      callback({ current: newBreakpoint, previous });
    }
  });
}

export default {
  getCurrentBreakpoint, isMobile, isTablet, isDesktop,
  getViewportSize, getElementSize, scrollToElement, scrollToTop,
  lockBodyScroll, unlockBodyScroll, toggleClass, addClass,
  removeClass, hasClass, setCssVar, getCssVar, getZIndex,
  onResize, onBreakpointChange
};
