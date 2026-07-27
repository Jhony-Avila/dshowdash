import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.2.0-MIGRATION-PHASE4";
const MODULE_ID = "panel-nav-admin.ui.views.split-view";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[SplitView]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const SPLIT_MODES = Object.freeze({
  OFF: "off",
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical"
});
const SPLIT_SIZES = Object.freeze({
  SMALL: 30,
  MEDIUM: 50,
  LARGE: 70
});
function SplitView(options = {}) {
  const container = options.container;
  const onItemSelect = options.onItemSelect;
  const onModeChange = options.onModeChange;
  const onResize = options.onResize;
  const renderList = options.renderList;
  const renderDetail = options.renderDetail;
  let _mode = options.mode || SPLIT_MODES.HORIZONTAL;
  let _size = options.size ?? SPLIT_SIZES.MEDIUM;
  let _selectedItem = null;
  let _el = null;
  let _isDragging = false;
  let _listPane = null;
  let _detailPane = null;
  let _divider = null;
  function init() {
    if (!container) return;
    _render();
    _log("info", "Initialized with mode:", _mode, "size:", _size);
  }
  function _render() {
    if (_mode === SPLIT_MODES.OFF) {
      container.innerHTML = '<div class="pna-split-view__list-only" data-slot="list-only"></div>';
      _listPane = container.querySelector('[data-slot="list-only"]');
      _detailPane = null;
      _divider = null;
      if (typeof renderList === "function") renderList(_listPane);
      return;
    }
    const isVertical = _mode === SPLIT_MODES.VERTICAL;
    const flexDir = isVertical ? "column" : "row";
    const sizeProp = isVertical ? "height" : "width";
    const listSize = `${_size}%`;
    const detailSize = `${100 - _size}%`;
    container.innerHTML = `
      <div class="pna-split-view pna-split-view--${_mode}" style="display:flex;flex-direction:${flexDir};height:100%;">
        <div class="pna-split-view__list" data-slot="list" style="${sizeProp}:${listSize};overflow:auto;"></div>
        <div class="pna-split-view__divider" data-role="divider" style="${isVertical ? "height" : "width"}:6px;cursor:${isVertical ? "row-resize" : "col-resize"};background:var(--pna-border,#ddd);flex-shrink:0;"></div>
        <div class="pna-split-view__detail" data-slot="detail" style="${sizeProp}:${detailSize};overflow:auto;"></div>
      </div>`;
    _listPane = container.querySelector('[data-slot="list"]');
    _detailPane = container.querySelector('[data-slot="detail"]');
    _divider = container.querySelector('[data-role="divider"]');
    if (typeof renderList === "function") renderList(_listPane);
    if (_selectedItem && typeof renderDetail === "function") {
      renderDetail(_detailPane, _selectedItem);
    } else if (_detailPane) {
      _detailPane.innerHTML = '<div class="pna-split-view__placeholder">Selecione um item para editar</div>';
    }
    _bindDividerDrag();
  }
  function _bindDividerDrag() {
    if (!_divider) return;
    const isVertical = _mode === SPLIT_MODES.VERTICAL;
    let startPos = 0;
    let startSize = 0;
    const onMouseDown = (e) => {
      e.preventDefault();
      _isDragging = true;
      startPos = isVertical ? e.clientY : e.clientX;
      startSize = _size;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      _divider.classList.add("pna-split-view__divider--active");
    };
    const onMouseMove = (e) => {
      if (!_isDragging) return;
      const containerRect = container.getBoundingClientRect();
      const totalSize = isVertical ? containerRect.height : containerRect.width;
      const currentPos = isVertical ? e.clientY : e.clientX;
      const delta = currentPos - startPos;
      const deltaPercent = delta / totalSize * 100;
      const newSize = Math.min(80, Math.max(20, startSize + deltaPercent));
      _size = Math.round(newSize);
      if (_listPane) {
        const prop = isVertical ? "height" : "width";
        _listPane.style[prop] = `${_size}%`;
        _detailPane.style[prop] = `${100 - _size}%`;
      }
    };
    const onMouseUp = () => {
      _isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      _divider.classList.remove("pna-split-view__divider--active");
      if (typeof onResize === "function") onResize(_size);
    };
    _divider.addEventListener("mousedown", onMouseDown);
  }
  function selectItem(item) {
    _selectedItem = item;
    if (typeof onItemSelect === "function") onItemSelect(item);
    if (_detailPane && typeof renderDetail === "function") {
      renderDetail(_detailPane, item);
    }
  }
  function getListPane() {
    return _listPane;
  }
  function getDetailPane() {
    return _detailPane;
  }
  function setMode(newMode) {
    _mode = newMode;
    _render();
    if (typeof onModeChange === "function") onModeChange(newMode);
  }
  function setSize(percent) {
    _size = Math.min(80, Math.max(20, percent));
    _render();
  }
  function getMode() {
    return _mode;
  }
  function getSize() {
    return _size;
  }
  function getSelectedItem() {
    return _selectedItem;
  }
  function refreshList() {
    if (_listPane && typeof renderList === "function") renderList(_listPane);
  }
  function refreshDetail() {
    if (_detailPane && _selectedItem && typeof renderDetail === "function") {
      renderDetail(_detailPane, _selectedItem);
    }
  }
  function destroy() {
    if (container) container.innerHTML = "";
    _el = null;
    _listPane = null;
    _detailPane = null;
    _divider = null;
    _selectedItem = null;
  }
  return {
    init,
    selectItem,
    getListPane,
    getDetailPane,
    setMode,
    setSize,
    getMode,
    getSize,
    getSelectedItem,
    refreshList,
    refreshDetail,
    destroy
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modes: Object.values(SPLIT_MODES) };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var split_view_default = { SplitView, SPLIT_MODES, SPLIT_SIZES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  SPLIT_MODES,
  SPLIT_SIZES,
  SplitView,
  VERSION,
  split_view_default as default,
  healthCheck,
  info,
  injectPorts
};
