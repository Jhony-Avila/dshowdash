import { ICONS } from "../utils/icons.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-tabs-enhanced";
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _emitEvent(eventType, payload) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}
const TAB_POSITION = { TOP: "top", BOTTOM: "bottom", LEFT: "left", RIGHT: "right" };
function createEnhancedTabs(container, options = {}) {
  const {
    tabs = [],
    activeTab = 0,
    position = TAB_POSITION.TOP,
    closable = false,
    draggable = false,
    lazyLoad = true,
    showIcons = true,
    className = "",
    onTabChange,
    onTabClose,
    onTabReorder,
    eventBus
  } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _tabs = [...tabs];
  let _activeIndex = activeTab;
  let _initialized = false;
  let _tabListEl = null;
  let _contentEl = null;
  let _loadedTabs = /* @__PURE__ */ new Set();
  let _dragState = null;
  function _createTabElement(tab, index) {
    const isActive = index === _activeIndex;
    const tabEl = document.createElement("button");
    tabEl.className = `dsd-tabs__tab ${isActive ? "dsd-tabs__tab--active" : ""}`;
    tabEl.setAttribute("role", "tab");
    tabEl.setAttribute("aria-selected", isActive ? "true" : "false");
    tabEl.setAttribute("aria-controls", `tabpanel-${index}`);
    tabEl.setAttribute("tabindex", isActive ? "0" : "-1");
    tabEl.dataset.index = String(index);
    if (draggable) tabEl.setAttribute("draggable", "true");
    const icon = showIcons && tab.icon ? `<span class="dsd-tabs__icon">${ICONS[tab.icon] || tab.icon}</span>` : "";
    const closeBtn = closable && tab.closable !== false ? `<button type="button" class="dsd-tabs__close" aria-label="Fechar aba" data-action="close">${ICONS.close}</button>` : "";
    tabEl.innerHTML = `${icon}<span class="dsd-tabs__label">${tab.label}</span>${closeBtn}`;
    return tabEl;
  }
  function _createPanelElement(tab, index) {
    const isActive = index === _activeIndex;
    const panel = document.createElement("div");
    panel.id = `tabpanel-${index}`;
    panel.className = `dsd-tabs__panel ${isActive ? "dsd-tabs__panel--active" : ""}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `tab-${index}`);
    panel.hidden = !isActive;
    if (isActive || !lazyLoad) {
      _renderPanelContent(panel, tab);
      _loadedTabs.add(index);
    }
    return panel;
  }
  function _renderPanelContent(panel, tab) {
    if (typeof tab.content === "function") {
      const content = tab.content();
      if (content instanceof Promise) {
        panel.innerHTML = '<div class="dsd-tabs__loading">Carregando...</div>';
        content.then((html) => {
          panel.innerHTML = typeof html === "string" ? html : "";
          if (html instanceof HTMLElement) panel.appendChild(html);
        });
      } else if (typeof content === "string") {
        panel.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        panel.innerHTML = "";
        panel.appendChild(content);
      }
    } else if (typeof tab.content === "string") {
      panel.innerHTML = tab.content;
    } else if (tab.content instanceof HTMLElement) {
      panel.innerHTML = "";
      panel.appendChild(tab.content);
    }
  }
  function _render() {
    if (!container) return;
    container.innerHTML = "";
    container.className = `dsd-tabs dsd-tabs--${position} ${className}`.trim();
    container.setAttribute("role", "tablist");
    _tabListEl = document.createElement("div");
    _tabListEl.className = "dsd-tabs__list";
    _tabListEl.setAttribute("role", "tablist");
    _contentEl = document.createElement("div");
    _contentEl.className = "dsd-tabs__content";
    _tabs.forEach((tab, index) => {
      const tabEl = _createTabElement(tab, index);
      tabEl.id = `tab-${index}`;
      _tabListEl.appendChild(tabEl);
      const panel = _createPanelElement(tab, index);
      _contentEl.appendChild(panel);
    });
    if (position === TAB_POSITION.BOTTOM) {
      container.appendChild(_contentEl);
      container.appendChild(_tabListEl);
    } else {
      container.appendChild(_tabListEl);
      container.appendChild(_contentEl);
    }
  }
  function _activateTab(index) {
    if (index < 0 || index >= _tabs.length || index === _activeIndex) return;
    const prevIndex = _activeIndex;
    _activeIndex = index;
    _tabListEl?.querySelectorAll(".dsd-tabs__tab").forEach((tab, i) => {
      const isActive = i === index;
      tab.classList.toggle("dsd-tabs__tab--active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    _contentEl?.querySelectorAll(".dsd-tabs__panel").forEach((panel, i) => {
      const isActive = i === index;
      panel.classList.toggle("dsd-tabs__panel--active", isActive);
      panel.hidden = !isActive;
      if (isActive && lazyLoad && !_loadedTabs.has(i)) {
        _renderPanelContent(panel, _tabs[i]);
        _loadedTabs.add(i);
      }
    });
    _emitEvent("tabs:change", { index, prevIndex, tab: _tabs[index] });
    onTabChange?.(index, prevIndex, _tabs[index]);
  }
  function _handleClick(e) {
    const closeBtn = e.target.closest('[data-action="close"]');
    if (closeBtn) {
      e.stopPropagation();
      const tabEl2 = closeBtn.closest(".dsd-tabs__tab");
      const index = parseInt(tabEl2?.dataset?.index || "", 10);
      if (!isNaN(index)) tabsApi.closeTab(index);
      return;
    }
    const tabEl = e.target.closest(".dsd-tabs__tab");
    if (tabEl) {
      const index = parseInt(tabEl.dataset.index || "", 10);
      if (!isNaN(index)) _activateTab(index);
    }
  }
  function _handleKeydown(e) {
    const tabEl = e.target.closest(".dsd-tabs__tab");
    if (!tabEl) return;
    const tabEls = Array.from(_tabListEl.querySelectorAll(".dsd-tabs__tab"));
    const currentIndex = tabEls.indexOf(tabEl);
    let newIndex = currentIndex;
    const isVertical = position === TAB_POSITION.LEFT || position === TAB_POSITION.RIGHT;
    const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
    switch (e.key) {
      case prevKey:
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabEls.length - 1;
        break;
      case nextKey:
        e.preventDefault();
        newIndex = currentIndex < tabEls.length - 1 ? currentIndex + 1 : 0;
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = tabEls.length - 1;
        break;
    }
    if (newIndex !== currentIndex) {
      tabEls[newIndex].focus();
      _activateTab(newIndex);
    }
  }
  function _setupDragAndDrop() {
    if (!draggable || !_tabListEl) return;
    _tabListEl.addEventListener("dragstart", (e) => {
      const tabEl = e.target.closest(".dsd-tabs__tab");
      if (!tabEl) return;
      _dragState = { index: parseInt(tabEl.dataset.index || "", 10) };
      tabEl.classList.add("dsd-tabs__tab--dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    _tabListEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      const tabEl = e.target.closest(".dsd-tabs__tab");
      if (tabEl && _dragState) {
        tabEl.classList.add("dsd-tabs__tab--drag-over");
      }
    });
    _tabListEl.addEventListener("dragleave", (e) => {
      const tabEl = e.target.closest(".dsd-tabs__tab");
      tabEl?.classList.remove("dsd-tabs__tab--drag-over");
    });
    _tabListEl.addEventListener("drop", (e) => {
      e.preventDefault();
      const tabEl = e.target.closest(".dsd-tabs__tab");
      if (!tabEl || !_dragState) return;
      const toIndex = parseInt(tabEl.dataset.index || "", 10);
      const fromIndex = _dragState.index;
      tabEl.classList.remove("dsd-tabs__tab--drag-over");
      if (fromIndex !== toIndex) {
        tabsApi.reorderTabs(fromIndex, toIndex);
      }
    });
    _tabListEl.addEventListener("dragend", (e) => {
      const tabEl = e.target.closest(".dsd-tabs__tab");
      tabEl?.classList.remove("dsd-tabs__tab--dragging");
      _dragState = null;
    });
  }
  const tabsApi = {
    init() {
      if (_initialized) return this;
      _render();
      _tabListEl?.addEventListener("click", _handleClick);
      _tabListEl?.addEventListener("keydown", _handleKeydown);
      _setupDragAndDrop();
      _initialized = true;
      return this;
    },
    setActiveTab(index) {
      _activateTab(index);
      return this;
    },
    getActiveTab() {
      return { index: _activeIndex, tab: _tabs[_activeIndex] };
    },
    addTab(tab, index) {
      const insertIndex = index !== void 0 ? index : _tabs.length;
      _tabs.splice(insertIndex, 0, tab);
      _render();
      _setupDragAndDrop();
      _emitEvent("tabs:add", { index: insertIndex, tab });
      return this;
    },
    closeTab(index) {
      if (index < 0 || index >= _tabs.length) return this;
      const tab = _tabs[index];
      _tabs.splice(index, 1);
      _loadedTabs.delete(index);
      if (_activeIndex >= _tabs.length) _activeIndex = _tabs.length - 1;
      else if (_activeIndex > index) _activeIndex--;
      _render();
      _setupDragAndDrop();
      _emitEvent("tabs:close", { index, tab });
      onTabClose?.(index, tab);
      return this;
    },
    reorderTabs(fromIndex, toIndex) {
      if (fromIndex === toIndex) return this;
      const [tab] = _tabs.splice(fromIndex, 1);
      _tabs.splice(toIndex, 0, tab);
      if (_activeIndex === fromIndex) _activeIndex = toIndex;
      else if (fromIndex < _activeIndex && toIndex >= _activeIndex) _activeIndex--;
      else if (fromIndex > _activeIndex && toIndex <= _activeIndex) _activeIndex++;
      _render();
      _setupDragAndDrop();
      _emitEvent("tabs:reorder", { fromIndex, toIndex });
      onTabReorder?.(fromIndex, toIndex);
      return this;
    },
    getTabs() {
      return [..._tabs];
    },
    getTabCount() {
      return _tabs.length;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _tabListEl?.removeEventListener("click", _handleClick);
      _tabListEl?.removeEventListener("keydown", _handleKeydown);
      container.innerHTML = "";
      _initialized = false;
      _loadedTabs.clear();
    },
    healthCheck() {
      return {
        status: _initialized ? "HEALTHY" : "NOT_INITIALIZED",
        version: VERSION,
        moduleId: MODULE_ID,
        tabCount: _tabs.length,
        activeTab: _activeIndex,
        loadedTabs: _loadedTabs.size,
        hasEventBus: !!_injectedEventBus
      };
    }
  };
  return tabsApi;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasEventBus: !!_injectedEventBus };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasEventBus: !!_injectedEventBus };
}
var tabs_enhanced_default = {
  createEnhancedTabs,
  injectEventBus,
  info,
  healthCheck,
  VERSION,
  MODULE_ID,
  TAB_POSITION
};
export {
  MODULE_ID,
  TAB_POSITION,
  VERSION,
  createEnhancedTabs,
  tabs_enhanced_default as default,
  healthCheck,
  info,
  injectEventBus
};
