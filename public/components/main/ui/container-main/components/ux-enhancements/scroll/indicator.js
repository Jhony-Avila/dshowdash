const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.components.ux-enhancements.scroll.indicator";
function createScrollIndicator(container) {
  let _bodyEl = null;
  let _contentEl = null;
  let _scrollHandler = null;
  let _resizeObserver = null;
  let _initialized = false;
  function _updateScrollState() {
    if (!_contentEl || !_bodyEl) return;
    const { scrollTop, scrollHeight, clientHeight } = _contentEl;
    const isScrollable = scrollHeight > clientHeight;
    const isAtTop = scrollTop > 10;
    const isAtBottom = scrollTop < scrollHeight - clientHeight - 10;
    _bodyEl.classList.toggle("dsd-container__body--scrollable", isScrollable && isAtBottom);
    _bodyEl.classList.toggle("dsd-container__body--scroll-top", isAtTop);
    _bodyEl.classList.toggle("dsd-container__body--scroll-bottom", isScrollable && isAtBottom);
  }
  return {
    init() {
      if (_initialized) return this;
      _bodyEl = container?.querySelector(".dsd-container__body");
      _contentEl = container?.querySelector(".dsd-container__content");
      if (!_contentEl) return this;
      _scrollHandler = () => requestAnimationFrame(_updateScrollState);
      _contentEl.addEventListener("scroll", _scrollHandler, { passive: true });
      _resizeObserver = new ResizeObserver(_updateScrollState);
      _resizeObserver.observe(_contentEl);
      _updateScrollState();
      _initialized = true;
      return this;
    },
    update() {
      _updateScrollState();
      return this;
    },
    destroy() {
      if (_scrollHandler && _contentEl) {
        _contentEl.removeEventListener("scroll", _scrollHandler);
      }
      if (_resizeObserver) {
        _resizeObserver.disconnect();
      }
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
  createScrollIndicator
};
