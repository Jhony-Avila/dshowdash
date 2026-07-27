// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/animations
// PURPOSE: Panel-01 - Animacoes de Transicao
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createAnimationManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/animations';

export class AnimationManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.duration = options.duration || 200;
    this.easing = options.easing || 'ease-out';
    this._enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  isEnabled() { return this._enabled; }
  enable() { this._enabled = true; }
  disable() { this._enabled = false; }

  fadeIn(element: HTMLElement, duration = this.duration) {
    if (!this._enabled || !element) return Promise.resolve();
    element.style.opacity = '0';
    element.style.display = '';
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        element.style.transition = `opacity ${duration}ms ${this.easing}`;
        element.style.opacity = '1';

        // @ts-expect-error TS migration - TS2794
        setTimeout(() => { element.style.transition = ''; resolve(); }, duration);
      });
    });
  }

  fadeOut(element: HTMLElement, duration = this.duration) {
    if (!this._enabled || !element) return Promise.resolve();
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ${this.easing}`;
      element.style.opacity = '0';

      // @ts-expect-error TS migration - TS2794
      setTimeout(() => { element.style.display = 'none'; element.style.transition = ''; resolve(); }, duration);
    });
  }

  slideIn(element: HTMLElement, direction = 'left', duration = this.duration) {
    if (!this._enabled || !element) return Promise.resolve();
    const transforms: Record<string, string> = { left: 'translateX(-20px)', right: 'translateX(20px)', up: 'translateY(-20px)', down: 'translateY(20px)' };
    element.style.opacity = '0';
    element.style.transform = transforms[direction] || transforms.left;
    element.style.display = '';
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        element.style.transition = `opacity ${duration}ms ${this.easing}, transform ${duration}ms ${this.easing}`;
        element.style.opacity = '1';
        element.style.transform = 'translate(0)';

        // @ts-expect-error TS migration - TS2794
        setTimeout(() => { element.style.transition = ''; resolve(); }, duration);
      });
    });
  }

  staggerIn(elements: ArrayLike<HTMLElement>, delay = 50) {
    if (!this._enabled) return Promise.resolve();
    const promises = Array.from(elements).map((el, i) => new Promise(resolve => {
      setTimeout(() => { this.fadeIn(el).then(resolve); }, i * delay);
    }));
    return Promise.all(promises);
  }

  pulse(element: HTMLElement, duration = 300) {
    if (!this._enabled || !element) return;
    element.classList.add('p01-pulse');
    setTimeout(() => element.classList.remove('p01-pulse'), duration);
  }

  highlight(element: HTMLElement, color = 'rgba(99, 102, 241, 0.3)', duration = 1000) {
    if (!this._enabled || !element) return;
    const original = element.style.backgroundColor;
    element.style.transition = `background-color ${duration / 2}ms`;
    element.style.backgroundColor = color;
    setTimeout(() => {
      element.style.backgroundColor = original;
      setTimeout(() => { element.style.transition = ''; }, duration / 2);
    }, duration / 2);
  }

  shake(element: HTMLElement, intensity = 5, duration = 400) {
    if (!this._enabled || !element) return;
    element.style.animation = `p01-shake ${duration}ms ease-in-out`;
    setTimeout(() => { element.style.animation = ''; }, duration);
  }
}

export function createAnimationManager(options: Record<string, unknown> = {}) { return new AnimationManager(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { AnimationManager, createAnimationManager };
