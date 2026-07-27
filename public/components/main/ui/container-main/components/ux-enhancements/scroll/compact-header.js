const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.components.ux-enhancements.scroll.compact-header";
function createCompactScrollHeader(container) {
  let _contentEl = null;
  let _scrollHandler = null;
  let _scrollThreshold = 50;
  let _initialized = false;
  function _updateScrollState() {
    if (!_contentEl || !container) return;
    const isScrolled = _contentEl.scrollTop > _scrollThreshold;
    container.classList.toggle("dsd-container--scrolled", isScrolled);
  }
  return {
    init(options = {}) {
      if (_initialized) return this;
      _scrollThreshold = options.threshold || 50;
      container?.classList?.add("dsd-container--compact-scroll");
      _contentEl = container?.querySelector(".dsd-container__content");
      if (!_contentEl) return this;
      _scrollHandler = () => requestAnimationFrame(_updateScrollState);
      _contentEl.addEventListener("scroll", _scrollHandler, { passive: true });
      _initialized = true;
      return this;
    },
    setThreshold(threshold) {
      _scrollThreshold = threshold;
      _updateScrollState();
      return this;
    },
    destroy() {
      if (_scrollHandler && _contentEl) {
        _contentEl.removeEventListener("scroll", _scrollHandler);
      }
      container?.classList?.remove("dsd-container--compact-scroll", "dsd-container--scrolled");
      _initialized = false;
    },
    isInitialized() {
      return _initialized;
    }
  };
}
export {
  MODULE_ID,
  VERSION,
  createCompactScrollHeader
};
