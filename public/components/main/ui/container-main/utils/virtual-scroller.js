const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-virtual-scroller";
function createVirtualScroller(container, options = {}) {
  const {
    itemHeight = 40,
    bufferSize = 5,
    onRenderItem,
    getItemCount = () => 0,
    getItemData = (index) => null
  } = options;
  let _initialized = false;
  let _scrollTop = 0;
  let _containerHeight = 0;
  let _itemCount = 0;
  let _renderedItems = /* @__PURE__ */ new Map();
  let _scrollHandler = null;
  let _resizeObserver = null;
  let _viewport = null;
  let _content = null;
  function _createStructure() {
    _viewport = document.createElement("div");
    _viewport.className = "virtual-scroller__viewport";
    _viewport.style.cssText = "overflow-y:auto;height:100%;position:relative;";
    _content = document.createElement("div");
    _content.className = "virtual-scroller__content";
    _content.style.cssText = "position:relative;";
    _viewport.appendChild(_content);
    container.appendChild(_viewport);
  }
  function _getVisibleRange() {
    const startIndex = Math.max(0, Math.floor(_scrollTop / itemHeight) - bufferSize);
    const visibleCount = Math.ceil(_containerHeight / itemHeight) + bufferSize * 2;
    const endIndex = Math.min(_itemCount - 1, startIndex + visibleCount);
    return { startIndex, endIndex };
  }
  function _render() {
    if (!_initialized || !onRenderItem) return;
    const { startIndex, endIndex } = _getVisibleRange();
    const totalHeight = _itemCount * itemHeight;
    _content.style.height = `${totalHeight}px`;
    _renderedItems.forEach((el, index) => {
      if (index < startIndex || index > endIndex) {
        el.remove();
        _renderedItems.delete(index);
      }
    });
    for (let i = startIndex; i <= endIndex; i++) {
      if (!_renderedItems.has(i)) {
        const itemData = getItemData(i);
        const itemEl = onRenderItem(itemData, i);
        if (itemEl) {
          itemEl.style.position = "absolute";
          itemEl.style.top = `${i * itemHeight}px`;
          itemEl.style.left = "0";
          itemEl.style.right = "0";
          itemEl.style.height = `${itemHeight}px`;
          _content.appendChild(itemEl);
          _renderedItems.set(i, itemEl);
        }
      }
    }
  }
  function _onScroll() {
    _scrollTop = _viewport.scrollTop;
    requestAnimationFrame(_render);
  }
  function _onResize() {
    _containerHeight = _viewport.clientHeight;
    _render();
  }
  const scroller = {
    init() {
      if (_initialized) return this;
      _createStructure();
      _containerHeight = _viewport.clientHeight;
      _itemCount = getItemCount();
      _scrollHandler = _onScroll;
      _viewport.addEventListener("scroll", _scrollHandler, { passive: true });
      _resizeObserver = new ResizeObserver(_onResize);
      _resizeObserver.observe(_viewport);
      _initialized = true;
      _render();
      return this;
    },
    refresh() {
      _itemCount = getItemCount();
      _render();
      return this;
    },
    setItemCount(count) {
      _itemCount = count;
      _render();
      return this;
    },
    scrollToIndex(index, behavior = "auto") {
      const top = index * itemHeight;
      _viewport.scrollTo({ top, behavior });
      return this;
    },
    scrollToTop(behavior = "auto") {
      return this.scrollToIndex(0, behavior);
    },
    scrollToBottom(behavior = "auto") {
      return this.scrollToIndex(_itemCount - 1, behavior);
    },
    getVisibleRange() {
      return _getVisibleRange();
    },
    getScrollTop() {
      return _scrollTop;
    },
    getRenderedCount() {
      return _renderedItems.size;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      if (_scrollHandler) _viewport?.removeEventListener("scroll", _scrollHandler);
      _resizeObserver?.(disconnect)();
      _renderedItems.clear();
      _viewport?.remove();
      _viewport = null;
      _content = null;
      _initialized = false;
    },
    healthCheck() {
      return {
        status: _initialized ? "HEALTHY" : "NOT_INITIALIZED",
        version: VERSION,
        moduleId: MODULE_ID,
        itemCount: _itemCount,
        renderedCount: _renderedItems.size,
        containerHeight: _containerHeight
      };
    }
  };
  return scroller;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var virtual_scroller_default = { createVirtualScroller, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createVirtualScroller,
  virtual_scroller_default as default,
  healthCheck,
  info
};
