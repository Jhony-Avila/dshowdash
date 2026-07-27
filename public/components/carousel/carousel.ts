// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.3.1-ENTERPRISE-MODULAR)
// ═══════════════════════════════════════════════════════════════
// MODULE: carousel
// PURPOSE: Carousel - v5.3.1-ENTERPRISE-MODULAR
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS from submodules (only what they actually provide)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '5.3.1-ENTERPRISE-MODULAR';
export const MODULE_ID = 'carousel';

// State
export { getState, setState, setCurrentSlide, setAutoplay } from './state.js';

// Navigation
export { init as navInit, next, prev, goTo, getCurrent, getTotal } from './navigation.js';

// Slides
export { add, remove, get, getAll, count, clear } from './slides.js';

// Events
export { on, off, emit } from './events.js';

// Template
export { createTemplate, createSlide } from './template.js';

// Imports for Carousel class
import { getState, setState, setCurrentSlide, setAutoplay } from './state.js';
import { init as navInit, next, prev, goTo, getCurrent, getTotal } from './navigation.js';
import { add, remove, get, getAll, count, clear } from './slides.js';
import { on, off, emit } from './events.js';
import { createTemplate, createSlide } from './template.js';

// Carousel Class (API unificada)
export class DashboardCarousel {
  static VERSION = VERSION;
  static MODULE_ID = MODULE_ID;

  container: HTMLElement;
  options: { autoplay?: boolean; interval?: number } & Record<string, unknown>;

  constructor(container: HTMLElement | string, options: { autoplay?: boolean; interval?: number } & Record<string, unknown> = {}) {
    // @ts-expect-error strict migration — TS2322
    if (typeof container === 'string') this.container = document.querySelector(container);
    else this.container = container;
    if (!this.container) throw new Error('Container não encontrado');
    this.options = { autoplay: false, interval: 5000, ...options };
    this.init();
  }

  init() {
    const state = getState();
    if (state.totalSlides > 0) return this;

    this.container.innerHTML = createTemplate(this.options);
    const track = this.container.querySelector('.carousel-track');
    if (track) {
      const slides = track.querySelectorAll('.carousel-slide');
      navInit(slides.length);
      slides.forEach((slide: Element, i: number) => add(slide));
    }

    this.setupControls();

    if (this.options.autoplay) {
      setAutoplay(true);
    }

    setCurrentSlide(0);
    return this;
  }

  setupControls() {
    const prevBtn = this.container.querySelector('[data-carousel-prev]');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    const nextBtn = this.container.querySelector('[data-carousel-next]');
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());
    const indicators = this.container.querySelectorAll('[data-carousel-indicator]');
    indicators.forEach((indicator: Element, index: number) => {
      indicator.addEventListener('click', () => this.goTo(index));
    });
  }

  destroy() {
    setAutoplay(false);
    clear();
  }

  goTo(index: number) { return goTo(index); }
  next() { return next(); }
  prev() { return prev(); }
  getCurrent() { return getCurrent(); }
  getTotal() { return getTotal(); }
  getSlide(index: number) { return get(index); }
  getAllSlides() { return getAll(); }
  addSlide(element: Element) { return add(element); }
  removeSlide(index: number) { return remove(index); }
  on(event: string, callback: Function) { return on(event, callback); }
  off(event: string, callback: Function) { return off(event, callback); }
  emit(event: string, data?: unknown) { return emit(event, data); }
  getState() { return getState(); }

  healthCheck() {
    const state = getState();
    const checks = {
      hasSlides: count() > 0,
      hasContainer: !!this.container,
    };
    const passed = Object.values(checks).filter(Boolean).length;
    return {
      status: passed === 2 ? 'healthy' : (passed >= 1 ? 'degraded' : 'unhealthy'),
      checks,
      currentIndex: getCurrent(),
      totalSlides: count(),
      version: VERSION,
    };
  }

  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: getState(), healthCheck: this.healthCheck() };
  }
}

export function createCarousel(container: HTMLElement | string, options: { autoplay?: boolean; interval?: number } & Record<string, unknown> = {}) { return new DashboardCarousel(container, options); }
export function mount(container: HTMLElement | string, options: { autoplay?: boolean; interval?: number } & Record<string, unknown> = {}) { return createCarousel(container, options); }
export function unmount(carousel: DashboardCarousel | { destroy?: Function }) { if (carousel && typeof carousel.destroy === 'function') carousel.destroy(); }
export default DashboardCarousel;
