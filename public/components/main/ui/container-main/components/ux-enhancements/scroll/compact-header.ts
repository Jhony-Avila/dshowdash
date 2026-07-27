// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: compact-header
// PURPOSE: UX Enhancements - Compact Scroll Header (#20)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createCompactScrollHeader() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'scroll'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.components.ux-enhancements.scroll.compact-header';

export function createCompactScrollHeader(container: HTMLElement) {
  let _contentEl: HTMLElement | null = null;
  let _scrollHandler: EventListener | null = null;
  let _scrollThreshold = 50;
  let _initialized = false;

  function _updateScrollState() {
    if (!_contentEl || !container) return;
    
    const isScrolled = _contentEl.scrollTop > _scrollThreshold;
    container.classList.toggle('dsd-container--scrolled', isScrolled);
  }

  return {
    init(options: Record<string, unknown> = {}) {
      if (_initialized) return this;
      
      _scrollThreshold = (options.threshold as number) || 50;
      container?.classList?.add('dsd-container--compact-scroll');
      
      _contentEl = container?.querySelector('.dsd-container__content');
      if (!_contentEl) return this;
      
      _scrollHandler = () => requestAnimationFrame(_updateScrollState);
      _contentEl.addEventListener('scroll', _scrollHandler as EventListener, { passive: true });
      
      _initialized = true;
      return this;
    },
    setThreshold(threshold: number) {
      _scrollThreshold = threshold;
      _updateScrollState();
      return this;
    },
    destroy() {
      if (_scrollHandler && _contentEl) {
        _contentEl.removeEventListener('scroll', _scrollHandler as EventListener);
      }
      container?.classList?.remove('dsd-container--compact-scroll', 'dsd-container--scrolled');
      _initialized = false;
    },
    isInitialized() { return _initialized; }
  };
}
