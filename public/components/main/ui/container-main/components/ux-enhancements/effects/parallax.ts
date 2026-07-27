// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: parallax
// PURPOSE: UX Enhancements - Parallax Background (#25)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createParallaxBackground() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'mousemove'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.components.ux-enhancements.effects.parallax';

export function createParallaxBackground(container: HTMLElement) {
  let _mouseMoveHandler: EventListener | null = null;
  let _intensity = 10;
  let _initialized = false;

  function _handleMouseMove(e: MouseEvent) {
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) / rect.width;
    const deltaY = (e.clientY - centerY) / rect.height;
    
    const moveX = deltaX * _intensity;
    const moveY = deltaY * _intensity;
    
    container.style.setProperty('--parallax-x', `${moveX}px`);
    container.style.setProperty('--parallax-y', `${moveY}px`);
  }

  return {
    init(options: Record<string, unknown> = {}) {
      if (_initialized) return this;
      
      _intensity = (options.intensity as number) || 10;
      container?.classList?.add('dsd-container--parallax');
      
      if (options.particles) {
        container?.classList?.add('dsd-container--parallax-particles');
      }
      
      // @ts-expect-error strict migration — TS2322
      _mouseMoveHandler = _handleMouseMove;
      container?.addEventListener('mousemove', _mouseMoveHandler as EventListener, { passive: true });
      
      _initialized = true;
      return this;
    },
    setIntensity(intensity: number) {
      _intensity = intensity;
      return this;
    },
    destroy() {
      if (_mouseMoveHandler && container) {
        container.removeEventListener('mousemove', _mouseMoveHandler as EventListener);
      }
      container?.classList?.remove('dsd-container--parallax', 'dsd-container--parallax-particles');
      container?.style?.removeProperty('--parallax-x');
      container?.style?.removeProperty('--parallax-y');
      _initialized = false;
    },
    isInitialized() { return _initialized; }
  };
}
